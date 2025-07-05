// Fetch and populate models dropdown on page load
document.addEventListener('DOMContentLoaded', async function () {
    const modelSelect = document.getElementById('modelSelect');
    try {
        const response = await fetch('http://3dsoftwareemergence.zapto.org:11434/api/tags');
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        // Ollama returns { "models": [ { "name": "llama2", ... }, ... ] }
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
    const query = userInput.value.trim();
    if (!query) return;

    // Append user message bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'bubble userBubble';
    userBubble.textContent = query;
    chatBox.appendChild(userBubble);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Disable button to prevent duplicate submissions
    submitButton.disabled = true;

    const apiEndpoint = `http://3dsoftwareemergence.zapto.org:11434/api/generate`;
    const modelName = modelSelect.value; // Get selected model name
    const requestData = {
        model: modelName,
        prompt: query
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Ollama streams responses, but for simplicity, just show the first response
        const aiText = data.response || "No response from AI.";
        const aiBubble = document.createElement('div');
        aiBubble.className = 'bubble aiBubble';
        aiBubble.textContent = aiText;
        chatBox.appendChild(aiBubble);
    } catch (error) {
        console.error('Error:', error);
        const errorBubble = document.createElement('div');
        errorBubble.className = 'bubble aiBubble';
        errorBubble.textContent = `An error occurred: ${error.message}`;
        chatBox.appendChild(errorBubble);
    } finally {
        chatBox.scrollTop = chatBox.scrollHeight;
        submitButton.disabled = false;
    }
});