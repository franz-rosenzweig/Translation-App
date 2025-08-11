import { Extension } from '@tiptap/core';

// Very lightweight decoration placeholder: we rely on precomputed change spans passed in options.
export interface ChangeSpan { id: string; type: 'insert'|'delete'; start: number; end: number; before?: string; after?: string; status?: 'pending'|'accepted'|'rejected'; }

export const TrackChangesExtension = Extension.create<{ getChanges: () => ChangeSpan[] }>({
  name: 'trackChangesLayer',
  addOptions() { return { getChanges: () => [] as ChangeSpan[] }; },
  onUpdate() {
    // Could update decorations dynamically in future.
  }
});
