document.addEventListener('DOMContentLoaded', () => {
    // Reveal Animations
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // UI Elements
    const checkBtn = document.getElementById('check-connection');
    const apiUrlInput = document.getElementById('api-url');
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('model-select');
    const logContent = document.getElementById('log-content');
    const statusDot = document.getElementById('status-dot');
    const clearBtn = document.getElementById('clear-logs');
    
    // Chat Elements
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const aiStatus = document.getElementById('ai-status');
    const searchToggle = document.getElementById('search-toggle');

    const systemPrompt = "당신은 '코다리부장'이라는 이름의 40대 한국 여성입니다. 지적이고 섹시하며 카리스마 넘치는 프로페셔널한 부장의 페르소나를 가지고 있습니다.";

    function addLog(message, type = 'neutral') {
        const p = document.createElement('p');
        p.className = `log-${type}`;
        const time = new Date().toLocaleTimeString();
        p.textContent = `[${time}] ${message}`;
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    }

    function appendMessage(text, role) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    async function checkConnection() {
        const lmUrl = apiUrlInput.value.trim();
        const ollamaUrl = 'http://localhost:11434';
        
        addLog(`Connecting to local models...`, 'info');
        if (modelSelect) modelSelect.innerHTML = '';

        let modelsFound = [];

        // Fetch from Ollama
        try {
            const response = await fetch(`${ollamaUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                data.models.forEach(m => {
                    modelsFound.push({
                        id: m.name,
                        label: `[Ollama] ${m.name}`,
                        baseUrl: `${ollamaUrl}/v1/chat/completions`,
                        isE4B: m.name.includes('e4b')
                    });
                });
                addLog(`Ollama connected.`, 'success');
            }
        } catch (e) { addLog('Ollama offline.', 'neutral'); }

        // Populate Dropdown
        if (modelsFound.length > 0) {
            modelSelect.innerHTML = modelsFound.map(m => 
                `<option value="${m.id}" data-url="${m.baseUrl}" ${m.isE4B ? 'selected' : ''}>${m.label}</option>`
            ).join('');
            statusDot.classList.add('active');
            addLog(`Gemma4:E4B prioritized. Ready for work.`, 'success');
        } else {
            addLog('No models found.', 'error');
            statusDot.classList.add('error');
        }
    }

    async function handleChat() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        userInput.value = '';
        
        const isSearchMode = searchToggle ? searchToggle.checked : false;
        aiStatus.textContent = isSearchMode ? 'System: Searching & Thinking...' : 'System: GPU Heavy Lifting...';
        
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const model = selectedOption ? selectedOption.value : '';
        const targetUrl = selectedOption ? selectedOption.getAttribute('data-url') : '';

        const aiMsgDiv = appendMessage('', 'ai');
        let fullResponse = '';

        try {
            let endpoint, body;
            if (isSearchMode) {
                endpoint = 'http://localhost:5000/chat';
                body = JSON.stringify({
                    query: text, use_search: true, model: model,
                    system_prompt: systemPrompt, target_url: targetUrl
                });
            } else {
                endpoint = targetUrl;
                body = JSON.stringify({
                    model: model,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
                    temperature: 0.7, stream: true
                });
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const dataStr = line.trim().slice(6);
                        if (dataStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const content = data.choices[0].delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                aiMsgDiv.textContent = fullResponse;
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        } catch (e) {}
                    }
                }
            }
            aiStatus.textContent = 'System: Ready (E4B)';
        } catch (error) {
            aiMsgDiv.textContent = `Error: ${error.message}`;
            aiStatus.textContent = 'System: Error';
        }
    }

    checkBtn.addEventListener('click', checkConnection);
    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChat();
        }
    });

    // Auto-check on load
    setTimeout(checkConnection, 1000);
});
