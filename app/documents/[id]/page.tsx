'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { diffWords } from '@/lib/diff';
import { langDir } from '@/lib/langDir';
import { useDebounce } from '@/lib/ui-utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TrackChangesExtension } from '@/lib/trackChangesExtension';
import { GlossaryHighlightExtension } from '@/lib/glossaryHighlightExtension';
import { GlossaryWarningsPanel } from '@/components/GlossaryWarningsPanel';
import TranslationSettings from '@/components/TranslationSettings';
import ModelSelector from '@/components/ModelSelector';
import LanguageSelector, { type Language } from '@/components/LanguageSelector';
import ReadabilityPane from '@/components/ReadabilityPane';
import DiffView from '@/components/DiffView';
import ThemeSelector, { type Theme } from '@/components/ThemeSelector';
import React from 'react';
import RunButton from '@/components/RunButton';
import GlossaryUpload from '@/components/GlossaryUpload';
import GuidelinesUploader from '@/components/GuidelinesUploader';
import ReferenceMaterialUploader from '@/components/ReferenceMaterialUploader';
import SessionManager, { type TranslationSession } from '@/components/SessionManager';
import { processTranslationAPI } from '@/lib/api-client';
import * as Tabs from '@radix-ui/react-tabs';
import Toasts, { useToasts } from '@/components/Toasts';
import { checkGuardrails, validateEditedText } from '@/lib/guardrails';

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
  
  // Source editing state
  const [editableSource, setEditableSource] = useState('');
  const [sourceBeingEdited, setSourceBeingEdited] = useState(false);
  const [useRoughEnglish, setUseRoughEnglish] = useState(false);
  const [roughEnglish, setRoughEnglish] = useState('');
  
  // Translation state
  const [adaptedDraft, setAdaptedDraft] = useState('');
  const [model, setModel] = useState('gpt-5');
  const [pending, setPending] = useState(false);
  const [generatingDirect, setGeneratingDirect] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [rephrasing, setRephrasing] = useState(false);
  
  // UI and session state
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showGuidelinesUploader, setShowGuidelinesUploader] = useState(false);
  const [showReferenceMaterial, setShowReferenceMaterial] = useState(false);
  const [showGlossaryUpload, setShowGlossaryUpload] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    timestamp: number;
    sourceText: string;
    roughText?: string;
    result: string;
    audienceVersion?: string;
    sourceLanguage: Language;
    targetLanguage: Language;
  }>>([]);
  
  // Translation settings
  const [audienceConfig, setAudienceConfig] = useState({
    prompt: "",
    audience: "General public",
    notes: ""
  });
  const [promptSettings, setPromptSettings] = useState({
    override: "",
    knobs: {
      localization: 5,
      structureStrictness: 5,
      toneStrictness: 5,
      jargonTolerance: 5
    },
    toggles: {
      preserveParagraphs: true,
      shorterSentences: false,
      plainVerbs: true
    }
  });
  const [glossary, setGlossary] = useState<Array<{ hebrew: string; chosen_english: string; note?: string }>>([]);
  const [guidelines, setGuidelines] = useState("");
  const [referenceMaterial, setReferenceMaterial] = useState("");
  
  // UI state
  const [mode, setMode] = useState<'edit'|'diff'|'align'|'readability'>('edit');
  const [diffDir, setDiffDir] = useState<'auto'|'ltr'|'rtl'>('auto');
  const [diffEditable, setDiffEditable] = useState(false);
  const [markdownView, setMarkdownView] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alignment, setAlignment] = useState<any>({ alignment: [], meta: null });
  const [loadingAlignment, setLoadingAlignment] = useState(false);
  const [audience, setAudience] = useState('General');
  const [rtlOverride, setRtlOverride] = useState<'auto'|'rtl'|'ltr'>('auto');
  const [sourceRtlOverride, setSourceRtlOverride] = useState<'auto'|'rtl'|'ltr'>('auto');
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(true);
  const [selectedDiffBase, setSelectedDiffBase] = useState<string | null>(null);
  const [selectedDiffTarget, setSelectedDiffTarget] = useState<string | null>(null);
  const [pairDiffOps, setPairDiffOps] = useState<any[]|null>(null);
  const [filterType, setFilterType] = useState<'all'|'adapted'|'direct'>('all');
  const [minimalMode, setMinimalMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [glossaryWarnings, setGlossaryWarnings] = useState<any[]>([]);
  const [bannedTermsViolations, setBannedTermsViolations] = useState<string[]>([]);
  const [stats, setStats] = useState<{sourceWords:number; directWords:number; adaptedWords:number; changeDensity:number; glossaryCompliance:number}>({ sourceWords:0, directWords:0, adaptedWords:0, changeDensity:0, glossaryCompliance:0 });
  const { toasts, addToast } = useToasts();
  const [showInlineVersionDiff, setShowInlineVersionDiff] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Compute lightweight stats locally (word counts & change density)
  useEffect(()=> {
    if(!doc) return;
    const strip = (html:string) => html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').trim();
    const wc = (s:string) => s ? (s.trim().match(/\S+/g)||[]).length : 0;
    const sourceWords = wc(doc.sourceText||'');
    const directText = doc.directTranslation || '';
    const adaptedText = adaptedDraft || '';
    const directWords = wc(strip(directText));
    const adaptedWords = wc(strip(adaptedText));
    // change density: proportion of characters changed between direct and adapted (rough)
    let changeDensity = 0;
    if(directText) {
      const ops = diffWords(directText, adaptedText);
      let changedChars = 0; let baseChars = directText.length;
      for(const op of ops) if(op.type !== 'equal') changedChars += op.text.length;
      changeDensity = baseChars ? +(changedChars / baseChars).toFixed(2) : 0;
    }
    // glossary compliance from warnings list (if glossary warnings fetched)
    // We infer total terms = warnings missing + present terms (we don't have present terms count directly, so approximate: if no warnings -> 100)
    // Better: when warnings update, compute compliance if we know total terms. Fetch once listGlossary.
    let glossaryCompliance = stats.glossaryCompliance;
    if(doc.id) {
      // Lazy fetch total glossary once
      (async ()=>{
        try {
          const res = await fetch(`/api/document/${doc.id}/glossary`);
          const json = await res.json();
          const total = (json.terms||[]).length;
          if(total>0) {
            const missing = glossaryWarnings.filter(w=> w.type==='missing').length;
            const present = total - missing;
            glossaryCompliance = +(present/total*100).toFixed(0);
            setStats(s => ({ ...s, glossaryCompliance }));
          } else {
            glossaryCompliance = 100;
            setStats(s => ({ ...s, glossaryCompliance }));
          }
        } catch { /* ignore */ }
      })();
    }
    setStats(s => ({ ...s, sourceWords, directWords, adaptedWords, changeDensity }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, doc?.sourceText, doc?.directTranslation, adaptedDraft, glossaryWarnings]);
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

  // Initialize editable source from doc
  useEffect(() => {
    if (doc && !sourceBeingEdited) {
      setEditableSource(doc.sourceText);
    }
  }, [doc, sourceBeingEdited]);

  // AI Translation Functions
  const translate = useCallback(async () => {
    const sourceText = useRoughEnglish && roughEnglish.trim() ? roughEnglish : editableSource;
    
    if (!sourceText.trim()) {
      addToast({ description: 'Please enter source text to translate', type: 'error' });
      return;
    }

    // Update document source if it changed
    if (editableSource !== doc?.sourceText) {
      await updateSourceText(editableSource);
    }

    setPending(true);
    // If a previous run is still active, abort it only if we are starting a fresh request (not accidental double click)
    if (abortRef.current && abortRef.current.signal.aborted === false) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const controller = abortRef.current;
    const startedAt = Date.now();
    let attempts = 0;

    try {
      // Normalize languages (handle short codes like 'he','en')
      const normalize = (c?: string) => {
        if(!c) return '';
        const lc = c.toLowerCase();
        if(lc === 'he' || lc.includes('hebrew')) return 'hebrew';
        if(lc === 'en' || lc.includes('english')) return 'english';
        return lc;
      };
      const srcLang = normalize(doc?.sourceLanguage);
      const tgtLang = normalize(doc?.targetLanguage);
      const isHebrewSource = srcLang === 'hebrew';
      const isEnglishSource = srcLang === 'english';
      // Build payload matching /api/process expectations
      const payload = {
        hebrew: isHebrewSource ? editableSource : '',
        roughEnglish: isEnglishSource ? editableSource : (useRoughEnglish ? (roughEnglish || sourceText) : ''),
        sourceLanguage: srcLang,
        targetLanguage: tgtLang,
        glossary,
        model,
        guidelines,
        promptOverride: promptSettings.override,
        knobs: promptSettings.knobs,
        style: promptSettings.toggles,
        referenceMaterial,
        mode: 'standard'
      };

  const attempt = async (): Promise<any> => {
        attempts++;
        try {
          return await processTranslationAPI(payload, controller.signal);
        } catch(err:any) {
          const isAbort = err?.name === 'AbortError' || /abort/i.test(err?.message||'');
          // Retry once on timeout/abort that took near full timeout window (likely server slow) but only once
          if(isAbort && attempts < 2 && Date.now() - startedAt > 10000) {
            await new Promise(r=>setTimeout(r, 500));
            return attempt();
          }
          throw err;
        }
  };
      const result = await attempt();

      if (result.edited_text) {
        setAdaptedDraft(result.edited_text);
        await save(false);
        addToast({ description: 'Translation completed', type: 'success' });
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: Date.now(),
          sourceText: editableSource,
          roughText: useRoughEnglish ? roughEnglish : undefined,
          result: result.edited_text,
          sourceLanguage: doc?.sourceLanguage as Language || 'hebrew',
          targetLanguage: doc?.targetLanguage as Language || 'english'
        }]);
      }
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      if (error.name === 'AbortError') {
        const elapsed = Date.now() - startedAt;
        addToast({ description: elapsed < 1000 ? 'Cancelled previous run' : 'Translation aborted (timeout or cancel).', type: 'error' });
      } else if (msg.includes('network') || msg.includes('fetch')) {
        addToast({ description: 'Network error: check connection / server / CORS.', type: 'error' });
      } else {
        addToast({ description: error.message || 'Translation failed', type: 'error' });
      }
    } finally {
      setPending(false);
    }
  }, [editableSource, roughEnglish, useRoughEnglish, doc, glossary, model, guidelines, promptSettings, audienceConfig, referenceMaterial, addToast]);

  // Update source text in document
  const updateSourceText = useCallback(async (newSource: string) => {
    if (!doc) return;
    
    try {
      const res = await fetch(`/api/document/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: newSource })
      });
      
      if (res.ok) {
        const data = await res.json();
        setDoc(prev => prev ? { ...prev, sourceText: newSource } : null);
        addToast({ description: 'Source text updated', type: 'success' });
      }
    } catch (error) {
      addToast({ description: 'Failed to update source text', type: 'error' });
    }
  }, [doc, addToast]);
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

  const load = useCallback(async () => {
    const res = await fetch(`/api/document/${id}`);
    const data = await res.json();
    if(data.document){
      setDoc(data.document);
      setAdaptedDraft(data.document.adaptedText || data.document.directTranslation || '');
    }
  }, [id]);

  const rejectChange = useCallback(async (id:string) => {
    setPendingChanges(list => list.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    try {
      const res = await fetch(`/api/changes/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reject' }) });
      if(res.ok) {
        const json = await res.json();
        if(json.newVersion) {
          await Promise.all([load(), fetchVersions()]);
          // Reload tracked changes for the new current version
          loadTrackedChanges();
        }
      }
    } catch {/* ignore */}
  }, []);

  const acceptChange = useCallback(async (id:string) => {
    const chg = pendingChanges.find(c => c.id === id);
    if(chg) applyChange(chg);
    setPendingChanges(list => list.map(c => c.id === id ? { ...c, status: 'accepted' } : c));
    try {
      const res = await fetch(`/api/changes/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'accept' }) });
      if(res.ok) {
        const json = await res.json();
        if(json.newVersion) {
          await Promise.all([load(), fetchVersions()]);
          loadTrackedChanges();
        }
      }
    } catch {/* ignore */}
  }, [pendingChanges, applyChange, load]);

  useEffect(()=>{ if(id) load(); }, [id, load]);

  const direction = useMemo(() => {
    const normalize = (c?: string) => {
      if(!c) return '';
      const lc = c.toLowerCase();
      if(lc === 'he' || lc.includes('hebrew')) return 'hebrew';
      if(lc === 'en' || lc.includes('english')) return 'english';
      return lc;
    };
    const tgt = normalize(doc?.targetLanguage);
    if(rtlOverride !== 'auto') return rtlOverride;
    return langDir(tgt === 'hebrew' ? 'he' : 'en');
  }, [doc, rtlOverride]);
  const sourceDirection = useMemo(() => {
    const normalize = (c?: string) => {
      if(!c) return '';
      const lc = c.toLowerCase();
      if(lc === 'he' || lc.includes('hebrew')) return 'hebrew';
      if(lc === 'en' || lc.includes('english')) return 'english';
      return lc;
    };
    const src = normalize(doc?.sourceLanguage);
    if(sourceRtlOverride !== 'auto') return sourceRtlOverride;
    return langDir(src === 'hebrew' ? 'he' : 'en');
  }, [doc, sourceRtlOverride]);

  // TipTap editor setup
  const editor = useEditor({
    extensions: [StarterKit, TrackChangesExtension.configure({ getChanges: () => pendingChanges }), GlossaryHighlightExtension.configure({ getWarnings: () => glossaryWarnings })],
    editable: mode === 'edit',
    content: adaptedDraft || '',
    immediatelyRender: false,
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
  const debouncedAutosave = useDebounce(async () => {
    if (adaptedDraft && doc && adaptedDraft !== doc.adaptedText) {
      const delta = Math.abs((adaptedDraft || '').length - (doc.adaptedText || '').length);
      if (delta >= 10) save(false);
    }
  }, 2000);

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!doc) return;
    debouncedAutosave();
  }, [adaptedDraft, doc?.id, mode, debouncedAutosave, doc]);

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
    // Use the new adaptToAudience function instead
    return adaptToAudience();
  }

  const adaptToAudience = useCallback(async () => {
    if (!adaptedDraft.trim()) {
      addToast({ description: 'No translation to adapt', type: 'error' });
      return;
    }

    setAdapting(true);
    try {
      const result = await processTranslationAPI({
        sourceText: adaptedDraft,
        sourceLanguage: doc?.targetLanguage as Language || 'english',
        targetLanguage: doc?.targetLanguage as Language || 'english',
        glossary,
        model,
        guidelines,
        promptSettings,
        audienceConfig: {
          ...audienceConfig,
          prompt: audienceConfig.prompt || `Adapt this text for ${audienceConfig.audience}. ${audienceConfig.notes}`
        },
        referenceMaterial,
        signal: abortRef.current?.signal
      });

      if (result.translation) {
        setAdaptedDraft(result.translation);
        await save(false);
        addToast({ description: `Adapted for ${audienceConfig.audience}`, type: 'success' });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        addToast({ description: error.message || 'Adaptation failed', type: 'error' });
      }
    } finally {
      setAdapting(false);
    }
  }, [adaptedDraft, doc, glossary, model, guidelines, promptSettings, audienceConfig, referenceMaterial, addToast]);

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
    setAlignment(data || { alignment: [], meta: null });
  }

  const diffOps = useMemo(()=>{
    if(mode !== 'diff') return [];
    if(selectedDiffBase && selectedDiffTarget && selectedDiffBase !== selectedDiffTarget && pairDiffOps) {
      return pairDiffOps;
    }
    let base = doc?.directTranslation || '';
    if(selectedDiffBase) {
      const v = versions.find(v=>v.id===selectedDiffBase);
      if(v) base = v.content;
    }
    return base ? diffWords(base, adaptedDraft) : [];
  }, [mode, doc?.directTranslation, adaptedDraft, selectedDiffBase, selectedDiffTarget, pairDiffOps, versions]);

  // Fetch diff between arbitrary version pair when both selectors chosen
  useEffect(()=> {
    if(mode !== 'diff') return;
    if(selectedDiffBase && selectedDiffTarget && selectedDiffBase !== selectedDiffTarget) {
      (async ()=> {
        try {
          const res = await fetch(`/api/document/${id}/diff?from=${encodeURIComponent(selectedDiffBase)}&to=${encodeURIComponent(selectedDiffTarget)}`);
          if(res.ok) {
            const json = await res.json();
            setPairDiffOps(json.ops || []);
          }
        } catch {/* ignore */}
      })();
    } else {
      setPairDiffOps(null);
    }
  }, [mode, selectedDiffBase, selectedDiffTarget, id]);

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
  <>
  <div className="flex flex-col min-h-screen p-4 gap-4">
    {/* Header */}
    <div className="flex items-center gap-4 border-b border-default pb-3">
        <h1 className="text-xl font-semibold flex-1 truncate">{doc.title || 'Untitled'}</h1>
        <div className="flex items-center gap-3 text-sm flex-wrap">
      <StatusBadge />
          <div className="opacity-60" title="Model forced to gpt-5">
            <ModelSelector value={model} onChange={()=>{}} />
          </div>
          <ThemeSelector theme={theme} onThemeChange={(t)=>{ 
            setTheme(t); 
            if(typeof document!=='undefined') { 
              const themes = ['dark','github-light','github-dark','solarized-light','solarized-dark','monokai','one-light','soft-light','cream-light','blue-light'];
              const cls = document.documentElement.className.split(/\s+/).filter(c=> !themes.includes(c));
              cls.push(t); 
              document.documentElement.className = cls.join(' ').trim();
            }
          }} />
          <button 
            onClick={() => setShowTranslationSettings(true)} 
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Settings
          </button>
          <button 
            onClick={translate} 
            disabled={pending || !editableSource.trim()} 
            className="px-4 py-1.5 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700"
          >
            {pending ? 'Translating…' : 'Translate'}
          </button>
          <button onClick={()=>save(true)} disabled={saving} className="px-3 py-1.5 rounded bg-accent text-accent-foreground disabled:opacity-50">
            {saving? 'Saving…':'Save'}
          </button>
        </div>
      </div>
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 text-sm px-1 opacity-80">
        <div>Source: {stats.sourceWords} words</div>
        <div>Translation: {stats.adaptedWords} words</div>
        <div>Model: {model}</div>
        <div>Languages: {doc.sourceLanguage} → {doc.targetLanguage}</div>
        {stats.changeDensity > 0 && <div>Change Density: {(stats.changeDensity*100).toFixed(0)}%</div>}
        {stats.glossaryCompliance > 0 && <div>Glossary Compliance: {stats.glossaryCompliance}%</div>}
      </div>

      {/* Main Three-Panel Layout */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        
        {/* SOURCE PANEL */}
        <div className="col-span-4 flex flex-col border border-default rounded">
          <div className="px-4 py-3 border-b border-default bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold">Source ({(doc.sourceLanguage||'').toLowerCase()})</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setSourceBeingEdited(!sourceBeingEdited)}
                className="text-sm px-2 py-1 border rounded hover:bg-accent/20"
              >
                {sourceBeingEdited ? 'View' : 'Edit'}
              </button>
              <select className="text-xs border rounded px-1 py-0.5" value={sourceRtlOverride} onChange={e=>setSourceRtlOverride(e.target.value as any)}>
                <option value="auto">Dir</option>
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
              {sourceBeingEdited && editableSource !== doc.sourceText && (
                <button 
                  onClick={() => updateSourceText(editableSource)}
                  className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              )}
              <button 
                onClick={() => setShowSessionManager(true)}
                className="text-sm px-2 py-1 border rounded hover:bg-accent/20"
                title="Session Manager"
              >
                📋
              </button>
            </div>
          </div>
          
          {/* Source Content */}
          <div className="flex-1 p-4 overflow-auto">
            {sourceBeingEdited ? (
              <div className="space-y-3">
                <textarea
                  value={editableSource}
                  onChange={(e) => setEditableSource(e.target.value)}
                  className="w-full h-48 resize-none border border-default rounded p-3 text-sm leading-relaxed"
                  dir={sourceDirection}
                  placeholder="Enter or paste source text..."
                  style={{ direction: sourceDirection }}
                />
                
                {/* Rough English for Hebrew → English */}
                {(doc.sourceLanguage?.toLowerCase()?.includes('he') || doc.sourceLanguage === 'hebrew' || doc.sourceLanguage === 'he') &&
                  (doc.targetLanguage?.toLowerCase()?.includes('en') || doc.targetLanguage === 'english' || doc.targetLanguage === 'en') && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useRoughEnglish}
                        onChange={(e) => setUseRoughEnglish(e.target.checked)}
                      />
                      Use rough English translation as starting point
                    </label>
                    {useRoughEnglish && (
                      <textarea
                        value={roughEnglish}
                        onChange={(e) => setRoughEnglish(e.target.value)}
                        className="w-full h-32 resize-none border border-default rounded p-3 text-sm leading-relaxed"
                        placeholder="Enter rough English translation..."
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div 
                dir={sourceDirection} 
                className="text-sm whitespace-pre-wrap leading-relaxed font-mono h-full"
                style={{ direction: sourceDirection }}
              >
                {doc.sourceText || <span className="text-muted italic">No source text</span>}
                {(useRoughEnglish || roughEnglish) && (
                  <div className="mt-4 pt-3 border-t border-dashed border-default/40">
                    <div className="text-xs font-semibold mb-1 opacity-70">Rough English Baseline</div>
                    <div className="text-xs whitespace-pre-wrap leading-relaxed">
                      {roughEnglish || <span className="italic opacity-60">(empty)</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Source Panel Tools */}
          <div className="p-3 border-t border-default bg-muted/10 flex flex-wrap gap-2">
            <button 
              onClick={() => setShowGlossaryUpload(true)}
              className="text-xs px-2 py-1 border rounded hover:bg-accent/20"
            >
              📚 Glossary
            </button>
            <button 
              onClick={() => setShowGuidelinesUploader(true)}
              className="text-xs px-2 py-1 border rounded hover:bg-accent/20"
            >
              📋 Guidelines
            </button>
            <button 
              onClick={() => setShowReferenceMaterial(true)}
              className="text-xs px-2 py-1 border rounded hover:bg-accent/20"
            >
              📖 Reference
            </button>
          </div>
        </div>

        {/* TRANSLATION PANEL */}
        <div className="col-span-5 flex flex-col border border-default rounded">
          <div className="px-4 py-3 border-b border-default bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold">Translation ({doc.targetLanguage})</h3>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" name="transMode" value="edit" checked={mode==='edit'} onChange={()=>setMode('edit')} />
                Edit
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" name="transMode" value="diff" checked={mode==='diff'} onChange={()=>setMode('diff')} />
                Diff
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" name="transMode" value="readability" checked={mode==='readability'} onChange={()=>setMode('readability')} />
                Quality
              </label>
            </div>
          </div>

          {/* AI Tools Bar */}
          <div className="px-4 py-2 border-b border-default bg-muted/10 flex items-center gap-2 flex-wrap">
            <button 
              onClick={adaptToAudience}
              disabled={adapting || !adaptedDraft.trim()}
              className={`px-3 py-1 rounded text-sm disabled:opacity-50 ${adapting ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
              {adapting ? 'Adapting…' : 'Adapt to Audience'}
            </button>
            <button 
              onClick={rephrase} 
              disabled={rephrasing || !adaptedDraft.trim()} 
              className="px-3 py-1 rounded bg-pink-600 text-white text-sm disabled:opacity-50 hover:bg-pink-700"
            >
              {rephrasing ? 'Rephrasing…' : 'Rephrase'}
            </button>
            <button
              onClick={()=>{
                // Simple paragraph re-flow: split on double newlines or long lines, ensure blank line between paragraphs
                const text = adaptedDraft
                  .replace(/<br\s*\/?>(\s*<br\s*\/?>)+/gi,'\n\n')
                  .replace(/<p>/gi,'\n\n')
                  .replace(/<\/p>/gi,'')
                  .replace(/\n{3,}/g,'\n\n');
                const paragraphs = text
                  .replace(/<[^>]+>/g,'')
                  .split(/\n{2,}|(?<=\.)(\s{2,})(?=[A-Z])/)
                  .filter(Boolean)
                  .map(p=>p.trim());
                const rebuilt = paragraphs.join('\n\n');
                setAdaptedDraft(rebuilt);
                editor?.commands.setContent(rebuilt);
                addToast({ description: 'Reflowed paragraphs', type: 'success' });
              }}
              disabled={!adaptedDraft.trim()}
              className="px-3 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-50 hover:bg-indigo-700"
            >
              Reflow ¶
            </button>
            <input 
              className="border rounded px-2 py-1 w-32 text-sm" 
              placeholder="Audience" 
              value={audienceConfig.audience} 
              onChange={e => setAudienceConfig(prev => ({ ...prev, audience: e.target.value }))} 
            />
            <select className="border rounded px-2 py-1 bg-panel text-sm" value={rtlOverride} onChange={e=>setRtlOverride(e.target.value as any)}>
              <option value="auto">Dir: Auto</option>
              <option value="ltr">Dir: LTR</option>
              <option value="rtl">Dir: RTL</option>
            </select>
            {mode==='diff' && (
              <>
                <select className="border rounded px-2 py-1 bg-panel text-sm" value={diffDir} onChange={e=>setDiffDir(e.target.value as any)}>
                  <option value="auto">Diff Dir: Auto</option>
                  <option value="ltr">Diff Dir: LTR</option>
                  <option value="rtl">Diff Dir: RTL</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={diffEditable} onChange={e=>setDiffEditable(e.target.checked)} /> Editable Diff
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={markdownView} onChange={e=>setMarkdownView(e.target.checked)} /> Markdown View
                </label>
              </>
            )}
          </div>

          {/* Translation Content */}
          <div className="flex-1 overflow-auto">
            {mode === 'edit' ? (
              <div className="h-full p-3">
                <div className={`editor-wrapper border rounded h-full ${mode!=='edit' ? 'pointer-events-none opacity-70':''}`} dir={direction} style={{ direction }}> 
                  <EditorContent editor={editor} />
                </div>
                
                {/* Track Changes Panel */}
                {pendingChanges.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-2 max-h-32 overflow-auto">
                    <div className="font-semibold flex items-center justify-between text-sm">
                      Tracked Changes <span className="text-xs">{pendingChanges.length}</span>
                    </div>
                    {pendingChanges.slice(0, 3).map(ch => {
                      const stale = doc.currentAdaptedVersionId && ch.versionId && ch.versionId !== doc.currentAdaptedVersionId;
                      return (
                        <div key={ch.id} className={`border rounded p-2 text-xs ${ch.status==='accepted'?'bg-green-500/10': ch.status==='rejected'?'bg-red-500/10':''}`}>
                          <div className="flex gap-2 items-center">
                            <span className="uppercase font-medium text-[10px]">{ch.type}</span>
                            <span className="line-through opacity-70 max-w-[80px] truncate">{ch.before?.slice(0,40)}</span>
                            <span className="opacity-50">→</span>
                            <span className="text-green-700 dark:text-green-300 max-w-[80px] truncate">{ch.after?.slice(0,40)}</span>
                            {stale && <span className="ml-1 px-1 py-0.5 bg-yellow-500/20 text-[9px] rounded">stale</span>}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button className="px-2 py-0.5 border rounded text-[10px] disabled:opacity-40" disabled={ch.status!=='pending' || stale} onClick={()=>acceptChange(ch.id)}>Accept</button>
                            <button className="px-2 py-0.5 border rounded text-[10px] disabled:opacity-40" disabled={ch.status!=='pending'} onClick={()=>rejectChange(ch.id)}>Reject</button>
                          </div>
                        </div>
                      );
                    })}
                    {pendingChanges.length > 3 && (
                      <div className="text-xs text-center opacity-60">... and {pendingChanges.length - 3} more changes</div>
                    )}
                  </div>
                )}
              </div>
            ) : mode === 'diff' ? (
              <div className="p-4 h-full overflow-auto space-y-4" dir={diffDir==='auto'? undefined: diffDir} style={diffDir!=='auto'? { direction: diffDir }: undefined}>
                {markdownView && (
                  <div className="border rounded p-3 text-xs whitespace-pre-wrap bg-panel/30">
                    {htmlToMarkdown(adaptedDraft)}
                  </div>
                )}
                <DiffView
                  original={(doc.directTranslation || '').replace(/<[^>]+>/g,'')}
                  edited={adaptedDraft.replace(/<[^>]+>/g,'')}
                  dir={diffDir === 'auto' ? undefined as any : diffDir}
                  editable={diffEditable}
                  onChange={(val)=> {
                    setAdaptedDraft(val);
                    editor?.commands.setContent(val);
                  }}
                  autoFocus={diffEditable}
                  className={diffEditable ? 'border rounded outline-offset-0 focus:ring-2 ring-accent/60 min-h-40' : ''}
                />
                {diffEditable && <div className="text-[10px] opacity-60">Editing inline: deletions show struck-through red. Insertions appear highlighted. Your edited text is saved to the main draft.</div>}
              </div>
            ) : mode === 'readability' ? (
              <div className="p-4 h-full overflow-auto">
                <ReadabilityPane 
                  text={adaptedDraft}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* REFERENCE PANEL */}
        <div className="col-span-3 flex flex-col border border-default rounded">
          <div className="px-4 py-3 border-b border-default bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold">Reference & QA</h3>
            <div className="flex gap-1">
              <a href={`/api/document/${doc.id}/export?format=docx`} className="text-xs border rounded px-2 py-1 hover:bg-accent/20">DOCX</a>
              <a href={`/api/document/${doc.id}/export?format=pdf`} className="text-xs border rounded px-2 py-1 hover:bg-accent/20">PDF</a>
              <button onClick={()=>downloadMarkdown(adaptedDraft)} className="text-xs border rounded px-2 py-1 hover:bg-accent/20">MD</button>
              <button onClick={()=>downloadRTF(adaptedDraft)} className="text-xs border rounded px-2 py-1 hover:bg-accent/20">RTF</button>
            </div>
          </div>
          
          <Tabs.Root defaultValue="direct" className="flex flex-col h-full">
            <Tabs.List className="flex gap-1 border-b border-default px-3 py-2 bg-muted/20 text-xs">
              <Tabs.Trigger value="direct" className="px-2 py-1 rounded data-[state=active]:bg-accent/30">Direct</Tabs.Trigger>
              <Tabs.Trigger value="glossary" className="px-2 py-1 rounded data-[state=active]:bg-accent/30">Glossary</Tabs.Trigger>
              <Tabs.Trigger value="versions" className="px-2 py-1 rounded data-[state=active]:bg-accent/30">Versions</Tabs.Trigger>
            </Tabs.List>
            
            <Tabs.Content value="direct" className="flex-1 overflow-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Direct Translation</span>
                  <button 
                    onClick={generateDirect} 
                    disabled={generatingDirect} 
                    className="text-xs border rounded px-2 py-1 disabled:opacity-50 hover:bg-accent/20"
                  >
                    {generatingDirect ? 'Generating…' : 'Generate'}
                  </button>
                </div>
                <textarea
                  className="w-full h-40 text-sm border rounded p-3 font-mono mb-2"
                  dir={direction}
                  style={{ direction }}
                  placeholder="Paste or edit baseline (direct/automatic) translation here..."
                  value={doc.directTranslation || ''}
                  onChange={e=> {
                    const val = e.target.value;
                    // optimistic update local doc
                    setDoc(d=> d ? { ...d, directTranslation: val } : d);
                  }}
                  onBlur={async (e)=> {
                    const val = e.target.value;
                    if(!doc) return;
                    // Persist as new direct version via import-direct endpoint
                    if(val && val !== doc.directTranslation) {
                      try {
                        await fetch(`/api/document/${doc.id}/import-direct`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: val }) });
                      } catch {/* ignore */}
                    }
                  }}
                />
                <div className="text-[10px] opacity-60 mb-3">This baseline is used for diff comparisons against the adapted translation.</div>
              </div>
            </Tabs.Content>
            
            <Tabs.Content value="glossary" className="flex-1 overflow-auto">
              <div className="p-3">
                <GlossaryWarningsPanel documentId={doc.id} adaptedHtml={adaptedDraft} onWarnings={setGlossaryWarnings} />
              </div>
            </Tabs.Content>
            
            <Tabs.Content value="versions" className="flex-1 overflow-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Version History</span>
                  <button className="text-xs underline" onClick={fetchVersions}>Refresh</button>
                </div>
                <div className="space-y-2 text-xs">
                  {versions.slice().reverse().slice(0, 10).map(v => {
                    const snippet = (v.content || '').replace(/<[^>]+>/g,'').slice(0,50);
                    const isCurrent = doc.currentAdaptedVersionId === v.id;
                    return (
                      <div key={v.id} className={`border rounded p-2 ${isCurrent? 'ring-1 ring-accent bg-accent/10' : 'hover:bg-muted/40'}`}> 
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{v.type}{isCurrent && ' (current)'}</span>
                          {v.type==='adapted' && !isCurrent && (
                            <button className="text-[10px] underline" onClick={()=>restoreVersion(v.id)}>Restore</button>
                          )}
                        </div>
                        <div className="opacity-70 text-[10px]">{new Date(v.createdAt).toLocaleString()}</div>
                        <div className="opacity-60 text-[10px] truncate mt-1">{snippet}</div>
                      </div>
                    );
                  })}
                  {versions.length === 0 && <div className="text-muted italic">No versions yet</div>}
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
      
      {/* Translation Settings Modal */}
      {showTranslationSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel border border-default rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Translation Settings</h2>
              <button 
                onClick={() => setShowTranslationSettings(false)}
                className="text-xl opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
            
            {/* Inline Settings Form */}
            <div className="space-y-6">
              {/* Audience Configuration */}
              <div>
                <h3 className="text-md font-medium mb-3">Audience Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={audienceConfig.audience}
                      onChange={(e) => setAudienceConfig(prev => ({ ...prev, audience: e.target.value }))}
                      className="w-full px-3 py-2 border border-default rounded"
                      placeholder="e.g., General public, Academic audience, Children"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Adaptation Instructions</label>
                    <textarea
                      value={audienceConfig.prompt}
                      onChange={(e) => setAudienceConfig(prev => ({ ...prev, prompt: e.target.value }))}
                      className="w-full px-3 py-2 border border-default rounded h-20 resize-none"
                      placeholder="Specific instructions for adapting to this audience..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <input
                      type="text"
                      value={audienceConfig.notes}
                      onChange={(e) => setAudienceConfig(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-default rounded"
                      placeholder="Additional notes or context"
                    />
                  </div>
                </div>
              </div>
              
              {/* Guidelines */}
              <div>
                <h3 className="text-md font-medium mb-3">Translation Guidelines</h3>
                <textarea
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  className="w-full px-3 py-2 border border-default rounded h-32 resize-none"
                  placeholder="Enter translation guidelines, style preferences, or specific instructions..."
                />
              </div>
              
              {/* Reference Material */}
              <div>
                <h3 className="text-md font-medium mb-3">Reference Material</h3>
                <textarea
                  value={referenceMaterial}
                  onChange={(e) => setReferenceMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-default rounded h-32 resize-none"
                  placeholder="Add reference material, context, or background information..."
                />
              </div>
              
              {/* Prompt Settings */}
              <div>
                <h3 className="text-md font-medium mb-3">Advanced Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Prompt Override</label>
                    <textarea
                      value={promptSettings.override}
                      onChange={(e) => setPromptSettings(prev => ({ ...prev, override: e.target.value }))}
                      className="w-full px-3 py-2 border border-default rounded h-20 resize-none"
                      placeholder="Override the default prompt with custom instructions..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={promptSettings.toggles.preserveParagraphs}
                        onChange={(e) => setPromptSettings(prev => ({ 
                          ...prev, 
                          toggles: { ...prev.toggles, preserveParagraphs: e.target.checked }
                        }))}
                      />
                      <span className="text-sm">Preserve Paragraphs</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={promptSettings.toggles.shorterSentences}
                        onChange={(e) => setPromptSettings(prev => ({ 
                          ...prev, 
                          toggles: { ...prev.toggles, shorterSentences: e.target.checked }
                        }))}
                      />
                      <span className="text-sm">Shorter Sentences</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={promptSettings.toggles.plainVerbs}
                        onChange={(e) => setPromptSettings(prev => ({ 
                          ...prev, 
                          toggles: { ...prev.toggles, plainVerbs: e.target.checked }
                        }))}
                      />
                      <span className="text-sm">Plain Verbs</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Manager Modal */}
      {showSessionManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel border border-default rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Session Manager</h2>
              <button 
                onClick={() => setShowSessionManager(false)}
                className="text-xl opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Current Session</h3>
              <div className="text-sm space-y-2">
                <div><strong>Source:</strong> {editableSource.slice(0, 100)}...</div>
                <div><strong>Translation:</strong> {adaptedDraft.slice(0, 100)}...</div>
                <div><strong>Model:</strong> {model}</div>
              </div>
              
              {conversationHistory.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recent Translations</h3>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {conversationHistory.slice(-5).map(item => (
                      <div key={item.id} className="border rounded p-2 text-sm">
                        <div className="font-medium">{new Date(item.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs opacity-70">{item.sourceText.slice(0, 50)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Glossary Upload Modal */}
      {showGlossaryUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel border border-default rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Glossary Management</h2>
              <button 
                onClick={() => setShowGlossaryUpload(false)}
                className="text-xl opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV or add terms manually</label>
                <textarea
                  className="w-full h-32 border border-default rounded p-3 text-sm"
                  placeholder="Hebrew,English,Note&#10;שלום,hello,greeting&#10;בית,house,building"
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    const terms = lines.map(line => {
                      const parts = line.split(',');
                      return {
                        hebrew: parts[0]?.trim() || '',
                        chosen_english: parts[1]?.trim() || '',
                        note: parts[2]?.trim() || ''
                      };
                    }).filter(t => t.hebrew && t.chosen_english);
                    setGlossary(terms);
                  }}
                />
              </div>
              <div className="text-sm">
                <strong>Current glossary:</strong> {glossary.length} terms
                {glossary.slice(0, 3).map((term, i) => (
                  <div key={i} className="text-xs opacity-70">{term.hebrew} → {term.chosen_english}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Guidelines Modal */}
      {showGuidelinesUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel border border-default rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Translation Guidelines</h2>
              <button 
                onClick={() => setShowGuidelinesUploader(false)}
                className="text-xl opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              className="w-full h-64 border border-default rounded p-3 text-sm"
              placeholder="Enter translation guidelines, style preferences, or specific instructions..."
            />
          </div>
        </div>
      )}
      
      {/* Reference Material Modal */}
      {showReferenceMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel border border-default rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reference Material</h2>
              <button 
                onClick={() => setShowReferenceMaterial(false)}
                className="text-xl opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
            <textarea
              value={referenceMaterial}
              onChange={(e) => setReferenceMaterial(e.target.value)}
              className="w-full h-64 border border-default rounded p-3 text-sm"
              placeholder="Add reference material, context, or background information..."
            />
          </div>
        </div>
      )}
    </div>
    <Toasts toasts={toasts} />
    </>
  );
}

// --- Helper utilities (Markdown/RTF export & HTML to Markdown) ---
function htmlToMarkdown(html: string): string {
  // Very naive conversion suitable for preview only
  return html
    .replace(/<\/?(div|span|body|html)>/gi,'')
    .replace(/<br\s*\/?>(\s*<br\s*\/?>)*/gi,'\n')
    .replace(/<p>/gi,'\n\n')
    .replace(/<\/p>/gi,'')
    .replace(/<strong>(.*?)<\/strong>/gi,'**$1**')
    .replace(/<em>(.*?)<\/em>/gi,'*$1*')
    .replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi,'## $1\n\n')
    .replace(/<[^>]+>/g,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

function downloadMarkdown(html: string) {
  const md = htmlToMarkdown(html);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'translation.md'; a.click();
  URL.revokeObjectURL(url);
}

function downloadRTF(html: string) {
  // Minimal RTF: wrap plain text (strip HTML)
  const text = html.replace(/<[^>]+>/g,'');
  const rtfHeader = '{\\rtf1\\ansi\n';
  const rtfBody = text
    .replace(/\\/g,'\\\\')
    .replace(/\{/g,'\\{')
    .replace(/\}/g,'\\}')
    .replace(/\n/g,'\\par\n');
  const rtf = rtfHeader + rtfBody + '}';
  const blob = new Blob([rtf], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'translation.rtf'; a.click();
  URL.revokeObjectURL(url);
}

function VersionInlineDiff({ baseId, versions, currentHtml, onClose }: { baseId: string; versions: any[]; currentHtml: string; onClose: ()=>void }) {
  const base = versions.find(v=>v.id===baseId);
  if(!base) return null;
  const baseText = (base.content || '').replace(/<[^>]+>/g,'');
  const currentText = (currentHtml || '').replace(/<[^>]+>/g,'');
  const ops = diffWords(baseText, currentText);
  return (
    <div className="mt-4 border-t pt-3 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">Version Diff vs selected ({new Date(base.createdAt).toLocaleTimeString()})</span>
        <button className="text-[10px] underline" onClick={onClose}>Close</button>
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">
        {ops.map((op,i)=> {
          if(op.type==='equal') return <span key={i}>{op.text}</span>;
          if(op.type==='insert') return <span key={i} className="bg-green-400/30 rounded-sm">{op.text}</span>;
          if(op.type==='delete') return <span key={i} className="bg-red-400/30 line-through rounded-sm opacity-80">{op.text}</span>;
          return null;
        })}
      </div>
    </div>
  );
}

function StatusBadge() {
  const [status, setStatus] = useState<{demoMode:boolean; hasApiKey:boolean; model:string}|null>(null);
  useEffect(()=>{ fetch('/api/status').then(r=>r.json()).then(setStatus).catch(()=>{}); },[]);
  if(!status) return <span className="px-2 py-1 text-[10px] rounded bg-muted/40">…</span>;
  return (
    <span className={`px-2 py-1 text-[10px] rounded font-medium ${status.demoMode? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300':'bg-green-500/20 text-green-700 dark:text-green-300'}`}
      title={status.demoMode? 'Demo mode (no API key). Set OPENAI_API_KEY in env for real translations.' : `Live model: ${status.model}`}
    >
      {status.demoMode? 'DEMO' : 'LIVE'}
    </span>
  );
}
