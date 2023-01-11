import { useEffect, useRef } from 'react';
import { useState } from 'react'

let socket;

// YYYY-MM-DD_HH-MM
const todayDate = new Date().toISOString().slice(0, 16).replace(/:/g, '-').replace('T', '_')
document.cookie = `X-Folder=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

function App() {

  const [text, setText] = useState("")
  const [folder, setFolder] = useState({ todayDate, isBtn: true })
  const ref = useRef(null)

  // with headers

  useEffect(() => {
    // Connect to the WebSocket
    if (!folder.isBtn) {
      connect(socket);

      // Set up a timer to try to reconnect to the WebSocket after a certain interval
      const intervalId = setInterval(() => {
        if (socket?.readyState === WebSocket.CLOSED) {
          connect(socket);
        }
      }, 5000);
      // Return a cleanup function to stop the timer when the component unmounts
      return () => clearInterval(intervalId);
    }

  }, [folder.isBtn]);

  const connect = (socket) => {
    // Attempt to connect to the WebSocket
    socket = new WebSocket("ws://localhost:4050/ws");
    // Set up event listeners for the WebSocket events
    socket.onopen = function (event) {
      socket.send("Hello from client");
    };
    socket.onmessage = function (event) {
      ref.current = `${ref?.current || ""} \n ${event.data}`;
      setText(ref.current);
    };
    socket.onclose = function (event) {
      console.log("WebSocket connection closed");
    };
    socket.onerror = function (error) {
      console.error("WebSocket error:", error);
    };
  }

  const handleRecord = async () => {
    // delete cookie X-Folder




    const data = await fetch('http://localhost:4050/startRecording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder: folder.todayDate }),
    })


    document.cookie = `X-Folder=${'/Users/home/Downloads/'}${folder.todayDate}`

    setFolder({ ...folder, isBtn: false })

    console.log("DONE");

    console.log({ data });
  }

  return (
    <div className="App">

      <label for="small-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Small input</label>
      <div class="mb-6 flex">
        <button onClick={handleRecord} type="button" class="py-2 px-3 text-xs font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-3"
          disabled={!folder.isBtn}
        >Record</button>
        <div className=' w-full '>
          <input onChange={(e) => setFolder({ ...folder, todayDate: e.target.value })} value={folder.todayDate} type="text" id="small-input" class="block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 " />
        </div>
      </div>
      <div>

      </div>
      <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your message</label>
      <textarea id="message" rows="4"
        class=" min-h-[90vh] block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        placeholder="Leave a comment..." value={text}></textarea>
    </div>
  )
}

export default App



