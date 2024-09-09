// script.js
const chatContainer = document.querySelector('.chat-container');
const darkModeToggle = document.querySelector('#dark-mode-toggle');
const messageInput = document.querySelector('#message-input');
const sendButton = document.querySelector('#send-button');
const chatMessages = document.querySelector('.chat-messages');

let darkMode = false;

darkModeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    chatContainer.classList.toggle('dark-mode');
});

sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        messageInput.value = '';
    }
});

// GPT integration will go here