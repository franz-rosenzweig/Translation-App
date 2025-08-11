import { NextRequest, NextResponse } from 'next/server';
import { getDocument, alignSourceDirect } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc: any = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let directText = doc.directTranslation;
  if(useDb && !directText && doc.directTranslationVersionId) {
    // fetch version content
    const versions = await repo.getVersions(doc.id);
    const directV = versions.find(v=>v.id===doc.directTranslationVersionId);
    directText = directV?.content;
  }
  if(!directText) return NextResponse.json({ alignment: [] });
  const rawPairs = alignSourceDirect(doc.sourceText, directText);
  const pairs = rawPairs.map(p => ({
    ...p,
    tier: p.similarity >= 0.85 ? 'good' : p.similarity >= 0.6 ? 'fuzzy' : 'poor'
  }));
  return NextResponse.json({ alignment: pairs });
}
