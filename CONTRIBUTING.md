# Contributing to Fluent Documentation

Thank you for your interest in contributing to the Fluent documentation! This guide will help you get started with contributing to our documentation site.

## Code of Conduct

We are committed to fostering an inclusive and welcoming community. All contributors are expected to follow our [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/3/0/code_of_conduct/), which emphasizes:

- **Respectful behavior** and constructive feedback
- **Inclusive language** that welcomes all contributors
- **Professional conduct** in all interactions
- **Accountability** for our words and actions

> **Important**: Harassment, discrimination, or any form of harmful behavior will not be tolerated. If you experience or witness inappropriate behavior, please report it to our community moderators.

## Getting Started

### Prerequisites

- Node.js v18.16.0 or later (use `nvm use v18.16.0` or higher)
- Git
- A GitHub account

### Local Development Setup

1. **Fork the repository:**
   ```bash
   # Fork on GitHub first, then clone your fork
   git clone https://github.com/YOUR_USERNAME/docs-docusaurus.git
   cd docs-docusaurus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or if you encounter peer dependency issues:
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npm run start
   ```
   This will open the site at `http://localhost:8000` with live reloading.

4. **Build for production:**
   ```bash
   npm run build
   ```

**Development Tips:**
- Most changes are reflected live without restarting the server
- Check the browser console for any build errors
- Test your changes thoroughly before submitting a PR

## Style Guide

### Admonitions

We use custom admonitions to highlight important information. Here are the available types:

- **Tip** (💡): Use for helpful hints and best practices
- **Info** (🔍): Use for general information and explanations
- **Warning** (⚠️): Use for important warnings and cautions
- **Danger** (🚨): Use for critical information that could cause issues
- **Best Practice** (🏆): Use for recommended approaches and methodologies
- **Prerequisite** (🧱): Use for required knowledge or setup steps
- **Summary** (🎨): Use for key takeaways and conclusions

### Markdown Guidelines

- Use clear, concise language
- Follow the existing documentation structure
- Include code examples where appropriate
- Use proper heading hierarchy (H1 → H2 → H3)
- Add descriptive alt text for images

## Contribution Workflow

### Branch Strategy

- **Small fixes/bugs**: Create PR against `main` branch
- **New features/pages**: Create PR against `stage` branch

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   git checkout -b fix/your-fix-name
   ```

2. **Make your changes** following the style guide

3. **Test locally:**
   ```bash
   npm run start
   # Check for build errors
   npm run build
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new documentation page"
   # Use conventional commits (see below)
   ```

5. **Push and create a PR:**
   ```bash
   git push origin your-branch-name
   # Create PR on GitHub
   ```

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: <type>[optional scope]: <description>

# Examples:
feat: add new authentication guide
fix: correct typo in getting started page
docs: update installation instructions
style: format code examples
refactor: reorganize sidebar structure
test: add tests for new components
chore: update dependencies
```

### Pull Request Guidelines

**PR Best Practices:**
- **Clear title**: Describe what the PR does
- **Detailed description**: Explain the changes and why they're needed
- **Testing**: Confirm no build errors and Cloudflare Pages preview works
- **Scope**: Keep changes focused and manageable

### Issue Guidelines

When creating issues:

- Use clear, descriptive titles
- Provide detailed reproduction steps
- Include relevant screenshots or logs
- Specify the expected vs actual behavior
- Tag issues appropriately (bug, enhancement, documentation, etc.)

## Review Process

1. **Automated checks** will run on your PR
2. **Community review** by maintainers and contributors
3. **Address feedback** and make requested changes
4. **Merge** once approved

> **Important**: All PRs must pass build checks and have a successful Cloudflare Pages preview before merging.

## Getting Help

- **Documentation**: Check existing docs first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use [Discord](https://discord.com/invite/fluentxyz") for discussing, in the #developer-forum channel before opening an issue or PR if you're unsure
- **Community**: Join our community channels for real-time help

## Recognition

Contributors will be recognized in our documentation and release notes. We appreciate all contributions, big and small!

---

Thank you for contributing to Fluent documentation! 🚀 