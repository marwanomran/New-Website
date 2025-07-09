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

        // Parse the lines from the raw response
        let lines;
        try {
            lines = text.split('\n').filter(line => line.trim() !== '');
        } catch (e) {
            lines = [];
        }
        console.log('Parsed lines:', lines);

        let fullResponse = '';

        for (const line of lines) {
            try {
                const obj = JSON.parse(line);
                if (obj.response && obj.response.trim() !== '') {
                    fullResponse += obj.response; // Concatenate non-empty response text
                }
            } catch (e) {
                console.warn('Invalid JSON line:', line);
            }
        }

        console.log('Full response after concatenation:', fullResponse);

        const aiText = fullResponse.trim() || "No response from AI.";
        const aiBubble = createBubble('', 'aiBubble');
        chatBox.appendChild(aiBubble);
        typeTextIntoBubble(aiBubble, aiText, 50); // 50ms per word, adjust as desired

    } catch (error) {
        console.error('Error:', error);
        chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight;
        submitButton.disabled = false;
    }
    function typeTextIntoBubble(bubble, text, delay = 50) {
        const words = text.split(' ');
        let i = 0;
        bubble.textContent = '';
        function typeNext() {
            if (i < words.length) {
                bubble.textContent += (i === 0 ? '' : ' ') + words[i];
                i++;
                setTimeout(typeNext, delay);
            }
        }
        typeNext();
    }
});
