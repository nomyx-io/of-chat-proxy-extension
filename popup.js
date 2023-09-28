// Function to handle messages from the content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateInterface') {
    document.getElementById('selectedMessage').value = request.messages.join('\n');
    document.getElementById('llmResponse').value = request.llmResponse;
  }
});

// Event listener for the select button
document.getElementById('selectMessage').addEventListener('click', function() {
  const manualMessage = document.getElementById('manualMessage').value;

  if (manualMessage) {
    document.getElementById('message1').value = manualMessage;
  } else {
    chrome.tabs.executeScript({
      code: `Array.from(document.querySelectorAll('.muser-short-msg p')).slice(-5).map(el => el.innerText)`
    }, (selections) => {
      const lastFiveMessages = selections[0];
      lastFiveMessages.forEach((message, index) => {
        document.getElementById(`message${index + 1}`).value = message;
      });
    });
  }
});

// Event listener for the send to bot button
document.getElementById('sendToBot').addEventListener('click', function() {
  let selectedMessage;
  for (let i = 1; i <= 5; i++) {
    if (document.getElementById(`selectMessage${i}`).checked) {
      selectedMessage = document.getElementById(`message${i}`).value;
      break;
    }
  }

  if (selectedMessage) {
    // Send the message to the content script to get the LLM response
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'sendResponse', message: selectedMessage });
    });
  } else {
    alert('Please select one of the messages or enter a message manually.');
  }
});
