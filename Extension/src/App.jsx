import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from '@/components/ui/button';

export default function App() {
  const [commands, setCommands] = useState([]);
  const [lastExecuted, setLastExecuted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message);
      } else if (response && response.config) {
        setCommands(response.config);
      } else {
        setError('Failed to load config');
      }
      setLoading(false);
    });
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

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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
              <Button 
                className="bg-slate-800 text-white hover:bg-slate-700" 
                onClick={() => handleCommandClick(command)}
              >
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