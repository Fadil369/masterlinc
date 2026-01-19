// MASTERLINC Application
const APP = {
    state: {
        domain: 'healthcare',
        lang: 'en',
        messages: [],
        processing: false
    },

    init() {
        // Initialize modules
        Auth.init();
        Analytics.init();

        // Bind events
        this.bindEvents();

        // Render initial UI
        this.renderWelcome();
        this.updateUI();

        // Load chat history if authenticated
        this.loadChatHistory();

        // Check API status
        this.checkAPIStatus();

        // Track app initialization
        Analytics.track('app_initialized', {
            domain: this.state.domain,
            language: this.state.lang
        });
    },

    bindEvents() {
        // Domain switching
        document.querySelectorAll('.domain-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const domain = e.currentTarget.dataset.domain;
                this.switchDomain(domain);
            });
        });

        // Language toggle
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLang(e.target.dataset.lang);
            });
        });

        // Send message
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-button');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input.addEventListener('input', () => this.autoResize());

        sendBtn.addEventListener('click', () => this.sendMessage());

        // Parallax effect
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;

            document.querySelectorAll('.gradient-sphere').forEach((sphere, i) => {
                const speed = (i + 1) * 0.3;
                sphere.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        });
    },

    switchDomain(domain) {
        this.state.domain = domain;

        // Update active card
        document.querySelectorAll('.domain-card').forEach(card => {
            card.classList.toggle('active', card.dataset.domain === domain);
        });

        this.updateUI();

        const config = CONFIG.DOMAINS[domain];
        this.addMessage('assistant',
            `Switched to **${config.title[this.state.lang]}**. ${config.agent} is ready to assist you.`,
            config.agent
        );

        // Track domain switch
        Analytics.track('domain_switched', {
            domain: domain,
            agent: config.agent
        });
    },

    switchLang(lang) {
        this.state.lang = lang;
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.updateUI();

        // Track language switch
        Analytics.track('language_switched', {
            language: lang
        });
    },

    updateUI() {
        const config = CONFIG.DOMAINS[this.state.domain];
        const lang = this.state.lang;

        document.getElementById('domain-title').textContent = config.title[lang];
        document.getElementById('domain-subtitle').textContent = config.subtitle[lang];
        document.getElementById('agent-name').textContent = config.agent;
        document.getElementById('agent-desc').textContent = config.desc[lang];

        this.renderQuickActions();
        this.renderPrompts();
        Analytics.renderStats();
    },

    renderQuickActions() {
        const container = document.getElementById('quick-actions-container');
        const actions = CONFIG.QUICK_ACTIONS[this.state.domain];

        container.innerHTML = actions.map(a => `
            <div class="quick-action" onclick="APP.useAction('${a.prompt.replace(/'/g, "\\'")}')">
                <div class="qa-icon">${a.icon}</div>
                <div class="qa-title">${a.title}</div>
                <div class="qa-desc">${a.desc}</div>
            </div>
        `).join('');
    },

    renderPrompts() {
        const container = document.getElementById('prompts-container');
        const prompts = CONFIG.SUGGESTED_PROMPTS[this.state.domain];

        container.innerHTML = prompts.map(p => `
            <div class="prompt-chip" onclick="APP.fillPrompt('${p.replace(/'/g, "\\'")}')">
                ${p}
            </div>
        `).join('');
    },

    useAction(prompt) {
        document.getElementById('message-input').value = prompt;
        this.sendMessage();

        // Track quick action usage
        Analytics.trackFeature('quick_action', 'used', {
            domain: this.state.domain,
            prompt: prompt
        });
    },

    fillPrompt(prompt) {
        document.getElementById('message-input').value = prompt;
        document.getElementById('message-input').focus();

        // Track prompt usage
        Analytics.trackFeature('suggested_prompt', 'selected', {
            domain: this.state.domain,
            prompt: prompt
        });
    },

    renderWelcome() {
        const msg = `Welcome to **MASTERLINC**, your universal AI intelligence platform. I orchestrate specialized agents across four domains:

**🏥 Healthcare & Medical** - Clinical support, claims, diagnostics, compliance
**📊 Business & Operations** - Strategy, finance, marketing, operations
**💻 Development & Tech** - Full-stack coding, architecture, DevOps, AI/ML
**🎯 Personal Growth** - Learning, productivity, wellness, creativity

How can I assist you today?`;

        this.addMessage('assistant', msg, 'MASTERLINC');
    },

    async sendMessage() {
        if (this.state.processing) return;

        const input = document.getElementById('message-input');
        const msg = input.value.trim();

        if (!msg) return;

        // Check if authentication is required but user is not authenticated
        if (CONFIG.FEATURES.AUTH_REQUIRED && !Auth.isAuthenticated()) {
            Auth.showAuthModal();
            return;
        }

        this.addMessage('user', msg);
        input.value = '';
        this.autoResize();

        this.showTyping();
        this.state.processing = true;

        // Track message sent
        Analytics.track('message_sent', {
            domain: this.state.domain,
            messageLength: msg.length,
            timestamp: Date.now()
        });

        const startTime = Date.now();

        try {
            const response = await API.callClaude(msg, this.state.domain);
            this.hideTyping();

            const config = CONFIG.DOMAINS[this.state.domain];
            this.addMessage('assistant', response, config.agent);

            // Track response received
            const responseTime = Date.now() - startTime;
            Analytics.trackPerformance('api_response_time', responseTime);
            Analytics.track('message_received', {
                domain: this.state.domain,
                responseLength: response.length,
                responseTime: responseTime
            });

            // Save to backend if authenticated
            if (Auth.isAuthenticated()) {
                await API.saveChatMessage({
                    domain: this.state.domain,
                    userMessage: msg,
                    assistantMessage: response,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('assistant', `⚠️ Error: ${error.message}`, 'System');

            // Track error
            Analytics.trackError(error, {
                context: 'send_message',
                domain: this.state.domain
            });
        } finally {
            this.state.processing = false;
        }
    },

    addMessage(type, text, sender = '') {
        const container = document.getElementById('messages-container');
        const div = document.createElement('div');
        div.className = `message ${type}`;

        const time = new Date().toLocaleTimeString(this.state.lang === 'ar' ? 'ar-SA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const avatar = type === 'assistant' ? (sender?.substring(0, 2) || 'ML') : 'You';
        const badge = type === 'assistant' && sender ? `<span class="msg-badge">${sender}</span>` : '';

        div.innerHTML = `
            <div class="msg-avatar ${type}">${avatar}</div>
            <div class="msg-content">
                <div class="msg-header">
                    <span class="msg-name">${sender || (type === 'user' ? 'You' : 'Assistant')}</span>
                    ${badge}
                    <span class="msg-time">${time}</span>
                </div>
                <div class="msg-text">${this.formatText(text)}</div>
            </div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Store message in state
        this.state.messages.push({
            type: type,
            text: text,
            sender: sender,
            timestamp: Date.now()
        });

        // Save to local storage
        this.saveMessages();
    },

    formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    },

    showTyping() {
        const container = document.getElementById('messages-container');
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'message assistant';
        div.innerHTML = `
            <div class="msg-avatar assistant">ML</div>
            <div class="typing">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        typing?.remove();
    },

    autoResize() {
        const textarea = document.getElementById('message-input');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    },

    async loadChatHistory() {
        if (!Auth.isAuthenticated()) {
            // Load from local storage
            this.loadLocalMessages();
            return;
        }

        try {
            const messages = await API.fetchChatHistory();
            if (messages && messages.length > 0) {
                this.state.messages = messages;
                this.renderMessages();
            } else {
                this.loadLocalMessages();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.loadLocalMessages();
        }
    },

    loadLocalMessages() {
        try {
            const saved = localStorage.getItem(`${CONFIG.APP.STORAGE_KEY}_messages`);
            if (saved) {
                this.state.messages = JSON.parse(saved);
                this.renderMessages();
            }
        } catch (error) {
            console.error('Failed to load local messages:', error);
        }
    },

    saveMessages() {
        try {
            localStorage.setItem(`${CONFIG.APP.STORAGE_KEY}_messages`, JSON.stringify(this.state.messages));
        } catch (error) {
            console.error('Failed to save messages:', error);
        }
    },

    renderMessages() {
        const container = document.getElementById('messages-container');
        container.innerHTML = '';

        this.state.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.type}`;

            const time = new Date(msg.timestamp).toLocaleTimeString(this.state.lang === 'ar' ? 'ar-SA' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const avatar = msg.type === 'assistant' ? (msg.sender?.substring(0, 2) || 'ML') : 'You';
            const badge = msg.type === 'assistant' && msg.sender ? `<span class="msg-badge">${msg.sender}</span>` : '';

            div.innerHTML = `
                <div class="msg-avatar ${msg.type}">${avatar}</div>
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-name">${msg.sender || (msg.type === 'user' ? 'You' : 'Assistant')}</span>
                        ${badge}
                        <span class="msg-time">${time}</span>
                    </div>
                    <div class="msg-text">${this.formatText(msg.text)}</div>
                </div>
            `;

            container.appendChild(div);
        });

        container.scrollTop = container.scrollHeight;
    },

    async checkAPIStatus() {
        const statusText = document.getElementById('api-status-text');
        const statusDot = document.querySelector('.status-dot');
        const statusContainer = document.querySelector('.api-status');

        try {
            // Try to ping backend
            const response = await fetch(`${CONFIG.API.BASE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                statusText.textContent = 'Backend Connected';
                statusDot.classList.remove('disconnected');
                statusContainer.classList.remove('disconnected');
            } else {
                throw new Error('Backend unavailable');
            }
        } catch (error) {
            statusText.textContent = 'Offline Mode';
            statusDot.classList.add('disconnected');
            statusContainer.classList.add('disconnected');

            // Track offline mode
            Analytics.track('api_status', { status: 'offline' });
        }
    },

    clearChat() {
        if (confirm('Are you sure you want to clear all messages?')) {
            this.state.messages = [];
            this.saveMessages();

            const container = document.getElementById('messages-container');
            container.innerHTML = '';

            this.renderWelcome();

            // Track clear chat
            Analytics.trackFeature('chat', 'cleared');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    APP.init();
});

// Expose APP globally for debugging
window.APP = APP;
window.Auth = Auth;
window.Analytics = Analytics;
window.API = API;
window.CONFIG = CONFIG;
