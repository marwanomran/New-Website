// Utility function to create a chat bubble
function createBubble(content, className) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${className}`;
    bubble.textContent = content;
    return bubble;
}

// File attachment utilities
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    const icons = {
        'text/plain': '📄',
        'application/pdf': '📕',
        'application/msword': '📘',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
        'image/jpeg': '🖼️',
        'image/jpg': '🖼️',
        'image/png': '🖼️',
        'image/gif': '🖼️'
    };
    return icons[fileType] || '📎';
}

function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileName = file.name;
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    const fileIcon = document.createElement('span');
    fileIcon.className = 'file-icon';
    fileIcon.textContent = getFileIcon(file.type);
    
    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(file.size);
    
    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);
    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileDetails);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file-btn';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => removeFile(file.name);
    
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);
    
    return fileItem;
}

function removeFile(fileName) {
    const fileList = document.getElementById('fileList');
    const fileItem = fileList.querySelector(`[data-file-name="${fileName}"]`);
    if (fileItem) {
        fileItem.remove();
        // Remove from selectedFiles array
        selectedFiles = selectedFiles.filter(file => file.name !== fileName);
        
        // Hide file preview if no files left
        if (selectedFiles.length === 0) {
            document.getElementById('filePreview').style.display = 'none';
        }
    }
}

function clearAllFiles() {
    selectedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// Function to read file contents
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            reader.readAsText(file);
        } else {
            // For non-text files, just return a placeholder
            resolve(`[Binary file: ${file.name}]`);
        }
    });
}

// Global variable to store selected files
let selectedFiles = [];

// Fetch and populate models dropdown on page load
document.addEventListener('DOMContentLoaded', async function () {
    // Force cache clearing on page load
    if (performance.navigation.type === 1) { // Reload
        // Clear any cached data if needed
        console.log('Page reloaded - cache cleared');
    }
    
    // Add cache-busting headers for future requests
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    
    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);
    
    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);

    const modelSelect = document.getElementById('modelSelect');
    const themeToggle = document.getElementById('themeToggle');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const body = document.body;
    const attachmentButton = document.getElementById('attachmentButton');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileList = document.getElementById('fileList');
    const clearFilesBtn = document.getElementById('clearFiles');

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

    // File attachment event listeners
    attachmentButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            // Check if file is already selected
            if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                selectedFiles.push(file);
                fileList.appendChild(createFileItem(file));
            }
        });
        
        if (selectedFiles.length > 0) {
            filePreview.style.display = 'block';
        }
    });

    clearFilesBtn.addEventListener('click', clearAllFiles);

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

    let abortController = null;

    document.getElementById('submitButton').addEventListener('click', async function () {
        const userInput = document.getElementById('userInput');
        const chatBox = document.getElementById('chatBox');
        const submitButton = document.getElementById('submitButton');
        const stopButton = document.getElementById('stopButton');
        const modelSelect = document.getElementById('modelSelect');

        // Get the trimmed query input
        const query = userInput.value.trim();

        if (!query && selectedFiles.length === 0) return;

        // Clear the input box after getting the value
        userInput.value = '';

        // Prepare message content with files
        let messageContent = query;
        if (selectedFiles.length > 0) {
            messageContent += '\n\n--- Attached Files ---\n';
            
            // Read file contents
            for (const file of selectedFiles) {
                messageContent += `\nFile: ${file.name} (${formatFileSize(file.size)})\n`;
                try {
                    const fileContent = await readFileContent(file);
                    messageContent += `Content:\n${fileContent}\n`;
                } catch (error) {
                    messageContent += `Error reading file: ${error.message}\n`;
                }
                messageContent += '---\n';
            }
        }

        // Append user message bubble
        chatBox.appendChild(createBubble(messageContent, 'userBubble'));
        chatBox.scrollTop = chatBox.scrollHeight;

        // Clear attached files after sending
        clearAllFiles();

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

        abortController = new AbortController();
        stopButton.style.display = 'block';
        try {
            await streamOllamaResponse(apiEndpoint, requestData, chatBox, abortController.signal);
        } catch (error) {
            if (error.name === 'AbortError') {
                chatBox.appendChild(createBubble('Response stopped by user.', 'aiBubble'));
            } else {
                chatBox.appendChild(createBubble(`An error occurred: ${error.message}`, 'aiBubble'));
            }
        } finally {
            chatBox.scrollTop = chatBox.scrollHeight;
            submitButton.disabled = false;
            loadingSpinner.style.display = 'none';
            stopButton.style.display = 'none';
            abortController = null;
        }
    });

    document.getElementById('stopButton').addEventListener('click', function () {
        if (abortController) abortController.abort();
        document.getElementById('stopButton').style.display = 'none';
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

async function streamOllamaResponse(apiEndpoint, requestData, chatBox, abortSignal) {
    const aiBubble = createBubble('', 'aiBubble');
    chatBox.appendChild(aiBubble);

    // Reasoning model detection
    const reasoningModelPatterns = [/reason/i, /deepseek/i, /llama/i];
    const modelName = requestData.model || '';
    let isReasoningModel = reasoningModelPatterns.some(re => re.test(modelName));
    let thinkingBubble = null;
    let thinkingInterval = null;
    if (isReasoningModel) {
        thinkingBubble = document.createElement('div');
        thinkingBubble.className = 'bubble aiBubble thinking-bubble';
        thinkingBubble.innerHTML = '<span class="thinking-dots">Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>';
        chatBox.appendChild(thinkingBubble);
        chatBox.scrollTop = chatBox.scrollHeight;
        // Animate dots
        let dotCount = 0;
        thinkingInterval = setInterval(() => {
            const dots = thinkingBubble.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.style.opacity = (i <= dotCount % 3) ? '1' : '0.2';
            });
            dotCount++;
        }, 400);
    }

    let wordQueue = [];
    let typing = false;

    // State for streaming code block rendering (unchanged)
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

    function typeNextWord() {
        if (wordQueue.length === 0) {
            typing = false;
            return;
        }
        let word = wordQueue.shift();

        // Remove thinking bubble on first word
        if (thinkingBubble) {
            thinkingBubble.remove();
            thinkingBubble = null;
            if (thinkingInterval) clearInterval(thinkingInterval);
        }

        // State machine for streaming code block (word by word)
        for (let i = 0; i < word.length; i++) {
            let char = word[i];
            // (same code block logic as before, but per char)
            if (!inCodeBlock) {
                if (backtickBuffer.length < 3) {
                    if (char === '`') {
                        backtickBuffer += '`';
                        if (backtickBuffer.length === 3) {
                            afterOpenTicks = true;
                            langBuffer = '';
                            continue;
                        } else {
                            displayBuffer += char;
                            continue;
                        }
                    } else {
                        if (backtickBuffer.length > 0) {
                            displayBuffer += backtickBuffer;
                            backtickBuffer = '';
                        }
                        displayBuffer += char;
                        continue;
                    }
                } else if (afterOpenTicks) {
                    if (!/^[a-zA-Z0-9]$/.test(char)) {
                        inCodeBlock = true;
                        codeBlockLang = langBuffer.trim();
                        codeBlockBuffer = '';
                        codeBlockOpen = true;
                        afterOpenTicks = false;
                        if (char !== '\n' && char !== ' ' && char !== '\r') {
                            codeBlockBuffer += char;
                        }
                        continue;
                    } else {
                        langBuffer += char;
                        continue;
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
                            continue;
                        } else {
                            continue;
                        }
                    } else {
                        if (backtickBuffer.length > 0) {
                            codeBlockBuffer += backtickBuffer;
                            backtickBuffer = '';
                        }
                        codeBlockBuffer += char;
                        continue;
                    }
                }
            }
        }
        updateBubble();
        setTimeout(typeNextWord, 120); // word-by-word speed
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
                    // Split into words (preserve whitespace)
                    const words = obj.response.match(/\S+\s*/g) || [];
                    for (const word of words) {
                        wordQueue.push(word);
                    }
                    if (!typing) {
                        typing = true;
                        typeNextWord();
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
                const words = obj.response.match(/\S+\s*/g) || [];
                for (const word of words) {
                    wordQueue.push(word);
                }
                if (!typing) {
                    typing = true;
                    typeNextWord();
                }
            }
        } catch (e) {}
    }
}
