import { NextRequest, NextResponse } from 'next/server';
import { diffVersions } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if(!from || !to) return NextResponse.json({ error: 'from & to required' }, { status: 400 });
  try {
    if(useDb) {
      const ops = await repo.diff(from, to);
      return NextResponse.json({ fromVersion: from, toVersion: to, ops });
    } else {
      const ops = diffVersions(from, to);
      return NextResponse.json({ fromVersion: from, toVersion: to, ops });
    }
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
