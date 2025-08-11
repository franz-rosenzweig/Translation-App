import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';

// Placeholder direct translation using existing process route eventually; now echo style.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Fake translation: prefix each line
  const direct = doc.sourceText.split('\n').map(l=>`[DIRECT] ${l}`).join('\n');
  const v = createVersion(doc.id, 'direct', direct);
  doc.directTranslation = direct;
  doc.currentDirectVersionId = v.id;
  return NextResponse.json({ version: v, directTranslation: direct });
}
