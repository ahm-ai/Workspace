package std

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"syscall"
)

var cmd *exec.Cmd

func RunBashWithSignal(bashFile string, args []string, sig chan os.Signal) error {

	// Start the Bash command in a Go routine
	go func() {
		// cmd = exec.Command(bashFile, args...)
		// out, err := cmd.CombinedOutput()
		// if err != nil {
		// 	fmt.Println(err)
		// 	return
		// }
		// fmt.Println(string(out))

		cmd = exec.Command(bashFile, args...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		// Run the command
		if err := cmd.Run(); err != nil {
			fmt.Printf("error: %v\n", err)
			// os.Exit(1)
		}

	}()

	return nil
}

func KillBash(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		// ps -e.
		// Kill the Bash process
		if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
			fmt.Println(err)
			return
		}

	} else {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}
