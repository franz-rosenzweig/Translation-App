import { PrismaClient } from '@prisma/client';
import { diff_match_patch } from 'diff-match-patch';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const repo = {
  async createDocument(input: { title?: string; sourceLanguage: string; targetLanguage: string; sourceText: string; }) {
    return prisma.$transaction(async (tx: any) => {
      const doc = await tx.document.create({
        data: {
          title: input.title || '',
            sourceLanguage: input.sourceLanguage,
            targetLanguage: input.targetLanguage,
            sourceText: input.sourceText,
            versions: { create: { type: 'source', content: input.sourceText } }
        },
        include: { versions: true }
      });
      return doc;
    });
  },
  listDocuments() {
    return prisma.document.findMany({ orderBy: { updatedAt: 'desc' } });
  },
  getDocument(id: string) {
    return prisma.document.findUnique({ where: { id } });
  },
  getVersions(documentId: string) {
    return prisma.version.findMany({ where: { documentId }, orderBy: { createdAt: 'asc' } });
  },
  async createVersion(documentId: string, type: 'source'|'direct'|'adapted', content: string, parentVersionId?: string, meta?: any) {
    const v = await prisma.version.create({ data: { documentId, type, content, parentVersionId, meta } });
    const update: any = { updatedAt: new Date() };
    if (type === 'direct') update.directTranslationVersionId = v.id;
    if (type === 'adapted') update.currentAdaptedVersionId = v.id;
    await prisma.document.update({ where: { id: documentId }, data: update });
    return v;
  },
  async diff(fromVersionId: string, toVersionId: string) {
    const from = await prisma.version.findUnique({ where: { id: fromVersionId } });
    const to = await prisma.version.findUnique({ where: { id: toVersionId } });
    if(!from || !to) throw new Error('Version(s) not found');
    const hash = crypto.createHash('sha256').update(`${from.id}:${to.id}:${from.content.length}:${to.content.length}`).digest('hex');
    const existing = await prisma.diffCache.findUnique({ where: { hash } });
    if(existing) return existing.diffJson as any;
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(from.content, to.content);
    dmp.diff_cleanupSemantic(diffs);
    const ops = diffs.map(([op, text]) => ({ type: op === 0 ? 'equal' : op === -1 ? 'delete' : 'insert', text }));
    await prisma.diffCache.create({ data: { documentId: from.documentId, fromVersionId: from.id, toVersionId: to.id, diffJson: ops, hash } });
    return ops;
  },
  // Tracked changes
  listTrackedChanges(versionId: string) {
    return prisma.trackedChange.findMany({ where: { versionId }, orderBy: { createdAt: 'asc' } });
  },
  createTrackedChange(input: { versionId: string; changeType: string; start: number; end: number; before?: string; after?: string; }) {
    return prisma.trackedChange.create({ data: { ...input } });
  },
  updateTrackedChangeStatus(id: string, status: string) {
    return prisma.trackedChange.update({ where: { id }, data: { status } });
  },
  getTrackedChange(id: string) {
    return prisma.trackedChange.findUnique({ where: { id } });
  },
  // Glossary
  upsertGlossary(documentId: string, terms: Array<{ hebrew: string; chosenEnglish: string; note?: string }>) {
    return prisma.$transaction(async (tx: any) => {
      await tx.glossaryTerm.deleteMany({ where: { documentId } });
      if(terms.length) {
        await tx.glossaryTerm.createMany({ data: terms.map(t => ({ documentId, hebrew: t.hebrew, chosenEnglish: t.chosenEnglish, note: t.note })) });
      }
      return tx.glossaryTerm.findMany({ where: { documentId } });
    });
  },
  listGlossary(documentId: string) {
    return prisma.glossaryTerm.findMany({ where: { documentId }, orderBy: { hebrew: 'asc' } });
  },
  getVersion(id: string) {
    return prisma.version.findUnique({ where: { id } });
  }
};
