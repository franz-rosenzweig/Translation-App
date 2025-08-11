'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DocDTO { id: string; title: string; sourceLanguage: string; targetLanguage: string; updatedAt: string; }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocDTO[]>([]);
  // Use full language identifiers matching /api/process expectations
  const [form, setForm] = useState({ title: '', sourceLanguage: 'hebrew', targetLanguage: 'english', sourceText: '' });
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch('/api/document');
    const data = await res.json();
    setDocs(data.documents || []);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/document', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setCreating(false);
    if(data.document){
      setDocs(prev => [data.document, ...prev]);
      setForm({ ...form, title:'', sourceText:'' });
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-8 overflow-auto">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <form onSubmit={create} className="space-y-3 max-w-xl">
        <input className="w-full rounded border border-default px-3 py-2 bg-panel" placeholder="Title (optional)" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
        <div className="flex gap-3">
          <select className="border border-default rounded px-2 py-1 bg-panel" value={form.sourceLanguage} onChange={e=>setForm(f=>({...f,sourceLanguage:e.target.value}))}>
            <option value="hebrew">Hebrew</option>
            <option value="english">English</option>
          </select>
          <span className="self-center">→</span>
          <select className="border border-default rounded px-2 py-1 bg-panel" value={form.targetLanguage} onChange={e=>setForm(f=>({...f,targetLanguage:e.target.value}))}>
            <option value="english">English</option>
            <option value="hebrew">Hebrew</option>
          </select>
        </div>
        <textarea className="w-full h-40 rounded border border-default px-3 py-2 font-mono text-sm bg-panel" placeholder="Paste source text…" value={form.sourceText} onChange={e=>setForm(f=>({...f,sourceText:e.target.value}))} required />
        <button disabled={creating} className="px-4 py-2 rounded bg-accent text-accent-foreground text-sm font-medium disabled:opacity-60">
          {creating ? 'Creating…' : 'Create Document'}
        </button>
      </form>
      <div className="space-y-2 pb-8">
        {docs.map(d => (
          <Link key={d.id} href={`/documents/${d.id}`} className="block border border-default rounded px-4 py-3 hover:bg-accent/10 transition-colors">
            <div className="font-medium">{d.title || 'Untitled'}</div>
            <div className="text-xs text-muted">{d.sourceLanguage} → {d.targetLanguage} • Updated {new Date(d.updatedAt).toLocaleString()}</div>
          </Link>
        ))}
        {docs.length === 0 && <div className="text-sm text-muted">No documents yet</div>}
      </div>
    </div>
  );
}
