package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

type RequestBody struct {
	FolderName string `json:"folderName"`
}

type fileEvent struct {
	name string
	time time.Time
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var rooms = make(map[string][]*websocket.Conn)

var fileQueue []fileEvent

var timeToProcess = 26 * time.Second

var ENDCOLOR = "\033[0m'"
var Black = "\033[0;30m"
var Red = "\033[0;31m"
var Green = "\033[0;32m"
var Yellow = "\033[0;33m"
var Blue = "\033[0;34m"
var Purple = "\033[0;35m"
var Cyan = "\033[0;36m"
var White = "\033[0;37m"

// [Watch] will see any changes added to the folder If there is a change we add them to the fileQueue that processes the files every 30 seconds

func main() {
	// ExecFuncCommand()

	http.HandleFunc("/watch", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Parse request body
		var requestBody RequestBody
		err := json.NewDecoder(r.Body).Decode(&requestBody)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		fmt.Println(requestBody.FolderName)

		// 2. Watch for events
		go func() {
			// Set up file watcher
			watcher, err := fsnotify.NewWatcher()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer watcher.Close()
			//  no such file or directory watcher.Add()

			err = watcher.Add(requestBody.FolderName)
			if err != nil {
				fmt.Println(err)
				// http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			for {
				select {
				case event := <-watcher.Events:
					if event.Op&fsnotify.Create == fsnotify.Create && filepath.Ext(event.Name) == ".mp4" {
						now := time.Now()
						hour, minute, _ := now.Clock()

						fmt.Println(Purple, "File succesfully queued:", event.Name, hour, minute, ENDCOLOR)
						// A new .mp4 file was created but wait 30 seconds before processing it
						fileQueue = append(fileQueue, fileEvent{name: event.Name, time: time.Now()})
						go Settimer()
					}

				case err := <-watcher.Errors:
					log.Println("error:", err)
				}
			}

		}()

	})

	http.HandleFunc("/ws", handleWebsocket)

	fmt.Println("Listening on port 8080...")
	http.ListenAndServe(":8080", nil)
}

func Settimer() {
	// 1. Process the queue every 30 seconds
	// go func() {
	ticker := time.NewTicker(timeToProcess)

	for range ticker.C {

		// If there is a mp4 file in the queue, process it
		if len(fileQueue) > 0 {
			now := time.Now()
			hour, minute, _ := now.Clock()

			fmt.Println(Blue, "File being proccessed now:", fileQueue[0].name, hour, minute, ENDCOLOR)
			ProcessQueue(&fileQueue)
			ticker.Stop()
		}

	}
	// }()
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	// Read message from client to determine which room to join
	_, message, err := conn.ReadMessage()
	if err != nil {
		log.Println(err)
		return
	}

	roomName := string(message)
	// join the room
	if _, ok := rooms[roomName]; !ok {
		rooms[roomName] = []*websocket.Conn{conn}
	} else {
		rooms[roomName] = append(rooms[roomName], conn)
	}

	// read messages from client in a separate goroutine
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("error: %v", err)
				}
				break
			}

			// broadcast message to all clients in the room
			for _, c := range rooms[roomName] {
				if c != conn {
					c.WriteMessage(websocket.TextMessage, message)
				}
			}
		}
	}()

	// Wait indefinitely
	select {}
}

func BroadCastMessage(message string) {
	// broadcast message to all clients in the room
	for _, c := range rooms["room1"] {
		c.WriteMessage(websocket.TextMessage, []byte(message))
	}
}

func ProcessQueue(fileQueue *[]fileEvent) {
	// process the first element of the queue
	fileName := (*fileQueue)[0].name

	ExecFuncWhisperCommand(fileName)

	// remove the first element from the queue
	*fileQueue = (*fileQueue)[1:]
}

func ExecFuncWhisperCommand(fileStr string) {

	filePath := path.Dir(fileStr)
	fileName := filepath.Base(fileStr)

	command := fmt.Sprintf("whisper %s --fp16 False  --model base --language English --beam_size 1 ", fileName)
	// fmt.Println(" filePath: ", filePath, " fileName: ", fileName, " command: ", command)

	cmd := exec.Command("zsh", "-c", command)
	cmd.Dir = filePath

	out, err := cmd.Output()
	if err != nil {
		fmt.Println(Red, err, ENDCOLOR)
		return // panic("some error found")
	}

	fmt.Println(Purple, "Output:", fileName)

	fmt.Println(Green)
	fmt.Println(string(out))
	fmt.Println(ENDCOLOR)
}
