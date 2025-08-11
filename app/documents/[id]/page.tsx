'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { diffWords } from '@/lib/diff';
import { langDir } from '@/lib/langDir';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TrackChangesExtension } from '@/lib/trackChangesExtension';

interface Doc {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  directTranslation?: string;
  adaptedText?: string;
  currentAdaptedVersionId?: string;
}

export default function DocumentWorkspace() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [adaptedDraft, setAdaptedDraft] = useState('');
  const [mode, setMode] = useState<'edit'|'diff'|'align'>('edit');
  const [saving, setSaving] = useState(false);
  const [generatingDirect, setGeneratingDirect] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [alignment, setAlignment] = useState<any[]>([]);
  const [loadingAlignment, setLoadingAlignment] = useState(false);
  const [audience, setAudience] = useState('General');
  const [rtlOverride, setRtlOverride] = useState<'auto'|'rtl'|'ltr'>('auto');
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(true);
  const [selectedDiffBase, setSelectedDiffBase] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all'|'adapted'|'direct'>('all');
  const [minimalMode, setMinimalMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const autosaveTimer = useRef<any>(null);

  // Load tracked changes from backend if version exists (DB mode)
  async function loadTrackedChanges() {
    if(!doc?.currentAdaptedVersionId) return;
    try {
      const res = await fetch(`/api/document/${doc.id}/versions/${doc.currentAdaptedVersionId}/changes`);
      if(res.ok) {
        const json = await res.json();
        setPendingChanges(json.changes || []);
      }
    } catch(e) { /* ignore */ }
  }

  useEffect(()=> { loadTrackedChanges(); }, [doc?.currentAdaptedVersionId]);
  // --- Track changes helpers ---
  const applyChange = useCallback((chg:any) => {
    // Apply change to adaptedDraft by replacing range [start,end) with after
    setAdaptedDraft(prev => {
      if(prev == null) return prev as any;
      // Basic safety: ensure indices
      const start = Math.max(0, chg.start || 0);
      const end = Math.min(prev.length, chg.end || chg.start || 0);
      return prev.slice(0,start) + (chg.after || '') + prev.slice(end);
    });
  }, []);

  const rejectChange = useCallback(async (id:string) => {
    setPendingChanges(list => list.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    fetch(`/api/changes/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reject' }) }).catch(()=>{});
  }, []);

  const acceptChange = useCallback(async (id:string) => {
    const chg = pendingChanges.find(c => c.id === id);
    if(chg) applyChange(chg);
    setPendingChanges(list => list.map(c => c.id === id ? { ...c, status: 'accepted' } : c));
    fetch(`/api/changes/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'accept' }) }).catch(()=>{});
  }, [pendingChanges, applyChange]);

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

  // TipTap editor setup
  const editor = useEditor({
    extensions: [StarterKit, TrackChangesExtension.configure({ getChanges: () => pendingChanges })],
    editable: mode === 'edit',
    content: adaptedDraft || '',
    onUpdate: ({ editor }) => {
      const text = editor.getHTML();
      setAdaptedDraft(text);
    }
  }, [mode]);

  useEffect(()=>{ if(editor && editor.getHTML() !== adaptedDraft) editor.commands.setContent(adaptedDraft); }, [adaptedDraft, editor]);

  async function save(manual = false) {
    if(!doc) return;
    setSaving(true);
    // Create a new adapted version instead of patch (works for DB and memory)
    const res = await fetch(`/api/document/${doc.id}/versions`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ type: 'adapted', content: adaptedDraft, parentVersionId: doc.currentAdaptedVersionId, meta: { autosave: !manual } }) });
    const data = await res.json();
    setSaving(false);
    if(data.version) {
      // refresh versions
      fetchVersions();
      setDoc(d => d ? { ...d, adaptedText: adaptedDraft, currentAdaptedVersionId: data.version.id } : d);
    }
  }

  // Debounced autosave
  useEffect(()=> {
    if(mode !== 'edit') return;
    if(!doc) return;
    if(autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(()=> {
      if(adaptedDraft && adaptedDraft !== doc.adaptedText) {
        const delta = Math.abs((adaptedDraft||'').length - (doc.adaptedText||'').length);
        if(delta >= 10) save(false);
      }
    }, 2000);
    return () => { if(autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptedDraft, doc?.id]);

  async function generateDirect() {
    if(!doc) return;
    // Placeholder: In real implementation call translation pipeline
    setGeneratingDirect(true);
    const res = await fetch(`/api/document/${doc.id}/translate`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ sourceLanguage: doc.sourceLanguage, targetLanguage: doc.targetLanguage }) });
    const data = await res.json();
    setGeneratingDirect(false);
    if(data.document){
      setDoc(data.document);
      if(!adaptedDraft) setAdaptedDraft(data.document.directTranslation || '');
    }
  }

  async function adapt() {
    if(!doc) return;
    setAdapting(true);
    const res = await fetch(`/api/document/${doc.id}/adapt`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ audience, sourceLanguage: doc.sourceLanguage, targetLanguage: doc.targetLanguage }) });
    const data = await res.json();
    setAdapting(false);
    if(data.adaptedText) {
      setDoc(d => d ? { ...d, adaptedText: data.adaptedText } : d);
      setAdaptedDraft(data.adaptedText);
      fetchVersions();
      if(minimalMode && data.change_log) {
        // Map to pending changes list (filter trivial inserts like whitespace)
        const pcs = (data.change_log as any[]).filter(c => (c.after||c.before||'').trim()).map((c,i)=> ({ id: c.id || `chg-${Date.now()}-${i}`, ...c, status: 'pending' }));
        setPendingChanges(pcs);
      }
    }
  }

  async function rephrase() {
    if(!doc) return;
    setAdapting(true);
    const res = await fetch(`/api/document/${doc.id}/rephrase`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ audience, sourceLanguage: doc.sourceLanguage, targetLanguage: doc.targetLanguage }) });
    const data = await res.json();
    setAdapting(false);
    if(data.adaptedText) {
      setDoc(d => d ? { ...d, adaptedText: data.adaptedText } : d);
      setAdaptedDraft(data.adaptedText);
      fetchVersions();
      if(minimalMode && data.change_log) {
        const pcs = (data.change_log as any[]).filter(c => (c.after||c.before||'').trim()).map((c,i)=> ({ id: c.id || `chg-${Date.now()}-${i}`, ...c, status: 'pending' }));
        setPendingChanges(pcs);
      }
    }
  }

  async function restoreVersion(vid: string) {
    if(!doc) return;
    setSaving(true);
    const res = await fetch(`/api/document/${doc.id}/versions/${vid}/restore`, { method: 'POST' });
    const data = await res.json();
    setSaving(false);
    if(data.version) {
      setDoc(d => d ? { ...d, adaptedText: data.version.content, currentAdaptedVersionId: data.version.id } : d);
      setAdaptedDraft(data.version.content);
      fetchVersions();
    }
  }

  async function loadAlignment() {
    if(!doc?.directTranslation) return;
    setLoadingAlignment(true);
    const res = await fetch(`/api/document/${doc.id}/alignment`);
    const data = await res.json();
    setLoadingAlignment(false);
    setAlignment(data.alignment || []);
  }

  const diffOps = useMemo(()=>{
    if(mode !== 'diff') return [];
    let base = doc?.directTranslation || '';
    if(selectedDiffBase) {
      const v = versions.find(v=>v.id===selectedDiffBase);
      if(v) base = v.content;
    }
    return base ? diffWords(base, adaptedDraft) : [];
  }, [mode, doc?.directTranslation, adaptedDraft, selectedDiffBase, versions]);

  useEffect(()=> {
    if(mode === 'align') loadAlignment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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

  async function fetchVersions() {
    if(!id) return;
    const res = await fetch(`/api/document/${id}/versions`);
    const data = await res.json();
    if(data.versions) setVersions(data.versions);
  }

  useEffect(()=> { fetchVersions(); }, [id]);

  if(!doc) return <div className="p-6">Loading…</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 gap-4">
      <div className="flex items-center gap-4 border-b border-default pb-2">
        <h1 className="text-lg font-semibold flex-1 truncate">{doc.title || 'Untitled'}</h1>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <label className="flex items-center gap-1"><input type="radio" name="mode" value="edit" checked={mode==='edit'} onChange={()=>setMode('edit')} /> Edit</label>
          <label className="flex items-center gap-1"><input type="radio" name="mode" value="diff" checked={mode==='diff'} onChange={()=>setMode('diff')} /> Diff</label>
          <label className="flex items-center gap-1"><input type="radio" name="mode" value="align" checked={mode==='align'} onChange={()=>setMode('align')} /> Align</label>
          <div className="flex items-center gap-1">
            <input className="border rounded px-1 py-0.5 w-32" placeholder="Audience" value={audience} onChange={e=>setAudience(e.target.value)} />
            <button onClick={adapt} disabled={adapting || !doc.directTranslation} className="px-2 py-1 rounded bg-purple-600 text-white disabled:opacity-50">{adapting? 'Adapting…':'Adapt'}</button>
            <button onClick={rephrase} disabled={adapting || !doc.directTranslation} className="px-2 py-1 rounded bg-pink-600 text-white disabled:opacity-50">{adapting? '…':'Rephrase'}</button>
          </div>
          <select className="border rounded px-1 py-0.5 bg-panel" value={rtlOverride} onChange={e=>setRtlOverride(e.target.value as any)}>
            <option value="auto">Dir: Auto</option>
            <option value="ltr">Dir: LTR</option>
            <option value="rtl">Dir: RTL</option>
          </select>
          <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={minimalMode} onChange={e=>setMinimalMode(e.target.checked)} /> Minimal</label>
          <button onClick={()=>save(true)} disabled={saving} className="px-3 py-1 rounded bg-accent text-accent-foreground disabled:opacity-50">{saving? 'Saving…':'Save'}</button>
          <button onClick={generateDirect} disabled={generatingDirect} className="px-3 py-1 rounded bg-indigo-600 text-white text-xs disabled:opacity-50">{generatingDirect ? 'Generating…' : 'Generate Direct'}</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden border border-default rounded relative">
          {showVersions && (
            <div className="absolute left-full top-0 ml-2 w-64 h-full border border-default rounded bg-panel flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold border-b border-default flex items-center justify-between">Versions
                <button className="text-[10px] underline" onClick={()=>fetchVersions()}>Refresh</button>
              </div>
              <div className="flex-1 overflow-auto text-[11px] divide-y divide-default/40">
                <div className="p-2 flex gap-1 text-[10px]">
                  <button className={`px-2 py-0.5 border rounded ${filterType==='all'?'bg-accent/40':''}`} onClick={()=>setFilterType('all')}>All</button>
                  <button className={`px-2 py-0.5 border rounded ${filterType==='adapted'?'bg-accent/40':''}`} onClick={()=>setFilterType('adapted')}>Adapted</button>
                  <button className={`px-2 py-0.5 border rounded ${filterType==='direct'?'bg-accent/40':''}`} onClick={()=>setFilterType('direct')}>Direct</button>
                </div>
                {versions.slice().reverse().filter(v => filterType==='all' || v.type===filterType).map(v => {
                  const snippet = (v.content || '').replace(/<[^>]+>/g,'').slice(0,60);
                  const isBase = selectedDiffBase===v.id;
                  const meta = v.meta || {};
                  return (
                    <div key={v.id} className={`px-2 py-1 space-y-0.5 ${isBase? 'bg-accent/30' : 'hover:bg-muted/40'}`}> 
                      <div className="flex items-center justify-between">
                        <button className="font-medium mr-2" onClick={()=> setSelectedDiffBase(v.id)}>{v.type}</button>
                        {v.type==='adapted' && <button className="text-[10px] underline" onClick={()=>restoreVersion(v.id)}>Restore</button>}
                      </div>
                      <div className="opacity-70 truncate">{new Date(v.createdAt).toLocaleTimeString()}</div>
                      {(meta.audience || meta.style || meta.llmModel) && (
                        <div className="text-[10px] opacity-60 truncate">
                          {meta.audience && <span>A:{meta.audience} </span>}
                          {meta.style && <span>S:{meta.style} </span>}
                          {meta.llmModel && <span>M:{meta.llmModel}</span>}
                        </div>
                      )}
                      <div className="text-[10px] opacity-80 truncate">{snippet}</div>
                    </div>
                  );
                })}
                {versions.length===0 && <div className="p-2 text-muted">No versions.</div>}
              </div>
              <div className="p-2 border-t border-default">
                <button className="w-full text-[11px] border rounded px-2 py-1" onClick={()=>setShowVersions(false)}>Hide</button>
              </div>
            </div>
          )}
          <div className="px-3 py-2 text-xs font-semibold border-b border-default bg-muted/30">Source ({doc.sourceLanguage})</div>
          <div dir={langDir(doc.sourceLanguage)} className="p-3 overflow-auto text-sm whitespace-pre-wrap leading-relaxed font-mono" style={{fontFamily:'monospace'}}>{doc.sourceText}</div>
        </div>
        <div className="flex flex-col overflow-hidden border border-default rounded">
          <div className="px-3 py-2 text-xs font-semibold border-b border-default bg-muted/30">Adapted ({doc.targetLanguage})</div>
          {mode === 'diff' && doc.directTranslation ? (
            <div dir={direction} className="p-3 overflow-auto" style={{ direction }}>
              {renderDiff()}
            </div>
          ) : mode === 'align' ? (
            <div className="p-3 overflow-auto text-xs space-y-1">
              {loadingAlignment && <div>Loading alignment…</div>}
              {!loadingAlignment && alignment.map(pair => (
                <div key={pair.sourceIndex} className="border rounded p-2">
                  <div className="font-medium opacity-70">#{pair.sourceIndex+1} similarity {(pair.similarity*100).toFixed(0)}%</div>
                  <div className="mt-1 text-[11px] opacity-80">{pair.source}</div>
                  <div className="mt-1 text-[11px]">{pair.target}</div>
                </div>
              ))}
              {!loadingAlignment && alignment.length === 0 && <div className="text-muted">No alignment available</div>}
            </div>
          ) : (
            <div className="flex-1 p-2 overflow-auto">
              <div className="flex items-center justify-between mb-1">
                <button onClick={()=>setShowVersions(s=>!s)} className="text-[10px] underline">{showVersions? 'Hide versions':'Show versions'}</button>
                <button onClick={()=>save(true)} disabled={saving} className="text-[10px] border rounded px-2 py-0.5 disabled:opacity-50">{saving? 'Saving…':'Manual Save'}</button>
              </div>
              <div className={`editor-wrapper border rounded h-full ${mode!=='edit' ? 'pointer-events-none opacity-70':''}`}> 
                <EditorContent editor={editor} />
              </div>
              {minimalMode && pendingChanges.length>0 && (
                <div className="mt-2 border-t pt-2 space-y-1 text-[11px]">
                  <div className="font-semibold flex items-center justify-between">Pending Changes <span>{pendingChanges.length}</span></div>
                  {pendingChanges.map(ch => (
                    <div key={ch.id} className={`border rounded p-1 flex flex-col gap-1 ${ch.status==='accepted'?'bg-green-500/10': ch.status==='rejected'?'bg-red-500/10':''}`}>
                      <div className="flex gap-2 text-[10px] items-center">
                        <span className="uppercase font-medium">{ch.type}</span>
                        <span className="line-through opacity-70 max-w-[120px] truncate">{ch.before?.slice(0,60)}</span>
                        <span className="opacity-50">→</span>
                        <span className="text-green-700 dark:text-green-300 max-w-[120px] truncate">{ch.after?.slice(0,60)}</span>
                        <span className="ml-auto text-[9px] italic opacity-60">{ch.status}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-0.5 border rounded disabled:opacity-40" disabled={ch.status!=='pending'} onClick={()=>acceptChange(ch.id)}>Accept</button>
                        <button className="px-2 py-0.5 border rounded disabled:opacity-40" disabled={ch.status!=='pending'} onClick={()=>rejectChange(ch.id)}>Reject</button>
                      </div>
                    </div>
                  ))}
                  {pendingChanges.every(c => c.status!=='pending') && (
                    <div className="pt-1">
                      <button
                        className="w-full px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                        disabled={saving}
                        onClick={()=> save(true)}
                      >Commit Accepted Changes</button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
