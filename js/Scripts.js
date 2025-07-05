document.getElementById('submitButton').addEventListener('click', function () {
    const query = document.getElementById('userInput').value.trim();
    if (!query) return;

    // Append user message bubble
    let userBubble = document.createElement('div');
    userBubble.className = 'bubble userBubble';
    userBubble.textContent = query;
    document.getElementById('chatBox').appendChild(userBubble);

    const apiEndpoint = `http://3dsoftwareemergence.zapto.org:11434/api/generate`;
    const modelKey = "your_model_key";  // Replace with actual key
    const requestData = {
        key: modelKey,
        query: query
    };

    fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
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
            errorBubble.textContent = `An error occurred: ${error.message}`;
            document.getElementById('chatBox').appendChild(errorBubble);
        });
});
