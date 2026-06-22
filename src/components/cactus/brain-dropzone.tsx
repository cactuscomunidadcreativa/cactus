'use client';

// Drag & drop de contenido al Cerebro: arrastra archivos de texto, pega texto
// o añade una URL. Lo guarda como conocimiento y lo indexa para el RAG.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Loader2, Check, FileText, Type, Link2 } from 'lucide-react';
import { extractText } from '@/lib/cactus/doc-extract';

export function BrainDropzone() {
  const router = useRouter();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<'file' | 'text' | 'url'>('file');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(items: { title: string; content?: string; kind?: string; sourceUrl?: string }[]) {
    if (items.length === 0) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/cactus/brain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo añadir.');
      setMsg({ ok: true, text: `Añadido al Cerebro (${d.added}). Indexado para los agentes.` });
      setTitle(''); setText(''); setUrl('');
      router.refresh();
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'Error' }); }
    finally { setBusy(false); }
  }

  async function handleFiles(files: File[]) {
    setBusy(true); setMsg(null);
    try {
      const items: { title: string; content: string; kind: string }[] = [];
      const failed: string[] = [];
      for (const f of files) {
        if (/\.docx?$/i.test(f.name)) { failed.push(f.name); continue; } // Word aún no
        let content = '';
        try { content = (await extractText(f)).slice(0, 100000); } catch { /* noop */ }
        if (content.trim()) items.push({ title: f.name, content, kind: f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? 'pdf' : 'doc' });
        else failed.push(f.name);
      }
      if (items.length) await send(items);
      else setBusy(false);
      if (failed.length) {
        setMsg({ ok: items.length > 0, text: `${items.length ? `Añadí ${items.length}. ` : ''}No pude leer: ${failed.join(', ')}. (Word/.docx aún no; pega el texto.)` });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'No pude procesar el archivo.' });
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleFiles(files);
  }

  const tabCls = (t: string) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-cactus-green text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setTab('file')} className={tabCls('file')}><FileText className="h-3.5 w-3.5" /> Archivo</button>
        <button onClick={() => setTab('text')} className={tabCls('text')}><Type className="h-3.5 w-3.5" /> Pegar texto</button>
        <button onClick={() => setTab('url')} className={tabCls('url')}><Link2 className="h-3.5 w-3.5" /> URL</button>
      </div>

      {tab === 'file' && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!drag) setDrag(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
          style={{ borderColor: drag ? '#0D6E4F' : 'var(--border)', backgroundColor: drag ? '#0D6E4F12' : 'transparent' }}
        >
          {busy ? <Loader2 className="h-7 w-7 animate-spin text-cactus-green" /> : <UploadCloud className="h-7 w-7 text-cactus-green" />}
          <p className="text-sm font-medium">{drag ? 'Suelta el contenido aquí…' : 'Arrastra archivos o haz clic'}</p>
          <p className="text-[11px] text-muted-foreground">PDF, imágenes (con OCR), Excel, .txt, .md, .csv — el Cerebro lo aprende</p>
          <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.log,.rtf,.vtt,.srt,.xlsx,.xls,.ods,image/*,text/*,application/pdf" hidden onChange={(e) => { const f = Array.from(e.target.files || []); if (fileRef.current) fileRef.current.value = ''; if (f.length) handleFiles(f); }} />
        </div>
      )}

      {tab === 'text' && (
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ej. Tono de marca)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Pega aquí el contenido que quieres que tus agentes conozcan…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={() => send([{ title: title.trim() || 'Nota', content: text.trim(), kind: 'note' }])} disabled={busy || !text.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cactus-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Añadir al Cerebro
          </button>
        </div>
      )}

      {tab === 'url' && (
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ej. Mi web)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <button onClick={() => send([{ title: title.trim() || url, sourceUrl: url.trim(), kind: 'url' }])} disabled={busy || !url.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cactus-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar URL
          </button>
        </div>
      )}

      {msg && <p className={`mt-2 rounded px-3 py-2 text-xs ${msg.ok ? 'bg-cactus-green/10 text-cactus-green' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}
