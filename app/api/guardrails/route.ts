import { NextRequest, NextResponse } from 'next/server';
import { checkGuardrails } from '@/lib/guardrails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const { text = '', maxInputLength, bannedTerms = [] } = body || {};
    const result = checkGuardrails(text, { maxInputLength, bannedTerms });
    return NextResponse.json({ result });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
