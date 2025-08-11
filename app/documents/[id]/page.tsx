'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { diffWords } from '@/lib/diff';
import { langDir } from '@/lib/langDir';

interface Doc {
  id: string; title: string; sourceLanguage: string; targetLanguage: string; sourceText: string; directTranslation?: string; adaptedText?: string;
}

export default function DocumentWorkspace() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [adaptedDraft, setAdaptedDraft] = useState('');
  const [mode, setMode] = useState<'edit'|'diff'>('edit');
  const [saving, setSaving] = useState(false);
  const [generatingDirect, setGeneratingDirect] = useState(false);
  const [rtlOverride, setRtlOverride] = useState<'auto'|'rtl'|'ltr'>('auto');

  const load = useCallback(async () => {
    const res = await fetch(`/api/document/${id}`);
    const data = await res.json();
    if(data.document){
      setDoc(data.document);
      setAdaptedDraft(data.document.adaptedText || data.document.directTranslation || '');
    }
  }, [id]);

  useEffect(()=>{ if(id) load(); }, [id, load]);

  const direction = useMemo(() => {
    if(rtlOverride !== 'auto') return rtlOverride;
    return langDir(doc?.targetLanguage || 'en');
  }, [doc, rtlOverride]);

  async function save() {
    if(!doc) return;
    setSaving(true);
    const res = await fetch(`/api/document/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ adaptedText: adaptedDraft }) });
    const data = await res.json();
    setSaving(false);
    if(data.document) setDoc(data.document);
  }

  async function generateDirect() {
    if(!doc) return;
    // Placeholder: In real implementation call translation pipeline
    setGeneratingDirect(true);
    // Fake direct translation by echo or simple transform
    const fake = doc.sourceText.split('\n').map(l=> `[DIRECT] ${l}`).join('\n');
    const res = await fetch(`/api/document/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ directTranslation: fake }) });
    const data = await res.json();
    setGeneratingDirect(false);
    if(data.document){
      setDoc(data.document);
      if(!adaptedDraft) setAdaptedDraft(data.document.directTranslation || '');
    }
  }

  const diffOps = useMemo(()=>{
    if(mode !== 'diff' || !doc?.directTranslation) return [];
    return diffWords(doc.directTranslation, adaptedDraft);
  }, [mode, doc?.directTranslation, adaptedDraft]);

  function renderDiff() {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {diffOps.map((op,i)=>{
          if(op.type === 'equal') return <span key={i}>{op.text}</span>;
          if(op.type === 'insert') return <span key={i} className="bg-green-300/40 dark:bg-green-700/40 rounded-sm">{op.text}</span>;
          if(op.type === 'delete') return <span key={i} className="bg-red-300/40 dark:bg-red-700/40 line-through rounded-sm opacity-70">{op.text}</span>;
          return null;
        })}
      </div>
    );
  }

  if(!doc) return <div className="p-6">Loading…</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 gap-4">
      <div className="flex items-center gap-4 border-b border-default pb-2">
        <h1 className="text-lg font-semibold flex-1 truncate">{doc.title || 'Untitled'}</h1>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1"><input type="radio" name="mode" value="edit" checked={mode==='edit'} onChange={()=>setMode('edit')} /> Edit</label>
          <label className="flex items-center gap-1"><input type="radio" name="mode" value="diff" checked={mode==='diff'} onChange={()=>setMode('diff')} /> Diff</label>
          <select className="border rounded px-1 py-0.5 bg-panel" value={rtlOverride} onChange={e=>setRtlOverride(e.target.value as any)}>
            <option value="auto">Dir: Auto</option>
            <option value="ltr">Dir: LTR</option>
            <option value="rtl">Dir: RTL</option>
          </select>
          <button onClick={save} disabled={saving} className="px-3 py-1 rounded bg-accent text-accent-foreground disabled:opacity-50">{saving? 'Saving…':'Save'}</button>
          <button onClick={generateDirect} disabled={generatingDirect} className="px-3 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50">{generatingDirect ? 'Generating…' : 'Generate Direct'}</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden border border-default rounded">
          <div className="px-3 py-2 text-xs font-semibold border-b border-default bg-muted/30">Source ({doc.sourceLanguage})</div>
          <div dir={langDir(doc.sourceLanguage)} className="p-3 overflow-auto text-sm whitespace-pre-wrap leading-relaxed font-mono" style={{fontFamily:'monospace'}}>{doc.sourceText}</div>
        </div>
        <div className="flex flex-col overflow-hidden border border-default rounded">
          <div className="px-3 py-2 text-xs font-semibold border-b border-default bg-muted/30">Adapted ({doc.targetLanguage})</div>
          {mode === 'diff' && doc.directTranslation ? (
            <div dir={direction} className="p-3 overflow-auto" style={{ direction }}>
              {renderDiff()}
            </div>
          ) : (
            <textarea dir={direction} className="flex-1 p-3 outline-none bg-transparent resize-none text-sm leading-relaxed" style={{ direction }} value={adaptedDraft} onChange={e=>setAdaptedDraft(e.target.value)} />
          )}
        </div>
        <div className="flex flex-col overflow-hidden border border-default rounded">
          <div className="px-3 py-2 text-xs font-semibold border-b border-default bg-muted/30">Direct ({doc.targetLanguage})</div>
          <div dir={direction} className="p-3 overflow-auto text-sm whitespace-pre-wrap leading-relaxed font-mono opacity-90" style={{ direction }}>
            {doc.directTranslation ? doc.directTranslation : <span className="text-muted">No direct translation yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
