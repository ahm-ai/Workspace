package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/atotto/clipboard"
	tea "github.com/charmbracelet/bubbletea"
)

type model struct {
	functions []string
	cursor    int
}

func initialModel() model {
	var functions []string
	files := []string{
		os.ExpandEnv("$HOME/.zshrc"),
		// Add more file paths as needed
	}

	for _, file := range files {
		functions = append(functions, readFunctions(file)...)
	}

	return model{
		functions: functions,
		cursor:    0,
	}
}

func readFunctions(filename string) []string {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		if !os.IsNotExist(err) {
			fmt.Printf("Error reading file %s: %v\n", filename, err)
		}
		return []string{}
	}

	var functions []string
	regex := regexp.MustCompile(`(?m)^(?:function\s+)?([a-zA-Z0-9_]+)\s*\(\)\s*\{`)

	matches := regex.FindAllStringSubmatch(string(content), -1)
	for _, match := range matches {
		if len(match) > 1 {
			functionName := match[1]
			functions = append(functions, fmt.Sprintf("%s (%s)", functionName, filepath.Base(filename)))
		}
	}

	return functions
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down":
			if m.cursor < len(m.functions)-1 {
				m.cursor++
			}
		case "enter":
			functionName := strings.Split(m.functions[m.cursor], " ")[0]
			err := clipboard.WriteAll(functionName)
			if err != nil {
				fmt.Println("Error copying function to clipboard:", err)
			} else {
				fmt.Println("Function copied to clipboard:", functionName)
			}
			return m, tea.Quit
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	}

	return m, nil
}

func (m model) View() string {
	s := "Select a function to copy to clipboard:\n\n"

	for i, function := range m.functions {
		cursor := " "
		if m.cursor == i {
			cursor = ">"
		}
		s += fmt.Sprintf("%s %s\n", cursor, function)
	}

	s += "\nPress q to quit.\n"

	return s
}

func main() {
	p := tea.NewProgram(initialModel())
	if err := p.Start(); err != nil {
		fmt.Println("Error running program:", err)
		os.Exit(1)
	}
}
