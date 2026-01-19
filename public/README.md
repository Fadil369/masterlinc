# MASTERLINC Frontend - GitHub Pages

This is the public-facing frontend for MASTERLINC, a Universal AI Intelligence Platform designed to provide specialized AI assistance across Healthcare, Business, Development, and Personal Growth domains.

## 🚀 Live Demo

Visit: https://fadil369.github.io/masterlinc/

## ✨ Features

- **Multi-Domain Intelligence**: Specialized AI agents for Healthcare, Business, Development, and Personal Growth
- **Bilingual Support**: Full English and Arabic language support with RTL layout
- **User Authentication**: Secure JWT-based authentication and session management
- **Analytics Tracking**: Comprehensive usage statistics and session analytics
- **Responsive Design**: Beautiful glassmorphism UI that works on all devices
- **Offline Mode**: Continue using the app even when backend is unavailable
- **Real-time Chat**: Interactive conversation with domain-specific AI agents

## 🏗️ Architecture

### Frontend (GitHub Pages)
- Pure HTML, CSS, and JavaScript (no build step required)
- Glassmorphism design with animated background
- Modular JavaScript architecture
- Local storage for offline functionality

### Backend (Separate Deployment)
- Node.js + Express.js REST API
- PostgreSQL database with Prisma ORM
- Redis for caching and session management
- JWT-based authentication

## 📦 Project Structure

```
public/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── main.css       # All styles
│   └── js/
│       ├── config.js       # Configuration
│       ├── auth.js         # Authentication module
│       ├── api.js          # API communication
│       ├── analytics.js    # Analytics tracking
│       └── app.js          # Main application logic
└── README.md
```

## ⚙️ Configuration

Edit `assets/js/config.js` to configure:

1. **Backend API URL**: Update `API.BASE_URL` to point to your backend
2. **Anthropic API**: Configure Claude API settings
3. **Features**: Enable/disable authentication, analytics, etc.
4. **Domains**: Customize domain configurations and prompts

```javascript
const CONFIG = {
    API: {
        BASE_URL: 'https://your-backend-api.com/api',
        // ... other settings
    },
    FEATURES: {
        AUTH_REQUIRED: false,    // Set to true to require auth
        ANALYTICS_ENABLED: true,
        OFFLINE_MODE: true,
    }
};
```

## 🚀 Deployment

### Option 1: GitHub Pages (Current)

1. Push changes to the `main` branch
2. GitHub Actions will automatically deploy to GitHub Pages
3. Access at: https://[username].github.io/[repo]/

### Option 2: Netlify

```bash
npm install -g netlify-cli
netlify deploy --dir=public --prod
```

### Option 3: Vercel

```bash
npm install -g vercel
vercel --prod public/
```

### Option 4: Custom Server

Simply serve the `public/` directory with any static file server:

```bash
# Using Python
python -m http.server 8000 --directory public

# Using Node.js
npx serve public

# Using nginx
# Configure nginx to serve from the public/ directory
```

## 🔧 Backend Setup

For full functionality, you need to deploy the backend API. See `../backend/README.md` for instructions.

### Quick Backend Setup

```bash
cd backend/
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npm run dev
```

## 🔐 Environment Variables (Backend)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/masterlinc
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 📱 Features by Module

### Authentication (`auth.js`)
- User registration and login
- JWT token management
- Session handling
- User profile management

### API Communication (`api.js`)
- Backend API integration
- Direct Claude API fallback
- Chat message handling
- User stats fetching

### Analytics (`analytics.js`)
- Event tracking
- Session management
- Usage statistics
- Performance monitoring

### Main App (`app.js`)
- Domain switching
- Message handling
- UI updates
- Local storage management

## 🎨 Customization

### Adding New Domains

Edit `config.js`:

```javascript
DOMAINS: {
    your_domain: {
        title: { en: 'Your Domain', ar: 'نطاقك' },
        subtitle: { en: 'Description', ar: 'الوصف' },
        agent: 'YourAgent',
        desc: { en: 'Agent description', ar: 'وصف الوكيل' }
    }
}
```

### Styling

All styles are in `assets/css/main.css`. Key CSS variables:

```css
:root {
    --bg-primary: #0a0e1a;
    --accent-purple: #a78bfa;
    --accent-blue: #60a5fa;
    /* ... */
}
```

## 🧪 Testing Locally

```bash
# Option 1: Python
python -m http.server 8000 --directory public

# Option 2: Node.js
cd public && npx serve

# Then visit http://localhost:8000
```

## 🔒 Security Notes

- Never commit API keys to the repository
- Use environment variables for sensitive data
- Backend API should validate all requests
- Implement rate limiting on the backend
- Use HTTPS in production

## 📊 Analytics

The app tracks:
- User sessions
- Message counts
- Domain usage
- Response times
- Feature usage
- Errors

Analytics data is stored locally and synced to backend when authenticated.

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/Fadil369/masterlinc/issues
- Email: support@masterlinc.ai

## 🙏 Acknowledgments

- Claude AI by Anthropic
- Tailwind CSS
- Radix UI
- GitHub Pages
