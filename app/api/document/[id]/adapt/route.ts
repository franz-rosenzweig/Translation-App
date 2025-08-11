import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';

// Placeholder adaptation endpoint - later integrate LLM adaptation using existing composePrompt pipeline.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}));
  const { audience = 'General', style = 'neutral' } = body;
  const doc = getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const base = doc.directTranslation || doc.sourceText;
  const adapted = base.replace(/\[DIRECT\]\s?/g,'').split('\n').map(l=>`[ADAPTED:${audience}] ${l}`).join('\n');
  const v = createVersion(doc.id, 'adapted', adapted, doc.currentAdaptedVersionId, { audience, style });
  doc.adaptedText = adapted;
  doc.currentAdaptedVersionId = v.id;
  return NextResponse.json({ version: v, adaptedText: adapted });
}
