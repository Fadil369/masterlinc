// MASTERLINC Configuration
const CONFIG = {
    // API Configuration
    API: {
        // Backend API URL - Update this based on your deployment
        BASE_URL: window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://your-backend-api.com/api',

        // Anthropic API Configuration
        ANTHROPIC: {
            URL: 'https://api.anthropic.com/v1/messages',
            MODEL: 'claude-sonnet-4-20250514',
            VERSION: '2023-06-01',
            MAX_TOKENS: 2048
        },

        // Endpoints
        ENDPOINTS: {
            AUTH: {
                LOGIN: '/auth/login',
                REGISTER: '/auth/register',
                LOGOUT: '/auth/logout',
                REFRESH: '/auth/refresh',
                ME: '/auth/me'
            },
            CHAT: {
                SEND: '/chat/send',
                HISTORY: '/chat/history',
                CLEAR: '/chat/clear'
            },
            ANALYTICS: {
                TRACK: '/analytics/track',
                STATS: '/analytics/stats',
                SESSION: '/analytics/session'
            },
            USER: {
                PROFILE: '/user/profile',
                SETTINGS: '/user/settings',
                USAGE: '/user/usage'
            }
        }
    },

    // App Settings
    APP: {
        NAME: 'MASTERLINC',
        VERSION: '1.0.0',
        DEFAULT_LANG: 'en',
        STORAGE_KEY: 'masterlinc',
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    },

    // Features
    FEATURES: {
        AUTH_REQUIRED: false, // Set to true to require authentication
        ANALYTICS_ENABLED: true,
        OFFLINE_MODE: true,
        AUTO_SAVE: true
    },

    // Domains Configuration
    DOMAINS: {
        healthcare: {
            title: {
                en: 'Healthcare & Medical Intelligence',
                ar: 'ذكاء الرعاية الصحية والطب'
            },
            subtitle: {
                en: 'Specialized AI assistance for clinical, administrative, and compliance tasks',
                ar: 'مساعدة ذكاء اصطناعي متخصصة للمهام السريرية والإدارية والامتثال'
            },
            agent: 'HealthcareLinc',
            desc: {
                en: 'Specialized in evidence-based medicine, NPHIES compliance, claims optimization, and clinical decision support.',
                ar: 'متخصص في الطب القائم على الأدلة والامتثال لـ NPHIES وتحسين المطالبات ودعم القرارات السريرية'
            }
        },
        business: {
            title: {
                en: 'Business & Operations Intelligence',
                ar: 'ذكاء الأعمال والعمليات'
            },
            subtitle: {
                en: 'Strategic planning, financial analysis, and operational excellence',
                ar: 'التخطيط الاستراتيجي والتحليل المالي والتميز التشغيلي'
            },
            agent: 'BusinessLinc',
            desc: {
                en: 'Expert in business strategy, market analysis, financial modeling, and operational optimization.',
                ar: 'خبير في استراتيجية الأعمال وتحليل السوق والنمذجة المالية والتحسين التشغيلي'
            }
        },
        development: {
            title: {
                en: 'Development & Technology Intelligence',
                ar: 'ذكاء التطوير والتكنولوجيا'
            },
            subtitle: {
                en: 'Full-stack development, architecture, and technical excellence',
                ar: 'التطوير الكامل والهندسة المعمارية والتميز التقني'
            },
            agent: 'DevLinc',
            desc: {
                en: 'Master programmer across languages, frameworks, cloud platforms, and system architecture.',
                ar: 'مبرمج خبير في اللغات والأطر وأنظمة السحابة والهندسة المعمارية'
            }
        },
        personal: {
            title: {
                en: 'Personal Growth Intelligence',
                ar: 'ذكاء النمو الشخصي'
            },
            subtitle: {
                en: 'Learning, productivity, wellness, and creative development',
                ar: 'التعلم والإنتاجية والصحة والتطوير الإبداعي'
            },
            agent: 'GrowthLinc',
            desc: {
                en: 'Personal development coach for skills, productivity, health, and creative pursuits.',
                ar: 'مدرب تطوير شخصي للمهارات والإنتاجية والصحة والمساعي الإبداعية'
            }
        }
    },

    // Quick Actions by Domain
    QUICK_ACTIONS: {
        healthcare: [
            { icon: '⚕️', title: 'Clinical Query', desc: 'Medical guidance', prompt: 'I need clinical decision support for a patient case' },
            { icon: '📋', title: 'Claims Analysis', desc: 'Rejection review', prompt: 'Analyze recent claim rejections and provide optimization suggestions' },
            { icon: '🔬', title: 'Diagnostic Help', desc: 'Image analysis', prompt: 'Help me interpret diagnostic imaging results' },
            { icon: '✓', title: 'Compliance Check', desc: 'HIPAA/NPHIES', prompt: 'Review compliance requirements for my healthcare facility' }
        ],
        business: [
            { icon: '📊', title: 'Market Analysis', desc: 'Industry trends', prompt: 'Analyze current market trends and competitive landscape' },
            { icon: '💡', title: 'Strategy Session', desc: 'Growth planning', prompt: 'Help me develop a strategic growth plan for Q2 2026' },
            { icon: '📈', title: 'Financial Model', desc: 'Build projections', prompt: 'Create a 3-year financial projection model' },
            { icon: '🎯', title: 'OKR Planning', desc: 'Set objectives', prompt: 'Help me define quarterly OKRs for my team' }
        ],
        development: [
            { icon: '🐛', title: 'Debug Code', desc: 'Fix errors', prompt: 'Help me debug this code and fix the error' },
            { icon: '🏗️', title: 'Architecture', desc: 'System design', prompt: 'Design a scalable microservices architecture' },
            { icon: '⚡', title: 'Optimize', desc: 'Performance', prompt: 'Optimize this code for better performance and efficiency' },
            { icon: '📝', title: 'Code Review', desc: 'Best practices', prompt: 'Review my code and suggest improvements' }
        ],
        personal: [
            { icon: '🎓', title: 'Learning Path', desc: 'Skill roadmap', prompt: 'Create a learning path for mastering AI and machine learning' },
            { icon: '📚', title: 'Study Plan', desc: 'Organize learning', prompt: 'Help me create an effective study schedule' },
            { icon: '🎯', title: 'Skill Assessment', desc: 'Gap analysis', prompt: 'Analyze my skill gaps for career advancement' },
            { icon: '💪', title: 'Practice', desc: 'Build skills', prompt: 'Give me practice problems to improve my skills' }
        ]
    },

    // Suggested Prompts by Domain
    SUGGESTED_PROMPTS: {
        healthcare: [
            'Interpret abnormal CBC lab results',
            'Analyze drug-drug interactions',
            'Create clinical documentation template',
            'Review diabetes treatment protocol'
        ],
        business: [
            'SWOT analysis for market entry',
            'Competitor benchmarking report',
            'Business model canvas review',
            'Pricing strategy optimization'
        ],
        development: [
            'Refactor this Python function',
            'Explain OAuth 2.0 implementation',
            'Design RESTful API endpoints',
            'Set up CI/CD pipeline with GitHub Actions'
        ],
        personal: [
            'Explain quantum computing basics',
            'Create flashcards for memory retention',
            'Recommend leadership books',
            'Spanish conversation practice'
        ]
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
