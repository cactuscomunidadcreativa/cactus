'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Presentation, LayoutList, Plus, Sparkles, Loader2, Send, ChevronLeft, ChevronRight,
  Download, Copy, Check, Trash2, ArrowUp, ArrowDown, ExternalLink, Pencil, MessageSquare, Palette,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow } from '@/components/cactus/app-shell/kpi-row';

interface Agent { slug: string; name: string; role: string; color: string; image: string }
interface VaultItem { id: string; slug: string; title: string; subtitle: string; slides: number; editable: boolean }
interface Slide { title: string; subtitle?: string; bullets: string[] }
interface Project { title: string; audience: string; objective: string; slides: Slide[] }
type Msg = { role: 'user' | 'assistant'; content: string };

const LS_KEY = 'pita:project:v1';
const EMPTY: Project = { title: '', audience: '', objective: '', slides: [] };

const SUGGESTIONS = [
  'Estructura para una propuesta comercial',
  'Pitch de inversión en 10 slides',
  'Convierte mi brief en una presentación',
];

function extractSlides(text: string): Slide[] | null {
  try {
    const a = text.indexOf('['); const b = text.lastIndexOf(']');
    if (a < 0 || b < 0) return null;
    const arr = JSON.parse(text.slice(a, b + 1));
    if (!Array.isArray(arr)) return null;
    return arr
      .map((s: any) => ({
        title: String(s.title || s.titulo || '').trim(),
        subtitle: s.subtitle || s.subtitulo ? String(s.subtitle || s.subtitulo) : undefined,
        bullets: Array.isArray(s.bullets || s.puntos) ? (s.bullets || s.puntos).map((x: any) => String(x)) : [],
      }))
      .filter((s: Slide) => s.title);
  } catch { return null; }
}

export function PitaApp({ agent, user, credits, vault }: { agent: Agent; user?: { name: string; email?: string }; credits?: number; vault: VaultItem[] }) {
  const c = agent.color;
  const [view, setView] = useState<'estudio' | 'presentaciones'>('estudio');
  const [project, setProject] = useState<Project>(EMPTY);
  const [sel, setSel] = useState(0);
  const [gen, setGen] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);

  // Chat
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: '¡Hola! Soy Pita. Dime de qué es tu presentación y para quién, y armo la estructura completa con su storytelling. ✨' }]);
  const [input, setInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const firstSave = useRef(true);
  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) { const p = JSON.parse(raw); setProject(p); } } catch { /* noop */ }
  }, []);
  useEffect(() => {
    // No guardar en el montaje (project aún vacío): clobbearía el borrador guardado.
    if (firstSave.current) { firstSave.current = false; return; }
    try { localStorage.setItem(LS_KEY, JSON.stringify(project)); } catch { /* noop */ }
  }, [project]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, chatting]);

  const nav: AppNavItem[] = [
    { key: 'estudio', label: 'Estudio', icon: Presentation, section: 'Pita' },
    { key: 'presentaciones', label: 'Presentaciones', icon: LayoutList, section: 'Pita' },
  ];

  const slides = project.slides;
  const current = slides[sel];
  const filled = slides.filter((s) => s.bullets.length > 0).length;
  const progress = slides.length ? Math.round((filled / slides.length) * 100) : 0;

  async function generateStructure() {
    if (!project.title.trim()) { setGenErr('Escribe el tema de la presentación.'); return; }
    setGen(true); setGenErr(null);
    const prompt = `Crea la estructura de una presentación profesional.
TEMA: ${project.title}
AUDIENCIA: ${project.audience || 'general'}
OBJETIVO: ${project.objective || 'informar y persuadir'}
Devuelve SOLO un array JSON de 8 a 12 slides, cada uno: {"title": "...", "subtitle": "...", "bullets": ["...", "..."]}. El primero es portada y el último un cierre con llamado a la acción. Sin texto fuera del JSON.`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'pita', messages: [{ role: 'user', content: prompt }], maxTokens: 2500 }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      const parsed = extractSlides(d.content || '');
      if (!parsed || !parsed.length) throw new Error('No pude leer la estructura. Reintenta.');
      setProject((p) => ({ ...p, slides: parsed })); setSel(0);
    } catch (e: any) { setGenErr(e?.message || 'Error generando'); }
    finally { setGen(false); }
  }

  async function sendChat(text?: string) {
    const content = (text ?? input).trim();
    if (!content || chatting) return;
    const next = [...msgs, { role: 'user' as const, content }];
    setMsgs(next); setInput(''); setChatting(true);
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'pita', messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const d = await res.json();
      setMsgs((m) => [...m, { role: 'assistant', content: res.ok ? (d.content || '…') : (d.error || 'No pude responder.') }]);
    } catch { setMsgs((m) => [...m, { role: 'assistant', content: 'Hubo un error de conexión.' }]); }
    finally { setChatting(false); }
  }

  function patchSlide(i: number, patch: Partial<Slide>) {
    setProject((p) => ({ ...p, slides: p.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= slides.length) return;
    const arr = [...slides]; [arr[i], arr[j]] = [arr[j], arr[i]];
    setProject((p) => ({ ...p, slides: arr })); setSel(j);
  }
  function removeSlide(i: number) {
    setProject((p) => ({ ...p, slides: p.slides.filter((_, j) => j !== i) }));
    setSel((s) => Math.max(0, Math.min(s, slides.length - 2)));
  }
  function addSlide() {
    setProject((p) => ({ ...p, slides: [...p.slides, { title: 'Nueva slide', bullets: [] }] }));
    setSel(slides.length);
  }

  const deckMarkdown = () =>
    `# ${project.title || 'Presentación'}\n\n` +
    slides.map((s, i) => `## ${i + 1}. ${s.title}${s.subtitle ? `\n_${s.subtitle}_` : ''}\n${s.bullets.map((b) => `- ${b}`).join('\n')}`).join('\n\n');

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => setView(k as any)}
      user={user}
      credits={credits}
      greeting={`Hola, ${user?.name || 'Eduardo'}`}
      subtitle="Concepto → estructura → storytelling → deck"
      cta={{ label: 'Nueva presentación', icon: Plus, onClick: () => { setProject(EMPTY); setSel(0); setView('estudio'); } }}
    >
      <KpiRow
        accent={c}
        items={[
          { label: 'Slides', value: slides.length, icon: <Presentation className="h-4 w-4" /> },
          { label: 'Progreso', value: `${progress}%`, icon: <Sparkles className="h-4 w-4" /> },
          { label: 'En el vault', value: vault.length, icon: <LayoutList className="h-4 w-4" /> },
          { label: 'Estado', value: slides.length ? 'En edición' : 'Vacío', icon: <Pencil className="h-4 w-4" /> },
        ]}
      />

      {view === 'presentaciones' ? (
        <VaultView vault={vault} color={c} onNew={() => setView('estudio')} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_1fr_320px]">
          {/* Chat con Pita */}
          <section className="flex h-[560px] flex-col rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <MessageSquare className="h-4 w-4" style={{ color: c }} />
              <span className="text-sm font-semibold">Chat con Pita</span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {msgs.map((m, i) => (
                <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'ml-auto text-white' : 'bg-muted text-foreground'}`} style={m.role === 'user' ? { backgroundColor: c } : undefined}>
                  {m.content}
                </div>
              ))}
              {chatting && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Pita escribe…</div>}
              <div ref={chatEnd} />
            </div>
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendChat(s)} className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-current" style={{ color: c }}>{s}</button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-border p-2.5">
              <input
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Escríbele a Pita…"
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none"
              />
              <button onClick={() => sendChat()} disabled={chatting} className="rounded-lg p-2 text-white disabled:opacity-50" style={{ backgroundColor: c }}><Send className="h-4 w-4" /></button>
            </div>
          </section>

          {/* Preview del deck */}
          <section className="space-y-3">
            {/* Brief */}
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2">
              <input value={project.title} onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))} placeholder="Tema de la presentación *" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm sm:col-span-2" />
              <input value={project.audience} onChange={(e) => setProject((p) => ({ ...p, audience: e.target.value }))} placeholder="Audiencia" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
              <input value={project.objective} onChange={(e) => setProject((p) => ({ ...p, objective: e.target.value }))} placeholder="Objetivo" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
              <button onClick={generateStructure} disabled={gen} className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2" style={{ backgroundColor: c }}>
                {gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {slides.length ? 'Regenerar estructura' : 'Generar estructura'}
              </button>
              {genErr && <p className="text-xs text-red-600 sm:col-span-2">{genErr}</p>}
            </div>

            {/* Slide grande */}
            {current ? (
              <>
                <SlideView slide={current} index={sel} total={slides.length} color={c} />
                <div className="flex items-center justify-between">
                  <button onClick={() => setSel((s) => Math.max(0, s - 1))} disabled={sel === 0} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <div className="flex gap-1 overflow-x-auto px-2">
                    {slides.map((s, i) => (
                      <button key={i} onClick={() => setSel(i)} title={s.title}
                        className={`h-9 w-14 shrink-0 rounded border text-[8px] ${i === sel ? 'ring-2' : 'opacity-70'}`}
                        style={{ borderColor: c + '55', background: c + '12', boxShadow: i === sel ? `0 0 0 2px ${c}` : undefined }}>
                        <span className="line-clamp-2 px-0.5 pt-0.5 text-foreground/70">{i + 1}. {s.title}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSel((s) => Math.min(slides.length - 1, s + 1))} disabled={sel >= slides.length - 1} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>

                {/* Editor de la slide seleccionada */}
                <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
                  <input value={current.title} onChange={(e) => patchSlide(sel, { title: e.target.value })} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-semibold" />
                  <input value={current.subtitle || ''} onChange={(e) => patchSlide(sel, { subtitle: e.target.value })} placeholder="Subtítulo (opcional)" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
                  <textarea value={current.bullets.join('\n')} onChange={(e) => patchSlide(sel, { bullets: e.target.value.split('\n') })} rows={4} placeholder="Un punto por línea" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" />
                </div>
              </>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-center text-muted-foreground">
                <Presentation className="h-8 w-8 opacity-40" />
                <p className="text-sm">Llena el brief y genera la estructura, o pídele a Pita en el chat.</p>
              </div>
            )}

            {/* Progreso */}
            {slides.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-medium">Progreso del proyecto</span><span style={{ color: c }}>{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: c }} /></div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{filled} de {slides.length} slides con contenido.</p>
              </div>
            )}
          </section>

          {/* Estructura + entregar + paneles */}
          <section className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Estructura</h3>
                <button onClick={addSlide} className="inline-flex items-center gap-1 text-xs" style={{ color: c }}><Plus className="h-3.5 w-3.5" /> Slide</button>
              </div>
              {slides.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Aún no hay slides.</p>
              ) : (
                <ol className="space-y-1">
                  {slides.map((s, i) => (
                    <li key={i} className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm ${i === sel ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                      <button onClick={() => setSel(i)} className="min-w-0 flex-1 truncate text-left"><span className="text-muted-foreground">{i + 1}.</span> {s.title}</button>
                      <button onClick={() => move(i, -1)} className="opacity-0 group-hover:opacity-100"><ArrowUp className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => move(i, 1)} className="opacity-0 group-hover:opacity-100"><ArrowDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => removeSlide(i)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {slides.length > 0 && <DeliverBox markdown={deckMarkdown()} title={project.title || 'presentacion'} color={c} />}

            <div className="rounded-2xl border border-border bg-card p-3">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><Palette className="h-4 w-4" style={{ color: c }} /> Brand kit</h3>
              <p className="text-xs text-muted-foreground">Pita usa el contexto de marca del <Link href="/brain" className="underline" style={{ color: c }}>Cerebro</Link> para el tono y los colores del deck.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3">
              <h3 className="mb-1.5 text-sm font-semibold">Revisiones y comentarios</h3>
              <p className="text-xs text-muted-foreground">Comparte la presentación (vista pública) para recibir feedback de tu equipo y clientes aquí.</p>
            </div>
          </section>
        </div>
      )}
    </AgentAppShell>
  );
}

function SlideView({ slide, index, total, color }: { slide: Slide; index: number; total: number; color: string }) {
  const cover = index === 0;
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border p-6 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc 60%, #0A241F)` }}>
      <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">{index + 1} / {total}</span>
      <div className={`flex h-full flex-col ${cover ? 'justify-center' : 'justify-start'}`}>
        <h2 className={`font-display font-bold leading-tight ${cover ? 'text-3xl' : 'text-2xl'}`}>{slide.title}</h2>
        {slide.subtitle && <p className="mt-1 text-white/80">{slide.subtitle}</p>}
        {!cover && slide.bullets.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-white/90">
            {slide.bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="opacity-60">›</span><span>{b}</span></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function DeliverBox({ markdown, title, color }: { markdown: string; title: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <h3 className="mb-2 text-sm font-semibold">Entregar</h3>
      <div className="flex gap-2">
        <button onClick={() => { navigator.clipboard?.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:border-current" style={{ color }}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button onClick={download} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
          <Download className="h-3.5 w-3.5" /> Descargar
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">El borrador vive en este navegador. Export a PPTX llega con la conexión de Slides (Conexiones).</p>
    </div>
  );
}

function VaultView({ vault, color, onNew }: { vault: VaultItem[]; color: string; onNew: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Mis presentaciones</h2>
        <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: color }}><Plus className="h-4 w-4" /> Nueva en el estudio</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vault.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex aspect-video items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${color}, #0A241F)` }}>
              <Presentation className="h-7 w-7 opacity-80" />
            </div>
            <h3 className="truncate font-semibold">{p.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{p.subtitle || '—'}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{p.slides} slides</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/pita/${p.slug}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs hover:border-current" style={{ color }}><ExternalLink className="h-3.5 w-3.5" /> Ver</Link>
              {p.editable && <Link href={`/apps/pita/editor/${p.id}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}><Pencil className="h-3.5 w-3.5" /> Editar</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
