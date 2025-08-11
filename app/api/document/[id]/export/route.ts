import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';
import { Document as DocxDocument, Packer, Paragraph } from 'docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';

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
      let text = (version?.content || '').replace(/<[^>]+>/g,'');
      // Remove simple tracked change markers if any custom tags are used (defensive)
      text = text.replace(/\[REPHRASED:[^\]]+\]\s?/g,'').replace(/\[ADAPTED:[^\]]+\]\s?/g,'');
      // Optionally append glossary summary
      try {
        const terms = await repo.listGlossary(doc.id);
        if(terms.length) {
          text += '\n\n---\nGlossary Terms ('+terms.length+'):\n' + terms.map((t:any)=> `- ${t.hebrew} → ${t.chosenEnglish}${t.note? ' ('+t.note+')':''}`).join('\n');
        }
      } catch {}
  const paragraphs = text.split(/\n+/).map((line: string) => new Paragraph(line));
      const d = new DocxDocument({ sections: [{ properties: {}, children: paragraphs }] });
  const buffer = await Packer.toBuffer(d);
  const uint8 = new Uint8Array(buffer);
  return new NextResponse(uint8, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="document-${doc.id}.docx"` } });
    } else if(format === 'pdf') {
      const adaptedVersionId = doc.currentAdaptedVersionId || doc.directTranslationVersionId;
      if(!adaptedVersionId) return NextResponse.json({ error: 'No content to export' }, { status: 400 });
      const version = await repo.getVersion(adaptedVersionId);
      const rawHtml = version?.content || '';
      let text = rawHtml.replace(/<[^>]+>/g,'');
      text = text.replace(/\[REPHRASED:[^\]]+\]\s?/g,'').replace(/\[ADAPTED:[^\]]+\]\s?/g,'');
      try {
        const terms = await repo.listGlossary(doc.id);
        if(terms.length) {
          text += '\n\n---\nGlossary Terms ('+terms.length+'):\n' + terms.map((t:any)=> `- ${t.hebrew} → ${t.chosenEnglish}${t.note? ' ('+t.note+')':''}`).join('\n');
        }
      } catch {}
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 50;
      const maxWidth = width - margin * 2;
      const lines: string[] = [];
      const words = text.split(/\s+/);
      let current = '';
      for(const w of words) {
        const tentative = current ? current + ' ' + w : w;
        const tw = font.widthOfTextAtSize(tentative, fontSize);
        if(tw > maxWidth) {
          if(current) lines.push(current); else lines.push(tentative);
          current = w;
        } else {
          current = tentative;
        }
      }
      if(current) lines.push(current);
      let y = height - margin;
      for(const line of lines) {
        if(y < margin + fontSize) {
          y = height - margin;
          pdfDoc.addPage();
        }
        const lw = font.widthOfTextAtSize(line, fontSize);
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= fontSize * 1.4;
      }
      const bytes = await pdfDoc.save();
      return new NextResponse(new Uint8Array(bytes), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="document-${doc.id}.pdf"` } });
    }
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
