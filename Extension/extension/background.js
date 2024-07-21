// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      chrome.tabs.sendMessage(tabId, { action: 'checkAndExecute' });
    }
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeCommand') {
      chrome.tabs.sendMessage(sender.tab.id, request);
      sendResponse({ status: "Command execution started" });
    }
  });