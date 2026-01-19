# 🚀 MASTERLINC - Universal AI Intelligence Platform

<div align="center">

![MASTERLINC Logo](https://via.placeholder.com/800x200/0a0e1a/a78bfa?text=MASTERLINC)

**Specialized AI Assistance Across Healthcare, Business, Development & Personal Growth**

[![GitHub Pages](https://img.shields.io/badge/demo-live-success)](https://fadil369.github.io/masterlinc/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D15.0-blue)](https://www.postgresql.org/)

[Live Demo](https://fadil369.github.io/masterlinc/) • [Documentation](#documentation) • [Deploy](#deployment) • [Contribute](#contributing)

</div>

---

## 🌟 Overview

MASTERLINC is a cutting-edge Universal AI Intelligence Platform that provides specialized AI assistance through domain-specific agents. Built with a beautiful glassmorphism UI, it offers bilingual support (English/Arabic) and comprehensive user management with analytics.

### ✨ Key Features

- 🏥 **Healthcare Intelligence** - Clinical support, claims management, NPHIES compliance
- 📊 **Business Operations** - Strategic planning, financial analysis, market insights
- 💻 **Development & Tech** - Full-stack coding, architecture, DevOps, AI/ML
- 🎯 **Personal Growth** - Learning paths, productivity, wellness, creativity
- 🔐 **Secure Authentication** - JWT-based auth with session management
- 📈 **Advanced Analytics** - Comprehensive usage tracking and insights
- 🌐 **Bilingual Support** - Full English and Arabic with RTL layout
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🔄 **Offline Mode** - Continue working without backend connectivity

## 🎨 Demo

<div align="center">

![MASTERLINC Screenshot](https://via.placeholder.com/800x500/0a0e1a/a78bfa?text=MASTERLINC+Screenshot)

**Live Demo**: [https://fadil369.github.io/masterlinc/](https://fadil369.github.io/masterlinc/)

</div>

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        MASTERLINC Platform                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Frontend Layer                         │  │
│  │              (GitHub Pages - Static Site)                  │  │
│  │                                                            │  │
│  │  • Glassmorphism UI          • Real-time Chat            │  │
│  │  • Multi-domain Support      • Offline Mode              │  │
│  │  • Bilingual (EN/AR)         • Local Analytics           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              │ REST API (HTTPS)                   │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      Backend API                           │  │
│  │                (Node.js + Express.js)                      │  │
│  │                                                            │  │
│  │  • JWT Authentication        • Chat Management            │  │
│  │  • User Management          • Analytics Tracking         │  │
│  │  • Claude AI Integration    • Session Management         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                 ┌────────────┴────────────┐                      │
│                 │                         │                      │
│  ┌──────────────▼──────────┐  ┌──────────▼──────────┐          │
│  │      PostgreSQL         │  │       Redis         │          │
│  │    (Primary DB)         │  │      (Cache)        │          │
│  │                         │  │                     │          │
│  │  • Users & Auth         │  │  • Sessions         │          │
│  │  • Chat History         │  │  • Rate Limiting    │          │
│  │  • Analytics Data       │  │  • Temp Storage     │          │
│  └─────────────────────────┘  └─────────────────────┘          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
masterlinc/
├── 📁 public/                    # Frontend (GitHub Pages)
│   ├── index.html               # Main HTML
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css        # All styles
│   │   └── js/
│   │       ├── config.js        # Configuration
│   │       ├── auth.js          # Authentication
│   │       ├── api.js           # API communication
│   │       ├── analytics.js     # Analytics tracking
│   │       └── app.js           # Main app logic
│   └── README.md
│
├── 📁 backend/                   # Backend API
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Utilities
│   │   └── server.js            # Main server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # Seed data
│   ├── package.json
│   └── README.md
│
├── 📁 .devcontainer/             # Dev Container config
│   ├── devcontainer.json
│   ├── onCreate.sh
│   └── postStartCommand.sh
│
├── 📁 .github/workflows/         # CI/CD
│   └── deploy-gh-pages.yml      # GitHub Pages deployment
│
├── 📄 DEPLOYMENT_GUIDE.md        # Complete deployment guide
├── 📄 package.json               # Root package config
└── 📄 README.md                  # This file
```

## 🚀 Quick Start

### Option 1: Full Stack Setup (Recommended for Development)

```bash
# Clone repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Complete setup (installs dependencies, sets up DB)
npm run setup

# Start both frontend and backend
npm run start:all
```

Then visit:
- Frontend: http://localhost:8000
- Backend API: http://localhost:3000

### Option 2: Frontend Only (GitHub Pages)

```bash
# Serve frontend locally
cd public/
python -m http.server 8000

# Or deploy to GitHub Pages (automatic)
git push origin main
```

### Option 3: DevContainer (VS Code)

```bash
# Prerequisites: Docker Desktop + VS Code + Remote Containers extension

# Open in VS Code
code masterlinc/

# Press F1 → "Remote-Containers: Reopen in Container"
# Wait for container to build (first time only)

# Everything is pre-configured!
npm run start:all
```

## 📚 Documentation

### Complete Guides

- 📖 [**Deployment Guide**](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- 🎨 [**Frontend README**](public/README.md) - Frontend documentation
- 🖥️ [**Backend README**](backend/README.md) - Backend API documentation
- 🐳 [**DevContainer Guide**](.devcontainer/README.md) - Development environment

### Quick Links

- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment Options](#deployment)
- [Troubleshooting](#troubleshooting)

## 🛠️ Installation

### Prerequisites

- **Frontend**: Any web browser, Git
- **Backend**: Node.js 18+, PostgreSQL 15+, Redis 7+
- **Full Development**: Docker Desktop (for DevContainer)

### Backend Setup

```bash
cd backend/

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values (database, API keys, etc.)

# Setup database
npx prisma migrate dev
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://masterlinc:masterlinc@localhost:5432/masterlinc

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8000
```

## ⚙️ Configuration

### Frontend Configuration

Edit `public/assets/js/config.js`:

```javascript
const CONFIG = {
    API: {
        BASE_URL: 'http://localhost:3000/api',  // Your backend URL
    },
    FEATURES: {
        AUTH_REQUIRED: false,      // Set true to require login
        ANALYTICS_ENABLED: true,   // Enable usage tracking
        OFFLINE_MODE: true,        // Allow offline usage
    }
};
```

### Domain Customization

Add new domains or modify existing ones in `config.js`:

```javascript
DOMAINS: {
    your_domain: {
        title: { en: 'Your Domain Title', ar: 'عنوان نطاقك' },
        subtitle: { en: 'Description', ar: 'الوصف' },
        agent: 'YourAgent',
        desc: { en: 'Agent capabilities...', ar: '...' }
    }
}
```

## 🚢 Deployment

### GitHub Pages (Frontend)

**Automatic Deployment** (already configured):
```bash
git push origin main
# GitHub Actions will auto-deploy to Pages
```

**Manual Deployment**:
```bash
npm run gh-pages:deploy
```

### Backend Deployment Options

#### 1. Heroku (Easiest)
```bash
cd backend/
heroku create masterlinc-api
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
git push heroku main
```

#### 2. Railway
```bash
railway init
railway add postgresql redis
railway up
```

#### 3. Render
- Connect your GitHub repo
- Render auto-detects configuration
- Deploy with one click

#### 4. VPS (Most Control)
See [Deployment Guide](DEPLOYMENT_GUIDE.md#option-d-vps) for complete instructions.

## 📡 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
Body: { "name", "email", "password" }

# Login
POST /api/auth/login
Body: { "email", "password" }

# Get profile
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

### Chat

```bash
# Send message
POST /api/chat/send
Body: { "message", "domain", "language" }

# Get history
GET /api/chat/history?limit=50&domain=healthcare
```

### Analytics

```bash
# Track events
POST /api/analytics/track
Body: { "sessionId", "events": [...] }

# Get stats
GET /api/analytics/stats
```

See [Backend README](backend/README.md) for complete API documentation.

## 🗄️ Database Schema

Key tables:
- **users** - User accounts and profiles
- **sessions** - JWT sessions and tokens
- **chat_messages** - Conversation history
- **analytics_events** - User activity tracking
- **user_preferences** - User settings
- **usage_stats** - Aggregate statistics

See [schema.prisma](backend/prisma/schema.prisma) for complete schema.

## 🧪 Testing

### Frontend Testing
```bash
cd public/
python -m http.server 8000
# Visit http://localhost:8000
```

### Backend Testing
```bash
cd backend/
npm test                    # Run tests
npm run test:coverage       # With coverage
```

### E2E Testing
```bash
npm run start:all          # Start both frontend & backend
# Test full user flow
```

## 🐛 Troubleshooting

### Common Issues

**Frontend can't connect to backend**
- Check backend is running: `curl http://localhost:3000/api/health`
- Verify `config.js` has correct API URL
- Check CORS settings in backend

**Database connection failed**
- Verify PostgreSQL is running: `sudo service postgresql status`
- Test connection: `psql $DATABASE_URL`
- Check DATABASE_URL in `.env`

**Redis connection failed**
- Check Redis: `redis-cli ping`
- Restart: `sudo service redis-server restart`

See [Deployment Guide](DEPLOYMENT_GUIDE.md#troubleshooting) for more.

## 🎯 Roadmap

- [ ] Multi-language support (add more languages)
- [ ] Voice input/output
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API marketplace
- [ ] Custom domain support
- [ ] WebSocket real-time updates

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Keep PRs focused and small

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Claude AI](https://www.anthropic.com/claude) by Anthropic
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Express.js](https://expressjs.com/)
- [GitHub Pages](https://pages.github.com/)

## 📞 Support

- 📧 Email: support@masterlinc.ai
- 🐛 Issues: [GitHub Issues](https://github.com/Fadil369/masterlinc/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Fadil369/masterlinc/discussions)

## ⭐ Star History

If you find this project useful, please consider giving it a star!

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=Fadil369/masterlinc&type=Date)](https://star-history.com/#Fadil369/masterlinc&Date)

---

Made with ❤️ by the MASTERLINC Team

</div>
