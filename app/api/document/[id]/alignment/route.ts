import { NextRequest, NextResponse } from 'next/server';
import { getDocument, alignSourceDirect } from '@/lib/documentStore';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if(!doc.directTranslation) return NextResponse.json({ alignment: [] });
  const pairs = alignSourceDirect(doc.sourceText, doc.directTranslation);
  return NextResponse.json({ alignment: pairs });
}
