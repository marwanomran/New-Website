// Utility function to create a chat bubble
function createBubble(content, className) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${className}`;
    bubble.textContent = content;
    return bubble;
}

// Fetch and populate models dropdown on page load
document.addEventListener('DOMContentLoaded', async function () {
    const modelSelect = document.getElementById('modelSelect');
    try {
        const response = await fetch('https://3dsoftwareemergence.dpdns.org:443/api/tags');
        if (!response.ok) throw new Error('Failed to load models');
        const data = await response.json();
        modelSelect.innerHTML = '';
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading models:', error);
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
});

document.getElementById('submitButton').addEventListener('click', async function () {
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const submitButton = document.getElementById('submitButton');
    const modelSelect = document.getElementById('modelSelect');

    // Get the trimmed query input
    const query = userInput.value.trim();

    if (!query) return;

    // Append user message bubble
    chatBox.appendChild(createBubble(query, 'userBubble'));
    chatBox.scrollTop = chatBox.scrollHeight;

    // Disable button to prevent duplicate submissions
    submitButton.disabled = true;

    const apiEndpoint = `https://3dsoftwareemergence.dpdns.org:443/api/generate`;
    const modelName = modelSelect.value;

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
        await streamOllamaResponse(apiEndpoint, requestData, chatBox);
    } catch (error) {
        console.error('Error:', error);
        chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight;
        submitButton.disabled = false;
    }
});

async function streamOllamaResponse(apiEndpoint, requestData, chatBox) {
    const aiBubble = createBubble('', 'aiBubble');
    chatBox.appendChild(aiBubble);

    let fullResponse = '';

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });

    if (!response.body) {
        aiBubble.textContent = "No response body from server.";
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split buffer into lines (Ollama returns JSON per line)
        let lines = buffer.split('\n');
        buffer = lines.pop(); // Last line may be incomplete, keep it in buffer

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const obj = JSON.parse(line);
                if (obj.response && obj.response.trim() !== '') {
                    fullResponse += obj.response;
                    // Update the bubble as we go (character-by-character effect)
                    aiBubble.textContent = fullResponse;
                    // If you want a typing effect, you can add a delay here
                }
            } catch (e) {
                // Ignore invalid JSON lines
            }
        }
    }
    // Handle any remaining buffer
    if (buffer.trim()) {
        try {
            const obj = JSON.parse(buffer);
            if (obj.response && obj.response.trim() !== '') {
                fullResponse += obj.response;
                aiBubble.textContent = fullResponse;
            }
        } catch (e) { }
    }
}
