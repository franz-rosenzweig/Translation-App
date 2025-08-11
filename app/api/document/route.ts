import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, createDocument } from '@/lib/documentStore';
import { repo } from '@/lib/repository';

export const dynamic = 'force-dynamic';

const useDb = process.env.FEATURE_DB === '1';

export async function GET() {
  if(useDb) {
    const docs = await repo.listDocuments();
    return NextResponse.json({ documents: docs });
  }
  return NextResponse.json({ documents: listDocuments() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, sourceLanguage, targetLanguage, sourceText } = body;
  if(!sourceText || !sourceLanguage || !targetLanguage) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if(useDb) {
    const doc = await repo.createDocument({ title, sourceLanguage, targetLanguage, sourceText });
    return NextResponse.json({ document: doc });
  } else {
    const doc = createDocument({ title, sourceLanguage, targetLanguage, sourceText });
    return NextResponse.json({ document: doc });
  }
}
