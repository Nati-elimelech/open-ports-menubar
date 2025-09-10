# Contributing to Open Ports Menubar

Thank you for your interest in contributing to Open Ports Menubar! I welcome contributions from the community.

## How to Contribute

### Reporting Issues

Before creating a new issue, please:
1. Check if the issue already exists in the [issue tracker](https://github.com/Nati-elimelech/open-ports-menubar/issues)
2. Include your macOS version and app version
3. Provide clear steps to reproduce the issue
4. Include any relevant error messages or screenshots

### Pull Requests

**Important:** All pull requests require approval from the repository owner (@Nati-elimelech) before merging. Branch protection rules are enabled on the `main` branch.

**Note for the repository owner:** As the repository owner, you can push directly to `main` when needed (admin bypass is enabled).

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the coding standards below
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork and submit a pull request
7. Wait for review and approval from the maintainer

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/open-ports-menubar.git
cd open-ports-menubar

# Install dependencies
npm install

# Run in development mode
npm start

# Build for distribution
npm run make
```

### Coding Standards

- Use ES modules (no CommonJS)
- Follow existing code style and patterns
- Add performance logging for significant operations:
  ```javascript
  console.time('⏱️ [AI-PERF] Operation name');
  // ... operation code ...
  console.timeEnd('⏱️ [AI-PERF] Operation name');
  ```
- Test on both Intel and Apple Silicon Macs if possible
- Ensure no TypeScript/linting errors before submitting

### Testing Checklist

Before submitting a PR, ensure:
- [ ] The app launches without errors
- [ ] Port scanning works correctly
- [ ] Docker container detection works (if Docker is installed)
- [ ] Process termination features work
- [ ] Preferences window functions properly
- [ ] No console errors in development mode

### Areas We Need Help With

- **Performance Optimization**: Improving port scanning speed
- **UI/UX Improvements**: Better visual design and user experience
- **Feature Additions**: New functionality that fits the app's purpose
- **Documentation**: Improving guides and API documentation
- **Testing**: Automated tests and manual testing on different macOS versions

## Maintainer

This project is maintained by [@Nati-elimelech](https://github.com/Nati-elimelech). All contributions require maintainer approval.

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.