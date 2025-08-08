
# Type3 Translation‑Editing App — Detailed Build Checklist

A precise, step‑by‑step checklist to build a sleek web UI that edits AI‑translated Hebrew → American English using your “Type 3” rules. Optimized for VS Code. Short steps, strong guardrails. Includes Hemingway‑style analyzer, Prompt Drawer, and GPT‑5 model selector.

---

## 0) Scope & Goals

- Build a **local Next.js app** that:
  - Accepts Hebrew source + rough English.
  - Has option for changing source (for example, English source, rough Hebrew)
  - Calls OpenAI **Responses API** with strict **Structured Outputs**.
  - Renders **edited_text**, **change_log**, **glossary hits**, **flags**.
  - Provides **Hemingway‑style readability** highlights.
  - Lets you **fine‑tune** the editing prompt live (Prompt Drawer).
  - Lets you switch between **GPT‑5 family** models.
- No file exports. Output stays in the UI.
- Option for file exports
- Ready to later add auth and deploy.

---

## 1) Decisions Up Front

- [ ] **Stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + OpenAI Node SDK.
- [ ] **Models**: `gpt-5` (quality), `gpt-5-mini` (default), `gpt-5-nano` (cheap).
- [ ] **Hosting**: Local dev now. Add Basic Auth before exposing publicly.
- [ ] **Data**: No DB. Persist profile and overrides in `localStorage`.
- [ ] **Cost**: API billed per token. ChatGPT Plus does not discount API usage.

---

## 2) Project Scaffolding

- [ ] Create repo: `type3-trans-edit/`
- [ ] Initialize:
  ```bash
  npm init -y
  npm i next react react-dom
  npm i -D typescript @types/node @types/react @types/react-dom
  npx tsc --init
  ```
- [ ] Add scripts to `package.json`:
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    }
  }
  ```
- [ ] Install deps:
  ```bash
  npm i openai papaparse diff zod
  npm i tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  npm i class-variance-authority clsx tailwind-merge lucide-react
  npm i @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-tooltip
  ```
- [ ] Configure Tailwind: add `app/**/*.{ts,tsx}` to `content` in `tailwind.config.js`.
- [ ] Create `.env.local`:
  ```env
  OPENAI_API_KEY=sk-...
  OPENAI_MODEL=gpt-5-mini
  ```

---

## 3) Folders & Base Files

- [ ] **App shell & styling**
  - [ ] `app/layout.tsx` — root layout, dark theme
  - [ ] `app/globals.css` — Tailwind `@tailwind base; @tailwind components; @tailwind utilities;` + tokens
  - [ ] `app/page.tsx` — main UI

- [ ] **API & logic**
  - [ ] `app/api/process/route.ts` — POST endpoint to call OpenAI
  - [ ] `lib/prompts.ts` — base “Type 3” system prompt
  - [ ] `lib/schema.ts` — JSON Schema for structured outputs
  - [ ] `lib/zod.ts` — zod mirror + `parseEditPayload()`
  - [ ] `lib/hemingway.ts` — analyzer (grade + highlights)
  - [ ] `lib/readability.ts` — (optional) Flesch‑Kincaid, word/sentence counts

- [ ] **Components**
  - [ ] `components/RunBar.tsx`
  - [ ] `components/ModelSelector.tsx`
  - [ ] `components/GlossaryUpload.tsx`
  - [ ] `components/PromptDrawer.tsx`
  - [ ] `components/OutputTabs.tsx`
  - [ ] `components/EditedText.tsx`
  - [ ] `components/NotesPane.tsx`
  - [ ] `components/ReadabilityPane.tsx`
  - [ ] `components/DiffView.tsx`
  - [ ] `components/Toasts.tsx`

**Definition of Done**: App boots; layout renders; tabs switch; no hydration warnings.

---

## 4) JSON Contract (Structured Outputs)

- [ ] Create `lib/schema.ts`:
  ```ts
  export const editSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      edited_text: { type: "string" },
      change_log: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            line: { type: "integer" },
            type: { type: "string" }, // clarity|tone|fidelity|idiom|structure|punctuation|spelling
            before: { type: "string" },
            after: { type: "string" },
            reason: { type: "string" }
          },
          required: ["type","after","reason"]
        }
      },
      terms_glossary_hits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hebrew: { type: "string" },
            chosen_english: { type: "string" },
            note: { type: "string" }
          },
          required: ["hebrew","chosen_english"]
        }
      },
      flags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: { type: "string" }, // fidelity|tone|ambiguity|idiom|formatting|terminology
            note: { type: "string" }
          },
          required: ["kind","note"]
        }
      }
    },
    required: ["edited_text"]
  } as const;
  ```

- [ ] Mirror with zod in `lib/zod.ts` and export `parseEditPayload(json)`.

**Definition of Done**: Every model response validates or triggers a clean error with remediation.

---

## 5) Prompting Strategy

- [ ] `lib/prompts.ts` base system prompt (short, strict):
  - Preserve original logic and structure.
  - Americanize wording and tone for U.S. readers.
  - Zinsser clarity. Short sentences. Avoid gerunds and fluff.
  - Grade 6–8 target unless content demands higher.
  - Respect glossary terms. No invented ideas.
  - **Return JSON only** matching the schema.

- [ ] Compose final prompt in API:
  - Base prompt
  - + Project Style (dropdown)
  - + **Prompt Override** (from Prompt Drawer)
  - + Knobs (Americanization, Structure strictness, Tone strictness, Jargon tolerance)
  - + Glossary JSON

**Definition of Done**: Small changes in knobs/override produce predictable differences in tone/structure.

---

## 6) API Route `/api/process`

- [ ] Accept JSON payload:
  ```ts
  { hebrew: string, roughEnglish: string, style?: string,
    glossary?: {hebrew:string;chosen_english:string;note?:string}[],
    model?: string, promptOverride?: string, knobs?: Record<string, unknown> }
  ```
- [ ] Input guards: non‑empty strings, small size limits, glossary is array.
- [ ] Call OpenAI Responses API:
  - `model`: default `gpt-5-mini` (selectable)
  - `input`: `{ role: "system" }` + `{ role: "user" }`
  - `response_format`: `{ type: "json_schema", json_schema: editSchema }`
- [ ] Timeout (20s) via `AbortController`.
- [ ] Retry once on 429/5xx (exponential backoff).
- [ ] Extract JSON string (prefer `response.output_text`), then `JSON.parse`.
- [ ] Validate with zod.
- [ ] On invalid JSON: **auto re‑ask once** with a terse instruction: “Return valid JSON only, per schema.”
- [ ] Map errors to HTTP: 400 (bad input), 429 (rate), 502 (bad JSON), 500 (unknown).

**Definition of Done**: Stable 200 with valid payload; precise error messages otherwise.

---

## 7) UI Skeleton (Sleek & Professional)

- [ ] **Top bar**: title, **ModelSelector**, Run/Clear, **Prompt Drawer** button.
- [ ] **Left Inputs Panel**:
  - [ ] Hebrew textarea (RTL, `dir="rtl"`).
  - [ ] Rough English textarea (LTR).
  - [ ] Style dropdown (saved profiles).
  - [ ] **GlossaryUpload** (CSV: `hebrew,english[,note]`).
  - [ ] Knobs: Americanization, Structure strictness, Tone strictness, Jargon tolerance.
- [ ] **Right Results Tabs**:
  - [ ] Edited Text (with optional Hemingway highlight overlay).
  - [ ] Notes (change_log, glossary hits, flags).
  - [ ] Readability (grade, counters, legend).
  - [ ] Diff (rough vs edited).

- [ ] Keyboard shortcuts:
  - `Cmd/Ctrl+Enter` → Run
  - `Cmd/Ctrl+/` → Prompt Drawer
  - `Cmd/Ctrl+[ / ]` → Switch tabs

**Definition of Done**: Zero layout shift; clear labels; smooth keyboard navigation.

---

## 8) Components to Build

- [ ] `ModelSelector.tsx` — dropdown: `gpt-5`, `gpt-5-mini`, `gpt-5-nano` (+ tooltips, persist choice).
- [ ] `GlossaryUpload.tsx` — parse CSV with PapaParse; show count + sample; emit normalized array.
- [ ] `PromptDrawer.tsx` — Radix dialog with:
  - [ ] **Prompt Override** textarea.
  - [ ] Sliders (0–3): Americanization, Structure, Tone, Jargon.
  - [ ] Toggles: Preserve paragraph breaks, Prefer shorter sentences, Prefer plain verbs.
  - [ ] Version history: save/restore last 5 overrides.
- [ ] `RunBar.tsx` — Run/Clear buttons, model selector, drawer button.
- [ ] `OutputTabs.tsx` — Tabs wrapper with Radix.
- [ ] `EditedText.tsx` — renders final text + Hemingway highlights.
- [ ] `NotesPane.tsx` — renders change_log, glossary hits, flags.
- [ ] `ReadabilityPane.tsx` — grade, counters, legend, mini heat‑map.
- [ ] `DiffView.tsx` — inline diff via `diff` package.
- [ ] `Toasts.tsx` — errors/success via Radix tooltip/portal.

**Definition of Done**: Components are isolated, typed, and accessible.

---

## 9) Hemingway‑Style Analyzer (`lib/hemingway.ts`)

- [ ] **Tokenization**
  - [ ] `splitSentences(text)`: robust regex; keep punctuation.
  - [ ] `splitWords(sent)`: keep apostrophes/hyphens; strip punctuation.
- [ ] **Grade**
  - [ ] Implement **Automated Readability Index (ARI)** for overall grade:
    - ARI ≈ 4.71 × (characters/words) + 0.5 × (words/sentences) − 21.43
  - [ ] Optional: compute Flesch‑Kincaid for comparison.
- [ ] **Classifiers**
  - [ ] Difficulty: **Hard** ≥ 20 words; **Very Hard** ≥ 30 words.
  - [ ] **Adverbs**: `\b\w+ly\b` minus an allowlist (`family`, `holy`, etc.).
  - [ ] **Passive**: `\b(is|are|was|were|be|been|being)\s+\w+(ed|en)\b` plus irregulars (`made`, `seen`, `given`, etc.).
  - [ ] **Complex words**: ≥ 3 syllables via vowel‑group heuristic; exclude proper nouns.
- [ ] **Output**
  - [ ] Return `{ grade, counts, annotations: [{ start, end, kind }] }`.
  - [ ] Kinds: `hard`, `veryhard`, `adverb`, `passive`, `complex`.

- [ ] **Renderer**
  - [ ] In `EditedText.tsx`, wrap ranges in spans with classes:
    - `.hl-hard`, `.hl-veryhard`, `.hl-adverb`, `.hl-passive`, `.hl-complex`.
  - [ ] Toggle via a switch. Add legend and counts in Readability tab.

**Definition of Done**: Highlights match counters; toggling works; no lag on long paragraphs.

---

## 10) Prompt Drawer (Fine‑Tune Prompt Live)

- [ ] UI: Radix Dialog with textarea + sliders + toggles; Save/Restore presets.
- [ ] Merge order for final system prompt:
  - Base → Project Style → **Prompt Override** → **Knobs** → **Schema lock** (“Return JSON only per schema”).
- [ ] Sliders map to explicit rules, e.g.:
  - Americanization `0..3`: “Favor idiomatic U.S. phrasing unless fidelity risk (level X/3).”
  - Structure strictness: “Preserve author paragraphing unless clarity requires change (level X/3).”
  - Tone strictness: “Keep sober, non‑sales tone (level X/3).”
  - Jargon tolerance: “Prefer plain English; retain technical terms when necessary (level X/3).”
- [ ] Persist last 5 overrides in `localStorage` with timestamp.

**Definition of Done**: Changes feel predictable; one‑click restore to a previous prompt works.

---

## 11) Model Selector (GPT‑5 Family)

- [ ] Dropdown with: `gpt-5` (best), `gpt-5-mini` (default), `gpt-5-nano` (drafting).
- [ ] Tooltip: quick guidance on cost/latency.
- [ ] Pipe selection to API payload, persist in `localStorage`.
- [ ] Log selected model server‑side for debugging.

**Definition of Done**: Switching models changes latency/quality noticeably; choice persists across reloads.

---

## 12) Glossary Flow

- [ ] CSV headers: `hebrew,english[,note]`.
- [ ] Normalize rows to `{ hebrew, chosen_english, note? }`.
- [ ] Include JSON glossary in system prompt.
- [ ] UI: show count and sample; show **terms_glossary_hits** in Notes.

**Definition of Done**: Bad CSV yields a clear inline error; good CSV affects outputs consistently.

---

## 13) Guardrails

- [ ] Optional **banned terms** per profile.
- [ ] If detected in `edited_text`:
  - [ ] Show red banner with offending terms.
  - [ ] Provide **“Re‑ask with enforcement”** button that adds a corrective line to system prompt and retries.
- [ ] Input size guard with clear suggestion to split long chapters.

**Definition of Done**: Enforcement flow works in one click; user sees exactly what changed.

---

## 14) Error Handling & UX

- [ ] Client:
  - [ ] Error toast + persistent banner with HTTP code and next steps.
  - [ ] Disable Run while pending; show spinner.
  - [ ] **AbortController** to cancel previous request on new Run.
- [ ] Server:
  - [ ] Log `requestId`, model, duration, error type, retry info.
  - [ ] Map errors cleanly to 400/429/502/500.

**Definition of Done**: Failures are actionable and never ambiguous.

---

## 15) Styling & Accessibility

- [ ] Dark theme, high contrast, generous spacing.
- [ ] 16–18px base text; optional monospace toggle for edited text.
- [ ] Respect `prefers-reduced-motion`.
- [ ] Proper labels, roles, focus traps in dialogs.
- [ ] RTL only on the Hebrew textarea (`dir="rtl"`). Keep UI LTR.

**Definition of Done**: Lighthouse a11y ≥ 95; keyboard‑only is smooth.

---

## 16) Testing

- [ ] **Unit**:
  - [ ] `lib/hemingway.ts` functions (tokenization, ARI, classifiers).
  - [ ] `parseEditPayload` zod validator.
- [ ] **Integration**:
  - [ ] Mock OpenAI client; assert happy path and invalid‑JSON first pass triggers retry.
- [ ] **Manual**:
  - [ ] Paste 3–5 known Hebrew paragraphs; verify edits, highlights, flags.

**Definition of Done**: Tests green; manual checks feel trustworthy.

---

## 17) Deployment Readiness (Optional)

- [ ] Add Basic Auth on API for demos.
- [ ] Add simple per‑IP rate limit.
- [ ] Set `NEXT_TELEMETRY_DISABLED=1`.
- [ ] Add minimal logging redaction (no raw text in logs if sensitive).

**Definition of Done**: Safe to share a demo link with a colleague.

---

## 18) Final Polish

- [ ] Copy buttons for Edited Text and Notes.
- [ ] Word/character counters beneath inputs.
- [ ] “New session” button clears all state.
- [ ] Microcopy: short, directive; no fluff.

**Definition of Done**: Feels fast, clear, and built for work.

---

## Appendix A — Keyboard Shortcuts

- Run: `Cmd/Ctrl + Enter`
- Toggle Prompt Drawer: `Cmd/Ctrl + /`
- Switch Tabs: `Cmd/Ctrl + [` and `Cmd/Ctrl + ]`

---

## Appendix B — Example `.env.local`

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
```

---

## Appendix C — Notes on Cost

- API is billed per token. ChatGPT Plus is separate and **does not** discount API usage.
- Keep inputs tight. Prefer `gpt-5-mini` for speed. Use `gpt-5` when nuance is critical.
- Avoid sending massive prompt text in the **user** message. Keep heavy rules in **system**.

---

## Definition of “Done” for the Whole App

- Paste Hebrew + rough English, pick a style, press Run.
- See edited text + notes + readability highlights instantly.
- Adjust Prompt Drawer sliders or overrides and re‑run; outputs change predictably.
- Switch between GPT‑5 models at will.
- No crashes, clear errors, smooth keyboard‑first workflow.
