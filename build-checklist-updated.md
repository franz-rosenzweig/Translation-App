# Type3 Translation‑Editing App — Detailed Build Checklist

A precise, step‑by‑step checklist to build a sleek web UI that edits AI‑translated Hebrew → American English using your "Type 3" rules. Optimized for VS Code. Short steps, strong guardrails. Includes Hemingway‑style highlighting, Session Management, Translation Guidelines, Language Selection, and Enhanced UX features.

---

## Project Status: ✅ COMPLETED - All Core Features Implemented

**Major Features Completed:**
- ✅ **Enhanced Hemingway-style syntax highlighting** with configurable overlays
- ✅ **Session Management** with persistent storage and conversation history  
- ✅ **Translation Guidelines Uploader** with markdown support
- ✅ **Language Selection** for source/target (Hebrew/English) with dynamic placeholders
- ✅ **Optional Rough Translation** input with toggle
- ✅ **Modal-based UI** for clean, professional interface
- ✅ **Increased character limits** (15,000 chars) with visual progress bars
- ✅ **Auto-save functionality** with conversation history tracking
- ✅ **Improved prompt composition** with guidelines integration

---

## 0) Scope & Goals

- ✅ Build a **local Next.js app** that:
  - ✅ Accepts Hebrew source + rough English.
  - ✅ Has option for changing source language (English/Hebrew)
  - ✅ Calls OpenAI **API** with strict **Structured Outputs**.
  - ✅ Renders **edited_text**, **change_log**, **glossary hits**, **flags**.
  - ✅ Provides **Hemingway‑style readability** highlights.
  - ✅ Lets you **fine‑tune** the editing prompt live (Prompt Drawer).
  - ✅ Lets you switch between **GPT models**.
- ✅ Output stays in the UI with copy functionality.
- ✅ Ready to later add auth and deploy.

---

## 1) Decisions Up Front

- ✅ **Stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + OpenAI Node SDK.
- ✅ **Models**: `gpt-4`, `gpt-4-turbo`, `gpt-4o`, `gpt-4o-mini`.
- ✅ **Hosting**: Local dev now. Ready for Basic Auth before exposing publicly.
- ✅ **Data**: No DB. Persist profile and sessions in `localStorage`.
- ✅ **Cost**: API billed per token. ChatGPT Plus does not discount API usage.

---

## 2) Project Scaffolding

- ✅ Create repo: `Translation Chat/`
- ✅ Initialize:
  ```bash
  npm init -y
  npm i next react react-dom
  npm i -D typescript @types/node @types/react @types/react-dom
  npx tsc --init
  ```
- ✅ Add scripts to `package.json`
- ✅ Install deps:
  ```bash
  npm i openai papaparse diff zod
  npm i tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  npm i class-variance-authority clsx tailwind-merge lucide-react
  npm i @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-tooltip
  ```
- ✅ Configure Tailwind
- ✅ Create `.env.local` with OpenAI API key

---

## 3) Folders & Base Files

- ✅ **App shell & styling**
  - ✅ `app/layout.tsx` — root layout, dark theme
  - ✅ `app/globals.css` — Tailwind + custom tokens
  - ✅ `app/page.tsx` — main UI

- ✅ **API & logic**
  - ✅ `app/api/process/route.ts` — POST endpoint to call OpenAI
  - ✅ `lib/prompts.ts` — base "Type 3" system prompt + composition
  - ✅ `lib/schema.ts` — JSON Schema for structured outputs
  - ✅ `lib/zod.ts` — zod mirror + `parseEditPayload()`
  - ✅ `lib/hemingway.ts` — analyzer (grade + highlights)
  - ✅ `lib/guardrails.ts` — banned terms detection

- ✅ **Components**
  - ✅ `components/RunBar.tsx` — top bar with buttons
  - ✅ `components/ModelSelector.tsx` — model dropdown
  - ✅ `components/GlossaryUpload.tsx` — CSV upload
  - ✅ `components/PromptDrawer.tsx` — fine-tune modal
  - ✅ `components/OutputTabs.tsx` — results tabs
  - ✅ `components/HighlightedText.tsx` — Hemingway highlighting
  - ✅ `components/DiffView.tsx` — text diff
  - ✅ `components/Toasts.tsx` — notifications
  - ✅ `components/SessionManager.tsx` — session save/load
  - ✅ `components/GuidelinesUploader.tsx` — guidelines modal
  - ✅ `components/LanguageSelector.tsx` — language picker

**Definition of Done**: ✅ App boots; layout renders; tabs switch; no hydration warnings.

---

## 4) JSON Contract (Structured Outputs)

- ✅ Create `lib/schema.ts` with comprehensive schema
- ✅ Mirror with zod in `lib/zod.ts` and export `parseEditPayload(json)`

**Definition of Done**: ✅ Every model response validates or triggers a clean error with remediation.

---

## 5) Prompting Strategy

- ✅ `lib/prompts.ts` base system prompt (short, strict):
  - ✅ Preserve original logic and structure.
  - ✅ Americanize wording and tone for U.S. readers.
  - ✅ Zinsser clarity. Short sentences. Avoid gerunds and fluff.
  - ✅ Grade 6–8 target unless content demands higher.
  - ✅ Respect glossary terms. No invented ideas.
  - ✅ **Return JSON only** matching the schema.

- ✅ Compose final prompt in API:
  - ✅ Base prompt
  - ✅ + Translation Guidelines (uploaded markdown)
  - ✅ + **Prompt Override** (from Prompt Drawer)
  - ✅ + Knobs (Americanization, Structure strictness, Tone strictness, Jargon tolerance)
  - ✅ + Glossary JSON
  - ✅ + Language context (source/target)
  - ✅ + Conversation history

**Definition of Done**: ✅ Small changes in knobs/override produce predictable differences in tone/structure.

---

## 6) API Route `/api/process`

- ✅ Accept JSON payload with all parameters
- ✅ Input guards: non‑empty strings, size limits (15,000 chars), glossary validation
- ✅ Call OpenAI API with structured outputs
- ✅ Timeout (20s) via `AbortController`
- ✅ Retry once on 429/5xx
- ✅ Extract and validate JSON response
- ✅ Auto re‑ask once on invalid JSON
- ✅ Map errors to HTTP status codes

**Definition of Done**: ✅ Stable 200 with valid payload; precise error messages otherwise.

---

## 7) UI Skeleton (Sleek & Professional)

- ✅ **Top bar**: title, **ModelSelector**, **Sessions**, **Translation Guidelines**, **Prompt Drawer**, Run/Clear buttons
- ✅ **Left Inputs Panel**:
  - ✅ Source text textarea with language selector and RTL support
  - ✅ Optional rough translation textarea with toggle
  - ✅ Target language selector
  - ✅ **GlossaryUpload** (CSV: `hebrew,english[,note]`)
  - ✅ Character counters with visual progress bars
- ✅ **Right Results Tabs**:
  - ✅ Edited Text (with optional Hemingway highlight overlay)
  - ✅ Notes (change_log, glossary hits, flags)
  - ✅ Conversation History with load/copy functionality
  - ✅ Diff (rough vs edited)

- ✅ Keyboard shortcuts:
  - ✅ `Cmd/Ctrl+Enter` → Run
  - ✅ `Cmd/Ctrl+/` → Prompt Drawer

**Definition of Done**: ✅ Zero layout shift; clear labels; smooth keyboard navigation.

---

## 8) Components Built

- ✅ `ModelSelector.tsx` — dropdown with model selection and persistence
- ✅ `GlossaryUpload.tsx` — CSV parser with PapaParse; show count + sample
- ✅ `PromptDrawer.tsx` — Radix dialog with:
  - ✅ **Prompt Override** textarea
  - ✅ Sliders (0–3): Americanization, Structure, Tone, Jargon
  - ✅ Toggles: Preserve paragraphs, Shorter sentences, Plain verbs
  - ✅ Version history: save/restore overrides
- ✅ `RunBar.tsx` — All action buttons with modal triggers
- ✅ `OutputTabs.tsx` — Tabs wrapper with Radix
- ✅ `DiffView.tsx` — inline diff via `diff` package
- ✅ `Toasts.tsx` — errors/success notifications
- ✅ `SessionManager.tsx` — save/load/delete sessions with auto-save
- ✅ `GuidelinesUploader.tsx` — markdown guidelines with file upload
- ✅ `LanguageSelector.tsx` — Hebrew/English selection per input

**Definition of Done**: ✅ Components are isolated, typed, and accessible.

---

## 9) Hemingway‑Style Analyzer (`lib/hemingway.ts`)

- ✅ **Tokenization**
  - ✅ `splitSentences(text)`: robust regex; keep punctuation
  - ✅ `splitWords(sent)`: keep apostrophes/hyphens; strip punctuation
- ✅ **Grade**
  - ✅ Implement **Automated Readability Index (ARI)** for overall grade
  - ✅ Optional: compute Flesch‑Kincaid for comparison
- ✅ **Classifiers**
  - ✅ Difficulty: **Hard** ≥ 20 words; **Very Hard** ≥ 30 words
  - ✅ **Adverbs**: `\b\w+ly\b` minus allowlist
  - ✅ **Passive**: comprehensive passive voice detection
  - ✅ **Complex words**: ≥ 3 syllables via vowel‑group heuristic
- ✅ **Output**
  - ✅ Return `{ grade, counts, annotations: [{ start, end, kind }] }`
  - ✅ Kinds: `hard`, `veryhard`, `adverb`, `passive`, `complex`

- ✅ **Renderer**
  - ✅ In `HighlightedText.tsx`, wrap ranges in spans with classes
  - ✅ Toggle via switch. Add legend and counts
  - ✅ Color-coded highlights matching Hemingway app style

**Definition of Done**: ✅ Highlights match counters; toggling works; no lag on long paragraphs.

---

## 10) Enhanced Features Implemented

### ✅ Session Management System
- ✅ **Persistent Sessions**: Save/load complete translation sessions
- ✅ **Auto-save**: Automatic saving of current work
- ✅ **Conversation History**: Track multiple translation attempts per session
- ✅ **Session Browser**: List, load, and delete saved sessions
- ✅ **Metadata Tracking**: Timestamps, models used, character counts

### ✅ Translation Guidelines Integration
- ✅ **File Upload**: Support for .md and .txt guideline files
- ✅ **Inline Editing**: Direct text editing with syntax highlighting
- ✅ **Default Templates**: Pre-loaded translation best practices
- ✅ **Prompt Integration**: Guidelines automatically included in AI prompts
- ✅ **Persistent Storage**: Guidelines saved with sessions

### ✅ Enhanced Language Support
- ✅ **Dynamic Language Selection**: Choose source/target languages independently
- ✅ **Smart Placeholders**: Context-aware placeholder text based on selected languages
- ✅ **RTL Support**: Proper right-to-left text handling for Hebrew
- ✅ **Optional Rough Translation**: Toggle rough translation requirement

### ✅ Advanced UI/UX Features
- ✅ **Modal Architecture**: Clean modal dialogs for all major features
- ✅ **Progressive Disclosure**: Hide complexity behind intuitive controls
- ✅ **Visual Feedback**: Progress bars, counters, and status indicators
- ✅ **Accessibility**: Proper ARIA labels, keyboard navigation, focus management

---

## 11) Model Selector 

- ✅ Dropdown with: `gpt-4`, `gpt-4-turbo`, `gpt-4o`, `gpt-4o-mini`
- ✅ Tooltip: quick guidance on cost/latency
- ✅ Pipe selection to API payload, persist in `localStorage`
- ✅ Log selected model server‑side for debugging

**Definition of Done**: ✅ Switching models changes latency/quality noticeably; choice persists across reloads.

---

## 12) Glossary Flow

- ✅ CSV headers: `hebrew,english[,note]`
- ✅ Normalize rows to `{ hebrew, chosen_english, note? }`
- ✅ Include JSON glossary in system prompt
- ✅ UI: show count and sample; show **terms_glossary_hits** in Notes

**Definition of Done**: ✅ Bad CSV yields a clear inline error; good CSV affects outputs consistently.

---

## 13) Guardrails

- ✅ Optional **banned terms** configuration
- ✅ Detection in `edited_text`:
  - ✅ Show red banner with offending terms
  - ✅ Provide **"Re‑ask with enforcement"** button for retry
- ✅ Input size guard (15,000 character limit) with clear messaging

**Definition of Done**: ✅ Enforcement flow works in one click; user sees exactly what changed.

---

## 14) Error Handling & UX

- ✅ Client:
  - ✅ Error toast + persistent banner with HTTP code and next steps
  - ✅ Disable Run while pending; show spinner
  - ✅ **AbortController** to cancel previous request on new Run
- ✅ Server:
  - ✅ Log `requestId`, model, duration, error type, retry info
  - ✅ Map errors cleanly to 400/429/502/500

**Definition of Done**: ✅ Failures are actionable and never ambiguous.

---

## 15) Styling & Accessibility

- ✅ Dark theme, high contrast, generous spacing
- ✅ 16–18px base text; monospace option for edited text
- ✅ Respect `prefers-reduced-motion`
- ✅ Proper labels, roles, focus traps in dialogs
- ✅ RTL only on Hebrew content (`dir="rtl"`). Keep UI LTR

**Definition of Done**: ✅ Lighthouse a11y ≥ 95; keyboard‑only is smooth.

---

## 16) Testing

- ✅ **Manual Testing**:
  - ✅ Hebrew paragraphs translate correctly with proper highlighting
  - ✅ Session save/load preserves all state
  - ✅ Guidelines integration affects translation output
  - ✅ Language switching updates placeholders and behavior
  - ✅ Modal dialogs work properly with keyboard navigation

**Definition of Done**: ✅ Manual checks feel trustworthy and professional.

---

## 17) Performance & Optimization

- ✅ **Character Limits**: Increased to 15,000 with visual feedback
- ✅ **Auto-save**: Debounced to prevent excessive storage writes
- ✅ **Memory Management**: Efficient conversation history storage
- ✅ **Responsive UI**: Smooth interactions even with large texts
- ✅ **Error Recovery**: Graceful handling of API failures

---

## 18) Final Polish

- ✅ Copy buttons for Edited Text and Notes
- ✅ Word/character counters beneath inputs with progress bars
- ✅ "New session" button clears all state
- ✅ Microcopy: short, directive; no fluff
- ✅ Professional modal dialogs for all major features
- ✅ Consistent button styling and interactions

**Definition of Done**: ✅ Feels fast, clear, and built for professional translation work.

---

## Current Architecture

### **File Structure:**
```
app/
├── layout.tsx          # Root layout with dark theme
├── page.tsx           # Main UI orchestration
├── globals.css        # Tailwind + custom styles
└── api/process/route.ts # OpenAI API integration

components/
├── RunBar.tsx          # Top navigation with action buttons
├── ModelSelector.tsx   # AI model selection dropdown  
├── GlossaryUpload.tsx  # CSV glossary upload/management
├── PromptDrawer.tsx    # Live prompt tuning interface
├── OutputTabs.tsx      # Tabbed results display
├── HighlightedText.tsx # Hemingway-style text analysis
├── DiffView.tsx        # Side-by-side text comparison
├── Toasts.tsx          # Notification system
├── SessionManager.tsx  # Session save/load interface
├── GuidelinesUploader.tsx # Translation guidelines management
└── LanguageSelector.tsx # Language picker component

lib/
├── prompts.ts          # System prompt composition
├── schema.ts           # OpenAI structured output schema
├── zod.ts             # Response validation
├── hemingway.ts       # Text analysis engine
└── guardrails.ts      # Content filtering
```

### **Key Features:**
1. **Professional Translation Workflow**: Complete session management with persistent storage
2. **AI-Powered Analysis**: GPT-4 integration with structured outputs and retry logic
3. **Advanced Text Analysis**: Hemingway-style readability scoring with visual highlights
4. **Flexible Input Options**: Language selection, optional rough translation, guidelines integration
5. **Modern UI/UX**: Modal-based interface with accessibility and keyboard navigation
6. **Robust Error Handling**: Comprehensive guardrails and user feedback

---

## Appendix A — Keyboard Shortcuts

- Run: `Cmd/Ctrl + Enter`
- Toggle Prompt Drawer: `Cmd/Ctrl + /`

---

## Appendix B — Example `.env.local`

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Definition of "Done" for the Whole App ✅

- ✅ Paste Hebrew + rough English, pick languages, press Run
- ✅ See edited text + notes + readability highlights instantly  
- ✅ Adjust Prompt Drawer sliders/overrides and re‑run; outputs change predictably
- ✅ Switch between GPT models at will
- ✅ Save and restore complete translation sessions
- ✅ Upload and integrate custom translation guidelines
- ✅ Professional modal-based interface with full accessibility
- ✅ No crashes, clear errors, smooth workflow

**🎉 PROJECT COMPLETE: All requested features implemented and tested successfully!**
