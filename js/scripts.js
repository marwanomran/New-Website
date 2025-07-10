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
    const themeToggle = document.getElementById('themeToggle');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const body = document.body;

    // SVG background pattern for extra flair
    function setBackgroundPattern(isLight) {
        const patternId = 'bg-svg-pattern';
        let existing = document.getElementById(patternId);
        if (existing) existing.remove();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', patternId);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('style', 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;');
        svg.innerHTML = isLight
            ? '<defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.5" fill="#b0b0b0" opacity="0.18"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/>'
            : '<defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.5" fill="#4CAF50" opacity="0.08"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/>';
        document.body.appendChild(svg);
    }

    // Fade animation for theme switch
    function fadeThemeSwitch(callback) {
        body.style.transition = 'background 0.5s, color 0.5s';
        body.classList.add('theme-fade');
        setTimeout(() => {
            callback();
            setTimeout(() => {
                body.classList.remove('theme-fade');
            }, 500);
        }, 10);
    }

    // Theme preference logic
    function setTheme(mode, save) {
        fadeThemeSwitch(() => {
            if (mode === 'light') {
                body.classList.add('light-mode');
                themeToggle.textContent = '☀️';
                setBackgroundPattern(true);
            } else {
                body.classList.remove('light-mode');
                themeToggle.textContent = '🌙';
                setBackgroundPattern(false);
            }
            if (save) localStorage.setItem('theme', mode);
        });
    }

    // On load: check localStorage, else system preference
    let theme = localStorage.getItem('theme');
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    setTheme(theme, false);

    themeToggle.addEventListener('click', function() {
        const isLight = body.classList.contains('light-mode');
        setTheme(isLight ? 'dark' : 'light', true);
    });

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

    document.getElementById('submitButton').addEventListener('click', async function () {
        const userInput = document.getElementById('userInput');
        const chatBox = document.getElementById('chatBox');
        const submitButton = document.getElementById('submitButton');
        const modelSelect = document.getElementById('modelSelect');

        // Get the trimmed query input
        const query = userInput.value.trim();

        if (!query) return;

        // Clear the input box after getting the value
        userInput.value = '';

        // Append user message bubble
        chatBox.appendChild(createBubble(query, 'userBubble'));
        chatBox.scrollTop = chatBox.scrollHeight;

        // Disable button to prevent duplicate submissions
        submitButton.disabled = true;

        // Show loading spinner
        loadingSpinner.style.display = 'inline-block';

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
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
        }
    });

    // Add event listener for Enter key on the input box
    document.getElementById('userInput').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if inside a form
            document.getElementById('submitButton').click();
        }
    });
});

function escapeHTML(str) {
    return str.replace(/[&<>"]'/g, function(tag) {
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

async function streamOllamaResponse(apiEndpoint, requestData, chatBox) {
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
            let html = displayBuffer.replace(/\n/g, '<br/>');
            html += `<pre><code${codeBlockLang ? ` class=\"language-${codeBlockLang}\"` : ''}>` + escapeHTML(codeBlockBuffer) + '</code></pre>';
            aiBubble.innerHTML = html;
        }
        if (window.Prism) Prism.highlightAll();
        // Auto-scroll chat to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function typeNextChar() {
        if (charQueue.length === 0) {
            typing = false;
            return;
        }
        let char = charQueue.shift();

        // State machine for streaming code block
        if (!inCodeBlock) {
            if (backtickBuffer.length < 3) {
                if (char === '`') {
                    backtickBuffer += '`';
                    if (backtickBuffer.length === 3) {
                        afterOpenTicks = true;
                        langBuffer = '';
                        return typeNextChar();
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
            if (backtickBuffer.length < 3) {
                if (char === '`') {
                    backtickBuffer += '`';
                    if (backtickBuffer.length === 3) {
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
        setTimeout(typeNextChar, 20);
    }

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

        let lines = buffer.split('\n');
        buffer = lines.pop();

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
