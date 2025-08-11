"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import { diffWords } from "diff";

type Props = {
  original: string;
  edited: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
  editable?: boolean; // enable live editing of the edited text
  onChange?: (next: string) => void;
  autoFocus?: boolean;
};

export default function DiffView({ original, edited, dir = 'auto', className, editable = false, onChange, autoFocus }: Props) {
  const diff = useMemo(() => diffWords(original, edited), [original, edited]);
  const containerRef = useRef<HTMLDivElement|null>(null);

  // On edit commit, propagate updated plain text (strip styling spans)
  const handleInput = useCallback(()=> {
    if(!editable) return;
    const el = containerRef.current;
    if(!el) return;
    // Collect textContent of all non-removed nodes (removed spans are visual only)
    // We mark removed spans with data-removed
    const pieces: string[] = [];
    el.childNodes.forEach(node => {
      if(node instanceof HTMLElement && node.dataset.removed === 'true') return; // skip removed segments from baseline
      pieces.push(node.textContent || '');
    });
    const next = pieces.join('');
    if(next !== edited) onChange?.(next);
  }, [editable, edited, onChange]);

  useEffect(()=> {
    if(autoFocus && containerRef.current) {
      containerRef.current.focus();
    }
  }, [autoFocus]);
  
  if (!original || !edited) {
    return (
      <div className="p-4 text-sm text-muted">
        Run the editor to see changes.
      </div>
    );
  }
  
  const direction = dir === 'auto' ? undefined : dir;
  return (
    <div
      ref={containerRef}
      className={"p-4 whitespace-pre-wrap text-sm outline-none " + (editable? 'cursor-text ' : '') + (className||'')}
      dir={direction}
      style={direction? { direction }: undefined}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={handleInput}
      spellCheck={false}
    >
      {diff.map((part, i) => {
        const cls = part.added
          ? "bg-green-500/30 dark:bg-green-700/30"
          : part.removed
          ? "bg-red-500/30 dark:bg-red-700/30 line-through opacity-70"
          : "";
        // For removed segments: still render but mark so we can ignore in text extraction.
        return (
          <span
            key={i}
            data-removed={part.removed? 'true': undefined}
            className={cls}
          >
            {part.value}
          </span>
        );
      })}
    </div>
  );
}
