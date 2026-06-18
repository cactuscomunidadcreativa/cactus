'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Reorder, useDragControls } from 'framer-motion';
import {
  LayoutDashboard, Blocks, Plug, Wand2, Loader2, Monitor, Tablet, Smartphone, Eye, Pencil,
  Download, Trash2, Copy, GripVertical, Plus, PanelTop, LayoutTemplate, Type, Image as ImageIcon,
  Sparkles, MessageSquareQuote, CreditCard, HelpCircle, Mail, AlignLeft, Globe, TrendingUp, Rocket,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { QuickActionsBar } from '@/components/cactus/app-shell/quick-actions-bar';

interface OpuntiaAgent { slug: string; name: string; role: string; color: string; image: string }

// ═══ Modelo de bloques ════════════════════════════════════════════════════════
type BlockType = 'navbar' | 'hero' | 'text' | 'features' | 'image' | 'gallery' | 'cta' | 'testimonials' | 'pricing' | 'faq' | 'contact' | 'footer';
interface Block { id: string; type: BlockType; props: Record<string, any> }
interface Page { theme: { color: string }; blocks: Block[] }

type FieldKind = 'text' | 'textarea' | 'image' | 'pairs' | 'urls';
interface Field { k: string; l: string; t: FieldKind; aL?: string; bL?: string }
interface BlockDef { label: string; icon: typeof PanelTop; make: () => Record<string, any>; fields: Field[] }

const BLOCKS: Record<BlockType, BlockDef> = {
  navbar: {
    label: 'Navbar', icon: PanelTop,
    make: () => ({ brand: 'Tu Marca', links: 'Inicio, Servicios, Nosotros, Contacto', ctaText: 'Empezar' }),
    fields: [{ k: 'brand', l: 'Marca', t: 'text' }, { k: 'links', l: 'Enlaces (separa con comas)', t: 'text' }, { k: 'ctaText', l: 'Botón', t: 'text' }],
  },
  hero: {
    label: 'Hero', icon: LayoutTemplate,
    make: () => ({ title: 'Tu propuesta de valor en una línea', subtitle: 'Explica en una frase qué haces y para quién, de forma clara y atractiva.', ctaText: 'Empieza ahora', ctaLink: '#', image: '' }),
    fields: [{ k: 'title', l: 'Título', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'textarea' }, { k: 'ctaText', l: 'Texto del botón', t: 'text' }, { k: 'ctaLink', l: 'Enlace', t: 'text' }, { k: 'image', l: 'Imagen de fondo (URL)', t: 'image' }],
  },
  text: {
    label: 'Texto', icon: Type,
    make: () => ({ heading: 'Una sección de texto', body: 'Cuenta tu historia, tu misión o el detalle de tu oferta. Este párrafo es totalmente editable.' }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'body', l: 'Texto', t: 'textarea' }],
  },
  features: {
    label: 'Características', icon: Blocks,
    make: () => ({ heading: '¿Por qué elegirnos?', items: [{ a: 'Rápido', b: 'Resultados en días, no meses.' }, { a: 'Simple', b: 'Sin curva de aprendizaje.' }, { a: 'A tu medida', b: 'Adaptado a tu negocio.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Características', t: 'pairs', aL: 'Título', bL: 'Descripción' }],
  },
  image: {
    label: 'Imagen', icon: ImageIcon,
    make: () => ({ url: '', caption: '' }),
    fields: [{ k: 'url', l: 'Imagen (URL)', t: 'image' }, { k: 'caption', l: 'Pie de foto', t: 'text' }],
  },
  gallery: {
    label: 'Galería', icon: ImageIcon,
    make: () => ({ images: ['', '', ''] }),
    fields: [{ k: 'images', l: 'Imágenes (URLs)', t: 'urls' }],
  },
  cta: {
    label: 'Llamada a la acción', icon: Sparkles,
    make: () => ({ title: '¿List@ para empezar?', subtitle: 'Da el primer paso hoy mismo.', ctaText: 'Contáctanos', ctaLink: '#' }),
    fields: [{ k: 'title', l: 'Título', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'text' }, { k: 'ctaText', l: 'Botón', t: 'text' }, { k: 'ctaLink', l: 'Enlace', t: 'text' }],
  },
  testimonials: {
    label: 'Testimonios', icon: MessageSquareQuote,
    make: () => ({ heading: 'Lo que dicen', items: [{ a: 'Ana, fundadora', b: 'Nos cambió la forma de trabajar.' }, { a: 'Luis, gerente', b: 'Resultados reales desde el primer mes.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Testimonios', t: 'pairs', aL: 'Autor', bL: 'Cita' }],
  },
  pricing: {
    label: 'Precios', icon: CreditCard,
    make: () => ({ heading: 'Planes', items: [{ a: 'Básico — $9', b: 'Lo esencial para empezar' }, { a: 'Pro — $29', b: 'Para equipos en crecimiento' }, { a: 'Empresa — A medida', b: 'Soporte y todo incluido' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Planes', t: 'pairs', aL: 'Plan y precio', bL: 'Qué incluye' }],
  },
  faq: {
    label: 'Preguntas', icon: HelpCircle,
    make: () => ({ heading: 'Preguntas frecuentes', items: [{ a: '¿Cómo funciona?', b: 'Te explicamos en 3 pasos sencillos.' }, { a: '¿Tiene contrato?', b: 'No, cancelas cuando quieras.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Preguntas', t: 'pairs', aL: 'Pregunta', bL: 'Respuesta' }],
  },
  contact: {
    label: 'Contacto', icon: Mail,
    make: () => ({ heading: 'Hablemos', subtitle: 'Déjanos tus datos y te escribimos.', buttonText: 'Enviar' }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'text' }, { k: 'buttonText', l: 'Botón', t: 'text' }],
  },
  footer: {
    label: 'Footer', icon: AlignLeft,
    make: () => ({ text: '© Tu Marca. Todos los derechos reservados.', links: 'Privacidad, Términos, Contacto' }),
    fields: [{ k: 'text', l: 'Texto', t: 'text' }, { k: 'links', l: 'Enlaces (separa con comas)', t: 'text' }],
  },
};
const BLOCK_ORDER: BlockType[] = ['navbar', 'hero', 'features', 'text', 'image', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'contact', 'footer'];

const STORAGE_KEY = 'cactus.opuntia.page.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const splitCommas = (s: string) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

const STARTER: Page = {
  theme: { color: '#2D6CDF' },
  blocks: [
    { id: uid(), type: 'navbar', props: BLOCKS.navbar.make() },
    { id: uid(), type: 'hero', props: BLOCKS.hero.make() },
    { id: uid(), type: 'features', props: BLOCKS.features.make() },
    { id: uid(), type: 'cta', props: BLOCKS.cta.make() },
    { id: uid(), type: 'footer', props: BLOCKS.footer.make() },
  ],
};

type View = 'resumen' | 'builder';

export function OpuntiaApp({ agent, user, credits }: { agent: OpuntiaAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('builder');
  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Mis sitios', icon: LayoutDashboard },
    { key: 'builder', label: 'Builder', icon: Blocks },
    { key: 'conexiones', label: 'Dominio & hosting', icon: Plug, href: '/empresa', section: 'Cuenta' },
  ];
  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🌐`}
      subtitle="Constructor web con Opuntia"
      cta={{ label: 'Abrir builder', icon: Blocks, onClick: () => setView('builder') }}
    >
      {view === 'resumen' ? <Resumen accent={agent.color} onGo={() => setView('builder')} /> : <Builder agent={agent} />}
    </AgentAppShell>
  );
}

// ═══ Resumen (dashboard de sitios — honesto) ══════════════════════════════════
function Resumen({ accent, onGo }: { accent: string; onGo: () => void }) {
  const kpis: Kpi[] = [
    { label: 'Sitios', value: 1, icon: <Globe className="h-4 w-4" />, hint: 'borrador en este navegador' },
    { label: 'Publicados', value: '—', icon: <Rocket className="h-4 w-4" />, hint: 'Conecta dominio (Fase F)' },
    { label: 'Visitas', value: '—', icon: <TrendingUp className="h-4 w-4" />, hint: 'Al publicar' },
    { label: 'Conversión', value: '—', icon: <Sparkles className="h-4 w-4" />, hint: 'Al publicar' },
  ];
  return (
    <div className="space-y-5">
      <KpiRow items={kpis} accent={accent} />
      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold">Tus sitios</h3>
          <p className="mb-4 text-sm text-muted-foreground">Diseña, edita y exporta. La publicación con dominio propio llega en Fase F.</p>
          <button onClick={onGo} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-[color:var(--c)]" style={{ ['--c' as string]: accent }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: accent + '14', color: accent }}><Blocks className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Mi sitio (borrador)</span>
              <span className="block text-xs text-muted-foreground">Abrir en el builder →</span>
            </span>
          </button>
        </div>
        <aside className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 text-sm font-medium"><Rocket className="h-4 w-4" style={{ color: accent }} /> Publicar con dominio</div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Hoy puedes diseñar y <strong>exportar el HTML</strong> de tu sitio. Conectar un dominio y publicar en 1 clic
            llega con las integraciones (Fase F).
          </p>
        </aside>
      </div>
    </div>
  );
}

// ═══ Builder ══════════════════════════════════════════════════════════════════
const DEVICE = { desktop: 'w-full', tablet: 'max-w-[768px]', mobile: 'max-w-[400px]' } as const;

function Builder({ agent }: { agent: OpuntiaAgent }) {
  const [page, setPage] = useState<Page>(STARTER);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICE>('desktop');
  const [preview, setPreview] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setPage(JSON.parse(raw)); } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(page)); } catch { /* noop */ }
  }, [page, loaded]);

  const setBlocks = (blocks: Block[]) => setPage((p) => ({ ...p, blocks }));
  const addBlock = (type: BlockType) => {
    const b: Block = { id: uid(), type, props: BLOCKS[type].make() };
    setPage((p) => ({ ...p, blocks: [...p.blocks, b] }));
    setSelected(b.id);
  };
  const updateBlock = (id: string, props: Record<string, any>) =>
    setPage((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id ? { ...b, props } : b)) }));
  const deleteBlock = (id: string) =>
    setPage((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
  const dupBlock = (id: string) => setPage((p) => {
    const i = p.blocks.findIndex((b) => b.id === id); if (i < 0) return p;
    const copy: Block = { id: uid(), type: p.blocks[i].type, props: { ...p.blocks[i].props } };
    const blocks = [...p.blocks]; blocks.splice(i + 1, 0, copy); return { ...p, blocks };
  });
  const setTheme = (color: string) => setPage((p) => ({ ...p, theme: { ...p.theme, color } }));

  const sel = page.blocks.find((b) => b.id === selected) || null;

  function exportHtml() {
    const html = pageToHtml(page);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sitio-opuntia.html'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setDevice(k)} title={k} className={`rounded-md p-1.5 ${device === k ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`} style={device === k ? { backgroundColor: agent.color } : undefined}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
          {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {preview ? 'Editar' : 'Vista previa'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>
            <Wand2 className="h-4 w-4" /> Generar con IA
          </button>
          <button onClick={exportHtml} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Exportar HTML
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[200px_1fr_300px]">
        {/* Paleta */}
        {!preview && (
          <div className="hidden xl:block">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bloques</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_ORDER.map((t) => {
                  const def = BLOCKS[t];
                  return (
                    <button key={t} onClick={() => addBlock(t)} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-1 py-2 text-[10px] text-muted-foreground transition-colors hover:border-[color:var(--c)] hover:text-foreground" style={{ ['--c' as string]: agent.color }}>
                      <def.icon className="h-4 w-4" /> {def.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="min-w-0 rounded-xl border border-border bg-muted/30 p-3">
          <div className={`mx-auto overflow-hidden rounded-lg bg-white shadow-sm transition-all ${DEVICE[device]}`}>
            {page.blocks.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-gray-400">
                <Blocks className="h-7 w-7" />
                <p className="text-sm">Agrega bloques desde la paleta o genera la página con IA.</p>
              </div>
            ) : preview ? (
              <div>{page.blocks.map((b) => <div key={b.id}><BlockView block={b} theme={page.theme} /></div>)}</div>
            ) : (
              <Reorder.Group axis="y" values={page.blocks} onReorder={setBlocks} className="list-none">
                {page.blocks.map((b) => (
                  <BlockItem
                    key={b.id} block={b} theme={page.theme} accent={agent.color}
                    selected={b.id === selected}
                    onSelect={() => setSelected(b.id)}
                    onDelete={() => { deleteBlock(b.id); if (selected === b.id) setSelected(null); }}
                    onDup={() => dupBlock(b.id)}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>

        {/* Inspector */}
        {!preview && (
          <div className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border bg-card p-4">
              {sel ? (
                <Inspector block={sel} accent={agent.color} onChange={(props) => updateBlock(sel.id, props)} />
              ) : (
                <PageSettings page={page} accent={agent.color} onColor={setTheme} />
              )}
            </div>
          </div>
        )}
      </div>

      {aiOpen && <AiModal agent={agent} onClose={() => setAiOpen(false)} onApply={(p) => { setPage(p); setSelected(null); setAiOpen(false); }} />}
    </div>
  );
}

// ── Item del canvas con drag-handle + controles ───────────────────────────────
function BlockItem({
  block, theme, accent, selected, onSelect, onDelete, onDup,
}: {
  block: Block; theme: Page['theme']; accent: string; selected: boolean;
  onSelect: () => void; onDelete: () => void; onDup: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls} className="relative">
      <div
        onClick={onSelect}
        className={`group relative cursor-pointer ${selected ? 'ring-2 ring-inset' : 'hover:ring-1 hover:ring-inset hover:ring-gray-200'}`}
        style={selected ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
      >
        {/* Barra de controles */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
          <button onPointerDown={(e) => controls.start(e)} title="Arrastrar" className="cursor-grab rounded p-1 text-gray-500 hover:bg-gray-100 active:cursor-grabbing"><GripVertical className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDup(); }} title="Duplicar" className="rounded p-1 text-gray-500 hover:bg-gray-100"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar" className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <span className="absolute left-2 top-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">{BLOCKS[block.type].label}</span>
        <BlockView block={block} theme={theme} />
      </div>
    </Reorder.Item>
  );
}

// ── Inspector (campos por esquema) ────────────────────────────────────────────
function Inspector({ block, accent, onChange }: { block: Block; accent: string; onChange: (props: Record<string, any>) => void }) {
  const def = BLOCKS[block.type];
  const set = (k: string, v: any) => onChange({ ...block.props, [k]: v });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <def.icon className="h-4 w-4" style={{ color: accent }} />
        <h3 className="font-display font-semibold">{def.label}</h3>
      </div>
      {def.fields.map((f) => (
        <div key={f.k}>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{f.l}</label>
          {f.t === 'textarea' ? (
            <textarea value={block.props[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
          ) : f.t === 'pairs' ? (
            <PairsEditor value={block.props[f.k] || []} aL={f.aL} bL={f.bL} accent={accent} onChange={(v) => set(f.k, v)} />
          ) : f.t === 'urls' ? (
            <UrlsEditor value={block.props[f.k] || []} accent={accent} onChange={(v) => set(f.k, v)} />
          ) : (
            <input value={block.props[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} placeholder={f.t === 'image' ? 'https://…' : ''} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
          )}
        </div>
      ))}
    </div>
  );
}

function PairsEditor({ value, aL, bL, accent, onChange }: { value: { a: string; b: string }[]; aL?: string; bL?: string; accent: string; onChange: (v: { a: string; b: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((it, i) => (
        <div key={i} className="space-y-1 rounded-lg border border-border p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </div>
          <input value={it.a} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} placeholder={aL} className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none" />
          <input value={it.b} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)))} placeholder={bL} className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none" />
        </div>
      ))}
      <button onClick={() => onChange([...value, { a: '', b: '' }])} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="h-3.5 w-3.5" /> Agregar</button>
    </div>
  );
}

function UrlsEditor({ value, accent, onChange }: { value: string[]; accent: string; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      {value.map((u, i) => (
        <div key={i} className="flex items-center gap-1">
          <input value={u} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} placeholder="https://…" className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none" />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...value, ''])} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="h-3.5 w-3.5" /> Agregar imagen</button>
    </div>
  );
}

function PageSettings({ page, accent, onColor }: { page: Page; accent: string; onColor: (c: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">Página</h3></div>
      <p className="text-xs text-muted-foreground">Selecciona un bloque en el lienzo para editarlo, o ajusta el estilo general aquí.</p>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Color de marca</label>
        <div className="flex items-center gap-2">
          <input type="color" value={page.theme.color} onChange={(e) => onColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
          <input value={page.theme.color} onChange={(e) => onColor(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

// ── Modal de generación con IA ────────────────────────────────────────────────
function AiModal({ agent, onClose, onApply }: { agent: OpuntiaAgent; onClose: () => void; onApply: (p: Page) => void }) {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    const b = brief.trim();
    if (!b || loading) return;
    setLoading(true); setError(null);
    const prompt =
      `Eres un constructor de páginas web. Diseña una landing para: ${b}.\n` +
      `Devuelve SOLO un JSON válido (sin markdown, sin texto extra) con la forma:\n` +
      `{"theme":{"color":"#2D6CDF"},"blocks":[{"type":"navbar","props":{...}}, ...]}\n` +
      `Tipos y props válidos:\n` +
      `navbar:{brand,links,ctaText} · hero:{title,subtitle,ctaText,ctaLink} · text:{heading,body} · ` +
      `features:{heading,items:[{a,b}]} · cta:{title,subtitle,ctaText,ctaLink} · testimonials:{heading,items:[{a,b}]} · ` +
      `pricing:{heading,items:[{a,b}]} · faq:{heading,items:[{a,b}]} · contact:{heading,subtitle,buttonText} · footer:{text,links}\n` +
      `Usa de 5 a 8 bloques, empezando por navbar y hero y terminando por footer. Texto en español, específico y real para ese negocio. Solo el JSON.`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: [{ role: 'user', content: prompt }], maxTokens: 4000 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      const page = parsePage(String(data.content || ''));
      if (!page || !page.blocks.length) throw new Error('La IA no devolvió una página válida. Intenta de nuevo.');
      onApply(page);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-2 flex items-center gap-2"><Wand2 className="h-4 w-4" style={{ color: agent.color }} /><h3 className="font-display text-lg font-semibold">Generar sitio con IA</h3></div>
        <p className="mb-3 text-sm text-muted-foreground">Describe tu negocio y Opuntia arma la página completa. Luego la editas a tu gusto.</p>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Ej. Estudio de yoga en Guadalajara, clases para principiantes, ambiente cálido, primera clase gratis…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Cancelar</button>
          <button onClick={generate} disabled={loading || !brief.trim()} className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {loading ? 'Diseñando…' : 'Generar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function parsePage(raw: string): Page | null {
  try {
    let s = raw.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{'); const end = s.lastIndexOf('}');
    if (start > 0 || end < s.length - 1) s = s.slice(start, end + 1);
    const obj = JSON.parse(s);
    const color = obj?.theme?.color && /^#?[0-9a-fA-F]{3,8}$/.test(String(obj.theme.color)) ? String(obj.theme.color).replace(/^#?/, '#') : '#2D6CDF';
    const blocks: Block[] = (Array.isArray(obj?.blocks) ? obj.blocks : [])
      .filter((b: any) => b && BLOCKS[b.type as BlockType])
      .map((b: any) => ({ id: uid(), type: b.type as BlockType, props: { ...BLOCKS[b.type as BlockType].make(), ...(b.props || {}) } }));
    return { theme: { color }, blocks };
  } catch { return null; }
}

// ═══ Render de bloques (en pantalla — Tailwind) ═══════════════════════════════
function BlockView({ block, theme }: { block: Block; theme: Page['theme'] }) {
  const c = theme.color;
  const p = block.props;
  switch (block.type) {
    case 'navbar':
      return (
        <nav className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <span className="font-bold text-gray-900">{p.brand}</span>
          <div className="hidden items-center gap-5 text-sm text-gray-600 sm:flex">
            {splitCommas(p.links).map((l, i) => <span key={i}>{l}</span>)}
          </div>
          <span className="rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.ctaText}</span>
        </nav>
      );
    case 'hero':
      return (
        <header className="relative px-6 py-16 text-center" style={p.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `linear-gradient(135deg, ${c}12, transparent)` }}>
          <h1 className={`mx-auto max-w-2xl text-3xl font-extrabold leading-tight ${p.image ? 'text-white' : 'text-gray-900'}`}>{p.title}</h1>
          <p className={`mx-auto mt-3 max-w-xl ${p.image ? 'text-white/90' : 'text-gray-600'}`}>{p.subtitle}</p>
          <span className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow" style={{ backgroundColor: c }}>{p.ctaText}</span>
        </header>
      );
    case 'text':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-3 text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <p className="whitespace-pre-wrap leading-relaxed text-gray-600">{p.body}</p>
        </section>
      );
    case 'features':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-5 sm:grid-cols-3">
            {(p.items || []).map((it: any, i: number) => (
              <div key={i} className="rounded-xl border border-gray-100 p-5 text-center">
                <div className="mx-auto mb-2 h-9 w-9 rounded-lg" style={{ backgroundColor: c + '22' }} />
                <h3 className="font-semibold text-gray-900">{it.a}</h3>
                <p className="mt-1 text-sm text-gray-600">{it.b}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case 'image':
      return (
        <section className="px-6 py-8">
          {p.url ? <img src={p.url} alt={p.caption || ''} className="mx-auto max-h-80 w-full rounded-xl object-cover" /> : <div className="flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">Imagen (añade una URL)</div>}
          {p.caption && <p className="mt-2 text-center text-xs text-gray-500">{p.caption}</p>}
        </section>
      );
    case 'gallery':
      return (
        <section className="grid grid-cols-3 gap-2 px-6 py-8">
          {(p.images || []).map((u: string, i: number) => (
            u ? <img key={i} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">+</div>
          ))}
        </section>
      );
    case 'cta':
      return (
        <section className="px-6 py-14 text-center" style={{ backgroundColor: c + '10' }}>
          <h2 className="text-2xl font-bold text-gray-900">{p.title}</h2>
          <p className="mt-2 text-gray-600">{p.subtitle}</p>
          <span className="mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.ctaText}</span>
        </section>
      );
    case 'testimonials':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-4 sm:grid-cols-2">
            {(p.items || []).map((it: any, i: number) => (
              <figure key={i} className="rounded-xl border border-gray-100 p-5">
                <blockquote className="text-gray-700">“{it.b}”</blockquote>
                <figcaption className="mt-2 text-sm font-semibold" style={{ color: c }}>{it.a}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    case 'pricing':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-4 sm:grid-cols-3">
            {(p.items || []).map((it: any, i: number) => (
              <div key={i} className="rounded-xl border border-gray-100 p-5 text-center">
                <h3 className="font-bold text-gray-900">{it.a}</h3>
                <p className="mt-1 text-sm text-gray-600">{it.b}</p>
                <span className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: c }}>Elegir</span>
              </div>
            ))}
          </div>
        </section>
      );
    case 'faq':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="mx-auto max-w-2xl space-y-3">
            {(p.items || []).map((it: any, i: number) => (
              <div key={i} className="rounded-lg border border-gray-100 p-4">
                <p className="font-semibold text-gray-900">{it.a}</p>
                <p className="mt-1 text-sm text-gray-600">{it.b}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case 'contact':
      return (
        <section className="px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{p.heading}</h2>
          <p className="mt-2 text-gray-600">{p.subtitle}</p>
          <div className="mx-auto mt-5 max-w-sm space-y-2">
            <div className="h-10 rounded-lg border border-gray-200" />
            <div className="h-10 rounded-lg border border-gray-200" />
            <span className="inline-block w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.buttonText}</span>
          </div>
        </section>
      );
    case 'footer':
      return (
        <footer className="flex flex-col items-center gap-2 border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-500">
          <div className="flex flex-wrap justify-center gap-4">{splitCommas(p.links).map((l, i) => <span key={i}>{l}</span>)}</div>
          <p>{p.text}</p>
        </footer>
      );
    default:
      return null;
  }
}

// ═══ Export HTML (sitio autónomo) ═════════════════════════════════════════════
function esc(s: any) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function btn(c: string, label: string) { return `<a href="#" style="display:inline-block;background:${c};color:#fff;padding:12px 22px;border-radius:10px;font-weight:600;text-decoration:none">${esc(label)}</a>`; }

function blockToHtml(b: Block, c: string): string {
  const p = b.props;
  switch (b.type) {
    case 'navbar': return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #eee"><strong>${esc(p.brand)}</strong><div style="display:flex;gap:20px;color:#555;font-size:14px">${splitCommas(p.links).map((l) => `<span>${esc(l)}</span>`).join('')}</div>${btn(c, p.ctaText)}</nav>`;
    case 'hero': return `<header style="padding:64px 24px;text-align:center;${p.image ? `background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url('${esc(p.image)}');background-size:cover;background-position:center;color:#fff` : `background:linear-gradient(135deg,${c}12,transparent)`}"><h1 style="font-size:34px;font-weight:800;max-width:640px;margin:0 auto;${p.image ? 'color:#fff' : 'color:#111'}">${esc(p.title)}</h1><p style="max-width:560px;margin:12px auto;${p.image ? 'color:#eee' : 'color:#555'}">${esc(p.subtitle)}</p><div style="margin-top:24px">${btn(c, p.ctaText)}</div></header>`;
    case 'text': return `<section style="padding:48px 24px;max-width:780px;margin:0 auto">${p.heading ? `<h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:12px">${esc(p.heading)}</h2>` : ''}<p style="color:#555;line-height:1.7;white-space:pre-wrap">${esc(p.body)}</p></section>`;
    case 'features': return `<section style="padding:48px 24px;max-width:980px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:12px;padding:20px;text-align:center"><div style="width:36px;height:36px;border-radius:10px;background:${c}22;margin:0 auto 8px"></div><h3 style="font-weight:600;color:#111">${esc(it.a)}</h3><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p></div>`).join('')}</div></section>`;
    case 'image': return `<section style="padding:32px 24px;max-width:900px;margin:0 auto;text-align:center">${p.url ? `<img src="${esc(p.url)}" alt="${esc(p.caption)}" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px"/>` : ''}${p.caption ? `<p style="color:#888;font-size:12px;margin-top:8px">${esc(p.caption)}</p>` : ''}</section>`;
    case 'gallery': return `<section style="padding:32px 24px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${(p.images || []).filter(Boolean).map((u: string) => `<img src="${esc(u)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"/>`).join('')}</section>`;
    case 'cta': return `<section style="padding:56px 24px;text-align:center;background:${c}10"><h2 style="font-size:24px;font-weight:700;color:#111">${esc(p.title)}</h2><p style="color:#555;margin-top:8px">${esc(p.subtitle)}</p><div style="margin-top:20px">${btn(c, p.ctaText)}</div></section>`;
    case 'testimonials': return `<section style="padding:48px 24px;max-width:900px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${(p.items || []).map((it: any) => `<figure style="border:1px solid #eee;border-radius:12px;padding:20px;margin:0"><blockquote style="color:#444">“${esc(it.b)}”</blockquote><figcaption style="margin-top:8px;font-weight:600;color:${c}">${esc(it.a)}</figcaption></figure>`).join('')}</div></section>`;
    case 'pricing': return `<section style="padding:48px 24px;max-width:980px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:12px;padding:20px;text-align:center"><h3 style="font-weight:700;color:#111">${esc(it.a)}</h3><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p><div style="margin-top:16px">${btn(c, 'Elegir')}</div></div>`).join('')}</div></section>`;
    case 'faq': return `<section style="padding:48px 24px;max-width:720px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:12px"><p style="font-weight:600;color:#111">${esc(it.a)}</p><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p></div>`).join('')}</section>`;
    case 'contact': return `<section style="padding:48px 24px;text-align:center;max-width:420px;margin:0 auto"><h2 style="font-size:24px;font-weight:700;color:#111">${esc(p.heading)}</h2><p style="color:#555;margin-top:8px">${esc(p.subtitle)}</p><div style="margin-top:20px;display:flex;flex-direction:column;gap:8px"><input placeholder="Nombre" style="height:40px;border:1px solid #ddd;border-radius:10px;padding:0 12px"/><input placeholder="Email" style="height:40px;border:1px solid #ddd;border-radius:10px;padding:0 12px"/>${btn(c, p.buttonText)}</div></section>`;
    case 'footer': return `<footer style="padding:32px 24px;text-align:center;border-top:1px solid #eee;color:#888;font-size:14px"><div style="display:flex;justify-content:center;gap:16px;margin-bottom:8px">${splitCommas(p.links).map((l) => `<span>${esc(l)}</span>`).join('')}</div><p>${esc(p.text)}</p></footer>`;
    default: return '';
  }
}

function pageToHtml(page: Page): string {
  const body = page.blocks.map((b) => blockToHtml(b, page.theme.color)).join('\n');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Sitio · Cactus</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111}img{display:block}</style>
</head><body>
${body}
<!-- Generado con Opuntia · Cactus Comunidad Creativa -->
</body></html>`;
}
