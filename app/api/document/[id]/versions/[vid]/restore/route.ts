import { NextRequest, NextResponse } from 'next/server';
import { getVersion, createVersion } from '@/lib/documentStore';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function POST(_req: NextRequest, { params }: { params: { id: string; vid: string } }) {
  try {
    const { id, vid } = params;
    if(useDb) {
      const versions = await repo.getVersions(id);
      const base = versions.find(v=>v.id===vid);
      if(!base) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      const restored = await repo.createVersion(id, 'adapted', base.content, vid, { restoredFrom: vid });
      return NextResponse.json({ version: restored });
    } else {
      const base = getVersion(vid);
      if(!base) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      const restored = createVersion(id, 'adapted', base.content, vid, { restoredFrom: vid });
      return NextResponse.json({ version: restored });
    }
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
