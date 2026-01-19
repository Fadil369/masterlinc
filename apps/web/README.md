# @brainsait/web

The main frontend application for the BrainSAIT Healthcare AI Platform.

## Tech Stack

- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Modern utility-first CSS
- **shadcn/ui** - Beautiful, accessible UI components
- **Framer Motion** - Smooth animations
- **TanStack Query** - Data fetching and caching

## Features

- 🌐 **Bilingual Interface** - Full English/Arabic support with RTL layout
- 🤖 **Agent Management** - View and manage AI agents
- 📨 **Message Communication** - Real-time messaging between agents
- 📊 **System Dashboard** - Monitor system health and metrics
- 🔄 **Workflow Orchestration** - Coordinate multi-agent workflows

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

From the repository root:

```bash
# Install all dependencies
pnpm install

# Run the web app in development mode
pnpm dev:web
```

Or from this directory:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at http://localhost:5173

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Linting

```bash
# Run ESLint
pnpm lint
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── AgentCard.tsx
│   │   ├── AgentsView.tsx
│   │   ├── DashboardView.tsx
│   │   └── MessagesView.tsx
│   ├── lib/            # Utilities and services
│   │   ├── aggregation/    # Data aggregation
│   │   ├── cache/          # Caching utilities
│   │   ├── config/         # Configuration management
│   │   ├── mock/           # Mock data generators
│   │   ├── services/       # Core services
│   │   ├── validation/     # Input validation
│   │   ├── i18n.ts         # Internationalization
│   │   └── utils.ts        # Utility functions
│   ├── hooks/          # React hooks
│   ├── styles/         # Global styles
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## Key Components

### AgentsView
Displays all registered agents with search, filtering, and status monitoring.

### MessagesView
Shows message log and allows sending messages between agents.

### DashboardView
System health dashboard with metrics and recent activity.

### WorkflowsView
Workflow orchestration interface (coming soon).

## Development

### Adding New Components

```bash
# Using shadcn/ui CLI (if available)
npx shadcn@latest add [component-name]

# Or manually create in src/components/
```

### Path Aliases

The `@/` alias points to the `src/` directory:

```typescript
import { Button } from '@/components/ui/button'
import { useKV } from '@/hooks/useKV'
```

### Styling

This project uses Tailwind CSS v4 with a custom design system. See `tailwind.config.js` for theme configuration.

### Internationalization

The app supports English and Arabic. Translations are managed in `src/lib/i18n.ts`.

```typescript
import { t } from '@/lib/i18n'

const text = t('agents.title', language) // Translates based on language
```

## API Integration

The frontend is designed to work with the BrainSAIT backend API. Configure the API URL in your environment:

```bash
VITE_API_URL=http://localhost:3001
```

## Testing

```bash
# Run tests (when available)
pnpm test
```

## Deployment

### Build for Production

```bash
pnpm build
```

Outputs to `dist/` directory.

### Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=https://api.yourdomain.com
```

## Contributing

See the main [README](../../README.md) for contribution guidelines.

## License

MIT
