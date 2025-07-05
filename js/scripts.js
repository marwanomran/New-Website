document.getElementById('submitButton').addEventListener('click', async function () {
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const submitButton = document.getElementById('submitButton');
    const modelSelect = document.getElementById('modelSelect');

    // Trim and get the query
    let query = userInput.value.trim();
    if (!query) return;

    // Append user message bubble
    chatBox.appendChild(createBubble(query, 'userBubble'));
    chatBox.scrollTop = chatBox.scrollHeight;

    // Disable button to prevent duplicate submissions
    submitButton.disabled = true;

    const apiEndpoint = `http://3dsoftwareemergence.zapto.org:11434/api/generate`;
    let modelName = modelSelect.value;

    if (!modelName) {
        chatBox.appendChild(createBubble('Please select a model before submitting.', 'aiBubble'));
        submitButton.disabled = false;
        return;
    }

    const requestData = {
        model: modelName,
        prompt: query
    };

    try {
        let response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw Ollama response:', text);

        // Initialize lines before using it
        let lines = text.split('\n').filter(line => line.trim() !== '');
        console.log('Parsed lines:', lines);

        let fullResponse = '';

        for (const line of lines) {
            try {
                const obj = JSON.parse(line);
                console.log('Parsed object:', obj); // Log each parsed object
                if (obj.response && obj.response.trim() !== '') {
                    fullResponse += obj.response; // Concatenate non-empty response text
                }
            } catch (e) {
                console.warn('Invalid JSON line:', line);
            }
        }

        console.log('Full response after concatenation:', fullResponse);

        const aiText = fullResponse.trim() || "No response from AI.";
        chatBox.appendChild(createBubble(aiText, 'aiBubble'));

    } catch (error) {
        console.error('Error:', error);
        chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight;
        submitButton.disabled = false;
    }
});
