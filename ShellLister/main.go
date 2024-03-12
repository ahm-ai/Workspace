package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/atotto/clipboard"
	tea "github.com/charmbracelet/bubbletea"
)

type model struct {
	functions []string
	cursor    int
}

func initialModel() model {
	return model{
		functions: readFunctions(os.ExpandEnv("$HOME/.zshrc")),
		cursor:    0,
	}
}

func readFunctions(filename string) []string {
	file, err := os.Open(filename)
	if err != nil {
		fmt.Println("Error opening file:", err)
		os.Exit(1)
	}
	defer file.Close()

	var functions []string
	scanner := bufio.NewScanner(file)
	funcStack := 0
	var funcName string

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if strings.HasPrefix(line, "function ") {
			funcName = strings.TrimSpace(strings.Split(line, "()")[0])
			funcName = strings.TrimPrefix(funcName, "function ")
			funcStack++
		} else if strings.HasPrefix(line, funcName+"()") {
			funcName = strings.TrimSpace(strings.Split(line, "()")[0])
			funcStack++
		} else if line == "}" && funcStack > 0 {
			funcStack--
			if funcStack == 0 {
				functions = append(functions, funcName)
				funcName = ""
			}
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
			functionName := m.functions[m.cursor]
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
