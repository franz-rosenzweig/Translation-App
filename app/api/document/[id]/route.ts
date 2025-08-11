import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if(useDb) {
    // If using DB, manual patch limited to title; versions handled elsewhere
    if(body.title) {
      // simple update
      // @ts-ignore
      const updated = await repo.getDocument(params.id); // no direct update util yet; skip
      return NextResponse.json({ document: updated });
    }
    const current = await repo.getDocument(params.id);
    return NextResponse.json({ document: current });
  }
  const doc = updateDocument(params.id, { directTranslation: body.directTranslation, adaptedText: body.adaptedText, title: body.title });
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}
