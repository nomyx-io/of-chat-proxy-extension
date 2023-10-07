// Function to send message to LLM and get a response
async function getLLMResponse(message, history) {
  try {
    // Retrieve the stored API key
    chrome.storage.local.get(['apiKey'], async function(result) {
      const apiKey = result.apiKey;
      // Check if an API key is available
      if (apiKey) {
        const response = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
          method: 'POST',
          headers: {
            //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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, // Include the stored API key
          },
          body: JSON.stringify({
            prompt: message,
            max_tokens: 60,
          }),
        });
        if (!response.ok) {
          throw new Error('Request to OpenAI API failed');
        }
        const data = await response.json();
        console.log(data);
        // Assuming you have an `updateLLM` function defined to handle the response
        updateLLM(data.choices[0].text);
        return true; // Required to allow async sendResponse
      } else {
        console.error('No API key available. Please enter your API key.');
        return false; // Return false if there's no API key
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return false; // Return false in case of an error
  }
}

// Function to update background with the LLM response
function updateLLM(response) {
  console.log('Updating background with LLM response:', response);
  chrome.runtime.sendMessage({ action: 'updateLLM', response: response });
}

// Function to update background with messages
function updateInterface(messages) {
  console.log('Updating background with messages:', messages);
  chrome.runtime.sendMessage({ action: 'updateInterface', messages: messages });
}

// Function to scrape the latest messages
function processLatestMessages() {
  // Get the last five messages
  var messageElements = document.querySelectorAll('#content-area .muser-short-msg p');
  if (!messageElements || messageElements.length < 5) {
    console.log('Latest message elements not found');
    return;
  }
  var messages = Array.from(messageElements).slice(0, 5).map(el => el.innerText); 
  console.log('Latest messages:', messages);

  // Update the popup interface
  updateInterface(messages);
}


// get messages on page load
window.onload = function() {                                                 
  var checkExist = setInterval(function() {                                  
    if (document.querySelector('#content-area .muser-short-msg')) {          
      processLatestMessages();                                               
      clearInterval(checkExist);                                             
    }                                                                        
  }, 1000); // check every 1000ms                                            
}; 

// Listen to popup for a message to send to LLM
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendResponse') {
    console.log('Sending message to LLM:', request.message);
    // Get LLM response
    getLLMResponse(request.message, request.history).then((response) => {
      console.log('LLM responsey:', response);
      // Populate the textarea with the LLM response
      //document.querySelector('textarea#sendText').value = JSON.parse(response);
      // Optionally, update the popup interface with the selected message and response
      // updateLLM(request.llmResponse);
    });
  }
});
