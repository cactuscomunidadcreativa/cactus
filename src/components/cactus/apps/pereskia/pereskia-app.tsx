'use client';

import { useState } from 'react';
import { Music, Wand2, Loader2, Download, Sparkles } from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';
import { getSubAgents } from '@/lib/cactus/sub-agents';

interface PereskiaAgent { slug: string; name: string; role: string; color: string; image: string }

const PRESETS = [
  'Lo-fi hip hop relajado, piano suave, batería tranquila, para concentrarse',
  'Corporativo inspirador, piano y cuerdas, crescendo, para un video de marca',
  'Pop alegre y enérgico, sintetizadores brillantes, para un reel',
  'Jingle corto y pegajoso para una marca de café, ukelele',
];

export function PereskiaApp({ agent, user, credits }: { agent: PereskiaAgent; user?: ShellUser; credits?: number }) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(12);
  const [subAgent, setSubAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; credits: number; costUsd: number } | null>(null);

  const c = agent.color;
  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [{ key: 'crear', label: 'Crear música', icon: Music }];

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    const focus = subAgent ? getSubAgents(agent.slug).find((s) => s.key === subAgent)?.focus : '';
    const full = focus ? `${focus} ${prompt.trim()}` : prompt.trim();
    try {
      const res = await fetch('/api/cactus/music', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: full, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar la música.');
      setResult(data);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav="crear" user={user} credits={credits}
      greeting={`¡Hola${firstName ? `, ${firstName}` : ''}! 🌵`}
      subtitle="Música y jingles a tu medida con Pereskia."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Crear música</h3>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">¿Qué música quieres?</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Ej. lo-fi relajado con piano para un video de producto…"
            className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setPrompt(p)} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted">{p.split(',')[0]}</button>
            ))}
          </div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Duración: {duration}s</label>
          <input type="range" min={5} max={30} step={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mb-3 w-full" />
          <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={c} />
          <button onClick={generate} disabled={loading || !prompt.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{loading ? 'Componiendo…' : 'Generar música'}
          </button>
          {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">Resultado</h3>
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: c + '14', color: c }}><Sparkles className="h-6 w-6" /></span>
              <p className="max-w-xs text-sm text-muted-foreground">Describe la música y Pereskia la compone. Puedes descargarla en MP3.</p>
            </div>
          )}
          {loading && <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Componiendo tu pista…</div>}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: c + '1a', color: c }}>{result.credits} créditos · ${result.costUsd.toFixed(4)}</span>
                <a href={result.url} download="pereskia-musica.mp3" className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: c }}><Download className="h-3 w-3" /> Descargar MP3</a>
              </div>
              <audio controls src={result.url} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </AgentAppShell>
  );
}
