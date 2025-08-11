import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, createDocument } from '@/lib/documentStore';

export async function GET() {
  return NextResponse.json({ documents: listDocuments() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, sourceLanguage, targetLanguage, sourceText } = body;
  if(!sourceText || !sourceLanguage || !targetLanguage) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const doc = createDocument({ title, sourceLanguage, targetLanguage, sourceText });
  return NextResponse.json({ document: doc });
}
