// Function to send message to LLM and get a response
async function getLLMResponse(message, history) {
  // Define the request object as per the Python code
  const request = {
    user_input: message,
    max_new_tokens: 250,
    // ... other parameters ...
    history: history
  };

  const URI = 'https://hugh-column-technological-frankfurt.trycloudflare.com/api/v1/chat'; // Adjust the URI as needed
  const response = await fetch(URI, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  return data.results[0].history; // Adjust based on the actual response structure
}

// Function to update the popup interface
function updateInterface(messages, llmResponse) {
  chrome.runtime.sendMessage({ action: 'updateInterface', messages: messages, llmResponse: llmResponse });
}

// Function to process the latest messages
function processLatestMessages() {
  // Get the last five messages
  var messageElements = document.querySelectorAll('#content-area .muser-short-msg p');
  if (!messageElements || messageElements.length < 5) {
    console.log('Latest message elements not found');
    return;
  }
  var messages = Array.from(messageElements).slice(-5).map(el => el.innerText);
  console.log('Latest messages:', messages);

  // Update the popup interface
  updateInterface(messages, null);
}

// Identify the chat container (replace with the actual selector)
var chatContainer = document.querySelector('#content-area'); // Adjust this if needed
if (!chatContainer) {
  console.log('Dammit! Chat container not found');
} else {
  console.log('Chat found hurray!');
}

// Create an observer to watch for changes
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    // Check for new messages
    if (mutation.addedNodes.length > 0) {
      processLatestMessages();
    }
  });
});

// Start observing
observer.observe(chatContainer, { childList: true, subtree: true }); // Added subtree to observe nested changes

// Listen for messages from the popup script to send the response
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendResponse') {
    // Get LLM response
    getLLMResponse(request.message, request.history).then((llmResponse) => {
      console.log('LLM response:', llmResponse);
      // Populate the textarea with the LLM response
      document.querySelector('textarea#sendText').value = JSON.parse(llmResponse);
      // Optionally, update the popup interface with the selected message and response
      updateInterface([request.message], llmResponse);
    });
  }
});
