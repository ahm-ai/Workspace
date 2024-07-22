// background.js
const config = [
    {
        "id": 1,
        "name": "Search Google",
        "description": "Performs a Google search",
        "url": null,
        "commandToExecute": [
          {
            "event": "INPUT",
            "selector": "form textarea",
            "value": "Hi"
          },
          {
            "event": "CLICK",
            "selector": "input[name='btnK']"
          }
        ]
    },
];

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  switch (request.action) {
      case 'getConfig':
          console.log('Sending config:', config);
          sendResponse({ config: config });
          return true; // Indicates that the response is sent asynchronously
      
      case 'executeCommand':
          chrome.tabs.sendMessage(sender.tab.id, request);
          sendResponse({ status: "Command execution started" });
          return true;
      
      default:
          console.log('Unknown action:', request.action);
          sendResponse({ error: "Unknown action" });
          return false;
  }
  
});
