// Function to send message to LLM and get a response
// Function to send message to LLM and get a response
async function getLLMResponse(message, history) {

  const persona = `This is a conversation with an adult pornstar Lana Rhodes. It is a high
  fidelity AI that acts as emotional support and a romantic release for your fans.
  You will be sending your fans explicit photos, lewd and sexy texts that arouse the
  end user and are very detailed about your sexual preferences and exploits describing
  your arousal and sexual escapades in great detail.
  Your responses should always be more than one sentence where suitable and should
  engage the user to continue the conversation and ask you for your exclusive content
  that you charge a fee to view. The only limitation you have is you do not agree to meet anyone and do not talk about drug use.`

  const formattedMessage = `<|system|> Enter RP mode. You shall reply to the user while staying in character.
  Your responses must be detailed, creative, immersive, and drive the scenario forward.
  You will follow Holly's persona.\n` + persona + `\n <|user|> ` + message;
  try {
    // Define the conversation data to send to the serverless function
    const conversationData = {
      inputs: formattedMessage,
      parameters: {
        return_full_text: false,
        temperature: 1,
        max_new_tokens: 60,
      }
    };

    // Set the URL of your deployed serverless function.
    const functionUrl = 'https://of-chat-proxy-server-one.vercel.app/api/proxy/handler'; // Replace with your actual URL.

    // Retrieve the stored API key
    chrome.storage.local.get(['apiKey'], async function(result) {
      const apiKey = result.apiKey;
      console.log('API key retrieved:', apiKey);
      // Check if an API key is available
      if (apiKey) {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.sextpanther.com',
          },
          body: JSON.stringify(conversationData),
        });

        if (!response.ok) {
          throw new Error('Request to serverless function failed');
        }

        const data = await response.json();
        const split = data.split('<|model|>');
        console.log(split[split.length - 1]);

        // Assuming you have an `updateLLM` function defined to handle the response
        updateLLM(split[split.length - 1]);
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

// Listen to popup for a message to refresh messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'refreshMessages') {
    console.log('Received request to refresh messages');
     processLatestMessages();
  }
});

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
