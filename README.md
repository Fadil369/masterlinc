# BrainSAIT Healthcare AI Platform

[![Monorepo CI](https://github.com/Fadil369/masterlinc/actions/workflows/monorepo-ci.yml/badge.svg)](https://github.com/Fadil369/masterlinc/actions/workflows/monorepo-ci.yml)

A complete full-stack monorepo for intelligent healthcare agent orchestration in the Saudi Arabian healthcare ecosystem. Features a sophisticated bilingual (English/Arabic) dashboard with production-ready backend services.

## 🏗️ Monorepo Architecture

This repository is structured as a monorepo using **pnpm workspaces** and **Turborepo** for efficient development and deployment.

```
brainsait/
├── apps/                    # Deployable applications
│   ├── web/                 # React frontend (Vite + TypeScript)
│   └── backend/             # Express.js backend (Prisma + PostgreSQL)
├── services/                # Microservices
│   ├── audit-service/       # Audit logging
│   ├── authlinc-api/        # Authentication
│   ├── claimlinc-api/       # Claims processing
│   ├── devlinc-api/         # Dev automation
│   ├── doctorlinc-api/      # Clinical support
│   ├── masterlinc-api/      # Central orchestrator
│   └── policylinc-api/      # Policy interpretation
├── packages/                # Shared libraries
│   ├── config/              # Shared configurations (ESLint, TypeScript, Tailwind)
│   ├── nphies-client/       # NPHIES integration
│   ├── types/               # Shared TypeScript types
│   └── ui-components/       # Shared React components
├── agents/                  # AI agents (placeholder for future merge)
├── infrastructure/          # IaC and deployment configs
├── docs/                    # Documentation
└── tests/                   # E2E and integration tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/Fadil369/masterlinc.git
cd masterlinc

# Install dependencies for all workspaces
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Seed the database
pnpm db:seed
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:web       # Frontend only (port 5173)
pnpm dev:backend   # Backend only (port 3001)

# Run all services
pnpm dev:services

# Open Prisma Studio
pnpm db:studio
```

### Building

```bash
# Build all apps and packages
pnpm build

# Lint all code
pnpm lint

# Run tests
pnpm test

# Clean all build artifacts
pnpm clean
```

### Docker

```bash
# Start all services with Docker Compose
pnpm docker:up

# Stop all services
pnpm docker:down
```

## 📦 Applications

### Web App (@brainsait/web)
**Location:** `apps/web/`  
**Port:** 5173  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4

The main frontend dashboard featuring:
- 🌐 Bilingual interface (English/Arabic with RTL support)
- 🤖 Agent management and monitoring
- 📨 Real-time message communication
- 📊 System health dashboard
- 🔄 Workflow orchestration (coming soon)

**Quick Start:**
```bash
cd apps/web
pnpm dev
```

### Backend (@brainsait/backend)
**Location:** `apps/backend/`  
**Port:** 3001  
**Tech Stack:** Express.js, Prisma, PostgreSQL, Redis

Core backend API providing:
- User management and authentication
- Analytics and metrics
- Database operations via Prisma ORM
- RESTful API endpoints

**Quick Start:**
```bash
cd apps/backend
pnpm dev
```

**API Documentation:** Available at `/api/docs` when running

## 🔧 Packages

### Shared Configurations
- **@brainsait/eslint-config** - Shared ESLint configuration
- **@brainsait/typescript-config** - Shared TypeScript configurations (base, react, node)

### Libraries
- **@brainsait/types** - Shared TypeScript type definitions
- **@brainsait/ui-components** - Shared React UI components
- **nphies-client** - NPHIES integration client

## 🛠️ Technology Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS v4 for styling
- shadcn/ui components
- Framer Motion for animations
- TanStack Query for data fetching

### Backend
- Express.js for API server
- Prisma ORM with PostgreSQL
- Redis for caching
- JWT authentication
- Winston for logging

### DevOps
- pnpm workspaces for monorepo management
- Turborepo for build orchestration
- Docker & Docker Compose
- GitHub Actions for CI/CD

## 📖 Documentation

- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Security Policy](docs/security/SECURITY.md)
- [Security Advisory](docs/security/SECURITY_ADVISORY.md)
- [Product Requirements](docs/PRD.md)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines in the docs.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

For security concerns, please see [SECURITY.md](docs/security/SECURITY.md).

---

**Part of the BrainSAIT ecosystem** - Transforming healthcare through AI innovation

**MASTERLINC** = **M**ulti-**A**gent **S**ystem for **T**ransformative **E**nterprise **R**esource **L**anguage-**I**ntegrated **N**etworked **C**oordination


## 🎨 Design System

### Colors
- **Primary (Teal)**: `oklch(0.55 0.15 200)` - Healthcare trust and precision
- **Accent (Cyan)**: `oklch(0.70 0.18 210)` - CTAs and active states
- **Success (Green)**: `oklch(0.65 0.18 150)` - Online status
- **Warning (Yellow)**: `oklch(0.75 0.15 80)` - Degraded status

### Typography
- **IBM Plex Sans** - Primary interface font
- **IBM Plex Sans Arabic** - Arabic text
- **JetBrains Mono** - Agent IDs, endpoints, code

## 📂 Workspace Structure

Each workspace follows consistent patterns:

- **apps/*** - Full applications with their own package.json
- **packages/*** - Shared libraries used across apps and services
- **services/*** - Microservices for specific domains

All workspaces can depend on each other, and Turborepo handles the build order automatically.

## 🧪 Development Workflow

### Adding a New Package

```bash
# Create package directory
mkdir -p packages/my-package/src

# Create package.json
cat > packages/my-package/package.json << EOF
{
  "name": "@brainsait/my-package",
  "version": "0.0.0",
  "private": true
}
EOF

# Install in another package
cd apps/web
pnpm add @brainsait/my-package
```

### Running Turbo Commands

```bash
# Run a command in all workspaces
turbo run build

# Run in specific workspace
turbo run dev --filter=@brainsait/web

# Run in multiple workspaces
turbo run build --filter=./apps/*
```

## 📊 Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm test` | Run tests across all workspaces |
| `pnpm lint` | Lint all code |
| `pnpm dev:web` | Run web app only |
| `pnpm dev:backend` | Run backend only |
| `pnpm dev:services` | Run all microservices |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |

## 🔗 Ecosystem Integration

MasterLinc serves as the central orchestration hub for the BrainSAIT healthcare AI ecosystem:

### Agent Specifications
Agent specifications are defined in `agents/specs/` using YAML format:
- **masterlinc.yaml** - Central orchestration agent
- **claimlinc.yaml** - Claims processing agent
- **policylinc.yaml** - Policy interpretation agent
- **doctorlinc.yaml** - Clinical decision support agent

### Integration Points
| Repository | Integration | Status |
|------------|-------------|--------|
| [sbs](https://github.com/Fadil369/sbs) | NPHIES claims processing | ✅ Ready |
| [brainsait-docs](https://github.com/Fadil369/brainsait-docs) | Centralized documentation | ✅ Ready |
| [-awesome-brainsait-copilot](https://github.com/Fadil369/-awesome-brainsait-copilot) | Copilot agent prompts | ✅ Ready |

### Running Integration Tests
```bash
# Start services
docker-compose -f infrastructure/docker/docker-compose.agents.yml up -d

# Run integration tests
./tests/integration/test-services.sh
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines in the docs.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

For security concerns, please see [SECURITY.md](docs/security/SECURITY.md).

---

**Part of the BrainSAIT ecosystem** - Transforming healthcare through AI innovation

**MASTERLINC** = **M**ulti-**A**gent **S**ystem for **T**ransformative **E**nterprise **R**esource **L**anguage-**I**ntegrated **N**etworked **C**oordination

