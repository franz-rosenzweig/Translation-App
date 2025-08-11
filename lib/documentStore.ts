import { randomUUID } from 'crypto';

export type DocVersionType = 'source' | 'direct' | 'adapted';

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
}

const docs: Record<string, DocumentRecord> = {};

export function listDocuments(): DocumentRecord[] {
  return Object.values(docs).sort((a,b)=> b.updatedAt.localeCompare(a.updatedAt));
}

export function createDocument(input: { title?: string; sourceLanguage: string; targetLanguage: string; sourceText: string; }): DocumentRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const rec: DocumentRecord = {
    id,
    title: input.title || 'Untitled',
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    sourceText: input.sourceText,
    createdAt: now,
    updatedAt: now
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
