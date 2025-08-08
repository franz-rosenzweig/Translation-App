"use client";

import { useCallback, useRef, useState } from "react";
import OutputTabs from "@/components/OutputTabs";
import RunBar from "@/components/RunBar";

export default function Page() {
  const [hebrew, setHebrew] = useState("");
  const [roughEnglish, setRoughEnglish] = useState("");
  const [model, setModel] = useState("gpt-5-mini");
  const [pending, setPending] = useState(false);

  // Outputs
  const [editedText, setEditedText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const abortRef = useRef<AbortController | null>(null);

  const onRun = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPending(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hebrew, roughEnglish, model }),
        signal: ac.signal
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      setEditedText(json.edited_text || "");
      const cl = Array.isArray(json.change_log) ? json.change_log.length : 0;
      const gh = Array.isArray(json.terms_glossary_hits) ? json.terms_glossary_hits.length : 0;
      const fl = Array.isArray(json.flags) ? json.flags.length : 0;
      setNotes(`change_log: ${cl}, glossary hits: ${gh}, flags: ${fl}`);
    } catch (e: any) {
      console.error(e);
      setNotes(e?.message || "Request failed");
    } finally {
      setPending(false);
    }
  }, [hebrew, roughEnglish, model]);

  const onClear = () => {
    abortRef.current?.abort();
    setHebrew("");
    setRoughEnglish("");
    setEditedText("");
    setNotes("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <RunBar model={model} setModel={setModel} onRun={onRun} onClear={onClear} pending={pending} />

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Left: Inputs */}
        <section className="space-y-3">
          <div className="space-y-1">
            <div className="input-label">Hebrew (source)</div>
            <textarea
              dir="rtl"
              className="w-full h-48 bg-panel border border-neutral-800 rounded p-2"
              value={hebrew}
              onChange={(e) => setHebrew(e.target.value)}
              placeholder="הדבק כאן טקסט בעברית…"
            />
          </div>
          <div className="space-y-1">
            <div className="input-label">Rough English</div>
            <textarea
              className="w-full h-48 bg-panel border border-neutral-800 rounded p-2"
              value={roughEnglish}
              onChange={(e) => setRoughEnglish(e.target.value)}
              placeholder="Paste the rough English here…"
            />
          </div>
          {/* Knobs, Style dropdown, Glossary upload will go here */}
          <div className="text-sm text-muted">(Style, Knobs, and Glossary controls coming next.)</div>
        </section>

        {/* Right: Outputs */}
        <section className="bg-panel border border-neutral-800 rounded min-h-[24rem] h-full">
          <OutputTabs
            tabs={[
              { value: "edited", label: "Edited Text", content: <pre className="whitespace-pre-wrap">{editedText}</pre> },
              { value: "notes", label: "Notes", content: <div className="text-sm whitespace-pre-wrap">{notes}</div> },
              { value: "readability", label: "Readability", content: <div className="text-sm">Grade, counters, heatmap (up next).</div> },
              { value: "diff", label: "Diff", content: <div className="text-sm">Inline diff (coming soon).</div> }
            ]}
          />
        </section>
      </main>
    </div>
  );
}

