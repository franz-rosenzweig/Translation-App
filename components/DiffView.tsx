"use client";

import { useMemo } from "react";
import { diffWords } from "diff";

type Props = {
  original: string;
  edited: string;
};

export default function DiffView({ original, edited }: Props) {
  const diff = useMemo(() => diffWords(original, edited), [original, edited]);
  
  if (!original || !edited) {
    return (
      <div className="p-4 text-sm text-muted">
        Run the editor to see changes.
      </div>
    );
  }
  
  return (
    <div className="p-4 whitespace-pre-wrap text-sm">
      {diff.map((part, i) => (
        <span
          key={i}
          className={
            part.added
              ? "bg-green-500/20 text-green-300"
              : part.removed
              ? "bg-red-500/20 text-red-300 line-through"
              : ""
          }
        >
          {part.value}
        </span>
      ))}
    </div>
  );
}
