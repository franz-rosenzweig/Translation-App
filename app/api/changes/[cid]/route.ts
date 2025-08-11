import { NextRequest, NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

// Accept or reject a tracked change. If accepting an insertion or rejecting a deletion, no further content change needed.
// If accepting a deletion (content already removed) nothing extra. If rejecting an insertion, content must be removed.
// If rejecting a deletion, we must reinsert the original text. After mutation, create a new adapted version snapshot.
export async function POST(req: NextRequest, { params }: { params: { cid: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { action } = body; // 'accept' | 'reject'
    if(action !== 'accept' && action !== 'reject') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    const change = await repo.getTrackedChange(params.cid);
    if(!change) return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    const version = await repo.getVersion(change.versionId);
    if(!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    if(version.type !== 'adapted') return NextResponse.json({ error: 'Only adapted versions mutable via tracked changes' }, { status: 400 });

    // If change already finalized, short-circuit
    if(change.status === 'accepted' || change.status === 'rejected') {
      return NextResponse.json({ id: change.id, status: change.status, skipped: true });
    }

    let content = version.content;
    const start = change.start;
    const end = change.end;

    // For safety bounds
    const clamp = (n: number) => Math.max(0, Math.min(n, content.length));
    const s = clamp(start);
    const e = clamp(end);

    if(change.changeType === 'insert') {
      if(action === 'reject') {
        // Remove inserted segment (after text stored in `after`)
        const inserted = change.after || '';
        // Assume inserted text occupies [s, s+inserted.length)
        const seg = content.slice(s, s + inserted.length);
        if(seg === inserted) {
          content = content.slice(0, s) + content.slice(s + inserted.length);
        } else {
          // Fallback: naive removal by first occurrence after s
          const idx = content.indexOf(inserted, s);
            if(idx !== -1) content = content.slice(0, idx) + content.slice(idx + inserted.length);
        }
      }
      // accept insertion: keep content as-is
    } else if(change.changeType === 'delete') {
      if(action === 'reject') {
        // Reinsert original text at start position
        const original = change.before || '';
        content = content.slice(0, s) + original + content.slice(s);
      }
      // accept deletion: content already lacks the text
    }

    // Persist change status
    const status = action === 'accept' ? 'accepted' : 'rejected';
    await repo.updateTrackedChangeStatus(change.id, status);

    // Create a new adapted version snapshot with updated content if content changed or for audit trail
    if(content !== version.content) {
      await repo.createVersion(version.documentId, 'adapted', content, version.id, { changeApplied: change.id, action });
    }

    return NextResponse.json({ id: change.id, status, newVersion: content !== version.content });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
