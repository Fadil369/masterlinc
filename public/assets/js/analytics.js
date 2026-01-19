// Analytics Module
const Analytics = {
    sessionId: null,
    sessionStartTime: null,
    events: [],
    stats: {
        messagesCount: 0,
        domainsUsed: new Set(),
        totalCharacters: 0,
        sessionDuration: 0
    },

    init() {
        if (!CONFIG.FEATURES.ANALYTICS_ENABLED) return;

        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.loadStats();
        this.startSession();

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('session_pause');
            } else {
                this.track('session_resume');
            }
        });

        // Track session end
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // Periodic sync
        setInterval(() => this.syncToBackend(), 60000); // Every minute
    },

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    loadStats() {
        try {
            const saved = localStorage.getItem(`${CONFIG.APP.STORAGE_KEY}_stats`);
            if (saved) {
                const data = JSON.parse(saved);
                this.stats = {
                    ...data,
                    domainsUsed: new Set(data.domainsUsed || [])
                };
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    },

    saveStats() {
        try {
            const data = {
                ...this.stats,
                domainsUsed: Array.from(this.stats.domainsUsed),
                lastUpdated: Date.now()
            };
            localStorage.setItem(`${CONFIG.APP.STORAGE_KEY}_stats`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    },

    async startSession() {
        this.track('session_start', {
            sessionId: this.sessionId,
            timestamp: this.sessionStartTime,
            userAgent: navigator.userAgent,
            language: navigator.language
        });

        await this.syncToBackend();
    },

    async endSession() {
        const duration = Date.now() - this.sessionStartTime;
        this.stats.sessionDuration += duration;

        this.track('session_end', {
            sessionId: this.sessionId,
            duration: duration,
            messagesCount: this.stats.messagesCount,
            domainsUsed: Array.from(this.stats.domainsUsed)
        });

        await this.syncToBackend();
        this.saveStats();
    },

    track(eventName, eventData = {}) {
        if (!CONFIG.FEATURES.ANALYTICS_ENABLED) return;

        const event = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: Auth.user?.id || 'anonymous'
        };

        this.events.push(event);

        // Update local stats
        this.updateLocalStats(eventName, eventData);

        // Log for debugging
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics Event:', eventName, eventData);
        }
    },

    updateLocalStats(eventName, eventData) {
        switch (eventName) {
            case 'message_sent':
                this.stats.messagesCount++;
                if (eventData.domain) {
                    this.stats.domainsUsed.add(eventData.domain);
                }
                if (eventData.messageLength) {
                    this.stats.totalCharacters += eventData.messageLength;
                }
                break;

            case 'domain_switched':
                if (eventData.domain) {
                    this.stats.domainsUsed.add(eventData.domain);
                }
                break;
        }

        this.saveStats();
        this.renderStats();
    },

    async syncToBackend() {
        if (!Auth.isAuthenticated() || this.events.length === 0) return;

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.ANALYTICS.TRACK}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...Auth.getAuthHeader()
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    events: this.events
                })
            });

            if (response.ok) {
                // Clear synced events
                this.events = [];
            }
        } catch (error) {
            console.error('Failed to sync analytics:', error);
            // Keep events for next sync attempt
        }
    },

    renderStats() {
        const container = document.getElementById('stats-container');
        if (!container) return;

        const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000 / 60);

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Messages Sent</span>
                <span class="stat-value">${this.stats.messagesCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Domains Explored</span>
                <span class="stat-value">${this.stats.domainsUsed.size}/4</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Session Time</span>
                <span class="stat-value">${duration}m</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Characters</span>
                <span class="stat-value">${this.formatNumber(this.stats.totalCharacters)}</span>
            </div>
        `;
    },

    async fetchDetailedStats() {
        if (!Auth.isAuthenticated()) return null;

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.ANALYTICS.STATS}`, {
                headers: Auth.getAuthHeader()
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch detailed stats:', error);
        }

        return null;
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Performance tracking
    trackPerformance(metric, value) {
        this.track('performance_metric', {
            metric: metric,
            value: value,
            timestamp: Date.now()
        });
    },

    // Error tracking
    trackError(error, context = {}) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: Date.now()
        });
    },

    // Feature usage tracking
    trackFeature(featureName, action, metadata = {}) {
        this.track('feature_usage', {
            feature: featureName,
            action: action,
            metadata: metadata,
            timestamp: Date.now()
        });
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    Analytics.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    Analytics.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
    });
});
