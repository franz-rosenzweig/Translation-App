import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

// Import an existing translation as the new direct baseline.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(()=>({}));
    const { content } = body;
    if(!content || typeof content !== 'string') return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    if(useDb) {
      const doc = await repo.getDocument(id);
      if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const v = await repo.createVersion(id, 'direct', content, doc.directTranslationVersionId || undefined, { imported: true });
      return NextResponse.json({ version: v });
    } else {
      const doc = getDocument(id);
      if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const v = createVersion(id, 'direct', content, doc.currentDirectVersionId, { imported: true });
      // @ts-ignore
      doc.directTranslation = content;
      // @ts-ignore
      doc.currentDirectVersionId = v.id;
      return NextResponse.json({ version: v });
    }
  } catch(e:any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
