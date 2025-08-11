import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

export async function POST(req: NextRequest, { params }: { params: { cid: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { action } = body; // 'accept' | 'reject'
    if(action !== 'accept' && action !== 'reject') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    const status = action === 'accept' ? 'accepted' : 'rejected';
    await repo.updateTrackedChangeStatus(params.cid, status);
    return NextResponse.json({ id: params.cid, status });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
