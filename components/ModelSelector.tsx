"use client";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

const MODELS = ["gpt-5-mini", "gpt-5", "gpt-5-nano"];

export default function ModelSelector({ value, onChange }: Props) {
  useEffect(() => {
    const saved = window.localStorage.getItem("model");
    if (saved && MODELS.includes(saved)) onChange(saved);
  }, [onChange]);

  useEffect(() => {
    if (value) window.localStorage.setItem("model", value);
  }, [value]);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Model</span>
      <select
        className="bg-panel border border-neutral-800 rounded px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  );
}
