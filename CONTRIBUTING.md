# Contributing to MasterLinc

Thank you for your interest in contributing to MasterLinc!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fadil369/masterlinc.git
   cd masterlinc
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Making Changes

1. Create a new branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests and type checking
   ```bash
   npm run type-check
   npm test
   npm run lint
   ```

4. Build to verify
   ```bash
   npm run build
   ```

### Commit Guidelines

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```bash
git commit -m "feat: add lazy loading for images"
```

### Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README.md if you're adding new features
4. The PR will be merged once approved by a maintainer

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good test coverage

## Questions?

Feel free to open an issue for any questions or concerns.
