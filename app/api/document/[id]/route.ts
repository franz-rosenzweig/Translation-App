import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/documentStore';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const doc = updateDocument(params.id, {
    directTranslation: body.directTranslation,
    adaptedText: body.adaptedText,
    title: body.title
  });
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ document: doc });
}
