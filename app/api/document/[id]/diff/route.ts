import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/repository';
import { diffVersions } from '@/lib/documentStore';

const useDb = process.env.FEATURE_DB === '1';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    if(!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 });
    if(useDb) {
      const ops = await repo.diff(from, to);
      return NextResponse.json({ from, to, ops });
    } else {
      const ops = diffVersions(from, to);
      return NextResponse.json({ from, to, ops });
    }
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
// (Duplicate block removed)
