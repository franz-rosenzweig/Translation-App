import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface GlossaryWarning { expected?: string; type: string; }

interface Options { getWarnings: () => GlossaryWarning[]; }

export const GlossaryHighlightExtension = Extension.create<Options>({
  name: 'glossaryHighlight',
  addOptions() { return { getWarnings: () => [] as GlossaryWarning[] }; },
  addProseMirrorPlugins() {
    const key = new PluginKey('glossaryHighlight');
    return [ new Plugin({
      key,
      state: { init: () => DecorationSet.empty, apply(tr, old) { return old.map(tr.mapping, tr.doc); } },
      props: {
        decorations: (state) => {
          const warnings = this.options.getWarnings();
          if(!warnings.length) return DecorationSet.empty;
          const decos: any[] = [];
          const parts: { from: number; text: string }[] = [];
          state.doc.descendants((node: any, pos: number) => {
            if(node.isText && typeof node.text === 'string') {
              parts.push({ from: pos+1, text: node.text });
            }
            return true;
          });
          const full = parts.map(p=>p.text).join('');
          const lowerFull = full.toLowerCase();
          function mapSpan(startIdx: number, len: number) {
            let offset = 0; let startPos = 0; let endPos = 0; let remaining = len;
            for(const part of parts) {
              const next = offset + part.text.length;
              if(startIdx >= offset && startIdx < next) {
                const within = startIdx - offset;
                startPos = part.from + within;
                let innerOffset = within;
                for(const part2 of parts.slice(parts.indexOf(part))) {
                  const available = part2.text.length - innerOffset;
                  const take = Math.min(available, remaining);
                  if(remaining - take === 0) { endPos = part2.from + innerOffset + take; break; }
                  remaining -= take; innerOffset = 0;
                }
                break;
              }
              offset = next;
            }
            return startPos && endPos ? { startPos, endPos } : null;
          }
          for(const w of warnings) {
            const expected = (w.expected||'').trim();
            const className = w.type === 'missing' ? 'glossary-missing' : w.type === 'mismatch' ? 'glossary-mismatch' : 'glossary-term';
            const occ = Array.isArray((w as any).occurrences) ? (w as any).occurrences : [];
            if(occ.length) {
              for(const o of occ) {
                const span = mapSpan(o.start, (o.end - o.start));
                if(span) decos.push(Decoration.inline(span.startPos, span.endPos, { class: className, 'data-tip': `${w.type}: ${expected}` }));
              }
            } else if(w.type === 'mismatch' && (w as any).near && (w as any).occurrences) {
              for(const o of (w as any).occurrences) {
                const span = mapSpan(o.start, (o.end - o.start));
                if(span) decos.push(Decoration.inline(span.startPos, span.endPos, { class: className, 'data-tip': `mismatch: ${(w as any).near} -> ${expected}` }));
              }
            }
          }
          return DecorationSet.create(state.doc, decos);
        }
      }
    })];
  }
});
