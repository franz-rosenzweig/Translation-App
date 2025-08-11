import { NextRequest, NextResponse } from 'next/server';
import { createVersion, getDocument, listVersions } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const doc = useDb ? await repo.getDocument(id) : getDocument(id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if(useDb) {
    const vs = await repo.getVersions(id);
    return NextResponse.json({ versions: vs });
  }
  return NextResponse.json({ versions: listVersions(id) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { type, content, parentVersionId, meta } = body;
  if(!type || !content) return NextResponse.json({ error: 'Missing type or content'}, { status: 400 });
  try {
    if(useDb) {
      const v = await repo.createVersion(id, type, content, parentVersionId, meta);
      return NextResponse.json({ version: v });
    } else {
      const v = createVersion(id, type, content, parentVersionId, meta);
      return NextResponse.json({ version: v });
    }
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
