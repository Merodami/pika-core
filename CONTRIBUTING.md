# Contributing to Pika Backend

Thank you for your interest in contributing to Pika Backend! We welcome contributions from the community, but please note the licensing restrictions.

## 📝 License & Commercial Use

**IMPORTANT**: This project is licensed under AGPL-3.0 with additional commercial use restrictions. Any commercial use requires explicit written permission from the copyright holder.

## 🤝 How to Contribute

### Reporting Issues

1. Check if the issue already exists in our [issue tracker](https://github.com/Merodami/pika-backend/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following our coding standards
4. **Write/update tests** for your changes
5. **Run quality checks**:
   ```bash
   yarn typecheck
   yarn lint
   yarn test
   ```
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and submit a pull request

### Coding Standards

- **TypeScript**: Strict mode, no `any` types
- **Clean Architecture**: Follow Controller → Service → Repository pattern
- **Testing**: Integration tests preferred over unit tests
- **Code Style**: Prettier and ESLint configured (run `yarn lint:fix`)
- **Imports**: Use `.js` extensions for ESM compatibility

### Pull Request Guidelines

- PRs should be focused on a single feature/fix
- Include tests for new functionality
- Update documentation if needed
- Ensure all checks pass
- Link related issues

## 🏗️ Development Setup

```bash
# Install dependencies
yarn install

# Start infrastructure
yarn docker:local

# Setup database
yarn local:generate
yarn db:seed

# Start development
yarn local
```

## 📚 Documentation

- Architecture guide: `CLAUDE.md`
- API documentation: `packages/api/src/README.md`
- Service-specific docs in each package's README

## ⚖️ Contributor License Agreement

By contributing to this project, you agree that:

1. Your contributions will be licensed under the same license as the project
2. You have the right to license your contributions
3. You understand the commercial use restrictions

## 🙏 Thank You!

We appreciate your contributions to making Pika Backend better!
