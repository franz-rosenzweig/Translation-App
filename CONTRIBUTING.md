# Contributing to TranslNathan

Thank you for your interest in contributing to TranslNathan! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/translnathan.git`
3. **Install** dependencies: `npm install`
4. **Create** a branch: `git checkout -b feature/your-feature-name`
5. **Make** your changes
6. **Test** thoroughly
7. **Submit** a pull request

## 📋 Development Guidelines

### Code Style
- Use **TypeScript** for all new code
- Follow existing **naming conventions**
- Use **functional components** with hooks
- Include **JSDoc comments** for complex functions
- Maintain **component modularity**

### File Structure
```
components/          # React components
├── UI/             # Basic UI components
├── Features/       # Feature-specific components
└── Layout/         # Layout components

lib/                # Utilities and helpers
├── api/           # API utilities
├── hooks/         # Custom React hooks
├── utils/         # General utilities
└── types/         # TypeScript type definitions

app/               # Next.js app directory
├── api/          # API routes
├── globals.css   # Global styles
└── layout.tsx    # Root layout
```

### Component Guidelines
```tsx
// ✅ Good: Typed props with JSDoc
interface ComponentProps {
  /** The title to display */
  title: string;
  /** Optional callback when clicked */
  onClick?: () => void;
}

export default function Component({ title, onClick }: ComponentProps) {
  return <button onClick={onClick}>{title}</button>;
}
```

### State Management
- Use **React hooks** for local state
- Use **localStorage** for persistence
- Avoid prop drilling - lift state appropriately
- Consider custom hooks for complex state logic

## 🧪 Testing

### Manual Testing
- Test all major workflows
- Verify theme switching works
- Check responsive design
- Test accessibility features

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if possible)

## 🎨 UI/UX Guidelines

### Design Principles
- **Accessibility First**: Ensure keyboard navigation and screen reader support
- **Professional Appearance**: Clean, minimal design suitable for professional use
- **Responsive Design**: Works on all screen sizes
- **Theme Consistency**: All components should work with all themes

### Theme System
- Use CSS variables for all colors
- Test new components with all themes
- Ensure sufficient contrast ratios
- Follow existing spacing patterns

## 🔧 Technical Considerations

### Performance
- Minimize bundle size
- Use dynamic imports for large components
- Optimize images and assets
- Consider loading states for async operations

### Security
- Never expose API keys in client code
- Validate all user inputs
- Use TypeScript for type safety
- Follow Next.js security best practices

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation
- Test with screen readers

## 📝 Pull Request Process

### Before Submitting
1. **Test** your changes thoroughly
2. **Update** documentation if needed
3. **Run** type checking: `npm run type-check`
4. **Ensure** no console errors
5. **Check** all themes work correctly

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested manually
- [ ] Works across themes
- [ ] Responsive design verified
- [ ] Accessibility checked

## Screenshots
(if applicable)
```

### Review Process
1. Code review by maintainers
2. Automated checks must pass
3. Manual testing verification
4. Approval and merge

## 🐛 Bug Reports

### What to Include
- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual** behavior
- **Browser/OS** information
- **Screenshots** if helpful

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 22]
```

## 💡 Feature Requests

### What Makes a Good Feature Request
- **Clear use case**: Why is this needed?
- **Detailed description**: What should it do?
- **User benefit**: How does it help users?
- **Implementation ideas**: Any thoughts on how to build it?

## 🏗️ Architecture Decisions

### When to Add Dependencies
- Is it really needed?
- Does it significantly improve UX?
- Is the maintenance burden acceptable?
- Are there lighter alternatives?

### Component Design
- Keep components focused and single-purpose
- Use composition over inheritance
- Make components reusable but not over-engineered
- Consider performance implications

## 📚 Resources

### Learning
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Accessibility Insights](https://accessibilityinsights.io/)

## 🤝 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be open** to different perspectives

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Publishing private information

### Enforcement
Report unacceptable behavior to the maintainers. All reports will be reviewed and investigated promptly and fairly.

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the README and inline comments
- **Code Review**: Ask questions in PR comments

---

Thank you for contributing to TranslNathan! 🙏

*Together we're building better tools for professional translation.*
