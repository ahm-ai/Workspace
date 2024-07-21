import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import config from './config.json';
import { Button } from '@/components/ui/button';



export default function App() {
  const [commands, setCommands] = useState([]);
  const [lastExecuted, setLastExecuted] = useState(null);

  useEffect(() => {
    setCommands(config);
  }, []);

  const handleCommandClick = (command) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'executeCommand',
        command: command.commandToExecute
      }, function(response) {
        console.log(response);
        setLastExecuted(command.name);
      });
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Commands</CardTitle>
          <CardDescription>Select a command to execute</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {commands.map((command) => (
          <Card key={command.id}>
            <CardHeader>
              <CardTitle>{command.name}</CardTitle>
              <CardDescription>{command.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className=" bg-slate-800 text-white " onClick={() => handleCommandClick(command)}>
                Execute
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>






      {lastExecuted && (
        <Alert className="mt-6">
          <AlertTitle>Command Executed</AlertTitle>
          <AlertDescription>
            Last executed command: {lastExecuted}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}