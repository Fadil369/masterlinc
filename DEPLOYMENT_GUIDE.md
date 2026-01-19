# MASTERLINC Deployment Guide

Complete guide to deploy MASTERLINC - Universal AI Intelligence Platform with GitHub Pages frontend and backend API.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Frontend Deployment (GitHub Pages)](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

MASTERLINC consists of two main components:

1. **Frontend**: Static site hosted on GitHub Pages
2. **Backend**: Node.js API deployed separately (Heroku, Railway, Render, or your own server)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       GitHub Pages                          │
│                 (Static Frontend - public/)                 │
│   - HTML, CSS, JavaScript                                   │
│   - User Interface                                          │
│   - Client-side Logic                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Backend API Server                       │
│                  (Node.js + Express)                        │
│   - Authentication                                          │
│   - Chat History                                            │
│   - Analytics                                               │
│   - Claude AI Integration                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│   PostgreSQL   │      │      Redis      │
│   (Database)   │      │     (Cache)     │
└────────────────┘      └─────────────────┘
```

## 📦 Prerequisites

### For Frontend (GitHub Pages)
- GitHub account
- Git installed locally
- Basic HTML/CSS/JavaScript knowledge

### For Backend
- Node.js 18+ installed
- PostgreSQL 15+ installed
- Redis 7+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Cloud hosting account (Heroku, Railway, Render, or VPS)

### For DevContainer
- Docker Desktop installed
- VS Code with Remote-Containers extension

## 🚀 Frontend Deployment (GitHub Pages)

### Step 1: Enable GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under **Source**, select:
   - Branch: `main` or `master`
   - Folder: `/ (root)` or `/public`
4. Click **Save**

### Step 2: Configure GitHub Actions

The workflow is already set up in `.github/workflows/deploy-gh-pages.yml`.

It will automatically deploy when you push changes to the `main` branch.

### Step 3: Update Frontend Configuration

Edit `public/assets/js/config.js`:

```javascript
API: {
    BASE_URL: 'https://your-backend-api.herokuapp.com/api',
    // Update this with your actual backend URL
}
```

### Step 4: Push Changes

```bash
git add .
git commit -m "Deploy MASTERLINC to GitHub Pages"
git push origin main
```

### Step 5: Verify Deployment

Visit: `https://[your-username].github.io/[repository-name]/`

## 🖥️ Backend Deployment

### Option A: Heroku (Recommended for beginners)

#### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download from https://cli-assets.heroku.com/heroku-x64.exe
```

#### 2. Login to Heroku

```bash
heroku login
```

#### 3. Create Heroku App

```bash
cd backend/
heroku create masterlinc-api
```

#### 4. Add PostgreSQL and Redis

```bash
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
```

#### 5. Set Environment Variables

```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
heroku config:set ANTHROPIC_API_KEY=your-api-key
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://[username].github.io/[repo]
```

#### 6. Deploy

```bash
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### 7. Run Migrations

```bash
heroku run npx prisma migrate deploy
heroku run npm run db:seed
```

#### 8. Verify

```bash
heroku open
# Or visit: https://your-app.herokuapp.com/api/health
```

### Option B: Railway

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize

```bash
railway login
cd backend/
railway init
```

#### 3. Add Services

```bash
railway add postgresql
railway add redis
```

#### 4. Set Variables

```bash
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set ANTHROPIC_API_KEY=your-api-key
railway variables set NODE_ENV=production
```

#### 5. Deploy

```bash
railway up
```

### Option C: Render

#### 1. Create `render.yaml`

Already created in backend directory.

#### 2. Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Select the repository
5. Render will automatically detect `render.yaml`

#### 3. Set Environment Variables

In Render dashboard, add:
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- Other required variables

#### 4. Deploy

Render will automatically deploy your app.

### Option D: VPS (DigitalOcean, AWS, etc.)

#### 1. Setup Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server
```

#### 2. Setup Application

```bash
# Clone repository
git clone https://github.com/[username]/masterlinc.git
cd masterlinc/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your values
```

#### 3. Setup Database

```bash
sudo -u postgres psql
CREATE DATABASE masterlinc;
CREATE USER masterlinc WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE masterlinc TO masterlinc;
\q

# Run migrations
npx prisma migrate deploy
npm run db:seed
```

#### 4. Setup PM2

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start src/server.js --name masterlinc-api

# Setup auto-start
pm2 startup
pm2 save
```

#### 5. Setup Nginx

```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/masterlinc
```

Add:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/masterlinc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 🗄️ Database Setup

### Local Development

```bash
# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb masterlinc

# Create user
sudo -u postgres psql
CREATE USER masterlinc WITH PASSWORD 'masterlinc';
GRANT ALL PRIVILEGES ON DATABASE masterlinc TO masterlinc;
\q

# Run migrations
cd backend/
npx prisma migrate dev

# Seed data
npm run db:seed
```

### Production

Migrations are automatically run during deployment on most platforms.

To run manually:

```bash
npx prisma migrate deploy
```

## ⚙️ Configuration

### Frontend Configuration

Edit `public/assets/js/config.js`:

```javascript
const CONFIG = {
    API: {
        // IMPORTANT: Update this with your backend URL
        BASE_URL: 'https://your-backend-url.com/api',
    },
    FEATURES: {
        AUTH_REQUIRED: true,     // Require authentication
        ANALYTICS_ENABLED: true,  // Enable analytics
        OFFLINE_MODE: true,       // Allow offline usage
    }
};
```

### Backend Configuration

Set these environment variables:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/masterlinc
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional
REDIS_URL=redis://localhost:6379
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

## 🧪 Testing

### Test Frontend

```bash
cd public/
python -m http.server 8000
# Visit http://localhost:8000
```

### Test Backend

```bash
cd backend/
npm run dev
# API will be at http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health
```

### Test Full Stack

1. Start backend: `npm run dev`
2. Update frontend config with `http://localhost:3000/api`
3. Open frontend in browser
4. Test authentication and chat features

## 📊 Monitoring

### Logs

**Backend logs:**
```bash
# View logs (PM2)
pm2 logs masterlinc-api

# View logs (Heroku)
heroku logs --tail

# View logs (Railway)
railway logs

# View log files
tail -f backend/logs/combined.log
```

### Health Checks

Monitor these endpoints:

- Frontend: `https://[username].github.io/[repo]/`
- Backend: `https://your-api.com/api/health`

### Database

```bash
# Connect to database
psql $DATABASE_URL

# View active connections
SELECT * FROM pg_stat_activity;

# View table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public';
```

## 🐛 Troubleshooting

### Frontend Issues

**Problem**: Blank page or errors

**Solution**:
1. Check browser console for errors
2. Verify `config.js` has correct backend URL
3. Check CORS settings on backend
4. Clear browser cache

**Problem**: API calls failing

**Solution**:
1. Verify backend is running: `curl https://your-api.com/api/health`
2. Check CORS configuration in backend
3. Verify API URL in frontend config
4. Check browser network tab for errors

### Backend Issues

**Problem**: Database connection failed

**Solution**:
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql $DATABASE_URL

# Check environment variables
echo $DATABASE_URL
```

**Problem**: Redis connection failed

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# Restart Redis
sudo service redis-server restart
```

**Problem**: Migration errors

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Force deploy migrations
npx prisma migrate deploy --force

# Generate Prisma Client
npx prisma generate
```

### Common Errors

**"JWT token invalid"**
- Check JWT_SECRET is set correctly
- Verify token hasn't expired
- Check system time is correct

**"CORS error"**
- Add frontend URL to CORS_ORIGIN in backend
- Verify backend is accessible
- Check if using HTTPS on both sides

**"Rate limit exceeded"**
- Wait for rate limit window to reset
- Adjust RATE_LIMIT_MAX_REQUESTS if needed
- Consider implementing user-specific limits

## 🔐 Security Checklist

- [ ] Changed all default passwords
- [ ] Set strong JWT secrets
- [ ] Enabled HTTPS/SSL
- [ ] Configured CORS properly
- [ ] Set up rate limiting
- [ ] Enabled helmet security headers
- [ ] No API keys in frontend code
- [ ] Database has restricted access
- [ ] Regular security updates
- [ ] Monitoring and alerting enabled

## 📈 Performance Optimization

### Frontend
- Enable browser caching
- Minimize API calls
- Use local storage effectively
- Lazy load images

### Backend
- Enable Redis caching
- Optimize database queries
- Use connection pooling
- Enable compression
- Set up CDN for static assets

## 🎉 Success!

Your MASTERLINC platform should now be fully deployed and operational!

### Next Steps

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Create backup strategy
4. Document custom configurations
5. Train users on the platform

## 📞 Support

Need help? Check:
- [GitHub Issues](https://github.com/Fadil369/masterlinc/issues)
- [Frontend README](public/README.md)
- [Backend README](backend/README.md)

## 📄 License

MIT License - See LICENSE file
