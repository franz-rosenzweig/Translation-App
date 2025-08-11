import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

// Rephrase current adapted (or direct if no adapted) with optional audience/style tweaks.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { audience = 'General', style = 'neutral', promptOverride = '', knobs = {}, sourceLanguage = 'hebrew', targetLanguage = 'english' } = body;
    const doc: any = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
    if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Determine base text (prefer adaptedText then directTranslation then source)
    let baseText = doc.adaptedText || doc.directTranslation || doc.sourceText;

    let rephrased = '';
    let meta: any = { audience, style, rephrase: true, base: baseText.slice(0,120), knobs };
    const canCallLLM = !!process.env.OPENAI_API_KEY;
    if(canCallLLM) {
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hebrew: sourceLanguage === 'hebrew' ? (sourceLanguage==='hebrew'? doc.sourceText: '') : '',
          roughEnglish: sourceLanguage !== 'hebrew' ? (sourceLanguage!=='hebrew'? doc.sourceText: '') : '',
          style,
          promptOverride: promptOverride + '\n\nRephrase directive: Improve readability and adapt for audience: ' + audience + '. Use base text as semantic content. Avoid hallucinations.',
          knobs,
          glossary: [],
          guidelines: '',
          referenceMaterial: baseText.slice(0,4000),
          sourceLanguage,
          targetLanguage,
          mode: 'audience-both'
        })
      });
      if(processRes.ok) {
        const json = await processRes.json();
        rephrased = json.audience_version?.text || json.edited_text || '';
        meta.llmModel = process.env.OPENAI_MODEL;
      }
    }
    if(!rephrased) {
      rephrased = baseText.split('\n').map((l:string)=>`[REPHRASED:${audience}] ${l}`).join('\n');
      meta.fallback = true;
    }

    const version = useDb
      ? await repo.createVersion(doc.id, 'adapted', rephrased, doc.currentAdaptedVersionId, meta)
      : createVersion(doc.id, 'adapted', rephrased, doc.currentAdaptedVersionId, meta);

    if(!useDb) {
      // @ts-ignore
      doc.adaptedText = rephrased;
      // @ts-ignore
      doc.currentAdaptedVersionId = version.id;
    }
    return NextResponse.json({ version, adaptedText: rephrased });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
