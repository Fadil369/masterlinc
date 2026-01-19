// Authentication Module
const Auth = {
    user: null,
    token: null,

    init() {
        // Load saved auth data
        const saved = this.loadFromStorage();
        if (saved) {
            this.user = saved.user;
            this.token = saved.token;
            this.validateSession();
        }

        // Render user menu
        this.renderUserMenu();
    },

    loadFromStorage() {
        try {
            const data = localStorage.getItem(`${CONFIG.APP.STORAGE_KEY}_auth`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load auth data:', error);
            return null;
        }
    },

    saveToStorage() {
        try {
            const data = {
                user: this.user,
                token: this.token,
                timestamp: Date.now()
            };
            localStorage.setItem(`${CONFIG.APP.STORAGE_KEY}_auth`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save auth data:', error);
        }
    },

    async validateSession() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.AUTH.ME}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.saveToStorage();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Session validation failed:', error);
            // Continue in offline mode if backend is unreachable
            return CONFIG.FEATURES.OFFLINE_MODE;
        }
    },

    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.token = data.token;
                this.saveToStorage();
                this.renderUserMenu();

                // Track login event
                if (CONFIG.FEATURES.ANALYTICS_ENABLED) {
                    Analytics.track('user_login', { userId: this.user.id });
                }

                return { success: true, user: this.user };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    async register(name, email, password) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.token = data.token;
                this.saveToStorage();
                this.renderUserMenu();

                // Track registration event
                if (CONFIG.FEATURES.ANALYTICS_ENABLED) {
                    Analytics.track('user_register', { userId: this.user.id });
                }

                return { success: true, user: this.user };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem(`${CONFIG.APP.STORAGE_KEY}_auth`);
        this.renderUserMenu();

        // Track logout event
        if (CONFIG.FEATURES.ANALYTICS_ENABLED) {
            Analytics.track('user_logout');
        }
    },

    isAuthenticated() {
        return !!this.token && !!this.user;
    },

    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    },

    renderUserMenu() {
        const container = document.getElementById('user-menu');
        if (!container) return;

        if (this.isAuthenticated()) {
            const initials = this.user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            container.innerHTML = `
                <div class="user-avatar" title="${this.user.name}" onclick="Auth.showUserDropdown(event)">
                    ${initials}
                </div>
            `;
        } else if (CONFIG.FEATURES.AUTH_REQUIRED) {
            container.innerHTML = `
                <button class="auth-btn" onclick="Auth.showAuthModal()">
                    Sign In
                </button>
            `;
        }
    },

    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        const form = document.getElementById('auth-form');

        form.innerHTML = `
            <div id="auth-toggle" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <button class="auth-tab active" data-tab="login">Sign In</button>
                <button class="auth-tab" data-tab="register">Sign Up</button>
            </div>

            <div id="login-form">
                <input type="email" class="auth-input" placeholder="Email" id="login-email" required>
                <input type="password" class="auth-input" placeholder="Password" id="login-password" required>
                <button class="auth-submit" onclick="Auth.handleLogin()">Sign In</button>
            </div>

            <div id="register-form" style="display: none;">
                <input type="text" class="auth-input" placeholder="Full Name" id="register-name" required>
                <input type="email" class="auth-input" placeholder="Email" id="register-email" required>
                <input type="password" class="auth-input" placeholder="Password" id="register-password" required>
                <button class="auth-submit" onclick="Auth.handleRegister()">Create Account</button>
            </div>

            <div style="text-align: center; margin-top: 1rem;">
                <button style="background: none; border: none; color: var(--text-secondary); cursor: pointer; text-decoration: underline;" onclick="Auth.closeAuthModal()">
                    Continue without account
                </button>
            </div>
        `;

        // Add tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.dataset.tab;
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                document.getElementById('login-form').style.display = target === 'login' ? 'block' : 'none';
                document.getElementById('register-form').style.display = target === 'register' ? 'block' : 'none';
            });
        });

        modal.classList.remove('hidden');
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('hidden');
    },

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const result = await this.login(email, password);

        if (result.success) {
            this.closeAuthModal();
            alert(`Welcome back, ${result.user.name}!`);
        } else {
            alert(result.error || 'Login failed. Please try again.');
        }
    },

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        const result = await this.register(name, email, password);

        if (result.success) {
            this.closeAuthModal();
            alert(`Welcome to MASTERLINC, ${result.user.name}!`);
        } else {
            alert(result.error || 'Registration failed. Please try again.');
        }
    },

    showUserDropdown(event) {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown glass-strong';
        dropdown.style.cssText = `
            position: absolute;
            top: ${event.target.offsetTop + event.target.offsetHeight + 10}px;
            right: ${window.innerWidth - event.target.offsetLeft - event.target.offsetWidth}px;
            min-width: 200px;
            border-radius: 12px;
            padding: 0.75rem;
            z-index: 1000;
        `;

        dropdown.innerHTML = `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--glass-border); margin-bottom: 0.5rem;">
                <div style="font-weight: 600;">${this.user.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.user.email}</div>
            </div>
            <button onclick="Auth.showProfile()" style="width: 100%; text-align: left; padding: 0.625rem; background: transparent; border: none; color: var(--text-primary); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                Profile
            </button>
            <button onclick="Auth.showSettings()" style="width: 100%; text-align: left; padding: 0.625rem; background: transparent; border: none; color: var(--text-primary); cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                Settings
            </button>
            <button onclick="Auth.logout(); Auth.closeDropdown()" style="width: 100%; text-align: left; padding: 0.625rem; background: transparent; border: none; color: #ef4444; cursor: pointer; border-radius: 8px; transition: all 0.2s;">
                Sign Out
            </button>
        `;

        document.body.appendChild(dropdown);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    },

    closeDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) dropdown.remove();
    },

    showProfile() {
        alert('Profile page coming soon!');
        this.closeDropdown();
    },

    showSettings() {
        alert('Settings page coming soon!');
        this.closeDropdown();
    }
};

// Style for auth tab buttons
const style = document.createElement('style');
style.textContent = `
    .auth-tab {
        flex: 1;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 10px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }
    .auth-tab.active {
        background: linear-gradient(135deg, #a78bfa, #60a5fa);
        border-color: transparent;
        color: white;
    }
    .user-dropdown button:hover {
        background: rgba(167, 139, 250, 0.1) !important;
    }
`;
document.head.appendChild(style);
