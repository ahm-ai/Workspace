// content.js
let configMap = [];

// Fetch config from background script
function fetchConfig() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response && response.config) {
        resolve(response.config);
      } else {
        reject('Failed to fetch config from background script');
      }
    });
  });
}

// Execute a single command
async function executeSingleCommand(command) {
  const element = document.querySelector(command.selector);
  if (!element) {
    return;
  }

  switch (command.event) {
    case "CLICK":
      element.click();
      break;
    case "INPUT":
      element.value = command.value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      break;
    case "SUBMIT":
      if (element.tagName.toLowerCase() === "form") {
        element.submit();
      }
      break;
  }

  // Add a small delay after executing the command
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// Execute a series of commands
async function executeCommand(commandToExecute) {
  for (const command of commandToExecute) {
    await executeSingleCommand(command);
  }
}

// Check and execute commands based on current URL
async function checkAndExecuteCommands() {
  const currentUrl = window.location.href;
  for (const config of configMap) {
    if (currentUrl.includes(config.url)) {
      await executeCommand(config.commandToExecute);
    }
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAndExecute") {
    checkAndExecuteCommands();
    sendResponse({ status: "Checking and executing commands" });
  } else if (request.action === "executeCommand") {
    if (request.command) {
      executeCommand(request.command);
      sendResponse({ status: "Command execution started" });
    } else {
      sendResponse({ status: "Command not found" });
    }
  }
  return true; // Indicates that the response is sent asynchronously
});

// Initialize the content script
async function init() {
  
  try {
    configMap = await fetchConfig();
    console.log("INIT", configMap);
    checkAndExecuteCommands();
  } catch (error) {
    // Error handling could be implemented here if needed
  }
}

// Run the initialization
init();

