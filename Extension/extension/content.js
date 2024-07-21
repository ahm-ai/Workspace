// content.js
const configMap = [
  {
    id: 1,
    name: "Search Google",
    description: "Performs a Google search",
    url: "google.com",
    commandToExecute: [
      {
        event: "INPUT",
        selector: "form textarea",
        value: "Hi",
      },
      {
        event: "CLICK",
        selector: "input[name='btnK']",
      },
    ],
  },
];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("from a content script:" + "from the extension");
  console.log({ request, sender });

  if (request.action === "executeCommand") {
    executeCommand(request.command);
    sendResponse({ status: "Command execution started" });
  }
});

async function executeCommand(commandToExecute) {
  for (const command of commandToExecute) {
    console.log({ selector: command?.selector });
    const element = document.querySelector(command.selector);
    if (!element) {
      console.error(`Element not found: ${command.selector}`);
      continue;
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
        } else {
          console.error("SUBMIT event can only be used with form elements");
        }
        break;
      default:
        console.error(`Unknown event type: ${command.event}`);
    }

    // Add a small delay between commands
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function init() {
  console.log("Current URL:", window.location.href);
  for (const config of configMap) {
    if (window.location.href.includes(config.url)) {
      console.log(`Matched configuration: ${config.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      for (const command of config.commandToExecute) {
        console.log("Executing command:", command);
        await executeCommand(command);
      }
    }
  }
}

// init();
