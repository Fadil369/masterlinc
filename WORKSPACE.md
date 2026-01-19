# BrainSAIT Monorepo Workspace Guide

This document explains the structure and conventions of the BrainSAIT monorepo.

## Workspace Structure

The repository is organized as a pnpm + Turborepo monorepo with the following structure:

```
brainsait/
├── apps/           # Deployable applications
├── packages/       # Shared libraries
├── services/       # Microservices
├── agents/         # AI agents (placeholder)
├── infrastructure/ # Deployment configs
├── docs/           # Documentation
└── tests/          # E2E and integration tests
```

## Workspaces

### Apps (`apps/*`)

Full applications with their own package.json, build, and deployment configurations.

- **apps/web** - React frontend (@brainsait/web)
- **apps/backend** - Express.js backend (@brainsait/backend)

### Packages (`packages/*`)

Shared libraries that can be used across apps and services.

- **packages/config/eslint-config** - Shared ESLint configuration (@brainsait/eslint-config)
- **packages/config/typescript-config** - Shared TypeScript configurations (@brainsait/typescript-config)
- **packages/types** - Shared TypeScript types (@brainsait/types)
- **packages/ui-components** - Shared React components (@brainsait/ui-components)
- **packages/nphies-client** - NPHIES integration client

### Services (`services/*`)

Microservices for specific business domains:

- audit-service
- authlinc-api
- claimlinc-api
- devlinc-api
- doctorlinc-api
- masterlinc-api
- policylinc-api

## Development Workflow

### Initial Setup

```bash
# Install pnpm if not already installed
npm install -g pnpm@9.0.0

# Install all dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate
```

### Running Apps

```bash
# Run all apps in dev mode
pnpm dev

# Run specific apps
pnpm dev:web       # Frontend only
pnpm dev:backend   # Backend only
pnpm dev:services  # All microservices
```

### Building

```bash
# Build all workspaces
pnpm build

# Build specific workspace
cd apps/web
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific workspace
cd apps/backend
pnpm test
```

### Linting

```bash
# Lint all code
pnpm lint

# Lint specific workspace
cd apps/web
pnpm lint
```

## Adding Dependencies

### To a Specific Workspace

```bash
# Navigate to workspace
cd apps/web

# Add dependency
pnpm add package-name

# Add dev dependency
pnpm add -D package-name
```

### To Root (for tools used across all workspaces)

```bash
# From root
pnpm add -D -w package-name
```

### Using Workspace Dependencies

To use a package from another workspace:

```bash
# In apps/web/package.json
pnpm add @brainsait/types
```

## Creating New Packages

### 1. Create Directory Structure

```bash
mkdir -p packages/my-package/src
```

### 2. Create package.json

```json
{
  "name": "@brainsait/my-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

### 3. Create Source Files

```bash
echo "export const myFunction = () => {};" > packages/my-package/src/index.ts
```

### 4. Use in Other Workspaces

```bash
cd apps/web
pnpm add @brainsait/my-package
```

## Turborepo Caching

Turborepo caches build outputs to speed up subsequent builds. The cache is configured in `turbo.json`.

### Cache Behavior

- **Build tasks** - Cached with outputs in dist/, .next/, build/
- **Dev tasks** - Never cached (cache: false)
- **Test tasks** - Cached with coverage/ outputs
- **Lint tasks** - Cached

### Clearing Cache

```bash
# Clear all caches
pnpm clean

# Or manually
rm -rf .turbo node_modules
pnpm install
```

## Environment Variables

### Global Variables

Defined in root `.env` and available to all workspaces:
- NODE_ENV
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- NPHIES_API_URL

### Workspace-Specific Variables

Add to workspace's own `.env` file or `.env.local`.

## Common Tasks

### Update All Dependencies

```bash
pnpm update -r
```

### Check for Outdated Dependencies

```bash
pnpm outdated -r
```

### Run Command in All Workspaces

```bash
turbo run <command>
```

### Run Command in Specific Workspaces

```bash
turbo run build --filter=@brainsait/web
turbo run dev --filter=./apps/*
```

## Troubleshooting

### Port Already in Use

Kill processes on specific ports:
```bash
# Kill process on port 5173 (web)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

### Dependency Resolution Issues

```bash
# Clear all node_modules and reinstall
pnpm clean
pnpm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript projects
pnpm build
```

## Best Practices

1. **Keep packages focused** - Each package should have a single, clear responsibility
2. **Use workspace protocol** - Reference workspace packages with `workspace:*` in package.json
3. **Avoid circular dependencies** - Design package dependencies to be acyclic
4. **Consistent naming** - Use `@brainsait/` prefix for all internal packages
5. **Document public APIs** - Add JSDoc comments to exported functions and types
6. **Version together** - Bump versions of related packages together
7. **Test in isolation** - Each package should be testable independently

## Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [BrainSAIT Main README](./README.md)
