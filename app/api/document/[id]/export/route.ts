import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';
import { Document as DocxDocument, Packer, Paragraph } from 'docx';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'docx';
  try {
    const doc = await repo.getDocument(params.id);
    if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if(format === 'docx') {
      const adaptedVersionId = doc.currentAdaptedVersionId || doc.directTranslationVersionId;
      if(!adaptedVersionId) return NextResponse.json({ error: 'No content to export' }, { status: 400 });
      const version = await repo.getVersion(adaptedVersionId);
      const text = (version?.content || '').replace(/<[^>]+>/g,'');
  const paragraphs = text.split(/\n+/).map((line: string) => new Paragraph(line));
      const d = new DocxDocument({ sections: [{ properties: {}, children: paragraphs }] });
  const buffer = await Packer.toBuffer(d);
  const uint8 = new Uint8Array(buffer);
  return new NextResponse(uint8, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="document-${doc.id}.docx"` } });
    }
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
