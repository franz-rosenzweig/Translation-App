import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from 'prosemirror-state';

// Very lightweight decoration placeholder: we rely on precomputed change spans passed in options.
export interface ChangeSpan { id: string; type: 'insert'|'delete'; start: number; end: number; before?: string; after?: string; status?: 'pending'|'accepted'|'rejected'; }

export const TrackChangesExtension = Extension.create<{ getChanges: () => ChangeSpan[] }>({
  name: 'trackChangesLayer',
  addOptions() { return { getChanges: () => [] as ChangeSpan[] }; },
  addProseMirrorPlugins() {
    const key = new PluginKey('trackChangesLayer');
    const getChanges = this.options.getChanges;
    const recompute = (doc: any) => {
      const changes = getChanges() || [];
      if(!changes.length) return DecorationSet.empty;
      const decos: any[] = [];
      const indexToPos: number[] = [];
      let idx = 0;
      doc.descendants((node: any, posStart: number) => {
        if(node.isText) {
          const text = node.text || '';
          for(let i=0;i<text.length;i++) indexToPos[idx++] = posStart + 1 + i;
        }
        return true;
      });
      const toPos = (i: number) => indexToPos[Math.min(i, indexToPos.length-1)] || 1;
      for(const ch of changes as ChangeSpan[]) {
        if(ch.type === 'insert') {
          const startPos = toPos(ch.start || 0);
          const endPos = toPos((ch.start || 0) + ((ch.after||'').length));
          const cls = ch.status === 'accepted' ? 'tc-insert-accepted' : ch.status === 'rejected' ? 'tc-insert-rejected' : 'tc-insert';
          if(endPos >= startPos) decos.push(Decoration.inline(startPos, endPos, { class: cls }));
        } else if(ch.type === 'delete') {
          if(ch.status !== 'accepted') {
            const startPos = toPos(ch.start || 0);
            const span = document.createElement('span');
            span.className = ch.status === 'rejected' ? 'tc-delete-rejected' : 'tc-delete';
            span.textContent = ch.before || '';
            decos.push(Decoration.widget(startPos, span));
          }
        }
      }
      return DecorationSet.create(doc, decos);
    };
    return [
      new Plugin({
        key,
        state: {
          init: (_, { doc }) => DecorationSet.empty,
          apply: (tr, old) => {
            // Recompute on doc or metadata change flag
            if (tr.docChanged || tr.getMeta('trackChanges:update')) {
              return recompute(tr.doc);
            }
            return old.map(tr.mapping, tr.doc);
          }
        },
        props: {
          decorations: (state) => recompute(state.doc)
        },
        view: () => ({
          update: (view) => {
            // Trigger recompute when external changes array length/status changes.
            view.dispatch(view.state.tr.setMeta('trackChanges:update', true));
          }
        })
      })
    ];
  },
});
