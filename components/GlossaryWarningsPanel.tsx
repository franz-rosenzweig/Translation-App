"use client";
import { useEffect, useState } from 'react';

interface Warning { type: string; hebrew?: string; expected?: string; }

export function GlossaryWarningsPanel({ documentId, adaptedHtml, onWarnings }: { documentId: string; adaptedHtml: string; onWarnings?: (w: Warning[]) => void; }) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = adaptedHtml.replace(/<[^>]+>/g,' ');

  async function runCheck() {
    if(!documentId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/document/${documentId}/glossary/check`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Glossary check failed');
  const w = json.warnings || [];
  setWarnings(w);
  onWarnings && onWarnings(w);
    } catch(e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(()=> { runCheck(); // auto-run on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wide">Glossary Warnings</h3>
        <button onClick={runCheck} disabled={loading} className="text-[10px] border rounded px-2 py-0.5 disabled:opacity-50">{loading? 'Checking…':'Re-run'}</button>
      </div>
      {error && <div className="text-[11px] text-red-500 mb-2">{error}</div>}
      <div className="flex-1 overflow-auto space-y-2 text-[11px]">
        {warnings.length === 0 && !loading && <div className="text-muted">No warnings.</div>}
        {warnings.map((w,i) => (
          <div key={i} className="border rounded p-2 bg-yellow-500/10 border-yellow-500/40">
            <div className="font-medium mb-1">{w.type === 'missing' ? 'Missing Preferred Term' : w.type}</div>
            {w.expected && <div><span className="opacity-70">Expected:</span> {w.expected}</div>}
            {w.hebrew && <div><span className="opacity-70">Hebrew:</span> {w.hebrew}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
