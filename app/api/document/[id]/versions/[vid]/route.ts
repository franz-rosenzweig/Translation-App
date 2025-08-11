import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';
import { getDocument, getVersion as memGetVersion } from '@/lib/documentStore';

const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: Request, { params }: { params: { id: string; vid: string } }) {
  try {
    if(useDb) {
      const v = await repo.getVersion(params.vid);
      if(!v || v.documentId !== params.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ version: v });
    } else {
      const doc = getDocument(params.id);
      if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const v = memGetVersion(params.vid);
      if(!v) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ version: v });
    }
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
