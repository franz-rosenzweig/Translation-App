import { PrismaClient, VersionType } from '@prisma/client';
import { diff_match_patch } from 'diff-match-patch';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const repo = {
  async createDocument(input: { title?: string; sourceLanguage: string; targetLanguage: string; sourceText: string; }) {
    return prisma.$transaction(async tx => {
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
  async createVersion(documentId: string, type: VersionType, content: string, parentVersionId?: string, meta?: any) {
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
  }
};
