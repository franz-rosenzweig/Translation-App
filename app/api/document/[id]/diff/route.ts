import { NextRequest, NextResponse } from 'next/server';
import { diffVersions } from '@/lib/documentStore';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if(!from || !to) return NextResponse.json({ error: 'from & to required' }, { status: 400 });
  try {
    const ops = diffVersions(from, to);
    return NextResponse.json({ fromVersion: from, toVersion: to, ops });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
