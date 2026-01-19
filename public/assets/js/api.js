// API Module
const API = {
    async callClaude(userMessage, domain, systemPrompt) {
        const config = CONFIG.DOMAINS[domain];

        const fullSystemPrompt = `You are ${config.agent}, a specialized AI assistant for ${config.title.en}.

${config.desc.en}

Guidelines:
- Provide expert, actionable guidance
- Use domain-specific terminology appropriately
- Be concise but comprehensive
- Include examples when helpful
- Format with markdown for clarity
- If query suits another domain better, mention it

Language: ${APP.state.lang === 'en' ? 'English' : 'Arabic'}`;

        try {
            // Try backend API first if authenticated
            if (Auth.isAuthenticated()) {
                const response = await this.callBackendAPI(userMessage, domain);
                if (response.success) {
                    return response.message;
                }
            }

            // Fallback to direct Claude API (requires browser extension or proxy)
            return await this.callDirectClaude(userMessage, fullSystemPrompt);
        } catch (error) {
            console.error('API error:', error);
            return this.fallbackResponse(userMessage, config);
        }
    },

    async callBackendAPI(userMessage, domain) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.CHAT.SEND}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeader()
                },
                body: JSON.stringify({
                    message: userMessage,
                    domain: domain,
                    language: APP.state.lang
                })
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: data.message,
                    metadata: data.metadata
                };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error('Backend API error:', error);
            return { success: false };
        }
    },

    async callDirectClaude(userMessage, systemPrompt) {
        try {
            const response = await fetch(CONFIG.API.ANTHROPIC.URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-version': CONFIG.API.ANTHROPIC.VERSION,
                    // Note: API key should be handled by browser extension or proxy
                    // Never expose API keys in client-side code
                },
                body: JSON.stringify({
                    model: CONFIG.API.ANTHROPIC.MODEL,
                    max_tokens: CONFIG.API.ANTHROPIC.MAX_TOKENS,
                    system: systemPrompt,
                    messages: [{
                        role: 'user',
                        content: userMessage
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.content?.[0]?.text) {
                return data.content[0].text;
            }

            throw new Error('Invalid API response');
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    },

    fallbackResponse(userMessage, config) {
        return `I'm ${config.agent}, ready to help with "${userMessage}"

**Note**: This is a fallback response. To enable real-time Claude AI:

1. **Backend API**: Configure your backend endpoint in \`config.js\`
2. **Browser Extension**: Install an API key manager extension
3. **Proxy Service**: Use a proxy with API key authentication

**${config.agent} specializes in:**
${config.desc.en}

**Quick Actions:**
- Ask specific questions about your domain
- Request analysis or recommendations
- Get help with complex problems
- Learn domain best practices

Would you like me to help you get started with any specific task in this domain?`;
    },

    async fetchChatHistory() {
        if (!Auth.isAuthenticated()) return [];

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.CHAT.HISTORY}`, {
                headers: Auth.getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                return data.messages || [];
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }

        return [];
    },

    async saveChatMessage(message) {
        if (!Auth.isAuthenticated() || !CONFIG.FEATURES.AUTO_SAVE) return;

        try {
            await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.CHAT.SEND}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeader()
                },
                body: JSON.stringify({
                    ...message,
                    save_only: true
                })
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    },

    async fetchUserStats() {
        if (!Auth.isAuthenticated()) return null;

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.ANALYTICS.STATS}`, {
                headers: Auth.getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                return data.stats;
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }

        return null;
    },

    async updateUserProfile(updates) {
        if (!Auth.isAuthenticated()) return { success: false };

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.USER.PROFILE}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeader()
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const data = await response.json();
                Auth.user = data.user;
                Auth.saveToStorage();
                return { success: true, user: data.user };
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }

        return { success: false };
    }
};
