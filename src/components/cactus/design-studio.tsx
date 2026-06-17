'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Wand2, Download } from 'lucide-react';

const FORMATS = [
  { key: 'square', label: 'Cuadrado (post)' },
  { key: 'story', label: 'Vertical (story)' },
  { key: 'wide', label: 'Horizontal (banner)' },
];

export function DesignStudio() {
  const [brief, setBrief] = useState('');
  const [brandName, setBrandName] = useState('');
  const [format, setFormat] = useState('square');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; revisedPrompt: string; credits: number; costUsd: number } | null>(null);

  const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none';

  async function generate() {
    if (!brief.trim()) { setError('Describe la pieza a diseñar.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/cactus/design', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, brandName, format, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <div>
            <h2 className="font-display font-semibold leading-tight">Cardón · Diseño</h2>
            <p className="text-xs text-muted-foreground">Describe la pieza, yo la diseño.</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">¿Qué pieza necesitas?</label>
          <textarea className={field} rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Post para anunciar el lanzamiento de ROWI: lotus tecnológico, verde y calma, tono inspirador." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Marca <span className="opacity-60">(opcional)</span></label>
          <input className={field} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="ROWI" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Formato</label>
            <select className={field} value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Estilo</label>
            <select className={field} value={style} onChange={(e) => setStyle(e.target.value as any)}>
              <option value="vivid">Vibrante</option>
              <option value="natural">Natural</option>
            </select>
          </div>
        </div>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        <button onClick={generate} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-cactus-green py-2.5 text-sm font-medium text-white hover:bg-cactus-green/90 disabled:opacity-60">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Diseñando…</> : <><Wand2 className="h-4 w-4" /> Generar pieza</>}
        </button>
      </div>

      <div>
        {!result && !loading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <span className="text-3xl">🎨</span>
            <p className="mt-2 max-w-xs">Describe tu pieza y Cardón la genera en segundos.</p>
          </div>
        )}
        {loading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-cactus-green" />
            <p className="mt-2">Generando tu diseño…</p>
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="rounded-full bg-cactus-green/10 px-2.5 py-0.5 text-xs font-medium text-cactus-green">{result.credits} créditos · ${result.costUsd.toFixed(4)}</span>
              <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cactus-green hover:underline"><Download className="h-3 w-3" /> Abrir / descargar</a>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-border" style={{ aspectRatio: format === 'story' ? '1024/1792' : format === 'wide' ? '1792/1024' : '1/1' }}>
              <Image src={result.url} alt="Diseño generado" fill className="object-contain" sizes="60vw" unoptimized />
            </div>
            <p className="text-[11px] text-muted-foreground">{result.revisedPrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
