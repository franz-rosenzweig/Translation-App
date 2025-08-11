import { randomUUID } from 'crypto';

export type DocVersionType = 'source' | 'direct' | 'adapted';

export interface DocumentVersion {
  id: string;
  documentId: string;
  type: DocVersionType;
  content: string;
  createdAt: string;
  parentVersionId?: string;
  meta?: Record<string, any>;
}

export interface DocumentRecord {
  id: string;
  title: string;
  sourceLanguage: string; // ISO code
  targetLanguage: string; // ISO code
  sourceText: string;
  directTranslation?: string;
  adaptedText?: string;
  createdAt: string;
  updatedAt: string;
  versionIds: string[]; // ordered newest last
  currentAdaptedVersionId?: string;
  currentDirectVersionId?: string;
}

const docs: Record<string, DocumentRecord> = {};
const versions: Record<string, DocumentVersion> = {}; // key by version id

// --- Basic CRUD ---
export function listDocuments(): DocumentRecord[] {
  return Object.values(docs).sort((a,b)=> b.updatedAt.localeCompare(a.updatedAt));
}

export function createDocument(input: { title?: string; sourceLanguage: string; targetLanguage: string; sourceText: string; }): DocumentRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const sourceVersion: DocumentVersion = {
    id: randomUUID(),
    documentId: id,
    type: 'source',
    content: input.sourceText,
    createdAt: now
  };
  versions[sourceVersion.id] = sourceVersion;
  const rec: DocumentRecord = {
    id,
    title: input.title || 'Untitled',
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    sourceText: input.sourceText,
    createdAt: now,
    updatedAt: now,
    versionIds: [sourceVersion.id],
  };
  docs[id] = rec;
  return rec;
}

export function getDocument(id: string) {
  return docs[id];
}

export function updateDocument(id: string, patch: Partial<Pick<DocumentRecord,'directTranslation'|'adaptedText'|'title'>>) {
  const d = docs[id];
  if(!d) return undefined;
  Object.assign(d, patch);
  d.updatedAt = new Date().toISOString();
  return d;
}

// --- Versioning ---
export function createVersion(documentId: string, type: DocVersionType, content: string, parentVersionId?: string, meta?: Record<string, any>) {
  const doc = docs[documentId];
  if(!doc) throw new Error('Document not found');
  const v: DocumentVersion = {
    id: randomUUID(),
    documentId,
    type,
    content,
    parentVersionId,
    meta,
    createdAt: new Date().toISOString()
  };
  versions[v.id] = v;
  doc.versionIds.push(v.id);
  doc.updatedAt = v.createdAt;
  if(type === 'adapted') doc.currentAdaptedVersionId = v.id;
  if(type === 'direct') doc.currentDirectVersionId = v.id;
  return v;
}

export function listVersions(documentId: string): DocumentVersion[] {
  const doc = docs[documentId];
  if(!doc) return [];
  return doc.versionIds.map(id => versions[id]);
}

export function getVersion(versionId: string) {
  return versions[versionId];
}

// --- Sentence Splitting (very naive initial) ---
// Improved splitter: keeps punctuation, avoids splitting on common abbreviations, preserves original if degenerate.
const ABBREV = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e)\.$/i;
export function splitSentences(text: string): string[] {
  if(!text) return [];
  const raw = text.split(/(?<=[.!?])\s+/g);
  const merged: string[] = [];
  for(let i=0;i<raw.length;i++) {
    let seg = raw[i];
    if(!seg) continue;
    // If segment ends with abbreviation, merge with next
    if(ABBREV.test(seg.trim()) && i < raw.length-1) {
      raw[i+1] = seg + ' ' + raw[i+1];
      continue;
    }
    merged.push(seg.trim());
  }
  // Fallback: if splitter produced suspiciously few segments relative to punctuation density, return single chunk
  if(merged.length <= 1 && /[.!?]/.test(text)) return [text.trim()];
  return merged.filter(Boolean);
}

// --- Alignment (placeholder 1:1) ---
export interface AlignmentPair { sourceIndex: number; targetIndex: number; source: string; target: string; similarity: number; }
export function alignSourceDirect(source: string, direct: string): AlignmentPair[] {
  const sSent = splitSentences(source);
  const dSent = splitSentences(direct);
  const len = Math.max(sSent.length, dSent.length);
  const out: AlignmentPair[] = [];
  for(let i=0;i<len;i++) {
    const s = sSent[i];
    const t = dSent[i];
    if(s || t) out.push({ sourceIndex: i, targetIndex: i, source: s || '', target: t || '', similarity: s && t ? roughSimilarity(s,t) : 0 });
  }
  return out;
}

function roughSimilarity(a: string, b: string): number {
  if(!a || !b) return 0;
  const al = a.length; const bl = b.length;
  const min = Math.min(al, bl);
  let match = 0;
  for(let i=0;i<min;i++) if(a[i] === b[i]) match++;
  return (2*match)/(al+bl);
}

// --- Diff between versions (simple word diff) ---
import { diffWords } from './diff';
export function diffVersions(fromVersionId: string, toVersionId: string) {
  const a = versions[fromVersionId];
  const b = versions[toVersionId];
  if(!a || !b) throw new Error('Version not found');
  return diffWords(a.content, b.content);
}
