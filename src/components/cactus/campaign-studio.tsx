'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { VariantCard } from './variant-card';
import {
  PROFILES, PROFILE_ORDER, OBJECTIVES, CHANNELS,
  type ProfileKey,
} from '@/lib/eq/profiles';
import type { AngleVariant } from '@/lib/eq/generate';

interface Result {
  variants: AngleVariant[];
  objective: string;
  channel: string;
  usage: { credits: number; costUsd: number; model: string };
}

export function CampaignStudio() {
  const [brand, setBrand] = useState({ brandName: '', offer: '', audience: '', tone: '', brief: '' });
  const [objective, setObjective] = useState('deseo');
  const [channel, setChannel] = useState('instagram');
  const [profiles, setProfiles] = useState<ProfileKey[]>([...PROFILE_ORDER]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function toggleProfile(k: ProfileKey) {
    setProfiles((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  async function generate() {
    setError(null);
    if (!brand.brandName || !brand.offer || !brand.brief) {
      setError('Completa al menos: marca, qué ofrece y la idea a comunicar.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/cactus/eq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, objective, channel, profiles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none';

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Panel de brief */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-4 lg:self-start">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <div>
            <h2 className="font-display font-semibold leading-tight">Peyote · Estratega Emocional</h2>
            <p className="text-xs text-muted-foreground">Un mensaje, un gatillo por perfil.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Marca</label>
            <input className={field} value={brand.brandName} onChange={(e) => setBrand({ ...brand, brandName: e.target.value })} placeholder="ROWI" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">¿Qué ofrece?</label>
            <textarea className={field} rows={2} value={brand.offer} onChange={(e) => setBrand({ ...brand, offer: e.target.value })} placeholder="Plataforma de IA emocional sobre Six Seconds." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Audiencia</label>
            <input className={field} value={brand.audience} onChange={(e) => setBrand({ ...brand, audience: e.target.value })} placeholder="Líderes de RRHH y coaches en LATAM" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tono de marca <span className="opacity-60">(opcional)</span></label>
            <input className={field} value={brand.tone} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Cálido, humano, con autoridad" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Idea / mensaje a comunicar</label>
            <textarea className={field} rows={3} value={brand.brief} onChange={(e) => setBrand({ ...brand, brief: e.target.value })} placeholder="Lanzamiento: la práctica diaria que transforma tus relaciones." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Objetivo</label>
              <select className={field} value={objective} onChange={(e) => setObjective(e.target.value)}>
                {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Canal</label>
              <select className={field} value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Perfiles a generar ({profiles.length})</label>
            <div className="flex flex-wrap gap-1.5">
              {PROFILE_ORDER.map((k) => {
                const p = PROFILES[k];
                const on = profiles.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleProfile(k)}
                    className="rounded-full px-2 py-1 text-[11px] font-medium transition-all"
                    style={on ? { backgroundColor: p.color, color: 'white' } : { backgroundColor: p.color + '15', color: p.color, opacity: 0.7 }}
                  >
                    {p.emoji} {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        <button
          onClick={generate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-cactus-green py-2.5 text-sm font-medium text-white transition-colors hover:bg-cactus-green/90 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando…</> : <><Sparkles className="h-4 w-4" /> Generar campaña</>}
        </button>
      </div>

      {/* Resultados */}
      <div>
        {!result && !loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <span className="text-3xl">🌵</span>
            <p className="mt-2 max-w-xs">Llena el brief y Peyote escribirá una variante por perfil emocional — cada una con su gatillo.</p>
          </div>
        )}
        {loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-cactus-green" />
            <p className="mt-2">Generando {profiles.length} ángulos emocionales…</p>
          </div>
        )}
        {result && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-display font-semibold">{result.variants.length} variantes</span>
              <span className="text-muted-foreground">Objetivo: {result.objective}</span>
              <span className="text-muted-foreground">Canal: {result.channel}</span>
              <span className="ml-auto rounded-full bg-cactus-green/10 px-2.5 py-0.5 text-xs font-medium text-cactus-green">
                {result.usage.credits} créditos · ${result.usage.costUsd.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.variants.map((v) => <VariantCard key={v.profile} v={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
