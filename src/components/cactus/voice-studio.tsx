'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Download, Upload, UserPlus, Sparkles } from 'lucide-react';

const OPENAI_VOICES = [
  { key: 'nova', label: 'Nova (cálida)' },
  { key: 'alloy', label: 'Alloy (neutra)' },
  { key: 'shimmer', label: 'Shimmer (suave)' },
  { key: 'onyx', label: 'Onyx (grave)' },
  { key: 'echo', label: 'Echo (clara)' },
  { key: 'fable', label: 'Fable (narrador)' },
];

interface ElVoice { id: string; name: string; cloned: boolean }

export function VoiceStudio() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');        // OpenAI
  const [voiceId, setVoiceId] = useState('');         // ElevenLabs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ audio: string; credits: number; costUsd: number } | null>(null);

  // ElevenLabs
  const [elEnabled, setElEnabled] = useState(false);
  const [elVoices, setElVoices] = useState<ElVoice[]>([]);
  const [cloneName, setCloneName] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none';

  async function loadVoices() {
    try {
      const r = await fetch('/api/cactus/voice/voices');
      const d = await r.json();
      setElEnabled(!!d.enabled);
      setElVoices(d.voices || []);
      if (d.enabled && d.voices?.length && !voiceId) setVoiceId(d.voices[0].id);
    } catch { /* noop */ }
  }
  useEffect(() => { loadVoices(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function generate() {
    if (!text.trim()) { setError('Escribe el texto a locutar.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = elEnabled && voiceId ? { text, voiceId } : { text, voice };
      const res = await fetch('/api/cactus/voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function clone() {
    if (!cloneName.trim()) { setCloneMsg('Ponle un nombre a tu voz.'); return; }
    if (cloneFiles.length === 0) { setCloneMsg('Sube al menos una muestra de audio.'); return; }
    setCloning(true); setCloneMsg(null);
    try {
      const fd = new FormData();
      fd.append('name', cloneName.trim());
      cloneFiles.forEach((f) => fd.append('files', f));
      const res = await fetch('/api/cactus/voice/clone', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setCloneMsg(`✓ Voz "${data.name}" creada. Ya puedes elegirla arriba.`);
      setCloneName(''); setCloneFiles([]); if (fileRef.current) fileRef.current.value = '';
      await loadVoices();
      if (data.voiceId) setVoiceId(data.voiceId);
    } catch (e: any) { setCloneMsg(e.message); }
    finally { setCloning(false); }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <div>
            <h2 className="font-display font-semibold leading-tight">Garambullo · Voz</h2>
            <p className="text-xs text-muted-foreground">Tu guion, convertido en locución{elEnabled ? ' — con voces premium y tu voz clonada' : ''}.</p>
          </div>
        </div>
        <textarea className={field} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí el guion de tu reel, podcast o anuncio…" maxLength={4000} />
        <div className="flex items-center gap-3">
          {elEnabled && elVoices.length > 0 ? (
            <select className={field + ' max-w-xs'} value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
              <optgroup label="Mis voces / clonadas">
                {elVoices.filter((v) => v.cloned).map((v) => <option key={v.id} value={v.id}>⭐ {v.name}</option>)}
              </optgroup>
              <optgroup label="Voces ElevenLabs">
                {elVoices.filter((v) => !v.cloned).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            </select>
          ) : (
            <select className={field + ' max-w-xs'} value={voice} onChange={(e) => setVoice(e.target.value)}>
              {OPENAI_VOICES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          )}
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

      {/* Mi voz — clonación */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-cactus-green" />
          <h3 className="font-display font-semibold leading-tight">Tu propia voz</h3>
        </div>
        {elEnabled ? (
          <>
            <p className="text-xs text-muted-foreground">Sube 1-3 minutos de tu voz hablando claro (mp3/wav). La clonamos y podrás locutar con ella.</p>
            <input value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder="Nombre de tu voz (ej. Eduardo)" className={field} />
            <input ref={fileRef} type="file" accept="audio/*" multiple onChange={(e) => setCloneFiles(Array.from(e.target.files || []))} className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm" />
            {cloneFiles.length > 0 && <p className="text-[11px] text-muted-foreground">{cloneFiles.length} archivo(s) listo(s)</p>}
            <button onClick={clone} disabled={cloning} className="inline-flex items-center justify-center gap-2 rounded-md border border-cactus-green px-4 py-2 text-sm font-medium text-cactus-green hover:bg-cactus-green/10 disabled:opacity-60">
              {cloning ? <><Loader2 className="h-4 w-4 animate-spin" /> Clonando…</> : <><Upload className="h-4 w-4" /> Clonar mi voz</>}
            </button>
            {cloneMsg && <p className="rounded bg-muted/50 px-3 py-2 text-xs text-foreground/80">{cloneMsg}</p>}
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cactus-green" />
            <span>Para subir y clonar tu voz, conecta <span className="font-medium text-foreground">ElevenLabs</span> en Conexiones. Mientras tanto, usa las voces estándar de arriba.</span>
          </div>
        )}
      </div>
    </div>
  );
}
