// Message queue to temporarily hold messages and response
let messages = [];
let response = '';

// Store the API key in local storage
function storeApiKey(apiKey) {
  chrome.storage.local.set({ apiKey: apiKey }, function() {
    console.log('API key has been stored:', apiKey);
  });
}

// Listener for the apiKey
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.apiKey) {
    // If a message contains the API key, store it
    storeApiKey(request.apiKey);
  }
});

// Listener for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "updateInterface") {
    // Add incoming messages to the message queue individually
    messages = request.messages;
    console.log(messages);
    
    // Save messages to chrome storage
    chrome.storage.local.set({ messages: messages });
  } else if (request.action === "updateLLM") {
    // Add incoming response to the message queue
    response = request.response;
    console.log('response: ', response);

    // Save response to chrome storage
    chrome.storage.local.set({ response: response });
    chrome.runtime.sendMessage({ action: 'sendLLMResponse', response: response });
  }

  // Send response asynchronously
  sendResponse({ messages: messages, response: response });
});

// Handle the request to update data
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.request === 'updateData') {
    console.log('Received request to update data');
    // Fetch messages from chrome storage
    chrome.storage.local.get(['messages'], function(result) {
      console.log('Messages are currently: ', result.messages);
      // Store the messages in a variable to avoid returning undefined
      const messages = result.messages || [];
      console.log('Sending messages:', messages);
      // Send the messages as a response
      sendResponse({ messages: messages });
    });
    // Don't return true here, since the response will be sent asynchronously
  }
});

