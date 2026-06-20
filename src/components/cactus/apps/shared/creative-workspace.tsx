'use client';

import { useRef, useState } from 'react';
import {
  Wand2, Upload, Loader2, Download, Sparkles, Send, RotateCw, FlipHorizontal2, FlipVertical2,
  Sliders, ImageIcon, History, Layers,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';
import { getSubAgents } from '@/lib/cactus/sub-agents';

export interface WsAgent { slug: string; name: string; role: string; color: string; image: string }
export interface WsConfig {
  mode: 'design' | 'photo' | 'character' | 'avatar';
  greeting: string;
  subtitle: string;
  genLabel: string;
  promptPlaceholder: string;
  changePlaceholder: string;
  uploadHint: string;        // qué subir (referencia/pose/tu foto)
  presets?: string[];        // estilos rápidos que se añaden al brief
}

const FORMATS: { key: 'square' | 'story' | 'wide'; label: string }[] = [
  { key: 'square', label: 'Cuadrado' }, { key: 'story', label: 'Vertical' }, { key: 'wide', label: 'Horizontal' },
];
const ASPECTS: { key: string; label: string; val: number | null }[] = [
  { key: 'orig', label: 'Original', val: null }, { key: '1:1', label: '1:1', val: 1 },
  { key: '4:5', label: '4:5', val: 0.8 }, { key: '16:9', label: '16:9', val: 16 / 9 }, { key: '9:16', label: '9:16', val: 9 / 16 },
];

interface Img { display: string; blob: Blob | null; raw: string }

async function urlToBlob(url: string): Promise<Blob | null> {
  try { const r = await fetch(url); if (!r.ok) return null; return await r.blob(); } catch { return null; }
}
function downloadUrl(url: string, name: string) {
  const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.rel = 'noopener'; a.click();
}

// Reduce y convierte la foto (incl. HEIC de iPhone en Safari) a JPEG <~1MB,
// para no superar el límite de subida y aceptar formatos del teléfono.
async function prepareImage(file: File): Promise<Blob> {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('decode'));
      im.src = url;
    });
    const max = 1536;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) throw new Error('blob');
    return blob;
  } catch {
    return file; // último recurso: sube el original (puede fallar si es HEIC en desktop)
  }
}

// Lee JSON de una respuesta; si el cuerpo no es JSON (p. ej. 413 'Request Entity
// Too Large' en texto), devuelve un error amigable según el status.
async function readJsonOrError(res: Response): Promise<any> {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch {
    if (res.status === 413) return { error: 'La foto pesa demasiado. Prueba con una más liviana.' };
    return { error: 'El servidor respondió un error inesperado. Intenta de nuevo.' };
  }
}

export function CreativeWorkspace({ agent, user, credits, config }: { agent: WsAgent; user?: ShellUser; credits?: number; config: WsConfig }) {
  const c = agent.color;
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // brief
  const [brief, setBrief] = useState('');
  const [format, setFormat] = useState<'square' | 'story' | 'wide'>('square');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [subAgent, setSubAgent] = useState<string | null>(null);
  const [srcUploaded, setSrcUploaded] = useState(false); // la imagen actual es una foto subida por el usuario

  // estado de imagen
  const [current, setCurrent] = useState<Img | null>(null);
  const [history, setHistory] = useState<Img[]>([]);
  const [busy, setBusy] = useState<'' | 'gen' | 'edit'>('');
  const [error, setError] = useState<string | null>(null);

  // ajustes sin IA
  const [adjOpen, setAdjOpen] = useState(false);
  const [b, setB] = useState(100); const [ct, setCt] = useState(100); const [sa, setSa] = useState(100); const [g, setG] = useState(0);
  const [rot, setRot] = useState(0); const [fh, setFh] = useState(false); const [fv, setFv] = useState(false); const [aspect, setAspect] = useState('orig');
  const ar = ASPECTS.find((a) => a.key === aspect)?.val ?? null;
  const filter = `brightness(${b}%) contrast(${ct}%) saturate(${sa}%) grayscale(${g}%)`;
  const resetAdj = () => { setB(100); setCt(100); setSa(100); setG(0); setRot(0); setFh(false); setFv(false); setAspect('orig'); };

  // chat de cambios
  const [change, setChange] = useState('');
  const [log, setLog] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);

  async function setFromUrl(url: string, pushHistory = true) {
    const blob = await urlToBlob(url);
    const display = blob ? URL.createObjectURL(blob) : url;
    const img: Img = { display, blob, raw: url };
    setCurrent(img); resetAdj();
    if (pushHistory) setHistory((h) => [img, ...h].slice(0, 12));
    return img;
  }

  async function generate() {
    if (!brief.trim() || busy) return;
    setBusy('gen'); setError(null);
    // Mini-agente (Bloque 6): su enfoque afina el brief visual.
    const focus = subAgent ? getSubAgents(agent.slug).find((s) => s.key === subAgent)?.focus : '';
    const fullBrief = focus ? `${focus} ${brief.trim()}` : brief.trim();
    try {
      // Si hay una FOTO subida, transformamos ESA imagen (preserva tu identidad)
      // en vez de inventar a otra persona desde cero.
      if (srcUploaded && current?.blob) {
        const fd = new FormData();
        fd.append('image', current.blob, 'foto.jpg'); fd.append('prompt', fullBrief);
        fd.append('format', format); fd.append('mode', config.mode);
        const res = await fetch('/api/cactus/design/edit', { method: 'POST', body: fd });
        const data = await readJsonOrError(res);
        if (!res.ok) throw new Error(data.error || 'No se pudo transformar tu foto.');
        await setFromUrl(data.url); // sigue siendo tu persona → mantenemos srcUploaded
        setLog([{ role: 'agent', text: 'Listo, transformé tu foto manteniendo tu identidad. Pide ajustes si quieres.' }]);
      } else {
        const res = await fetch('/api/cactus/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: fullBrief, mode: config.mode, format, style }) });
        const data = await readJsonOrError(res);
        if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
        setSrcUploaded(false);
        await setFromUrl(data.url);
        setLog([{ role: 'agent', text: 'Aquí está tu primera versión. Pídeme los cambios que quieras.' }]);
      }
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setBusy(''); }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (fileRef.current) fileRef.current.value = '';
    setBusy('edit'); setError(null);
    try {
      const blob = await prepareImage(f); // reduce + convierte (HEIC→JPEG)
      const display = URL.createObjectURL(blob);
      const img: Img = { display, blob, raw: display };
      setCurrent(img); resetAdj(); setHistory((h) => [img, ...h].slice(0, 12));
      setSrcUploaded(true);
      setLog([{ role: 'agent', text: 'Foto cargada. Escribe cómo la quieres (ej. "avatar profesional, fondo neutro") y pulsa Generar: la transformo manteniendo tu cara.' }]);
    } catch {
      setError('No pude leer esa foto. Prueba con JPG o PNG.');
    } finally { setBusy(''); }
  }

  async function applyChange() {
    const t = change.trim();
    if (!t || busy) return;
    if (!current?.blob) { setError('No puedo editar esta imagen automáticamente. Descárgala y vuelve a subirla.'); return; }
    setBusy('edit'); setError(null);
    setLog((l) => [...l, { role: 'user', text: t }]); setChange('');
    try {
      const fd = new FormData(); fd.append('image', current.blob, 'img.jpg'); fd.append('prompt', t); fd.append('format', format); fd.append('mode', config.mode);
      const res = await fetch('/api/cactus/design/edit', { method: 'POST', body: fd });
      const data = await readJsonOrError(res);
      if (!res.ok) throw new Error(data.error || 'No se pudo aplicar el cambio.');
      await setFromUrl(data.url);
      setLog((l) => [...l, { role: 'agent', text: 'Aplicado ✦. ¿Otro ajuste?' }]);
    } catch (e: any) { setError(e?.message || 'Error'); setLog((l) => [...l, { role: 'agent', text: 'No pude aplicarlo, intenta reformular.' }]); } finally { setBusy(''); }
  }

  function exportAdjusted() {
    const img = imgRef.current; if (!img || !img.naturalWidth || !current) { if (current) downloadUrl(current.display, `${agent.slug}.png`); return; }
    const r = ((rot % 360) + 360) % 360; const swap = r === 90 || r === 270;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const bw = swap ? ih : iw, bh = swap ? iw : ih;
    let cw = bw, ch = bh;
    if (ar) { if (bw / bh > ar) cw = Math.round(bh * ar); else ch = Math.round(bw / ar); }
    const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d'); if (!ctx) { downloadUrl(current.display, `${agent.slug}.png`); return; }
    ctx.filter = filter; ctx.translate(cw / 2, ch / 2); ctx.rotate(r * Math.PI / 180); ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
    try { ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih); canvas.toBlob((blob) => { if (!blob) { downloadUrl(current.display, `${agent.slug}.png`); return; } const u = URL.createObjectURL(blob); downloadUrl(u, `${agent.slug}.png`); setTimeout(() => URL.revokeObjectURL(u), 4000); }, 'image/png'); }
    catch { downloadUrl(current.display, `${agent.slug}.png`); }
  }

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [{ key: 'workspace', label: 'Estudio', icon: Layers }];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav="workspace" onNav={() => {}}
      user={user} credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} ${config.greeting}`}
      subtitle={config.subtitle}
    >
      <div className="grid gap-4 xl:grid-cols-[300px_1fr_320px]">
        {/* Brief / crear */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 font-display font-semibold">{config.genLabel}</h3>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder={config.promptPlaceholder} className="mb-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
            {config.presets && config.presets.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {config.presets.map((p) => (
                  <button key={p} type="button" onClick={() => setBrief((b) => (b.trim() ? `${b.trim()}, ${p}` : p))}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted">+ {p}</button>
                ))}
              </div>
            )}
            <div className="mb-2 flex gap-1">{FORMATS.map((f) => <button key={f.key} onClick={() => setFormat(f.key)} className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-medium ${format === f.key ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={format === f.key ? { backgroundColor: c } : undefined}>{f.label}</button>)}</div>
            <div className="mb-3 flex gap-1">{(['vivid', 'natural'] as const).map((s) => <button key={s} onClick={() => setStyle(s)} className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-medium ${style === s ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={style === s ? { backgroundColor: c } : undefined}>{s === 'vivid' ? 'Vibrante' : 'Natural'}</button>)}</div>
            <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={c} />
            <button onClick={generate} disabled={busy !== '' || !brief.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: c }}>{busy === 'gen' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {srcUploaded ? 'Transformar mi foto' : 'Generar'}</button>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
            <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 text-center text-muted-foreground hover:text-foreground"><Upload className="h-6 w-6" /><span className="text-xs">{config.uploadHint}</span></button>
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" hidden onChange={onFile} />
          </div>
          {history.length > 1 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><History className="h-3.5 w-3.5" /> Versiones</div>
              <div className="grid grid-cols-4 gap-1.5">{history.map((h, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={i} src={h.display} alt="" onClick={() => { setCurrent(h); resetAdj(); }} className={`aspect-square cursor-pointer rounded-md object-cover ${current?.raw === h.raw ? 'ring-2' : 'opacity-80 hover:opacity-100'}`} style={current?.raw === h.raw ? { boxShadow: `0 0 0 2px ${c}` } : undefined} />
              ))}</div>
            </div>
          )}
        </div>

        {/* Preview del entregable */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold">Preview</h3>
            {current && <div className="flex items-center gap-1.5"><button onClick={() => setAdjOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted"><Sliders className="h-3.5 w-3.5" /> Ajustes</button><button onClick={exportAdjusted} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: c }}><Download className="h-3.5 w-3.5" /> PNG</button></div>}
          </div>
          <div className="flex min-h-[360px] items-center justify-center rounded-xl bg-muted/30 p-3">
            {busy === 'gen' && !current ? (
              <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando…</div>
            ) : !current ? (
              <div className="flex flex-col items-center gap-2 text-center text-muted-foreground"><ImageIcon className="h-10 w-10 opacity-50" /><p className="max-w-xs text-sm">Genera con un texto o sube tu imagen para empezar.</p></div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={current.display} alt="" crossOrigin="anonymous" className="max-h-[460px] rounded-lg object-contain" style={{ filter, transform: `rotate(${rot}deg) scaleX(${fh ? -1 : 1}) scaleY(${fv ? -1 : 1})` }} />
                {busy === 'edit' && <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 text-white"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Aplicando cambio…</div>}
              </div>
            )}
          </div>
          {adjOpen && current && (
            <div className="mt-3 grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-2">
              <Slider label="Brillo" value={b} setValue={setB} accent={c} />
              <Slider label="Contraste" value={ct} setValue={setCt} accent={c} />
              <Slider label="Saturación" value={sa} setValue={setSa} accent={c} />
              <Slider label="B&N" value={g} setValue={setG} min={0} max={100} accent={c} />
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5">
                <button onClick={() => setRot((r) => (r + 90) % 360)} className="rounded-md border border-border p-1.5 hover:bg-muted"><RotateCw className="h-4 w-4" /></button>
                <button onClick={() => setFh((v) => !v)} className={`rounded-md border p-1.5 ${fh ? 'text-white' : 'border-border hover:bg-muted'}`} style={fh ? { backgroundColor: c, borderColor: c } : undefined}><FlipHorizontal2 className="h-4 w-4" /></button>
                <button onClick={() => setFv((v) => !v)} className={`rounded-md border p-1.5 ${fv ? 'text-white' : 'border-border hover:bg-muted'}`} style={fv ? { backgroundColor: c, borderColor: c } : undefined}><FlipVertical2 className="h-4 w-4" /></button>
                <span className="mx-1 text-[11px] text-muted-foreground">Recorte:</span>
                {ASPECTS.map((a) => <button key={a.key} onClick={() => setAspect(a.key)} className={`rounded-md px-2 py-1 text-[11px] ${aspect === a.key ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={aspect === a.key ? { backgroundColor: c } : undefined}>{a.label}</button>)}
                <button onClick={resetAdj} className="ml-auto rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted">Reset</button>
              </div>
              <p className="sm:col-span-2 text-[11px] text-muted-foreground">Ajustes locales gratis (sin IA). Se aplican al descargar.</p>
            </div>
          )}
        </div>

        {/* Pedir cambios (IA) */}
        <div className="flex max-h-[560px] flex-col rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3"><Sparkles className="h-4 w-4" style={{ color: c }} /><h3 className="font-display font-semibold">Pedir cambios</h3></div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {log.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cuando tengas una imagen, escribe el cambio (ej. “cambia el fondo a estudio blanco”, “más cálido”, “quita el texto”) y {agent.name} la edita.</p>
            ) : log.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-1.5 text-sm ${m.role === 'user' ? 'text-white' : 'bg-muted text-foreground'}`} style={m.role === 'user' ? { backgroundColor: c } : undefined}>{m.text}</div>
              </div>
            ))}
            {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          </div>
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea value={change} onChange={(e) => setChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyChange(); } }} rows={1} placeholder={config.changePlaceholder} disabled={!current} className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none disabled:opacity-50" />
              <button onClick={applyChange} disabled={busy !== '' || !current || !change.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: c }}>{busy === 'edit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
      </div>
    </AgentAppShell>
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
