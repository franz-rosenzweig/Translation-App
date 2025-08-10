# TranslNathan 🔄

A de## Features

### Translation Stuff
- GPT-4 integration for decent Hebrew ↔ English translation
- Can adapt text for different audiences (kids, academics, etc.)
- Keeps your writing style while making it sound natural in the target language
- Upload reference materials to teach the AI your preferred style

### UI
- Collapsible sidebar like ChatGPT
- Combined settings modal instead of scattered options
- Light/dark themes
- Readability analysis with color highlighting

### Useful Features
- Save/restore translation sessions
- Upload translation guidelines and glossaries
- Side-by-side diff view to compare versions
- Banned terms management app for Hebrew-English translation using AI. Built with Next.js, Electron, and GPT models - basically ChatGPT but specifically tuned for Hebrew translation work.

*Note: This app was built with AI assistance.*

---

## 🌟 Key Features

### 🧠 **AI-Powered Translation Editing**
- **GPT Integration**: Leverages OpenAI's models (GPT-4, GPT-5-mini) for superior translation quality
- **Bidirectional Support**: Hebrew ↔ English translation with context awareness
- **Style Preservation**: Maintains authorial voice while adapting to target language conventions
- **Audience Adaptation**: Generate tailored versions for specific audiences (general public, academic, children, business)

### 🎨 **Modern UI/UX Design**
- **Collapsible Sidebar**: ChatGPT-style sidebar with hamburger menu navigation
- **Unified Settings Modal**: Combined prompt and audience settings in tabbed interface
- **Multiple Themes**: Light and dark modes with proper contrast and accessibility
- **Responsive Layout**: Optimized for desktop use with proper window controls
- **Clean Typography**: Professional interface designed for extended use

### � **Advanced Content Management**
- **Reference Material Integration**: Upload writing samples to guide AI style adaptation
- **Translation Guidelines**: Upload and maintain custom translation style guides
- **Session Management**: Save and restore complete translation sessions
- **Glossary Support**: Custom terminology management and banned terms

### 📊 **Sophisticated Text Analysis**
- **Hemingway-Style Readability**: Real-time analysis with color-coded feedback
- **Grade Level Scoring**: Ensures content meets target reading levels
- **Diff View**: Compare original, edited, and audience versions side-by-side
- **Sentence Complexity**: Identifies and flags overly complex structures

### ⚙️ **Granular Translation Control**
- **Translation Settings**: Fine-tune cultural localization, structure strictness, tone strictness, and jargon tolerance
- **Audience Configuration**: Custom prompts and settings for different target audiences
- **Processing Options**: Control paragraph breaks, sentence length, and verb complexity
- **Custom Prompts**: Override default behavior with specific instructions

---

## Tech Stack

- **Electron** - Desktop app framework
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **OpenAI API** - The AI magic

---

## Getting Started

### Quick Install
1. Download the `.dmg` file from releases
2. Drag to Applications folder
3. Get an OpenAI API key and add it in Settings

### Development Setup
```bash
git clone https://github.com/franz-rosenzweig/Translation-App.git
cd Translation-App
npm install

# Add your API key to .env.local
echo "OPENAI_API_KEY=your_key_here" > .env.local

# Run the app
npm run app-dev

# Build for production
npm run dist-mac
```

**Important:** Don't commit your `.env.local` file - it has your API key in it!

---

## 📖 User Guide

### **Interface Overview**

#### **Collapsible Sidebar**
- **Toggle**: Click the hamburger menu (☰) to collapse/expand
- **Settings**: Access all translation and app settings
- **Tools**: Sessions, guidelines, reference materials, and API settings
- **Model Selection**: Choose between GPT models and themes

#### **Main Translation Area**
- **Source Text**: Enter Hebrew text for translation
- **Rough English**: Optional rough translation for context
- **Run Button**: Positioned below source text for easy access
- **Results Tabs**: View edited text, audience version, and analysis

### **Basic Translation Workflow**

1. **Setup**: Configure API key via Settings → API Key Settings
2. **Input**: Paste Hebrew text in the source panel
3. **Optional Context**: Add rough English translation if available
4. **Settings**: Access Translation Settings for fine-tuning
5. **Run**: Click Run button to process with AI
6. **Review**: Examine results with readability analysis
7. **Export**: Save or copy results as needed

### **Advanced Features**

#### **Translation Settings (Unified Modal)**
Access via sidebar → Translation Settings button for combined configuration:

**Prompt Settings Tab:**
- **Override Text**: Custom instructions for the AI
- **Translation Sliders**: Cultural Localization, structure, tone, jargon (1-10 scale)
- **Processing Options**: Paragraph breaks, sentence length, verb complexity
- **Banned Terms**: Configure prohibited terminology

**Audience Version Tab:**
- **Target Audience**: Specify intended readership
- **Custom Prompt**: Additional instructions for audience adaptation
- **Quick Presets**: General Public, Academic, Children, Business
- **Additional Notes**: Context for audience-specific requirements

#### **Reference Material Management**
1. Click "Reference Material" in sidebar
2. Upload PDF files or paste text samples
3. Include 2-3 representative paragraphs per author/style
4. Materials automatically influence translation style

#### **Session Management**
1. Use "Sessions" to save current translation work
2. Name sessions for different projects or clients
3. Switch between sessions without losing progress
4. Auto-save prevents data loss

#### **Translation Guidelines**
1. Access via sidebar → "Translation Guidelines"
2. Upload Markdown or text files with style rules
3. Guidelines apply automatically to all translations
4. Supports project-specific style guides

### **Keyboard Shortcuts**
- **Cmd/Ctrl + Enter**: Run translation
- **Cmd/Ctrl + /**: Toggle Translation Settings modal
- **Cmd/Ctrl + ,**: Open preferences (API settings)

---

## 🎨 Theme System

TranslNathan features a sophisticated theming system with both light and dark modes:

### **Available Themes**
- **Light Mode**: Clean, professional interface for day use
- **Dark Mode**: Reduced eye strain for extended sessions

### **Theme Features**
- **Consistent Color Palette**: Carefully chosen colors for optimal contrast
- **Accessibility Compliant**: WCAG 2.1 AA color contrast ratios
- **Smooth Transitions**: Animated theme switching
- **System Integration**: Respects system dark mode preferences

Access theme settings via the sidebar → Theme selector.

---

## 🔧 Configuration

### **Application Settings**

#### **API Configuration**
- **OpenAI API Key**: Required for AI translation functionality
- **Model Selection**: Choose between available GPT models
- **Usage Monitoring**: Track API usage and costs

#### **Translation Parameters**

| Setting | Range | Description |
|---------|-------|-------------|
| **Cultural Localization** | 1-10 | Bidirectional cultural adaptation - Americanization for Hebrew→English, Israelization for English→Hebrew |
| **Structure Strictness** | 1-10 | Preservation vs. restructuring of original syntax |
| **Tone Strictness** | 1-10 | Fidelity to original authorial voice |
| **Jargon Tolerance** | 1-10 | Technical terminology preservation vs. simplification |

#### **Processing Options**
- **Preserve Paragraph Breaks**: Maintain original paragraph structure
- **Shorter Sentences**: Break complex sentences for clarity
- **Plain Verbs**: Prefer simple over complex verb constructions

#### **Audience Settings**
- **Target Audience**: Specify intended readership
- **Adaptation Level**: How extensively to modify for audience
- **Custom Instructions**: Specific requirements for audience version

### **Environment Configuration**

Create `.env.local` (never commit this file!):

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your_api_key_here

# Optional: Model Configuration
OPENAI_MODEL=gpt-4-turbo-preview

# Optional: Application Limits
MAX_CONTENT_LENGTH=15000
SESSION_TIMEOUT=24h
```

---

## 📊 Text Analysis & Readability

### **Hemingway-Style Analysis**
TranslNathan includes sophisticated text analysis inspired by the Hemingway Editor:

#### **Color-Coded Highlighting**
- 🟡 **Hard Sentences**: Complex structures that may confuse readers
- 🔴 **Very Hard Sentences**: Extremely difficult passages requiring revision
- 🟦 **Passive Voice**: Passive constructions that reduce impact
- 🟣 **Complex Phrases**: Unnecessarily complicated expressions
- 🟢 **Weakeners**: Qualifying words that diminish authority

#### **Readability Metrics**
- **Grade Level**: Flesch-Kincaid reading level assessment
- **Readability Score**: Overall text accessibility rating
- **Word/Sentence Counts**: Basic text statistics
- **Average Sentence Length**: Complexity indicators

#### **Improvement Suggestions**
- **Sentence Simplification**: Recommendations for clearer expression
- **Active Voice**: Suggestions for more direct communication
- **Word Choice**: Alternative expressions for complex terms
---

## 🔒 Privacy & Security

### **Data Handling & Privacy**
- **Local Storage Only**: All user data stored locally in browser storage
- **No Server Persistence**: Translation history never stored on remote servers
- **API Security**: All OpenAI API calls use secure HTTPS connections
- **Session Isolation**: Each application instance maintains independent data

### **Sensitive Information Protection**
- **API Key Security**: Keys stored locally, never transmitted except to OpenAI
- **Content Privacy**: Translation text only sent to OpenAI during active processing
- **No Logging**: Translation content not logged or retained by application
- **User Control**: Complete control over data retention and deletion

### **Best Practices**
- **Environment Variables**: Store API keys in `.env.local` (never commit!)
- **Key Rotation**: Regularly rotate OpenAI API keys for security
- **Local Backups**: Export important sessions before clearing browser data
- **Secure Networks**: Use application only on trusted network connections

---

## � Deployment & Distribution

### **Desktop Application Build**

#### **macOS DMG**
```bash
npm run dist-mac
```
Creates `Translation Chat-1.0.0-arm64.dmg` in `dist/` folder

#### **Cross-Platform Build**
```bash
npm run dist
```
Builds for current platform (Windows, macOS, Linux)

#### **Development Testing**
```bash
npm run app-dev
```
Runs Next.js dev server with Electron for live development

### **Build Configuration**
- **Electron Builder**: Configured for professional app packaging
- **Code Signing**: Optional for macOS distribution (requires developer account)
- **Auto-updater**: Ready for implementation in future versions
- **Icon Assets**: Optimized icons for all platforms and resolutions

### **System Requirements**
- **macOS**: 10.14 Mojave or later (Apple Silicon optimized)
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04+ or equivalent
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space for installation

---

## � Development

### **Project Structure**
```
Translation-App/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Main application page
│   └── api/               # API routes
├── components/            # React components
│   ├── Sidebar.tsx        # Collapsible sidebar navigation
│   ├── TranslationSettings.tsx  # Unified settings modal
│   ├── RunButton.tsx      # Translation execution
│   └── ...
├── lib/                   # Utility libraries
│   ├── api-client.ts      # OpenAI API integration
│   ├── storage.ts         # Local storage management
│   └── hemingway.ts       # Text analysis algorithms
├── assets/               # Application assets
│   ├── icon.icns         # macOS application icon
│   ├── icon-1024.png     # High-resolution icon
│   └── icon.svg          # Vector source icon
├── main.js               # Electron main process
├── preload.js            # Electron preload script
└── package.json          # Project configuration
```

### **Development Workflow**

#### **Local Development**
1. **Install dependencies**: `npm install`
2. **Start dev server**: `npm run app-dev`
3. **Make changes**: Edit files with hot reload
4. **Test thoroughly**: Verify functionality across components
5. **Build for testing**: `npm run dist-mac` for final testing

#### **Code Quality**
- **TypeScript**: Strict type checking enabled
- **Component Architecture**: Modular, reusable components
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance**: Optimized React rendering and state management

#### **Testing Strategy**
- **Manual Testing**: Comprehensive UI/UX testing across workflows
- **Error Scenarios**: Test API failures, invalid inputs, network issues
- **Cross-Platform**: Test builds on target operating systems
- **Accessibility**: Verify keyboard navigation and screen reader support

### **Contributing Guidelines**

#### **Development Setup**
1. Fork the repository on GitHub
2. Clone your fork locally
3. Create feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install`
5. Set up environment: Copy `.env.example` to `.env.local`

#### **Making Changes**
- Follow existing TypeScript conventions
- Maintain component modularity and reusability
- Add proper error handling and validation
- Update documentation for new features
- Test thoroughly before submitting

#### **Submission Process**
1. Commit changes: `git commit -m 'Add amazing feature'`
2. Push to branch: `git push origin feature/amazing-feature`
3. Open Pull Request with detailed description
4. Address code review feedback
5. Ensure CI passes (when implemented)

---

## 🐛 Troubleshooting

### **Common Issues**

#### **API Key Problems**
```
Error: Invalid API key or quota exceeded
```
**Solutions:**
- Verify API key in Settings → API Key Settings
- Check OpenAI account billing and quota
- Ensure key has proper permissions for GPT models

#### **Application Won't Start**
**Symptoms:** Electron app fails to launch or shows blank screen
**Solutions:**
- Clear application data: `~/Library/Application Support/Translation Chat`
- Restart application completely
- Check for macOS security restrictions (right-click → Open)

#### **Translation Fails**
```
Error: Request timeout or network error
```
**Solutions:**
- Check internet connection
- Reduce text length (max 15,000 characters)
- Verify OpenAI service status
- Try different GPT model in settings

#### **Settings Not Saving**
**Symptoms:** Configuration resets after restart
**Solutions:**
- Check browser localStorage is enabled
- Verify application has proper permissions
- Clear and reconfigure settings
- Restart application after major changes

#### **Performance Issues**
**Symptoms:** Slow response or high CPU usage
**Solutions:**
- Close other resource-intensive applications
- Reduce text length for processing
- Clear old sessions from storage
- Restart application periodically

### **Advanced Troubleshooting**

#### **Debug Mode**
For development builds, use browser developer tools:
1. **Open DevTools**: Cmd+Option+I (macOS) or F12 (Windows/Linux)
2. **Check Console**: Look for JavaScript errors
3. **Network Tab**: Verify API calls are successful
4. **Application Tab**: Inspect localStorage data

#### **Log Files**
Application logs available in:
- **macOS**: `~/Library/Logs/Translation Chat/`
- **Windows**: `%USERPROFILE%\AppData\Roaming\Translation Chat\logs\`
- **Linux**: `~/.config/Translation Chat/logs/`

## License

MIT License - see [LICENSE.md](LICENSE.md) for details. Use it however you want, just don't blame me if something breaks.
