import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { text } = body; // adapted text to check
    if(!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    const terms = await repo.listGlossary(params.id);
    const warnings: any[] = [];
    for(const term of terms) {
      const expected = term.chosenEnglish;
      const regex = new RegExp(`\\b${expected.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'i');
      if(!regex.test(text)) {
        warnings.push({ type: 'missing', hebrew: term.hebrew, expected });
      }
    }
    return NextResponse.json({ warnings, count: warnings.length });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
