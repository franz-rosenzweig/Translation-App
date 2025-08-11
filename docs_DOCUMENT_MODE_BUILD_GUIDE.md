# Document-Centric Translation Workspace Build Guide

This guide explains how to evolve the existing Translation App into a Google‑Docs–style, document‑centric environment with:
- Rich in-app editing
- Multiple translation states (Source, Direct Translation, Audience-Friendly Adaptation)
- Inline / side-by-side diffs
- (Optional) Real-time collaboration
- Version history, glossary enforcement, and advanced QA

---

## 1. Objectives

### Core Goals
1. Turn each translation session into a persistent “Document”.
2. Maintain three principal states per document:
   - Source (immutable reference)
   - Direct Translation (system generated)
   - Adapted / Audience-Friendly Translation (user-editable)
3. Provide diff visualizations:
   - Direct vs Adapted (intra-language diff)
   - Source vs Direct (cross-language sentence alignment + semantic change cues)
4. Enable iterative refinement (regenerate, rephrase, apply style presets).
5. Support revision history + optional tracked changes (accept / reject).
6. (Later) Add real-time multi-user editing.
7. Export (DOCX, PDF) and commentary/annotations.

### Non-Goals (Initial Phases)
- Full offline support
- Complex role-based workflow approvals
- Machine Translation provider abstraction layer with pluggable pricing/billing

---

## 2. High-Level Architecture

```
+-------------------+          +-----------------------+
|   Web Frontend    | <------> |     Backend API       |
|  (React + TipTap) |  HTTPS   | (Node/Express or Fast)| 
+---------+---------+          +----------+------------+
          |                               |
          | WebSocket (Yjs optional)      | DB (Postgres) + Object Storage
          v                               v
    Realtime Provider                Persistence Layer
  (y-websocket / Liveblocks)   (Documents, Versions, Alignments, Glossary,
                               Diff Cache, Yjs snapshots)
```

### Logical Components
- Translation Service Adapter (DeepL / Google / Custom LLM)
- Adaptation Service (LLM prompt pipeline)
- Diff Engine (textual + sentence alignment)
- Glossary & QA Module
- Versioning & Revision Store
- Realtime Collaboration Layer (Phase 3+)
- Export Service (DOCX/PDF generation)

---

## 3. Technology Choices

| Concern | Recommended |
|---------|-------------|
| Frontend | React + TipTap (ProseMirror) |
| Diff (same language) | diff-match-patch OR `diff` npm package |
| Sentence Alignment | Simple heuristic + multilingual embeddings (LaBSE / sentence-transformers) |
| Realtime (optional) | Yjs + y-websocket (self-host) |
| Backend | Node.js (Express / Fastify) |
| Database | Postgres (with JSONB for metadata) |
| Auth | Existing auth or GitHub OAuth / JWT |
| Queue (optional) | Redis / BullMQ (for long LLM jobs) |
| Embeddings | sentence-transformers service (Python microservice) or hosted API |
| Export | docx (npm), pdf-lib, or server-side LibreOffice container |

---

## 4. User Roles & Personas

- Translator / Editor: Edits adapted translation, triggers rephrases.
- Reviewer (Phase 4+): Accepts tracked changes, comments.
- Viewer: Read-only access.
- System (Automation): Generates direct + adaptation versions.

---

## 5. User Stories (Core)

1. As a user, I create a new translation document from source text.
2. I view Source, Direct Translation, and Adapted version side-by-side.
3. I toggle inline diffs between Direct and Adapted.
4. I request a rephrase for a specific audience (e.g., “Child-friendly”).
5. I see sentence-level alignment differences Source vs Direct.
6. I accept or revert tracked changes (Phase 3+).
7. I view revision history and restore an earlier adaptation.
8. I collaborate in real-time with another editor (Phase 3+).
9. I export the final adapted translation to DOCX or PDF.
10. I enforce a glossary and receive warnings for term deviations.

---

## 6. Data Model (Initial)

### Tables (Simplified)

#### documents
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | Editable |
| source_language | text | ISO code |
| target_language | text | ISO code |
| source_text | text | Immutable baseline |
| direct_translation_version_id | uuid | FK reference to versions table |
| current_adapted_version_id | uuid | FK to versions |
| glossary_id | uuid | (Optional, Phase 4) |
| created_by | uuid | FK users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### versions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| document_id | uuid | FK |
| type | enum('source','direct','adapted') | |
| content | text | Full snapshot |
| author_id | uuid | Null if system |
| parent_version_id | uuid | For adaptation lineage |
| created_at | timestamptz | |
| meta | jsonb | { "audience": "...", "style": "...", "model": "gpt-4o" } |

#### diffs_cache
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| document_id | uuid | |
| from_version_id | uuid | |
| to_version_id | uuid | |
| diff_json | jsonb | Serialized ops |
| created_at | timestamptz | |
| hash | text | Hash of (from,to,content) |

#### sentence_alignments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| document_id | uuid | |
| source_sentence_index | int | |
| target_sentence_index | int | -1 if unmatched |
| similarity | float | 0..1 |
| alignment_version_id | uuid | Which direct translation version |
| created_at | timestamptz | |

#### glossary_terms (Phase 4)
| term | text |
| preferred_translation | text |
| case_sensitive | boolean |
| notes | text |

#### tracked_changes (Phase 3+)
| id | uuid |
| version_id | uuid | Adapted working version |
| change_type | enum('insert','delete') |
| position | int | Character or token index |
| length | int |
| text | text |
| author_id | uuid |
| created_at | timestamptz |
| status | enum('pending','accepted','rejected') |

(Realtime Yjs snapshots stored either in versions.meta or separate table `crdt_snapshots`.)

---

## 7. API Design (Draft)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /documents | Create document (includes source text) |
| GET | /documents/:id | Metadata & current versions summary |
| GET | /documents/:id/source | Raw source |
| POST | /documents/:id/translate | Generate direct translation (if absent or re-run) |
| GET | /documents/:id/direct | Latest direct translation |
| POST | /documents/:id/adapt | Generate new adapted version (audience params) |
| PATCH | /documents/:id/adapted | Update (manual edits) or commit new version |
| GET | /documents/:id/adapted | Current adapted version |
| GET | /documents/:id/versions | List all versions |
| GET | /documents/:id/versions/:vid | Retrieve specific version |
| GET | /documents/:id/diff?from=X&to=Y | Diff JSON |
| GET | /documents/:id/alignment | Sentence alignment results |
| POST | /documents/:id/rephrase | Rephrase current adapted |
| POST | /documents/:id/glossary/check | Glossary validation run |
| GET | /documents/:id/export?format=docx | Export final |
| WS | /realtime/documents/:id | Yjs sync channel |

### Diff Response (Example)
```json
{
  "fromVersion": "uuid-A",
  "toVersion": "uuid-B",
  "ops": [
    { "type": "equal", "text": "The quick " },
    { "type": "delete", "text": "brown " },
    { "type": "insert", "text": "dark " },
    { "type": "equal", "text": "fox." }
  ]
}
```

---

## 8. Frontend Implementation

### Document Workspace Layout
Left Panel:
- Source text (read-only, sentence segmented)
Middle Editor:
- Adapted translation (TipTap editor)
Right Panel (toggleable):
- Direct translation (sentence segmented)
- Diff / alignment insights
- Glossary warnings

### States & Mode Toggles
Modes:
1. Edit (no diff)
2. Show Diff: Direct vs Adapted
3. Show Alignment: Source vs Direct
4. Track Changes (Phase 3)

Use React context or Zustand for local UI state (current diff mode, selected sentence, etc.).

---

## 9. Editor (TipTap) Extensions

Custom Extensions:
- DiffDecorationExtension: applies inline marks for insert/delete based on diff ops.
- TrackChangesExtension (Phase 3): intercepts key presses to wrap insertions; on deletion, capture removed segment.
- GlossaryHighlightExtension: scans doc, decorates matched terms or deviations.

Pseudo-init:
```ts
const editor = new Editor({
  content: adaptedContent,
  extensions: [
    StarterKit,
    DiffDecorationExtension.configure({ diffProvider }),
    GlossaryHighlightExtension.configure({ glossaryTerms }),
    // TrackChangesExtension.configure({ enabled: trackChangesEnabled })
  ]
});
```

---

## 10. Diff Strategies

### Direct vs Adapted
- Use `diff-match-patch`:
  1. Compute diff on raw strings.
  2. Semantic cleanup.
  3. Map to inline decorations (class names: diff-insert, diff-delete).
- Recompute:
  - Debounce (e.g., 600ms after last keystroke).
  - Cache result in memory; persist periodically.

### Source vs Direct (Cross-Language)
1. Sentence split both texts.
2. Embed sentences (multilingual model).
3. Greedy or Hungarian matching by cosine similarity.
4. Mark:
   - 0.85+ similarity: Aligned
   - 0.60–0.85: Fuzzy (yellow)
   - <0.60 or unmatched: Divergent (red)
5. Expose side-by-side mapping.

---

## 11. Sentence Splitting

Simple heuristic (early):
- Split on `.?!` followed by space + capital letter.
- Fallback for abbreviations (list of known patterns).
Later: Use spaCy / NLTK / lingua-specific segmenters (server-side to ensure consistency).

Persist segmented arrays for consistent index mapping.

---

## 12. Adaptation (LLM Prompt Template)

Prompt skeleton:
```
You are a professional translator.
Task: Rewrite the Direct Translation into an audience-friendly style.
Audience: {audiencePersona}
Constraints: Preserve factual accuracy, keep domain terminology unchanged unless glossary indicates alternative, flag uncertain idioms.
Output ONLY revised text.
```

Include glossary terms in system / context prompt:
`Glossary JSON: [{term: "...", preferred: "..."}]`

---

## 13. Versioning & Revisions

Trigger a new adapted version on:
- User clicks “Save Version”
- Significant idle time threshold (e.g., 30s no edits + modified flag)
- After automated rephrase

Show revision timeline with:
- Timestamp
- Author
- Audience parameters
- Diff preview (first N changed tokens)

---

## 14. Track Changes (Phase 3+)

If using CRDT (Yjs):
- Option A: Layer track change metadata as marks with attributes {change_id, type, author}.
- Option B: Maintain separate change log referencing absolute positions; require mapping on doc updates (harder with CRDT merges).

Acceptance:
- Accept insertion: remove mark
- Reject insertion: delete content range
- Accept deletion: permanently remove (already removed)
- Reject deletion: re-insert original text at remembered position

UI: Side panel listing pending changes grouped by sentence.

---

## 15. Real-Time Collaboration (Optional Phase 3)

Yjs Setup:
- Each document maps to a Y.Doc with a Y.Text field `adapted`.
- On initial load: fetch latest adapted version -> apply as initial content.
- On disconnect: server persists snapshot.
- Additional shared states: selection awareness, presence (username, color).

Conflict with Track Changes:
- Delay implementing Track Changes until basic Yjs sync is stable OR gate behind a feature flag.
- For each operation, attach user id in awareness; track changes extension attributes mark insert/delete with that user.

---

## 16. Glossary & QA (Phase 4)

Pipeline on Save / Manual Run:
1. Extract all tokens / n-grams.
2. Match against glossary.
3. For each term:
   - Found but mismatched translation -> warn.
   - Missing required term -> suggestion.
4. Named Entity Check (optional):
   - Use NER on source + adapted; compare sets; highlight dropped entities.

Store QA results in `versions.meta.qa = { warnings: [...], score: ... }`.

---

## 17. Export

DOCX:
- Use `docx` npm to build paragraphs.
- Include optional appendix: glossary warnings summary.

PDF:
- Convert HTML (adapted with accepted changes only) via `puppeteer` or `pdf-lib`.

---

## 18. Security & Privacy

- Redact PII before sending to external LLM (optional).
- Store hashed API keys; restrict translation invocation to backend.
- Rate limit adaptation/regeneration endpoints per user.
- Audit log table (action, user_id, doc_id, payload hash).

---

## 19. Performance & Caching

| Concern | Approach |
|---------|----------|
| Repeated diffs | Cache (fromVersion,toVersion) in diffs_cache |
| Long docs | Virtualized rendering (ProseMirror handles reasonably; consider lazy decoration) |
| Embedding latency | Pre-batch sentence embeddings; store vectors (vector extension or separate table) |
| LLM cost | Cache adaptation outputs keyed by (directVersionId, audience params) |

---

## 20. Testing Strategy

### Unit
- Diff engine correctness
- Sentence segmentation edge cases
- Glossary matcher

### Integration
- End-to-end translation + adaptation flow
- Version restoration fidelity

### UI / E2E
- Cypress / Playwright:
  - “Toggle diff mode” correctness
  - “Accept tracked change” scenario

### Load
- Simulate editing on large (50k char) document

### Regression
- Snapshot tests for API responses (versions, diffs)

---

## 21. Deployment Steps (Example)

1. Migrations: `documents`, `versions`, `diffs_cache`, etc.
2. Deploy embedding microservice (if used).
3. Deploy backend (Render/Fly/Heroku).
4. Configure environment:
   - TRANSLATION_API_KEY
   - LLM_API_KEY
   - EMBEDDINGS_ENDPOINT
5. Deploy frontend (Vercel/Netlify).
6. (Phase 3) Deploy y-websocket server (Node) behind HTTPS.
7. Set up monitoring (Healthchecks, logs, error tracker like Sentry).
8. Backup strategy for DB + snapshots.

---

## 22. Incremental Build Plan (Phases)

| Phase | Scope | Deliverables |
|-------|-------|--------------|
| 1 | Document model + basic editor | Create/translate/adapt view; simple diff direct vs adapted |
| 2 | Sentence alignment + rephrase | Alignment panel; audience rephrase endpoint |
| 3 | Collaboration & track changes (optional) | Yjs realtime + tracked changes or defer track changes |
| 4 | Glossary & QA + Export | Glossary enforcement, warnings, DOCX export |
| 5 | Advanced analytics | Readability metrics, change density, glossary compliance score |

---

## 23. Sample Directory Structure

```
/backend
  /src
    /api
      documents.controller.ts
      versions.controller.ts
      diffs.controller.ts
    /services
      translation.service.ts
      adaptation.service.ts
      diff.service.ts
      alignment.service.ts
      glossary.service.ts
    /db
      migrations/
      models/
    /utils/
    server.ts
/frontend
  /src
    /components
      DocumentWorkspace/
        Editor.tsx
        DiffToggle.tsx
        AlignmentPanel.tsx
        GlossaryWarnings.tsx
    /hooks
    /api
    /state
    App.tsx
  index.html
/realtime
  y-websocket-server.js
/docs
  DOCUMENT_MODE_BUILD_GUIDE.md
```

---

## 24. Example Backend Snippets

### Diff Service (Simplified)
```ts
import { diff_match_patch } from 'diff-match-patch';

export function computeDiff(a: string, b: string) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(a, b);
  dmp.diff_cleanupSemantic(diffs);
  return diffs.map(([op, text]) => ({
    type: op === 0 ? 'equal' : op === -1 ? 'delete' : 'insert',
    text
  }));
}
```

### Sentence Alignment (Pseudo)
```ts
async function alignSentences(source: string[], target: string[]) {
  const vectorsSrc = await embedBatch(source);
  const vectorsTgt = await embedBatch(target);
  // Compute similarity matrix
  // Greedy matching
  // Return pairs with similarity
}
```

---

## 25. Example TipTap Diff Decoration (Conceptual)

```ts
// After computing diff ops:
const decorations = [];
let pos = 0;
diffOps.forEach(op => {
  if (op.type === 'equal') {
    pos += op.text.length;
  } else if (op.type === 'insert') {
    decorations.push(Decoration.inline(
      pos,
      pos + op.text.length,
      { class: 'diff-insert' }
    ));
    pos += op.text.length;
  } else if (op.type === 'delete') {
    // Render a zero-width anchor or separate layer with strikethrough ghost text
    decorations.push(Decoration.widget(
      pos,
      () => {
        const span = document.createElement('span');
        span.className = 'diff-delete';
        span.textContent = op.text;
        return span;
      }
    ));
  }
});
```

---

## 26. Styling (Example CSS Tokens)

```css
.diff-insert { background: #d2f8d2; text-decoration: none; }
.diff-delete { background: #ffd6d6; text-decoration: line-through; opacity: 0.8; }
.alignment-good { background: #eef; }
.alignment-fuzzy { background: #fff6cc; }
.alignment-bad { background: #ffe2e2; }
```

---

## 27. Monitoring & Metrics

- Track: average adaptation latency, diff computation time, embedding alignment duration.
- Logging: Each adaptation request (doc_id, model, tokens).
- Error Alerts: Embedding failures, translation API quota errors.
- Frontend Performance: Web Vitals, initial load time.

---

## 28. Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Large doc diff slowdown | Debounce + worker thread for diff |
| Alignment inaccuracies | Provide manual re-align (drag sentences) later |
| LLM cost spike | Cache, batch, limit daily rephrases |
| Track changes complexity with Yjs | Feature flag; ship diff-only first |
| Glossary false positives | Term boundary regex; case sensitivity toggle |

---

## 29. Future Enhancements

- Inline comments / annotations.
- Per-sentence quality scoring.
- Entity consistency checker (numbers, dates).
- MT provider A/B comparison.
- Custom style training (few-shot prompt memory).
- Offline editing with sync queue.

---

## 30. Quick Start Checklist

Phase 1
[x] DB migrations (documents, versions)
[x] Basic create document API
[x] Translation integration (direct)
[x] Adaptation endpoint (LLM)
[x] Diff endpoint (direct vs adapted)
[x] React workspace with TipTap + diff toggle

Phase 2
[x] Sentence segmentation & alignment (heuristic splitter + alignment route)
[x] Embedding microservice client & fallback (REMOTE via EMBEDDINGS_ENDPOINT, local pseudo-vector fallback)
[x] Alignment UI panel
[x] Rephrase with audience form
[x] Revision history view

Phase 3
[ ] Yjs realtime server
[ ] Integrate Yjs into editor
[x] (Optional) Track changes extension (implemented with persistence & inline decorations)

Phase 4
[x] Glossary CRUD (list + replace endpoints)
[x] Glossary enforcement + warnings panel (backend check + UI panel)
[x] Export DOCX/PDF (DOCX + PDF implemented)

Phase 5
[ ] Analytics dashboard
[ ] Advanced QA (NER, entity consistency)

Progress Notes:
 - Completed Phases 1 & 2 (embedding client now implemented with remote + fallback). 
 - Phase 3 track changes delivered (without realtime Yjs). 
 - Phase 4 completed (glossary warnings panel + PDF export added).

---

## 31. Summary

Following this guide provides a structured path to transform your translation app into a sophisticated, document-centric platform supporting iterative, audience-aware translation workflows, collaborative editing, and robust quality assurance.

Feel free to adapt naming conventions or stack details to match your existing codebase.

---

## 32. Contact / Next Steps

If you need:
- Concrete migration SQL
- More detailed TipTap extension code
- Example embedding microservice

…add a follow-up request and we’ll extend this guide.

Good luck building!