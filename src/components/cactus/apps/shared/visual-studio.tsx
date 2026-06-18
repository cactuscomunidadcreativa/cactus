'use client';

import { useRef, useState } from 'react';
import {
  Wand2, Sliders, Sparkles, Loader2, Download, Upload, RotateCw, FlipHorizontal2, FlipVertical2,
  ImageIcon,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

export interface VisualAgent { slug: string; name: string; role: string; color: string; image: string }
export interface VisualConfig {
  mode: 'design' | 'photo' | 'character';
  greeting: string;
  subtitle: string;
  genLabel: string;          // "Generar pieza"
  promptPlaceholder: string;
}

const FORMATS: { key: 'square' | 'story' | 'wide'; label: string }[] = [
  { key: 'square', label: 'Cuadrado' }, { key: 'story', label: 'Vertical' }, { key: 'wide', label: 'Horizontal' },
];

type Tab = 'generar' | 'ajustes' | 'editar';

export function VisualStudio({ agent, user, credits, config }: { agent: VisualAgent; user?: ShellUser; credits?: number; config: VisualConfig }) {
  const [tab, setTab] = useState<Tab>('generar');
  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'generar', label: 'Generar', icon: Wand2 },
    { key: 'ajustes', label: 'Ajustes (sin IA)', icon: Sliders },
    { key: 'editar', label: 'Editar con IA', icon: Sparkles },
  ];
  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={tab} onNav={(k) => setTab(k as Tab)}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} ${config.greeting}`}
      subtitle={config.subtitle}
    >
      {tab === 'generar' && <Generar agent={agent} config={config} />}
      {tab === 'ajustes' && <Ajustes agent={agent} />}
      {tab === 'editar' && <EditarIA agent={agent} />}
    </AgentAppShell>
  );
}

function download(url: string, name = 'cactus.png') {
  const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.rel = 'noopener'; a.click();
}

// ── Generar (IA real, /api/cactus/design) ─────────────────────────────────────
function Generar({ agent, config }: { agent: VisualAgent; config: VisualConfig }) {
  const [brief, setBrief] = useState('');
  const [format, setFormat] = useState<'square' | 'story' | 'wide'>('square');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgs, setImgs] = useState<string[]>([]);
  const c = agent.color;

  async function generate() {
    if (!brief.trim() || loading) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/cactus/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: brief.trim(), mode: config.mode, format, style }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      setImgs((p) => [data.url, ...p]);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">{config.genLabel}</h3>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder={config.promptPlaceholder} className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Formato</label>
          <div className="flex gap-1.5">{FORMATS.map((f) => <button key={f.key} onClick={() => setFormat(f.key)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${format === f.key ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={format === f.key ? { backgroundColor: c } : undefined}>{f.label}</button>)}</div>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Estilo</label>
          <div className="flex gap-1.5">{(['vivid', 'natural'] as const).map((s) => <button key={s} onClick={() => setStyle(s)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${style === s ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={style === s ? { backgroundColor: c } : undefined}>{s === 'vivid' ? 'Vibrante' : 'Natural'}</button>)}</div>
        </div>
        <button onClick={generate} disabled={loading || !brief.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generar</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Resultado</h3>
        {imgs.length === 0 && !loading && <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><ImageIcon className="h-9 w-9 opacity-50" /><p className="max-w-xs text-sm">Describe lo que necesitas y {agent.name} lo genera (imagen real).</p></div>}
        {loading && imgs.length === 0 && <div className="flex h-72 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generando…</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {loading && <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {imgs.map((u, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-square w-full object-cover" />
              <button onClick={() => download(u, `${agent.slug}.png`)} className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium opacity-0 shadow transition-opacity group-hover:opacity-100"><Download className="h-3.5 w-3.5" /> PNG</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ajustes (sin IA — canvas en el navegador, gratis) ─────────────────────────
const ASPECTS: { key: string; label: string; val: number | null }[] = [
  { key: 'orig', label: 'Original', val: null }, { key: '1:1', label: '1:1', val: 1 },
  { key: '4:5', label: '4:5', val: 0.8 }, { key: '16:9', label: '16:9', val: 16 / 9 }, { key: '9:16', label: '9:16', val: 9 / 16 },
];

function Ajustes({ agent }: { agent: VisualAgent }) {
  const [url, setUrl] = useState<string | null>(null);
  const [b, setB] = useState(100); const [ct, setCt] = useState(100); const [sa, setSa] = useState(100); const [g, setG] = useState(0);
  const [rot, setRot] = useState(0); const [fh, setFh] = useState(false); const [fv, setFv] = useState(false);
  const [aspect, setAspect] = useState('orig');
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = agent.color;
  const ar = ASPECTS.find((a) => a.key === aspect)?.val ?? null;
  const filter = `brightness(${b}%) contrast(${ct}%) saturate(${sa}%) grayscale(${g}%)`;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUrl(URL.createObjectURL(f));
    setB(100); setCt(100); setSa(100); setG(0); setRot(0); setFh(false); setFv(false); setAspect('orig');
  }
  function reset() { setB(100); setCt(100); setSa(100); setG(0); setRot(0); setFh(false); setFv(false); setAspect('orig'); }

  function exportImg() {
    const img = imgRef.current; if (!img || !img.naturalWidth) return;
    const r = ((rot % 360) + 360) % 360; const swap = r === 90 || r === 270;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const bw = swap ? ih : iw, bh = swap ? iw : ih;
    let cw = bw, ch = bh;
    if (ar) { if (bw / bh > ar) cw = Math.round(bh * ar); else ch = Math.round(bw / ar); }
    const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.filter = filter;
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(r * Math.PI / 180);
    ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    canvas.toBlob((blob) => { if (!blob) return; const u = URL.createObjectURL(blob); download(u, `${agent.slug}-editado.png`); setTimeout(() => URL.revokeObjectURL(u), 4000); }, 'image/png');
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-muted/30 p-5">
        {!url ? (
          <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Upload className="h-9 w-9 opacity-50" />
            <p className="max-w-xs text-sm">Sube una imagen para editarla. <strong>Recorte, rotación y filtros son gratis</strong> (sin IA).</p>
            <button onClick={() => fileRef.current?.click()} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: c }}>Subir imagen</button>
          </div>
        ) : (
          <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-sm" style={{ aspectRatio: ar ? `${ar}` : undefined, maxHeight: 460, maxWidth: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={url} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" style={{ filter, transform: `rotate(${rot}deg) scaleX(${fh ? -1 : 1}) scaleY(${fv ? -1 : 1})` }} />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Ajustes</h3>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"><Upload className="h-3.5 w-3.5" /> Otra</button>
        </div>
        <Slider label="Brillo" value={b} setValue={setB} accent={c} />
        <Slider label="Contraste" value={ct} setValue={setCt} accent={c} />
        <Slider label="Saturación" value={sa} setValue={setSa} accent={c} />
        <Slider label="Blanco y negro" value={g} setValue={setG} min={0} max={100} accent={c} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Transformar</label>
          <div className="flex gap-1.5">
            <IconBtn onClick={() => setRot((r) => (r + 90) % 360)} title="Rotar"><RotateCw className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={() => setFh((v) => !v)} active={fh} accent={c} title="Voltear H"><FlipHorizontal2 className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={() => setFv((v) => !v)} active={fv} accent={c} title="Voltear V"><FlipVertical2 className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Recorte</label>
          <div className="flex flex-wrap gap-1.5">{ASPECTS.map((a) => <button key={a.key} onClick={() => setAspect(a.key)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${aspect === a.key ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={aspect === a.key ? { backgroundColor: c } : undefined}>{a.label}</button>)}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={exportImg} disabled={!url} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}><Download className="h-4 w-4" /> Descargar</button>
          <button onClick={reset} disabled={!url} className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted disabled:opacity-50">Reset</button>
        </div>
        <p className="text-[11px] text-muted-foreground">Estos ajustes son locales y gratis (no usan IA).</p>
      </div>
    </div>
  );
}

function Slider({ label, value, setValue, min = 0, max = 200, accent }: { label: string; value: number; setValue: (n: number) => void; min?: number; max?: number; accent: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-muted-foreground">{label}</span><span className="text-muted-foreground">{value}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full" style={{ accentColor: accent }} />
    </div>
  );
}
function IconBtn({ children, onClick, active, accent, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; accent?: string; title?: string }) {
  return <button onClick={onClick} title={title} className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-sm ${active ? 'text-white' : 'border-border text-muted-foreground hover:bg-muted'}`} style={active ? { backgroundColor: accent, borderColor: accent } : undefined}>{children}</button>;
}

// ── Editar con IA (/api/cactus/design/edit) ───────────────────────────────────
function EditarIA({ agent }: { agent: VisualAgent }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState<'square' | 'story' | 'wide'>('square');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const c = agent.color;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null);
  }
  async function edit() {
    if (!file || !prompt.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    const fd = new FormData(); fd.append('image', file); fd.append('prompt', prompt.trim()); fd.append('format', format);
    try {
      const res = await fetch('/api/cactus/design/edit', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo editar.');
      setResult(data.url);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Editar con IA</h3>
        <p className="mb-3 text-sm text-muted-foreground">Sube una imagen y describe el cambio (cambiar fondo, quitar/añadir, retoque, estilo…).</p>
        {preview ? (
          <div className="mb-3 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-48 w-full object-contain bg-muted" />
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="mb-3 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted/40"><Upload className="h-6 w-6" /><span className="text-xs">Subir imagen</span></button>
        )}
        {preview && <button onClick={() => fileRef.current?.click()} className="mb-3 inline-flex items-center gap-1 text-xs font-medium" style={{ color: c }}><Upload className="h-3.5 w-3.5" /> Cambiar imagen</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Ej. cambia el fondo a un estudio blanco; agrega luz cálida…" className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <div className="mb-3 flex gap-1.5">{FORMATS.map((f) => <button key={f.key} onClick={() => setFormat(f.key)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${format === f.key ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={format === f.key ? { backgroundColor: c } : undefined}>{f.label}</button>)}</div>
        <button onClick={edit} disabled={loading || !file || !prompt.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Editar con IA</button>
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold">Resultado</h3>
        {!result && !loading && <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><Sparkles className="h-9 w-9 opacity-50" /><p className="max-w-xs text-sm">La imagen editada aparecerá aquí.</p></div>}
        {loading && <div className="flex h-72 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Editando…</div>}
        {result && (
          <div className="group relative inline-block overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result} alt="" className="max-h-[460px] w-full object-contain" />
            <button onClick={() => download(result, `${agent.slug}-editado.png`)} className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium shadow"><Download className="h-3.5 w-3.5" /> PNG</button>
          </div>
        )}
      </div>
    </div>
  );
}
