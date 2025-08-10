# Contributing to TranslNathan

Thank you for your interest in contributing to TranslNathan! This document provides comprehensive guidelines for contributing to our Hebrew-English AI translation desktop application.

## 🚀 Quick Start

1. **Fork** the repository from [franz-rosenzweig/Translation-App](https://github.com/franz-rosenzweig/Translation-App)
2. **Clone** your fork: `git clone https://github.com/yourusername/Translation-App.git`
3. **Install** dependencies: `npm install`
4. **Set up** environment: `cp .env.example .env.local` (add your OpenAI API key)
5. **Create** a branch: `git checkout -b feature/your-feature-name`
6. **Start** development: `npm run app-dev`
7. **Make** your changes and test thoroughly
8. **Submit** a pull request

## 🏗 Development Environment

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **npm** package manager
- **OpenAI API key** for testing AI features
- **macOS** (for DMG builds) or Windows/Linux for development

### Development Setup
```bash
# Clone and setup
git clone https://github.com/franz-rosenzweig/Translation-App.git
cd Translation-App
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with your OpenAI API key

# Start development server
npm run app-dev    # Runs Next.js + Electron
npm run dev        # Next.js only (for web testing)

# Build for production
npm run dist-mac   # macOS DMG
npm run dist       # Current platform
```

## 📋 Development Guidelines

### Project Architecture
TranslNathan is an Electron-based desktop application with a Next.js frontend:

```
Translation-App/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with themes
│   ├── page.tsx            # Main application page
│   ├── globals.css         # Global styles and CSS variables
│   └── api/               # API routes (OpenAI integration)
├── components/            # React components
│   ├── Sidebar.tsx        # Collapsible navigation sidebar
│   ├── TranslationSettings.tsx  # Unified settings modal
│   ├── RunButton.tsx      # Translation execution button
│   ├── OutputTabs.tsx     # Results display tabs
│   └── ...               # Other UI components
├── lib/                   # Utility libraries
│   ├── api-client.ts      # OpenAI API integration
│   ├── storage.ts         # Local storage management
│   ├── hemingway.ts       # Text analysis algorithms
│   └── prompts.ts         # AI prompt templates
├── assets/               # Application assets
│   ├── icon.icns         # macOS app icon
│   ├── icon-1024.png     # High-res icon
│   └── icon.svg          # Vector source
├── main.js               # Electron main process
├── preload.js            # Electron preload script
└── package.json          # Dependencies and build config
```

### Code Style & Standards

#### TypeScript Guidelines
- **Strict Mode**: All TypeScript strict checks enabled
- **Explicit Types**: Define interfaces for all props and complex objects
- **Type Safety**: Avoid `any` type; use proper type guards
- **JSDoc Comments**: Document complex functions and interfaces

```tsx
// ✅ Good: Proper TypeScript with documentation
interface TranslationSettingsProps {
  /** Current translation configuration */
  config: TranslationConfig;
  /** Callback when settings change */
  onConfigChange: (config: TranslationConfig) => void;
  /** Whether the modal is open */
  open: boolean;
  /** Callback to control modal visibility */
  onOpenChange: (open: boolean) => void;
}

/**
 * Unified settings modal for translation and audience configuration
 */
export default function TranslationSettings({ 
  config, 
  onConfigChange, 
  open, 
  onOpenChange 
}: TranslationSettingsProps) {
  // Implementation...
}
```

#### React Component Guidelines
- **Functional Components**: Use function components with hooks
- **Component Modularity**: Single responsibility principle
- **Props Interface**: Define TypeScript interfaces for all props
- **Error Boundaries**: Implement error handling for user-facing components
- **Accessibility**: Include proper ARIA labels and keyboard navigation

```tsx
// ✅ Good: Modular component with error handling
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);
    await processTranslation(text);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Translation failed');
  } finally {
    setIsLoading(false);
  }
}, [text]);
```
#### Styling Guidelines
- **Tailwind CSS**: Use utility classes for styling
- **CSS Variables**: Use defined theme variables for colors
- **Responsive Design**: Mobile-first approach with desktop optimizations
- **Theme Support**: Ensure components work in both light and dark modes

```tsx
// ✅ Good: Theme-aware styling with Tailwind
<div className="bg-panel border border-default rounded-lg p-4">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
  <p className="text-sm text-muted">Description</p>
</div>
```

#### File Naming Conventions
- **Components**: PascalCase (`TranslationSettings.tsx`)
- **Utilities**: camelCase (`api-client.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TEXT_LENGTH`)
- **Types**: PascalCase with descriptive names (`TranslationConfig`)

### State Management Guidelines
- **Local State**: React `useState` and `useReducer` for component state
- **Persistence**: Browser `localStorage` for user preferences and sessions
- **Global State**: React Context for shared application state
- **Custom Hooks**: Extract complex state logic into reusable hooks

```tsx
// ✅ Good: Custom hook for persistent state
function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue] as const;
}
```

## 🧪 Testing Guidelines

### Manual Testing Workflow
1. **Core Translation**: Test Hebrew → English translation with various text types
2. **Settings Persistence**: Verify settings save/restore correctly
3. **UI Responsiveness**: Test sidebar collapse/expand and modal interactions
4. **Error Handling**: Test with invalid API keys, network failures, large texts
5. **Theme Switching**: Verify both light and dark modes work properly
6. **Cross-Platform**: Test on target operating systems

### Test Cases to Cover
- **Translation Workflow**: Complete translation from input to output
- **Settings Management**: All translation parameters and audience settings
- **Session Management**: Save, load, and switch between sessions
- **File Operations**: Upload/import of reference materials and guidelines
- **API Integration**: OpenAI API calls with proper error handling
- **Accessibility**: Keyboard navigation and screen reader compatibility

### Performance Testing
- **Large Texts**: Test with maximum character limits
- **Memory Usage**: Monitor for memory leaks during extended use
- **Startup Time**: Ensure reasonable application launch time
- **Response Time**: Verify UI responsiveness during AI processing

## 🎨 UI/UX Guidelines

### Design Principles
- **Clarity**: Interface should be immediately understandable
- **Efficiency**: Minimize clicks/steps for common workflows
- **Consistency**: Maintain consistent interaction patterns
- **Accessibility**: Support keyboard navigation and screen readers

### Component Design
- **Composition**: Build complex UIs from simple, reusable components
- **Flexibility**: Components should adapt to different content/contexts
- **Error States**: Always design for loading, error, and empty states
- **Feedback**: Provide clear feedback for user actions

### Accessibility Requirements
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG 2.1 AA compliance for text contrast
- **Focus Management**: Visible focus indicators and logical tab order

## 🔧 Feature Development

### Adding New Features

1. **Planning Phase**
   - Create GitHub issue describing the feature
   - Discuss approach and design in issue comments
   - Get approval from maintainers before starting

2. **Implementation Phase**
   - Create feature branch from main: `git checkout -b feature/feature-name`
   - Follow existing code patterns and conventions
   - Write comprehensive tests for the feature
   - Update documentation as needed

3. **Testing Phase**
   - Test feature thoroughly across different scenarios
   - Verify accessibility compliance
   - Test on target platforms (especially macOS)
   - Ensure no regressions in existing functionality

4. **Submission Phase**
   - Create pull request with detailed description
   - Include screenshots/videos for UI changes
   - Respond to code review feedback
   - Ensure CI passes (when implemented)

### Feature Guidelines
- **User-Centered**: Focus on user needs and workflows
- **Performance**: Consider impact on application performance
- **Maintainability**: Write code that's easy to understand and modify
- **Integration**: Ensure features work well with existing functionality

## 🐛 Bug Reports

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Try latest version** to see if issue is already fixed
3. **Reproduce consistently** to confirm the bug
4. **Test in clean environment** to rule out configuration issues

### Bug Report Template
```markdown
**Bug Description**
Clear description of what went wrong

**Reproduction Steps**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should have happened

**Actual Behavior**
What actually happened

**Environment**
- OS: macOS 13.5
- App Version: 1.0.0
- Node.js Version: 18.17.0
- Browser: Chrome 115 (for web testing)

**Additional Context**
- Error messages (full text)
- Screenshots or videos
- Configuration details
- Related issues or PRs
```

## 🔍 Code Review Process

### Review Criteria
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean, readable, and maintainable?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security implications?
- **Testing**: Is the code adequately tested?
- **Documentation**: Is documentation updated as needed?

### Review Guidelines
- **Be Constructive**: Provide helpful, actionable feedback
- **Be Specific**: Reference exact lines and suggest improvements
- **Be Respectful**: Maintain professional, collaborative tone
- **Be Thorough**: Review both functionality and code quality

## 📚 Documentation

### Documentation Updates
When contributing code, also update:
- **README.md**: For new features or setup changes
- **Code Comments**: For complex algorithms or business logic
- **TypeScript Interfaces**: Document all public interfaces
- **Component Props**: Document all component properties

### Writing Guidelines
- **Clear Language**: Use simple, direct language
- **Code Examples**: Include practical examples for complex features
- **Keep Updated**: Ensure documentation matches current functionality
- **User-Focused**: Write from the user's perspective

## 🚀 Release Process

### Version Management
- **Semantic Versioning**: Follow semver (major.minor.patch)
- **Changelog**: Update CHANGELOG.md for each release
- **Git Tags**: Tag releases with version numbers
- **Build Artifacts**: Generate DMG/installer for releases

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Git tag created
- [ ] Release artifacts built
- [ ] GitHub release created

## 🤝 Community Guidelines

### Code of Conduct
- **Be Respectful**: Treat all contributors with respect
- **Be Inclusive**: Welcome diverse perspectives and experiences
- **Be Collaborative**: Work together to improve the project
- **Be Professional**: Maintain professional communication

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Community questions and conversations
- **Pull Requests**: Code review and collaboration
- **README**: Primary documentation and project information

## 📞 Getting Help

### Resources
- **README.md**: Comprehensive setup and usage guide
- **GitHub Issues**: Search existing issues for solutions
- **Code Comments**: Review inline documentation
- **Component Examples**: Study existing component implementations

### Asking Questions
When asking for help:
1. **Search first**: Check if question was already answered
2. **Be specific**: Provide context and details
3. **Include code**: Share relevant code snippets
4. **Describe goal**: Explain what you're trying to achieve

Thank you for contributing to TranslNathan! Your efforts help make professional translation tools more accessible and powerful for the community.
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
