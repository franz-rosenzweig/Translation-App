# TranslNathan 🔄

**Professional Hebrew-English AI Translation Editor with Style Awareness**

TranslNathan is a sophisticated web application designed for professional translators, editors, and content creators who need high-quality, style-aware translation between Hebrew and English. Built with advanced AI integration and real-time readability analysis, it goes beyond simple translation to deliver polished, publication-ready content.

---

## 🌟 Key Features

### 🧠 **AI-Powered Translation Editing**
- **GPT-5 Integration**: Leverages OpenAI's latest models for superior translation quality
- **Bidirectional Support**: Hebrew ↔ English translation with context awareness
- **Style Preservation**: Maintains authorial voice while adapting to target language conventions

### 📚 **Reference Material Integration**
- **Style Emulation**: Upload writing samples to guide AI style adaptation
- **Author Voice Matching**: Reference material from specific authors (e.g., Alisa Cohn, William Zinsser)
- **Persistent Storage**: Your reference materials are saved automatically

### 📋 **Translation Guidelines Management**
- **Custom Guidelines**: Upload and maintain translation style guides
- **Industry Standards**: Built-in support for professional translation conventions
- **Automatic Application**: Guidelines are applied consistently across all translations

### 🎨 **Professional UI/UX**
- **Multiple Themes**: GitHub Light/Dark, Solarized, Monokai, One Light
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

### 📊 **Advanced Text Analysis**
- **Hemingway-Style Readability**: Real-time analysis with color-coded feedback
- **Grade Level Scoring**: Ensures content meets target reading levels
- **Sentence Complexity**: Identifies and flags overly complex structures

### ⚙️ **Granular Control**
- **Translation Intensity**: 10-point scales for americanization, structure, tone, and jargon
- **Custom Prompts**: Override default behavior with specific instructions
- **Banned Terms**: Configure prohibited terminology
- **Session Management**: Save and restore translation sessions

---

## 🛠 Technical Architecture

### **Frontend Stack**
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript for type safety and developer experience
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom CSS variables for theming
- **UI Components**: [Radix UI](https://www.radix-ui.com/) for accessible, unstyled components
- **Icons**: [Lucide React](https://lucide.dev/) for consistent iconography

### **Backend & AI**
- **API Routes**: Next.js API routes for server-side processing
- **AI Provider**: [OpenAI GPT Models](https://openai.com/api/) with structured JSON responses
- **Text Processing**: Custom algorithms for readability analysis and highlighting
- **File Handling**: Browser-based file upload with multiple format support

### **Data Management**
- **State Management**: React hooks with TypeScript interfaces
- **Persistence**: Browser localStorage with automatic backup/restore
- **Session Storage**: Auto-save functionality with 24-hour retention
- **Material Storage**: Long-term storage (30 days) for guidelines and reference materials

### **Development Tools**
- **Code Quality**: ESLint and TypeScript for static analysis
- **Package Manager**: npm with lock file for reproducible builds
- **Development Server**: Next.js development server with hot reload

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- OpenAI API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/translnathan.git
   cd translnathan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### **Production Deployment**

**Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

**Manual Deployment**
```bash
npm run build
npm start
```

---

## 📖 Usage Guide

### **Basic Translation Workflow**

1. **Input Text**: Paste Hebrew text in the source panel
2. **Optional Rough Translation**: Add rough English for context
3. **Configure Settings**: Adjust translation intensity sliders
4. **Run Translation**: Click "Run" to process with AI
5. **Review Results**: Examine edited text with readability analysis
6. **Export or Iterate**: Save results or refine further

### **Advanced Features**

#### **Reference Material Setup**
1. Click "Reference Material" button
2. Upload PDF files or paste text samples
3. Include 2-3 representative paragraphs
4. Save for automatic application to future translations

#### **Translation Guidelines**
1. Access "Translation Guidelines" panel
2. Upload Markdown or text files with style rules
3. System automatically applies guidelines to all translations

#### **Custom Prompt Engineering**
1. Open "Prompt Drawer"
2. Adjust intensity sliders (1=minimal, 10=maximum)
3. Add custom override instructions
4. Configure banned terms if needed

#### **Session Management**
1. Use "Sessions" to save current work
2. Create named sessions for different projects
3. Switch between sessions without losing progress

---

## 🎨 Theme System

TranslNathan includes professional color schemes inspired by popular development environments:

### **Light Themes**
- **GitHub Light**: Clean, minimal design inspired by GitHub's interface
- **One Light**: Warm, easy-on-the-eyes color palette
- **Solarized Light**: Scientifically-optimized color contrast

### **Dark Themes**
- **Default Dark**: Modern dark theme with blue accents
- **GitHub Dark**: GitHub's professional dark mode
- **Solarized Dark**: High-contrast dark theme for extended use
- **Monokai**: Classic dark theme favored by developers

Access themes via the palette icon in the top navigation bar.

---

## 🔧 Configuration

### **Translation Settings**

| Setting | Range | Description |
|---------|-------|-------------|
| **Americanization** | 1-10 | How strongly to adapt text for American English readers |
| **Structure Strictness** | 1-10 | How closely to preserve original sentence structure |
| **Tone Strictness** | 1-10 | How precisely to match the original author's tone |
| **Jargon Tolerance** | 1-10 | Whether to preserve or simplify technical terminology |

### **Additional Options**
- **Preserve Paragraph Breaks**: Maintain original paragraph structure
- **Prefer Shorter Sentences**: Break up complex sentences when possible
- **Prefer Plain Verbs**: Use simple verb forms over complex constructions

### **Environment Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API authentication key | Required |
| `OPENAI_MODEL` | Model to use for translations | `gpt-4-turbo-preview` |
| `MAX_CONTENT_LENGTH` | Maximum characters per translation | `15000` |
| `SESSION_TIMEOUT` | Auto-save retention period | `24h` |

---

## 📊 Readability Analysis

TranslNathan includes sophisticated text analysis inspired by the Hemingway Editor:

### **Color-Coded Highlighting**
- 🟡 **Hard Sentences**: Complex sentence structures
- 🔴 **Very Hard Sentences**: Extremely difficult to read
- 🟦 **Passive Voice**: Passive construction detection
- 🟣 **Complex Phrases**: Overly complicated expressions
- 🟢 **Weakeners**: Qualifying words that reduce impact

### **Metrics Provided**
- **Grade Level**: Flesch-Kincaid reading level
- **Word Count**: Total words in translated text
- **Sentence Count**: Number of sentences
- **Average Sentence Length**: Words per sentence
- **Character Density**: Characters per word

---

## 🔒 Privacy & Security

### **Data Handling**
- **Local Storage**: All user data stored in browser localStorage
- **No Server Storage**: Translation history not stored on servers
- **API Security**: OpenAI API calls use secure HTTPS connections
- **Session Isolation**: Each browser session is independent

### **Content Privacy**
- **Temporary Processing**: Text sent to OpenAI only during active translation
- **No Logging**: Translation content not logged on servers
- **User Control**: Complete control over data retention and deletion

---

## 🤝 Contributing

We welcome contributions to TranslNathan! Here's how to get involved:

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### **Contribution Guidelines**
- Follow TypeScript best practices
- Maintain component modularity
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance

### **Code Style**
- Use TypeScript for all new code
- Follow existing naming conventions
- Component files should be PascalCase
- Utility files should be camelCase
- Include JSDoc comments for complex functions

---

## 🐛 Troubleshooting

### **Common Issues**

#### **API Key Problems**
```
Error: Invalid API key
```
**Solution**: Verify your OpenAI API key in `.env.local`

#### **Translation Timeout**
```
Error: Request timeout
```
**Solution**: Try shorter text or check internet connection

#### **Theme Not Loading**
**Solution**: Clear browser cache and reload page

#### **Session Not Saving**
**Solution**: Ensure localStorage is enabled in browser settings

### **Performance Tips**
- Keep translations under 15,000 characters
- Use reference material under 3,000 characters
- Clear old sessions periodically
- Close unused browser tabs to free memory

---

## 📜 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT models that power translation
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Hemingway Editor** for readability analysis inspiration
- **The translation community** for feedback and feature requests

---

## 📞 Support

- **Documentation**: Full docs available at [docs.translnathan.com](https://docs.translnathan.com)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/translnathan/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/yourusername/translnathan/discussions)
- **Email**: Contact us at support@translnathan.com

---

**Built with ❤️ for professional translators and content creators**

*TranslNathan - Where AI meets professional translation standards*
