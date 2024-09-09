// Define a dictionary of responses
const responses = {
    'hello': 'Hi! How can I help you?',
    'how are you': 'I\'m good, thanks! How about you?',
    'what is your name': 'My name is ChatBot.'
};

// Define a function to toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}

// Define a function to enlarge the window
function enlargeWindow() {
    const window = document.getElementById('window');
    window.classList.toggle('enlarged');
}

// Define a function to respond to user input
function respond(userInput) {
    // Check if the user input matches a response
    for (const token in responses) {
        if (userInput.includes(token)) {
            return responses[token];
        }
    }

    // If no match is found, return a default response
    return 'Sorry, I didn\'t understand that.';
}

// Test the respond function
const userInput = 'hello';
console.log(respond(userInput));  // Output: Hi! How can I help you?

// Add event listeners to the toggle dark mode and enlarge window buttons
document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
document.getElementById('enlarge-window').addEventListener('click', enlargeWindow);