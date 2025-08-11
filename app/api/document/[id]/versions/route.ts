import { NextRequest, NextResponse } from 'next/server';
import { createVersion, getDocument, listVersions } from '@/lib/documentStore';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const doc = getDocument(id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ versions: listVersions(id) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { type, content, parentVersionId, meta } = body;
  if(!type || !content) return NextResponse.json({ error: 'Missing type or content'}, { status: 400 });
  try {
    const v = createVersion(id, type, content, parentVersionId, meta);
    return NextResponse.json({ version: v });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
