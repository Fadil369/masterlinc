# MASTERLINC Backend API

RESTful API for MASTERLINC - Universal AI Intelligence Platform. Provides user management, authentication, chat history, and analytics services.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Anthropic API key (for Claude AI)

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Prisma client
│   │   ├── redis.js     # Redis client
│   │   └── logger.js    # Winston logger
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   └── analytics.controller.js
│   ├── middleware/      # Express middleware
│   │   └── auth.js      # Authentication middleware
│   ├── models/          # Data models (Prisma)
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   └── analytics.routes.js
│   ├── utils/           # Utility functions
│   │   └── jwt.js       # JWT utilities
│   └── server.js        # Main application
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Seed data
├── logs/                # Log files
├── .env.example         # Environment template
└── package.json
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/masterlinc

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5000

# Logging
LOG_LEVEL=info
```

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/login`
Login existing user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/logout`
Logout current user (requires authentication).

#### POST `/api/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

### Chat

#### POST `/api/chat/send`
Send a message and get AI response.

**Request:**
```json
{
  "message": "What are the symptoms of diabetes?",
  "domain": "healthcare",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Diabetes symptoms include...",
  "metadata": {
    "tokens": 245,
    "responseTime": 1234,
    "domain": "healthcare"
  }
}
```

#### GET `/api/chat/history`
Get chat history (requires authentication).

**Query Parameters:**
- `limit` - Number of messages (default: 50)
- `offset` - Skip messages (default: 0)
- `domain` - Filter by domain (optional)

#### DELETE `/api/chat/clear`
Clear chat history (requires authentication).

### Analytics

#### POST `/api/analytics/track`
Track analytics events.

**Request:**
```json
{
  "sessionId": "session_123",
  "events": [
    {
      "name": "message_sent",
      "data": { "domain": "healthcare" },
      "timestamp": 1704067200000
    }
  ]
}
```

#### GET `/api/analytics/stats`
Get user statistics (requires authentication).

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 150,
    "totalSessions": 25,
    "totalTokens": 45000,
    "recentMessages": 12,
    "activeSessions": 1,
    "averageResponseTime": 1500,
    "domainBreakdown": [
      { "domain": "healthcare", "count": 80 },
      { "domain": "business", "count": 40 }
    ]
  }
}
```

#### GET `/api/analytics/session/:sessionId`
Get analytics for specific session (requires authentication).

#### GET `/api/analytics/dashboard`
Get dashboard metrics (requires authentication).

**Query Parameters:**
- `timeRange` - 24h, 7d, or 30d (default: 7d)

### Health Check

#### GET `/api/health`
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## 🗄️ Database Schema

### Users
- Authentication and profile data
- Role-based access control
- Email verification

### Sessions
- JWT token management
- Session expiration
- Device tracking

### ChatMessages
- Conversation history
- Domain tracking
- Token usage

### AnalyticsEvents
- User behavior tracking
- Session analytics
- Feature usage

### UserPreferences
- Language preferences
- Theme settings
- Default domain

### UsageStats
- Aggregate statistics
- Performance metrics
- Activity tracking

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token generation and validation
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Input sanitization

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
# Build (if using TypeScript)
npm run build

# Start production server
npm start

# Or use PM2
pm2 start src/server.js --name masterlinc-api
pm2 save
pm2 startup
```

### Docker

```bash
# Build image
docker build -t masterlinc-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  masterlinc-backend
```

### Cloud Platforms

#### Heroku

```bash
heroku create masterlinc-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

#### Railway

```bash
railway login
railway init
railway add
railway up
```

#### Render

Create `render.yaml`:

```yaml
services:
  - type: web
    name: masterlinc-api
    env: node
    plan: starter
    buildCommand: npm install && npx prisma migrate deploy
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: masterlinc-db
          property: connectionString
```

## 📊 Monitoring

### Logs

Logs are stored in `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

### Metrics

Use Prometheus for metrics collection:

```javascript
// TODO: Add Prometheus metrics
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- auth.test.js
```

## 📝 API Documentation

Generate API documentation:

```bash
# Using Swagger
npm install swagger-ui-express swagger-jsdoc
```

## 🔄 Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npm run db:studio
```

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://user:password@localhost:5432/masterlinc

# Check if PostgreSQL is running
sudo service postgresql status
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check if Redis is running
sudo service redis-server status
```

### Migration Issues

```bash
# Force reset
npx prisma migrate reset --force

# Generate Prisma Client
npx prisma generate
```

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests
4. Make your changes
5. Submit a pull request

## 📞 Support

For issues: https://github.com/Fadil369/masterlinc/issues
