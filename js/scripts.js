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

    let isProcessing = false;
    let abortController = null;

    // Replace event listeners for submitButton with actionButton
    const actionButton = document.getElementById('actionButton');
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');

    actionButton.addEventListener('click', async function () {
        if (isProcessing) {
            // Stop the stream
            if (abortController) abortController.abort();
            return;
        }
        // Start sending
        const query = userInput.value.trim();
        if (!query) return;
        userInput.value = '';
        chatBox.appendChild(createBubble(query, 'userBubble'));
        chatBox.scrollTop = chatBox.scrollHeight;
        isProcessing = true;
        actionButton.textContent = 'Stop Response';
        userInput.disabled = true;
        modelSelect.disabled = true;
        abortController = new AbortController();
        const apiEndpoint = `https://3dsoftwareemergence.dpdns.org:443/api/generate`;
        const modelName = modelSelect.value;
        if (!modelName) {
            chatBox.appendChild(createBubble('Please select a model before submitting.', 'aiBubble'));
            isProcessing = false;
            actionButton.textContent = 'Send Query';
            userInput.disabled = false;
            modelSelect.disabled = false;
            return;
        }
        const requestData = {
            model: modelName,
            prompt: query
        };
        try {
            await streamOllamaResponse(apiEndpoint, requestData, chatBox, abortController.signal);
        } catch (error) {
            if (error.name === 'AbortError') {
                chatBox.appendChild(createBubble('Response stopped by user.', 'aiBubble'));
            } else {
                chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
            }
        } finally {
            isProcessing = false;
            actionButton.textContent = 'Send Query';
            userInput.disabled = false;
            modelSelect.disabled = false;
            abortController = null;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    userInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !isProcessing) {
            event.preventDefault();
            actionButton.click();
        }
    });
});

let isProcessing = false;
let abortController = null;

// Replace event listeners for submitButton with actionButton
const actionButton = document.getElementById('actionButton');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const modelSelect = document.getElementById('modelSelect');

actionButton.addEventListener('click', async function () {
    if (isProcessing) {
        // Stop the stream
        if (abortController) abortController.abort();
        return;
    }
    // Start sending
    const query = userInput.value.trim();
    if (!query) return;
    userInput.value = '';
    chatBox.appendChild(createBubble(query, 'userBubble'));
    chatBox.scrollTop = chatBox.scrollHeight;
    isProcessing = true;
    actionButton.textContent = 'Stop Response';
    userInput.disabled = true;
    modelSelect.disabled = true;
    abortController = new AbortController();
    const apiEndpoint = `https://3dsoftwareemergence.dpdns.org:443/api/generate`;
    const modelName = modelSelect.value;
    if (!modelName) {
        chatBox.appendChild(createBubble('Please select a model before submitting.', 'aiBubble'));
        isProcessing = false;
        actionButton.textContent = 'Send Query';
        userInput.disabled = false;
        modelSelect.disabled = false;
        return;
    }
    const requestData = {
        model: modelName,
        prompt: query
    };
    try {
        await streamOllamaResponse(apiEndpoint, requestData, chatBox, abortController.signal);
    } catch (error) {
        if (error.name === 'AbortError') {
            chatBox.appendChild(createBubble('Response stopped by user.', 'aiBubble'));
        } else {
            chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
        }
    } finally {
        isProcessing = false;
        actionButton.textContent = 'Send Query';
        userInput.disabled = false;
        modelSelect.disabled = false;
        abortController = null;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

userInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !isProcessing) {
        event.preventDefault();
        actionButton.click();
    }
});

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return charsToReplace[tag] || tag;
    });
}

function parseMarkdownToHTML(text) {
    // Find all code blocks and replace them with placeholders
    const codeBlocks = [];
    text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
        codeBlocks.push('<pre><code>' + escapeHTML(code) + '</code></pre>');
        return `[[CODEBLOCK_${codeBlocks.length - 1}]]`;
    });
    // Replace newlines in the rest of the text
    text = escapeHTML(text).replace(/\n/g, '<br/>');
    // Restore code blocks
    text = text.replace(/\[\[CODEBLOCK_(\d+)\]\]/g, function(match, idx) {
        return codeBlocks[idx];
    });
    return text;
}

async function streamOllamaResponse(apiEndpoint, requestData, chatBox, abortSignal) {
    const aiBubble = createBubble('', 'aiBubble');
    chatBox.appendChild(aiBubble);

    let charQueue = [];
    let typing = false;

    // State for streaming code block rendering
    let displayBuffer = '';
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockBuffer = '';
    let codeBlockOpen = false;
    let backtickBuffer = '';
    let langBuffer = '';
    let afterOpenTicks = false;

    function updateBubble() {
        if (!inCodeBlock) {
            aiBubble.innerHTML = displayBuffer.replace(/\n/g, '<br/>');
        } else {
            // Render everything before the code block, then the code block as it grows
            let html = displayBuffer.replace(/\n/g, '<br/>');
            html += `<pre><code${codeBlockLang ? ` class=\"language-${codeBlockLang}\"` : ''}>` + escapeHTML(codeBlockBuffer) + '</code></pre>';
            aiBubble.innerHTML = html;
        }
        // Apply syntax highlighting to all code blocks
        if (window.Prism) Prism.highlightAll();
    }

    function typeNextChar() {
        if (charQueue.length === 0) {
            typing = false;
            return;
        }
        let char = charQueue.shift();

        // State machine for streaming code block
        if (!inCodeBlock) {
            // Look for opening triple backticks
            if (backtickBuffer.length < 3) {
                if (char === '`') {
                    backtickBuffer += '`';
                    if (backtickBuffer.length === 3) {
                        afterOpenTicks = true;
                        langBuffer = '';
                        return typeNextChar(); // Don't display the backticks
                    } else {
                        displayBuffer += char;
                        updateBubble();
                        setTimeout(typeNextChar, 20);
                        return;
                    }
                } else {
                    if (backtickBuffer.length > 0) {
                        displayBuffer += backtickBuffer;
                        backtickBuffer = '';
                    }
                    displayBuffer += char;
                    updateBubble();
                    setTimeout(typeNextChar, 20);
                    return;
                }
            } else if (afterOpenTicks) {
                // After ```, collect language specifier until first non-space/newline/letter
                if (char === '\n' || char === ' ' || char === '\r') {
                    inCodeBlock = true;
                    codeBlockLang = langBuffer.trim();
                    codeBlockBuffer = '';
                    codeBlockOpen = true;
                    afterOpenTicks = false;
                    updateBubble();
                    setTimeout(typeNextChar, 20);
                    return;
                } else {
                    langBuffer += char;
                    setTimeout(typeNextChar, 20);
                    return;
                }
            }
        } else {
            // Inside code block, look for closing triple backticks
            if (backtickBuffer.length < 3) {
                if (char === '`') {
                    backtickBuffer += '`';
                    if (backtickBuffer.length === 3) {
                        // End code block
                        inCodeBlock = false;
                        codeBlockOpen = false;
                        backtickBuffer = '';
                        updateBubble();
                        setTimeout(typeNextChar, 20);
                        return;
                    } else {
                        setTimeout(typeNextChar, 20);
                        return;
                    }
                } else {
                    if (backtickBuffer.length > 0) {
                        codeBlockBuffer += backtickBuffer;
                        backtickBuffer = '';
                    }
                    codeBlockBuffer += char;
                    updateBubble();
                    setTimeout(typeNextChar, 20);
                    return;
                }
            }
        }
        // Fallback (should not reach here)
        setTimeout(typeNextChar, 20);
    }

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: abortSignal
    });

    if (!response.body) {
        aiBubble.textContent = "No response body from server.";
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        if (abortSignal.aborted) throw new DOMException('Aborted', 'AbortError');
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
                    for (const char of obj.response) {
                        charQueue.push(char);
                    }
                    if (!typing) {
                        typing = true;
                        typeNextChar();
                    }
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
                for (const char of obj.response) {
                    charQueue.push(char);
                }
                if (!typing) {
                    typing = true;
                    typeNextChar();
                }
            }
        } catch (e) {}
    }
}
