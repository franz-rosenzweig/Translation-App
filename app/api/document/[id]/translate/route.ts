import { NextRequest, NextResponse } from 'next/server';
import { getDocument, createVersion } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

// Creates a direct translation version using either LLM pipeline (if OPENAI key) or fallback heuristic.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { sourceLanguage = 'hebrew', targetLanguage = 'english', knobs = {}, guidelines = '', referenceMaterial = '', promptOverride = '' } = body;
    const doc = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
    if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let direct: string = '';
    let meta: any = { sourceLanguage, targetLanguage, knobs };

    const canCallLLM = !!process.env.OPENAI_API_KEY;
    if(canCallLLM) {
      // Call internal /api/process to leverage existing prompt composition (server-internal fetch)
      const processRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hebrew: sourceLanguage === 'hebrew' ? doc.sourceText : '',
          roughEnglish: sourceLanguage !== 'hebrew' ? doc.sourceText : '',
          style: 'default',
          promptOverride,
          knobs,
          glossary: [],
          guidelines,
            referenceMaterial,
          sourceLanguage,
          targetLanguage,
          mode: 'standard'
        })
      });
      if(!processRes.ok) {
        console.warn('Process endpoint failed, falling back', await processRes.text());
      } else {
        const json = await processRes.json();
        direct = json.edited_text || json.editedText || '';
        meta.llmModel = process.env.OPENAI_MODEL;
      }
    }

    if(!direct) {
      // Fallback: simple tagged echo
  direct = doc.sourceText.split('\n').map((l: string)=>`[DIRECT] ${l}`).join('\n');
      meta.fallback = true;
    }

    const version = useDb
      ? await repo.createVersion(doc.id, 'direct', direct, undefined, meta)
      : createVersion(doc.id, 'direct', direct, undefined, meta);

    // For in-memory store, also patch doc convenience fields
    if(!useDb) {
      // @ts-ignore
      doc.directTranslation = direct; // convenience display
      // @ts-ignore
      doc.currentDirectVersionId = version.id;
    }

    return NextResponse.json({ version, directTranslation: direct });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
