import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const terms = await repo.listGlossary(params.id);
    return NextResponse.json({ terms });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { terms = [] } = body;
    if(!Array.isArray(terms) || terms.length > 1000) {
      return NextResponse.json({ error: 'Invalid terms' }, { status: 400 });
    }
    const cleaned = terms.map((t:any) => ({ hebrew: String(t.hebrew||'').trim(), chosenEnglish: String(t.chosenEnglish||'').trim(), note: t.note ? String(t.note) : undefined }))
      .filter(t => t.hebrew && t.chosenEnglish);
    const saved = await repo.upsertGlossary(params.id, cleaned);
    return NextResponse.json({ terms: saved });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
