import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

// Creates an adapted version from the latest direct translation (or source) using audience mode if LLM available
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { audience = 'General', style = 'neutral', knobs = {}, guidelines = '', referenceMaterial = '', promptOverride = '', sourceLanguage = 'hebrew', targetLanguage = 'english' } = body;
    const doc: any = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
    if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const base = doc.directTranslation || doc.sourceText;
    let adapted = '';
    let meta: any = { audience, style, knobs, baseVersionId: doc.currentDirectVersionId };
    const canCallLLM = !!process.env.OPENAI_API_KEY;
    if(canCallLLM) {
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hebrew: sourceLanguage === 'hebrew' ? (sourceLanguage === 'hebrew' ? doc.sourceText : '') : '',
          roughEnglish: sourceLanguage !== 'hebrew' ? (sourceLanguage !== 'hebrew' ? doc.sourceText : '') : '',
          style,
          promptOverride,
          knobs,
          glossary: [],
          guidelines,
          referenceMaterial,
          sourceLanguage,
          targetLanguage,
          mode: 'audience-both'
        })
      });
      if(processRes.ok) {
        const json = await processRes.json();
        adapted = json.audience_version?.text || json.edited_text || '';
        meta.llmModel = process.env.OPENAI_MODEL;
      } else {
        console.warn('Adapt process failed, using fallback', await processRes.text());
      }
    }

    if(!adapted) {
      adapted = base.replace(/\[DIRECT\]\s?/g,'').split('\n').map((l: string)=>`[ADAPTED:${audience}] ${l}`).join('\n');
      meta.fallback = true;
    }

    const version = useDb
      ? await repo.createVersion(doc.id, 'adapted', adapted, doc.currentAdaptedVersionId, meta)
      : createVersion(doc.id, 'adapted', adapted, doc.currentAdaptedVersionId, meta);

    if(!useDb) {
      // @ts-ignore
      doc.adaptedText = adapted;
      // @ts-ignore
      doc.currentAdaptedVersionId = version.id;
    }
    return NextResponse.json({ version, adaptedText: adapted });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
