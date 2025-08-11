import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

export async function GET(_req: Request, { params }: { params: { id: string; vid: string } }) {
  try {
    const version = await repo.getVersion(params.vid);
    if(!version || version.documentId !== params.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const changes = await repo.listTrackedChanges(version.id);
    return NextResponse.json({ versionId: version.id, changes });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
