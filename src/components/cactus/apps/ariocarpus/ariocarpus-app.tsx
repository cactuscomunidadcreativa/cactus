'use client';

import { useState } from 'react';
import {
  UserCircle2, Sparkles, Wand2, Loader2, Download, RefreshCw, ImagePlus, FileText, Plug,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';

interface AriocarpusAgent { slug: string; name: string; role: string; color: string; image: string }

const ROLES = ['Vendedor / asesor', 'Presentador', 'Influencer virtual', 'Embajador de marca', 'Atención al cliente', 'Educador'];
const ESTILOS = ['Realista', '3D / Pixar', 'Ilustración', 'Anime'];
const FORMATOS: { key: 'square' | 'story'; label: string }[] = [{ key: 'square', label: 'Cuadrado' }, { key: 'story', label: 'Retrato' }];

interface Gen { url: string; createdAt: number }

export function AriocarpusApp({ agent, user, credits }: { agent: AriocarpusAgent; user?: ShellUser; credits?: number }) {
  const c = agent.color;
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState(ROLES[0]);
  const [estilo, setEstilo] = useState(ESTILOS[0]);
  const [formato, setFormato] = useState<'square' | 'story'>('square');
  const [apariencia, setApariencia] = useState('');

  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Gen[]>([]);

  const [persona, setPersona] = useState<string | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);

  function buildPrompt() {
    const mode = estilo === 'Ilustración' || estilo === 'Anime' ? 'character' : 'photo';
    const look = apariencia.trim() || 'persona carismática, profesional';
    const styleHint = estilo === '3D / Pixar' ? 'render 3D estilizado tipo Pixar' : estilo === 'Anime' ? 'estilo anime' : estilo === 'Ilustración' ? 'ilustración digital limpia' : 'fotorrealista';
    const brief = `Avatar / humano digital de marca${nombre.trim() ? ` llamado ${nombre.trim()}` : ''}, rol de ${rol}. ${look}. ${styleHint}, retrato de medio cuerpo, mirada a cámara, fondo limpio neutro, iluminación profesional, consistente para usar como avatar de marca.`;
    return { mode, brief };
  }

  async function generate() {
    if (genLoading) return;
    setGenLoading(true); setGenError(null);
    const { mode, brief } = buildPrompt();
    try {
      const res = await fetch('/api/cactus/design', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, mode, format: formato, style: 'natural', brandName: nombre.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el avatar.');
      setGallery((g) => [{ url: data.url, createdAt: Date.now() }, ...g]);
    } catch (e: any) { setGenError(e?.message || 'Error'); } finally { setGenLoading(false); }
  }

  async function makePersona() {
    if (personaLoading) return;
    setPersonaLoading(true);
    const prompt =
      `Eres Ariocarpus. Crea la ficha de personaje de un avatar de marca${nombre.trim() ? ` llamado ${nombre.trim()}` : ''}, rol ${rol}.\n` +
      `Apariencia: ${apariencia.trim() || 'a tu criterio, coherente con el rol'}.\n` +
      `Incluye: 1) Identidad y personalidad, 2) Tono de voz, 3) Mini biografía/historia, 4) Guion de presentación (30s). Cálido y consistente. Sin preámbulo.`;
    try {
      const res = await fetch('/api/cactus/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 900 }) });
      const data = await res.json();
      if (res.ok) setPersona(String(data.content || '').trim());
    } finally { setPersonaLoading(false); }
  }

  function download(url: string) {
    const a = document.createElement('a'); a.href = url; a.download = `avatar-${nombre.trim() || 'cactus'}.png`; a.target = '_blank'; a.rel = 'noopener'; a.click();
  }

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'crear', label: 'Crear avatar', icon: UserCircle2 },
    { key: 'voz', label: 'Ponerle voz (Garambullo)', icon: Plug, href: '/voice', section: 'Siguiente' },
  ];
  const kpis: Kpi[] = [
    { label: 'Avatares', value: gallery.length, icon: <UserCircle2 className="h-4 w-4" /> },
    { label: 'Variaciones', value: gallery.length, icon: <ImagePlus className="h-4 w-4" /> },
    { label: 'Ficha', value: persona ? '1' : '—', icon: <FileText className="h-4 w-4" /> },
    { label: 'Video', value: '—', icon: <Sparkles className="h-4 w-4" />, hint: 'Animar = Fase F' },
  ];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav="crear" onNav={() => {}}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🧑‍🚀`}
      subtitle="Avatares y humanos digitales con Ariocarpus"
    >
      <KpiRow items={kpis} accent={c} />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Brief */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Diseña tu avatar</h3>
          <Field label="Nombre"><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Valentina" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
          <Field label="Rol"><select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estilo"><select value={estilo} onChange={(e) => setEstilo(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{ESTILOS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Formato"><select value={formato} onChange={(e) => setFormato(e.target.value as 'square' | 'story')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none">{FORMATOS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select></Field>
          </div>
          <Field label="Apariencia"><textarea value={apariencia} onChange={(e) => setApariencia(e.target.value)} rows={3} placeholder="Edad, género, vestuario, rasgos, vibra de marca…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></Field>
          <button onClick={generate} disabled={genLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {gallery.length ? 'Generar variación' : 'Crear avatar'}</button>
          {genError && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{genError}</p>}
          <button onClick={makePersona} disabled={personaLoading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">{personaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" style={{ color: c }} />} Generar ficha / persona</button>
        </div>

        {/* Resultado */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">Tu avatar</h3>
            {genLoading && gallery.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando tu avatar…</div>
            ) : gallery.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><UserCircle2 className="h-9 w-9 opacity-50" /><p className="max-w-xs text-sm">Describe a tu avatar y Ariocarpus lo crea de verdad (imagen real).</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((g, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt="avatar" className="aspect-square w-full object-cover" />
                    <button onClick={() => download(g.url)} className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium opacity-0 shadow transition-opacity group-hover:opacity-100"><Download className="h-3.5 w-3.5" /> PNG</button>
                  </div>
                ))}
                {genLoading && <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              </div>
            )}
            {gallery.length > 0 && (
              <button onClick={generate} disabled={genLoading} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: c }}><RefreshCw className="h-4 w-4" /> Generar otra variación</button>
            )}
          </div>

          {persona && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-2 font-display font-semibold">Ficha del personaje</h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{persona}</div>
            </div>
          )}
        </div>
      </div>

      <QuickActionsBar accent={c} actions={[
        { label: 'Crear avatar', icon: UserCircle2, onClick: generate },
        { label: 'Ponerle voz (Garambullo)', icon: Plug, href: '/voice' },
        { label: 'Animarlo (Candelabro)', icon: Sparkles, href: '/apps/candelabro' },
      ]} />
    </AgentAppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="mb-3"><label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>{children}</div>);
}
