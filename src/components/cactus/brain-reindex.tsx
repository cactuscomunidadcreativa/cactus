'use client';

import { useEffect, useState } from 'react';
import { Brain, Loader2, RefreshCw } from 'lucide-react';

export function BrainReindex() {
  const [stats, setStats] = useState<{ chunks: number; embedded: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    try { const r = await fetch('/api/cactus/brain/index'); setStats(await r.json()); } catch { /* noop */ }
  }
  useEffect(() => { load(); }, []);

  async function reindex() {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/cactus/brain/index', { method: 'POST' });
      const d = await r.json();
      if (d.ok) setMsg(`Indexados ${d.chunks} fragmentos${d.embedded ? ' (con embeddings semánticos).' : ' (modo texto — falta key de embeddings).'}`);
      else setMsg(d.error || 'No se pudo indexar. ¿Desplegaste la base (botón) y tienes empresa activa?');
      await load();
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cactus-green/10 text-cactus-green"><Brain className="h-4 w-4" /></span>
        <h2 className="font-display font-semibold">Cerebro RAG</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Indexa tu marca y conocimiento en vectores para que cada agente recupere solo lo relevante a su rol (scoping por agente).
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{stats ? `${stats.chunks} fragmentos · ${stats.embedded} con embedding` : '…'}</span>
        <button onClick={reindex} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cactus-green px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reindexar
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
    </section>
  );
}
