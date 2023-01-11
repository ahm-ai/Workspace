package std

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"
)

func GetOutput(cmd string, args []string) error {

	c := exec.Command(cmd, args...)

	// Set the stdin, stdout, and stderr fields to the respective streams of the current process
	c.Stdin = os.Stdin
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr

	// Run the command
	if err := c.Run(); err != nil {
		fmt.Printf("error: %v\n", err)
		// os.Exit(1)
	}
	return nil
}

func FilterOutput(cmd string, args []string, dir string) (string, error) {
	// Create a new command with the given command and arguments
	c := exec.Command(cmd, args...)

	// if dir != "" {
	// 	c.Dir = dir
	// }

	// Get the stdout pipe
	stdout, err := c.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("failed to get stdout pipe: %v", err)
	}

	// Set the stdin, stdout, and stderr fields to the respective streams of the current process
	c.Stdin = os.Stdin
	c.Stderr = os.Stderr

	// Start the command
	if err := c.Start(); err != nil {
		return "", fmt.Errorf("failed to start command: %v", err)
	}

	// Create a buffer to hold the stdout output
	var buf bytes.Buffer

	// Copy the stdout data to the buffer
	if _, err := io.Copy(&buf, stdout); err != nil {
		return "", fmt.Errorf("failed to copy stdout: %v", err)
	}

	// Wait for the command to finish
	if err := c.Wait(); err != nil {
		fmt.Println("failed to wait for command: %v", err)
		return buf.String(), nil
	}

	// Return the stdout output as a string
	return buf.String(), nil
}

// func GetOutput(cmd string, args []string) error {
// 	// Create a new command with the given command and arguments
// 	c := exec.Command(cmd, args...)

// 	c.Stdin = os.Stdin
// 	c.Stdout = os.Stdout
// 	c.Stderr = os.Stderr

// 	// Get the stdout and stderr pipes
// 	stdout, err := c.StdoutPipe()
// 	if err != nil {
// 		return fmt.Errorf("failed to get stdout pipe: %v", err)
// 	}
// 	stderr, err := c.StderrPipe()
// 	if err != nil {
// 		return fmt.Errorf("failed to get stderr pipe: %v", err)
// 	}

// 	// Start the command
// 	if err := c.Start(); err != nil {
// 		return fmt.Errorf("failed to start command: %v", err)
// 	}

// 	// Copy the stdout and stderr data to the respective streams
// 	go io.Copy(os.Stdout, stdout)
// 	go io.Copy(os.Stderr, stderr)

// 	// Wait for the command to finish
// 	if err := c.Wait(); err != nil {
// 		// return fmt.Errorf("failed to wait for command: %v", err)
// 	}

// 	return nil
// }

func RunCommand(cmd string, args []string, dir string) {
	// Run the command in a new Go routine
	go func() {
		// Execute the command
		output, err := exec.Command(cmd, args...).Output()
		if err != nil {
			fmt.Printf("Error running command: %s\n", err)
			return
		}

		// Print the command output
		fmt.Printf("Command output: %s\n", output)
	}()
}
