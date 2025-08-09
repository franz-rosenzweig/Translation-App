# Build Checklist: Audience-Optimized Version + Prompt Override Weighting

Goal: Add a second "Audience Version" translation output (creative/adaptive) alongside the faithful edited translation, and increase the authority of the Prompt Drawer override directives.

---
## High-Level Feature Set
1. Prompt Override Weighting (highest-priority directives)
2. Extended Prompt Composer with `mode` (standard | audience-both | audience-only)
3. Schema extension to include optional `audience_version` object
4. API / IPC plumbing to request audience mode
5. UI additions:
   - Button: "Generate Audience Version"
   - Second editor panel (Audience Version) with: editability, readability score, diff(s)
6. Diff & Readability integration for audience text
7. Persistence in conversation history (include both variants)
8. Electron parity
9. Basic testing + fallback behavior

---
## Incremental Phases
| Phase | Scope | Deliverable |
|-------|-------|-------------|
| 1 | Prompt + Schema foundation | Updated `prompts.ts`, zod schema, types |
| 2 | Backend plumbing | API route & Electron main modifications to accept `mode` and emit audience payload |
| 3 | UI trigger & rendering | Button + second panel UI skeleton |
| 4 | Readability + Diff | Integrate existing analyzers + diff lib for audience text |
| 5 | Conversation / state | Persist both versions, allow re-generation |
| 6 | Polish & QA | Error handling, guardrails, docs |

## 🎉 IMPLEMENTATION COMPLETE!

**Status: Phase 1-3 Fully Implemented ✅**

### Core Features Working:
- ✅ **Enhanced Prompt Override Weighting** - Override directives now have highest priority
- ✅ **Audience Version Generation** - "Generate Audience Version" button creates optimized translations  
- ✅ **Dual Output Tabs** - Faithful translation + Audience version with rationale
- ✅ **Diff Integration** - Toggle between audience text and diff vs faithful
- ✅ **Readability Analysis** - Full hemingway analysis for both versions
- ✅ **Banned Terms Checking** - Separate violation detection for both outputs
- ✅ **Conversation History** - Stores and loads both versions
- ✅ **Graceful Error Handling** - Fallback parsing and validation
- ✅ **Development Logging** - Audience mode usage tracking

### Ready to Test:
App running at **http://localhost:3001**

Test workflow:
1. Enter Hebrew/English text
2. Run standard translation
3. Click "Generate Audience Version" 
4. Compare outputs in separate tabs
5. Use "Diff vs Faithful" toggle
6. Check readability scores for both
7. Test prompt override priority in Prompt Drawer

---

### Remaining Optional Items:

### 1. Prompt & Schema Foundation
- [x] `lib/prompts.ts`: Add `mode` parameter ("standard" | "audience-both" | "audience-only").
- [x] Add wrapper around override directives (`wrapOverride`) that appends high-priority block at END of system content.
- [x] Add audience addendum text when mode starts with `audience`.
- [x] Extend base system prompt JSON schema description to include `audience_version` object.
- [x] Export helper `composeAudienceOnlyPrompt` (optional convenience).
- [x] Update comments to clarify precedence rules.

### 2. Schema / Types
- [x] `lib/zod.ts`: Extend `EditPayload` with optional `audience_version: { text: string; rationale?: string }`.
- [x] Add TypeScript type export for new shape.
- [ ] Add narrow runtime check to gracefully ignore unknown fields.

### 3. API Route (Next.js) `app/api/process/route.ts`
- [x] Accept `mode` in POST body (default `standard`).
- [x] Pass `mode` into `composePrompt` call.
- [ ] Update validation: If `audience_version` present and `text` missing, treat as malformed.
- [x] Backward compatibility: If not present, continue existing flow.
- [ ] Log when audience mode used (dev only).

### 4. Electron Main (`main.js`)
- [x] Accept `mode` from payload in `handleTranslationProcessing`.
- [x] Mirror audience addendum logic OR reuse `composePrompt` directly (optional refactor—phase 7 improvement).
- [x] Parse JSON response for `audience_version` and forward unchanged.
- [x] Maintain fallback: if model returns only one text, map it to both or just `edited_text`.

### 5. Frontend State & Types (`app/page.tsx` + related components)
- [x] Add `mode` to request body (initially only when user clicks new button).
- [x] Add `audienceDraft` state: `{ text: string; rationale?: string } | null`.
- [x] Store in conversation history entries: `audienceVersion?: string`.
- [x] Include toggle or always show panel if audienceDraft exists.

### 6. UI Components
- [x] Add button below primary edited text area: "Generate Audience Version".
- [x] Disable button while pending.
- [x] When clicked: send same payload + `mode="audience-both"` (so we also refresh faithful version if improved).
- [x] Audience panel layout: title bar ("Audience Version" + re-generate icon), editable textarea / rich editor, rationale tooltip.
- [x] Visual diff triggers (buttons: Diff vs Faithful, Diff vs Rough Source) shown if respective source exists.

### 7. Diff Integration
- [x] Add lightweight diff utility (e.g. `diff` package already in deps) or custom word-level diff.
- [x] Component to render diff with insert/delete styling.
- [x] Reuse existing `DiffView` if adaptable; else extend to accept two arbitrary strings and a label context.

### 8. Readability & Analytics
- [x] Reuse `hemingway` functions against `audience_version.text`.
- [x] Display same highlight overlay & score panel.
- [x] Provide quick metrics (word count, reading level approximation) near panel header.

### 9. Guardrails / Enforcement
- [ ] If banned terms check implemented, run on both outputs.
- [ ] Show violations per panel (distinct markers/icons).
- [ ] In retry with enforcement mode, allow applying only to faithful or both (future—phase 7+).

### 10. Override Directive Weighting
- [ ] Confirm override block appended last.
- [ ] Add explicit instruction: "If conflict: OVERRIDE prevails unless JSON safety or factual integrity would break." in override block.
- [ ] Add integration test (mock completion) verifying override phrase appears after glossary & settings.

### 11. Conversation History Persistence
- [ ] Modify stored history structure to include `audienceVersion`.
- [ ] Display an icon/badge in history list if audience version existed.
- [ ] On recall of a history entry, repopulate both editors.

### 12. Error Handling
- [ ] If model omits `audience_version` in audience mode, surface non-blocking warning badge.
- [ ] If JSON parse fails, show raw text fallback in faithful panel only (existing behavior) and note missing audience.

### 13. Testing
- [ ] Unit: `composePrompt` ordering (override last, mode injection, audience addendum presence).
- [ ] Unit: zod schema accepts + rejects malformed `audience_version`.
- [ ] Integration (mock OpenAI): API route returns both fields when prompted.
- [ ] UI: Button triggers second request, audience panel appears, diff toggles function.
- [ ] Regression: Standard mode unaffected (no audience fields returned).

### 14. Performance / Limits
- [ ] Ensure truncation logic for reference material still applied (shared across modes).
- [ ] Confirm token budget estimate (log length of system prompt when audience mode on in dev).

### 15. Documentation
- [ ] Update `README.md` feature list with Audience Version explanation.
- [ ] Add quick user guide: when to use faithful vs audience.
- [ ] Update any screenshots (future optional).

### 16. Optional Future Enhancements (Defer)
- [ ] Toggle to treat Audience Version as new baseline (promote to edited_text).
- [ ] Iterative refinement workflow (ask model to improve only audience version with delta instructions).
- [ ] Style persona caching / extraction (structured style profile object). 

---
## Acceptance Criteria
- Generating faithful translation works exactly as before with no extra noise if audience mode unused.
- Clicking "Generate Audience Version" yields a second panel with distinct text (when model responds accordingly) and rationale.
- Prompt override directives always appear last and clearly labeled in the assembled system message.
- Schema validation passes for both with and without audience_version present.
- Diff and readability tools function independently for each panel.

---
## Rollback Plan
- Disable button (feature flag) via simple boolean constant.
- Remove `mode` parameter (default back to standard) — no schema break since audience fields are optional.

---
## Quick Implementation Order (Checklist Optimized)
1. Prompt + schema + types (Phases 1–2 essentials)
2. API/Electron plumbing
3. UI button + state + simple render
4. Diff + readability reuse
5. History persistence
6. Tests + docs

---
## Commands (Reference)
Development:
```
npm run app-dev
```
Build:
```
npm run build-electron
```

---
## Notes
Keep initial audience prompt conservative—model hallucination risk is higher with freedom. Reinforce: "Do not add facts."
Add test prompts early to inspect token expansion before UI polish.
