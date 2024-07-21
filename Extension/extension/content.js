chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    
    if (request.action === 'executeCommand') {
      executeCommand(request.command);
      sendResponse({status: "Command execution started"});
    }
  }
);

async function executeCommand(commandToExecute) {
  for (const command of commandToExecute) {
    const element = document.querySelector(command.slector);
    if (!element) {
      console.error(`Element not found: ${command.slector}`);
      continue;
    }

    switch (command.event) {
      case 'CLICK':
        element.click();
        break;
      case 'INPUT':
        element.value = command.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      case 'SUBMIT':
        if (element.tagName.toLowerCase() === 'form') {
          element.submit();
        } else {
          console.error('SUBMIT event can only be used with form elements');
        }
        break;
      default:
        console.error(`Unknown event type: ${command.event}`);
    }

    // Add a small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}