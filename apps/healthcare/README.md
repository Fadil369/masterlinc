# Healthcare App

Modern healthcare application built with React, TypeScript, and Vite for the MasterLinc ecosystem.

## Features

### Core Modules
- **Patient Intake** - Multi-step patient registration and onboarding
- **Appointments** - Schedule, manage, and track patient appointments
- **Direct Messages** - Real-time messaging between healthcare providers
- **Live Facilities Map** - Interactive map of healthcare facilities
- **Voice Agent** - AI-powered voice assistance
- **Provider Dashboard** - Clinical documentation and patient management
- **CDI Module** - Clinical Documentation Improvement
- **RCM Module** - Revenue Cycle Management
- **Coding Module** - Medical coding assistance

### Advanced Features
- **Offline Sync** - Work offline and sync when connection restored
- **Error Boundaries** - Graceful error handling with recovery options
- **Centralized Logging** - Structured logging for debugging and monitoring
- **Local Storage** - Persistent data with cross-tab synchronization
- **Notifications** - Browser notifications with toast fallbacks
- **Lazy Loading** - Optimized image loading with IntersectionObserver
- **API Client** - Reusable HTTP client with error handling and timeouts

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **State Management**: React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts & D3
- **Testing**: Vitest + Testing Library
- **Error Handling**: React Error Boundary

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=10000

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_AUTH_ENABLED=false
VITE_DEBUG=false
```

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ecosystem/      # Feature-specific components
│   ├── ui/             # Base UI components
│   └── __tests__/      # Component tests
├── contexts/           # React contexts
├── hooks/              # Custom hooks
│   ├── useApiClient.ts
│   ├── useLocalStorage.ts
│   ├── useOfflineSync.ts
│   └── use-masterlinc.ts
├── lib/                # Utilities and helpers
│   └── logger.ts       # Centralized logging
├── styles/             # Global styles
├── test/               # Test configuration
└── types.ts            # TypeScript types
```

### Key Hooks

#### useApiClient
```typescript
const { get, post, loading, error } = useApiClient('https://api.example.com')

// GET request
const data = await get<User>('/users/123')

// POST request
const created = await post<User>('/users', { name: 'John' })
```

#### useOfflineSync
```typescript
const { isOnline, addToQueue, syncPendingItems } = useOfflineSync()

// Add to sync queue when offline
if (!isOnline) {
  addToQueue('appointment', appointmentData)
}
```

#### useLocalStorage
```typescript
const [user, setUser, removeUser] = useLocalStorage('user', null)

setUser({ id: 1, name: 'John' })
removeUser()
```

### Error Handling

Wrap components with ErrorBoundary:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary'

<ErrorBoundary fallback={<CustomError />}>
  <YourComponent />
</ErrorBoundary>
```

### Logging

Use the centralized logger:

```typescript
import { logger } from './lib/logger'

logger.info('User logged in', { userId: 123 })
logger.warn('API slow response', { duration: 5000 })
logger.error('Failed to save', error, { context: 'appointment' })
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Build & Deployment

### Production Build
```bash
npm run build
```

### Build Outputs
- `dist/` - Production build
- Bundle size: ~960KB (optimized with code splitting)
- Chunks:
  - react-vendor (~11KB)
  - ui-vendor (~6KB)
  - utils (~35KB)
  - charts (lazy loaded)
  - main bundle (~507KB)

### Performance

- Build time: ~4s
- Hot reload: <100ms
- Type check: ~13s
- Bundle analysis available in CI/CD

## Code Quality

### Linting
```bash
npm run lint
npm run lint:fix
```

### Type Checking
```bash
npm run type-check
```

### Cleaning
```bash
npm run clean
```

## CI/CD

GitHub Actions workflows:
- ✅ Type checking on every push
- ✅ Linting on every push
- ✅ Build verification
- ✅ Test execution
- ✅ Bundle size analysis on PRs

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

**Build fails with memory error:**
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Type errors after update:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Tests fail to run:**
```bash
npm run clean
npm install --legacy-peer-deps
npm test
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Proprietary - All rights reserved
