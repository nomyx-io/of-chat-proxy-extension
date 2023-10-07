// Check the current tab's URL
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const currentUrl = tabs[0].url;

  if (currentUrl === 'https://www.sextpanther.com/model/messages/') {
    // User is on the specific URL, show chat interface
    console.log('User is on the specific URL');
    document.getElementById('loginMessage').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'block';
    // check if apiKey is set
    chrome.storage.local.get(['apiKey'], function(result) {
    const apiKey = result.apiKey;
    if (apiKey) {
      console.log('API key retrieved');
    } else {
      console.log('API key not found.');
      document.getElementById('keyMessage').style.display = 'block';
      document.getElementById('chatInterface').style.display = 'none';
    }
  });
  } else {
    console.log('User is not on the specific URL');
    // User is not on the specific URL, show login message
    document.getElementById('loginMessage').style.display = 'block';
    document.getElementById('chatInterface').style.display = 'none';
  }
});

// Function to retrieve messages from local storage and update the popup interface
function getMessagesFromStorage() {
  chrome.storage.local.get(['messages'], function(result) {
    const messages = result.messages || []; // Default to an empty array if messages are not found
    console.log('Messages from storage:', messages);

    // Update the popup interface with the data from messages
    for (let i = 0; i < messages.length; i++) {
      document.getElementById(`message${i + 1}`).value = messages[i];
    }
  });
}                                                                          
                                                                               
// Call the update when popup loads                                        
window.onload = function() {
  console.log('Popup window loaded');
  getMessagesFromStorage();
};

// Event listener for the api input button
document.getElementById('storeApiKey').addEventListener('click', function() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKey = apiKeyInput.value;
  console.log('API key entered:', apiKey);
  // Send the API key to the background script
  chrome.runtime.sendMessage({ apiKey: apiKey });
  // Reload the extension after 1/2 second to make sure the apiKey gets set
  setTimeout(() => {
    // Reload the extension
    chrome.runtime.reload();
  }, 500); // delay 
  // Refresh the webpage
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    console.log('Reloading tab:', currentTab);
    chrome.tabs.reload(currentTab.id);
    });
});

// Function to refresh messages
function refreshMessages() {
  console.log('Message sent to content.js to refresh messages');
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshMessages' });
  });
}

// Event listener for the refresh button
document.getElementById('refreshMessages').addEventListener('click', function() {
    // Refresh the webpage so content.js scrapes again
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    console.log('Reloading tab:', currentTab);
    chrome.tabs.reload(currentTab.id);
    });
});

// Function to send the message to LLM
function sendToLLM(selectedMessage) {
  if (selectedMessage) {
    // Send the message to the content script to get the LLM response
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'sendResponse', message: selectedMessage });
    });
  } else {
    alert('Select one of the messages or enter your own.');
  }
}

// Event listener for the send manual message button
document.getElementById('selectMessage').addEventListener('click', function() {
  let selectedMessage = document.getElementById('manualMessage').value;
  console.log('Manual message:', selectedMessage);
  sendToLLM(selectedMessage);
});

// Grab the checked message
function getFirstCheckedMessage() {
  for (let i = 1; i <= 5; i++) {
    if (document.getElementById(`selectMessage${i}`).checked) {
      return document.getElementById(`message${i}`).value;
    }
  }
}

// Event listener for the send selected button
document.getElementById('sendToBot').addEventListener('click', function() {
  let selectedMessage = getFirstCheckedMessage();
  console.log('Selected message:', selectedMessage);
  sendToLLM(selectedMessage);
});

// Event listener for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendLLMResponse') {
    // Handle the LLM response in your popup.js
    const llmResponse = request.response;
    // update html
    console.log('Received LLM response in popup.js:', llmResponse);
    document.getElementById('llmResponse').value = llmResponse;
  }
});

