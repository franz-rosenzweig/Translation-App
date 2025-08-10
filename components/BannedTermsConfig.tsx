"use client";

import { useState, useEffect } from "react";

type Props = {
  onChange: (terms: string[]) => void;
};

export default function BannedTermsConfig({ onChange }: Props) {
  const [termsText, setTermsText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("bannedTerms");
    if (saved) {
      setTermsText(saved);
      onChange(parseTerms(saved));
    }
  }, [onChange]);

  const handleChange = (value: string) => {
    setTermsText(value);
    localStorage.setItem("bannedTerms", value);
    onChange(parseTerms(value));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Banned Terms
        <span className="text-muted ml-2">(one per line)</span>
      </label>
      <textarea
        value={termsText}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-20 bg-panel border border-default rounded p-2 text-sm font-mono text-foreground resize-none"
        placeholder="Enter terms to ban..."
      />
    </div>
  );
}

function parseTerms(text: string): string[] {
  return text
    .split("\n")
    .map(t => t.trim())
    .filter(Boolean);
}
