// Get the input field, send button, and chat window elements
const inputField = document.getElementById('input-field');
const sendBtn = document.getElementById('send-btn');
const chatWindow = document.getElementById('chat-window');

// Add event listener to the send button
sendBtn.addEventListener('click', () => {
    // Get the user's input
    const userInput = inputField.value.trim();

    // Check if the input is not empty
    if (userInput !== '') {
        // Create a new paragraph element to display the user's message
        const userMessage = document.createElement('p');
        userMessage.textContent = `You: ${userInput}`;
        chatWindow.appendChild(userMessage);

        // Create a new paragraph element to display the AI's response
        const aiResponse = document.createElement('p');
        aiResponse.textContent = `AI: ${getAIResponse(userInput)}`;
        chatWindow.appendChild(aiResponse);

        // Clear the input field
        inputField.value = '';
    }
});

// Function to get the AI's response
function getAIResponse(userInput) {
    // This is a placeholder function. You would need to implement the actual AI logic here.
    return 'This is a sample response from the AI.';