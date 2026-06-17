'use client';

import { useState } from 'react';
import { Loader2, Mic, Download } from 'lucide-react';

const VOICES = [
  { key: 'nova', label: 'Nova (cálida)' },
  { key: 'alloy', label: 'Alloy (neutra)' },
  { key: 'shimmer', label: 'Shimmer (suave)' },
  { key: 'onyx', label: 'Onyx (grave)' },
  { key: 'echo', label: 'Echo (clara)' },
  { key: 'fable', label: 'Fable (narrador)' },
];

export function VoiceStudio() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ audio: string; credits: number; costUsd: number } | null>(null);

  const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none';

  async function generate() {
    if (!text.trim()) { setError('Escribe el texto a locutar.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/cactus/voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <div>
            <h2 className="font-display font-semibold leading-tight">Garambullo · Voz</h2>
            <p className="text-xs text-muted-foreground">Tu guion, convertido en locución.</p>
          </div>
        </div>
        <textarea className={field} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí el guion de tu reel, podcast o anuncio…" maxLength={4000} />
        <div className="flex items-center gap-3">
          <select className={field + ' max-w-xs'} value={voice} onChange={(e) => setVoice(e.target.value)}>
            {VOICES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{text.length}/4000</span>
        </div>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <button onClick={generate} disabled={loading} className="flex items-center justify-center gap-2 rounded-md bg-cactus-green px-4 py-2.5 text-sm font-medium text-white hover:bg-cactus-green/90 disabled:opacity-60">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando voz…</> : <><Mic className="h-4 w-4" /> Generar locución</>}
        </button>
      </div>

      {result && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-cactus-green/10 px-2.5 py-0.5 text-xs font-medium text-cactus-green">{result.credits} créditos · ${result.costUsd.toFixed(4)}</span>
            <a href={result.audio} download="garambullo-voz.mp3" className="inline-flex items-center gap-1 text-xs text-cactus-green hover:underline"><Download className="h-3 w-3" /> Descargar MP3</a>
          </div>
          <audio controls src={result.audio} className="w-full" />
        </div>
      )}
    </div>
  );
}
