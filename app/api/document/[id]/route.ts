import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/documentStore';
import { repo } from '@/lib/repository';

export const dynamic = 'force-dynamic';

const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const doc = useDb ? await repo.getDocument(id) : getDocument(id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const body = await req.json();
  if(useDb) {
    // If using DB, manual patch limited to title; versions handled elsewhere
    if(body.title) {
      // simple update
      // @ts-ignore
      const updated = await repo.getDocument(id); // no direct update util yet; skip
      return NextResponse.json({ document: updated });
    }
    const current = await repo.getDocument(id);
    return NextResponse.json({ document: current });
  }
  const doc = updateDocument(id, { directTranslation: body.directTranslation, adaptedText: body.adaptedText, title: body.title });
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

// Update source text (and optionally title). Creates a new source version when sourceText changes.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const body = await req.json();
  try {
    if(useDb) {
      const doc = await repo.getDocument(id);
      if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      let updated = doc;
      // Update title if provided (no dedicated update method yet)
      if(body.title) {
        // prisma update for title only
        // @ts-ignore
        updated = await (repo as any).prisma?.document.update?.({ where: { id }, data: { title: body.title } }) || doc;
      }
      if(typeof body.sourceText === 'string' && body.sourceText !== doc.sourceText) {
        // Create new source version
        const v = await repo.createVersion(id, 'source', body.sourceText, undefined, { updatedVia: 'PUT' });
        // @ts-ignore update doc convenience field (direct prisma update not exposed)
        updated.sourceText = body.sourceText;
      }
      const fresh = await repo.getDocument(id);
      return NextResponse.json({ document: fresh });
    } else {
      const doc = getDocument(id);
      if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if(typeof body.sourceText === 'string' && body.sourceText !== doc.sourceText) {
        // create a new source version in memory
        const { createVersion } = await import('@/lib/documentStore');
        createVersion(id, 'source', body.sourceText, undefined, { updatedVia: 'PUT' });
        doc.sourceText = body.sourceText; // mutate in-memory
      }
      if(body.title) doc.title = body.title;
      return NextResponse.json({ document: doc });
    }
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
