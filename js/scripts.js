document.getElementById('submitButton').addEventListener('click', function () {
    const query = document.getElementById('userInput').value.trim();
    if (!query) return;

    // Append user message bubble
    let userBubble = document.createElement('div');
    userBubble.className = 'bubble userBubble';
    userBubble.textContent = query;
    document.getElementById('chatBox').appendChild(userBubble);

    // Send request to AI service
    fetch(`https://3dsoftwareemergence.zapto.org:11434/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })
        .then(response => response.json())
        .then(data => {
            // Append AI response bubble
            let aiBubble = document.createElement('div');
            aiBubble.className = 'bubble aiBubble';
            aiBubble.textContent = data.response;
            document.getElementById('chatBox').appendChild(aiBubble);
        })
        .catch(error => {
            console.error('Error:', error);
            // Append error message bubble
            let errorBubble = document.createElement('div');
            errorBubble.className = 'bubble aiBubble';
            errorBubble.textContent = 'An error occurred. Please check the server logs.';
            document.getElementById('chatBox').appendChild(errorBubble);
        });

    // Clear input
    document.getElementById('userInput').value = '';
});
