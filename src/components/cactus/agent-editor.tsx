'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, ArrowLeft, KeyRound, Plus, Trash2, Upload, Film } from 'lucide-react';
import Link from 'next/link';

interface Props { slug: string }

const PROVIDERS = [
  { v: '', label: 'Por defecto (router)' },
  { v: 'claude', label: 'Claude (premium)' },
  { v: 'openai', label: 'OpenAI (gpt-4o-mini)' },
  { v: 'gemini', label: 'Gemini' },
];

export function AgentEditor({ slug }: Props) {
  const [defaults, setDefaults] = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  // Por defecto GLOBAL: un cambio (foto/persona/video) aplica en todos lados.
  const [scope, setScope] = useState<'company' | 'global'>('global');
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async (sc: 'company' | 'global') => {
    setLoading(true);
    const r = await fetch(`/api/cactus/agents/${slug}?scope=${sc}`);
    const d = await r.json();
    // No super-admin no edita global → cae a "Mi empresa" automáticamente
    if (sc === 'global' && !d.isSuper) { setIsSuper(false); setScope('company'); return; }
    setDefaults(d.defaults || null);
    setCanManage(!!d.canManage);
    setIsSuper(!!d.isSuper);
    setForm(d.config || {});
    setLoading(false);
  }, [slug]);
  useEffect(() => { load(scope); }, [load, scope]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`/api/cactus/agents/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, scope }),
      });
      const d = await r.json();
      setMsg(d.ok ? (scope === 'global' ? '✅ Guardado en Cactus (global).' : '✅ Guardado para tu empresa.') : (d.error || 'No se pudo guardar.'));
    } finally { setSaving(false); }
  }

  async function uploadPhoto(file: File) {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`/api/cactus/agents/${slug}/photo?scope=${scope}`, { method: 'POST', body: fd });
      const d = await r.json();
      if (d.ok && d.url) set(d.kind === 'video' ? 'video_url' : 'image_url', d.url);
      else setMsg(d.error || 'No se pudo subir el archivo.');
    } finally { setUploading(false); }
  }

  if (!defaults || loading) return <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const photo = form.image_url || defaults.image;
  const ro = !canManage;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/empresa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Empresa</Link>

      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={defaults.name} className="h-20 w-20 rounded-2xl border border-border object-cover" />
        <div>
          <h1 className="font-display text-2xl font-bold">{form.display_name || defaults.name}</h1>
          <p className="text-sm" style={{ color: defaults.color }}>{defaults.role}</p>
        </div>
      </div>

      {isSuper && (
        <div className="flex gap-2">
          {(['company', 'global'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${scope === s ? 'border-cactus-green bg-cactus-green/10 text-cactus-green' : 'border-border hover:bg-muted'}`}>
              {s === 'company' ? 'Mi empresa' : 'Cactus (global)'}
            </button>
          ))}
        </div>
      )}
      {scope === 'global' && <p className="rounded-lg border border-cactus-green/30 bg-cactus-green/5 px-3 py-2 text-xs text-muted-foreground">Editando el <strong>valor por defecto global</strong> de Cactus: aplica a toda empresa que no lo personalice.</p>}

      {ro && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">{scope === 'global' ? 'Solo Cactus (super-admin) edita el nivel global.' : 'Solo el owner/admin de la empresa puede editar los agentes.'}</p>}

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Field label="Foto del agente">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted ${ro ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir imagen
              <input type="file" accept="image/*" className="hidden" disabled={ro} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            </label>
          </div>
          <input value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} disabled={ro} placeholder="…o pega una URL de imagen" className={`${inputCls} mt-2`} />
        </Field>
        <Field label="Animación (video, opcional · mp4/webm, máx 50 MB)">
          <div className="flex items-center gap-3">
            {form.video_url
              ? <video src={form.video_url} autoPlay muted loop playsInline className="h-14 w-14 rounded-lg border border-border object-cover" />
              : <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">sin video</span>}
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted ${ro ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />} Subir video
              <input type="file" accept="video/*" className="hidden" disabled={ro} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            </label>
          </div>
          <input value={form.video_url || ''} onChange={(e) => set('video_url', e.target.value)} disabled={ro} placeholder="…o pega una URL de video" className={`${inputCls} mt-2`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <input value={form.display_name || ''} onChange={(e) => set('display_name', e.target.value)} disabled={ro} placeholder={defaults.name} className={inputCls} />
          </Field>
          <Field label="Activo">
            <select value={form.is_active === false ? 'no' : 'si'} onChange={(e) => set('is_active', e.target.value === 'si')} disabled={ro} className={inputCls}>
              <option value="si">Encendido</option><option value="no">Apagado</option>
            </select>
          </Field>
        </div>
        <Field label="Descripción (para qué sirve)">
          <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} disabled={ro} rows={2} placeholder={defaults.description} className={inputCls} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Proveedor de IA">
            <select value={form.provider || ''} onChange={(e) => set('provider', e.target.value)} disabled={ro} className={inputCls}>
              {PROVIDERS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Modelo (referencia)">
            <input value={form.model || ''} onChange={(e) => set('model', e.target.value)} disabled={ro} placeholder="p.ej. gpt-4o-mini" className={inputCls} />
          </Field>
        </div>

        <Field label="Cómo piensa / persona (system prompt)">
          <textarea value={form.prompt || ''} onChange={(e) => set('prompt', e.target.value)} disabled={ro} rows={4} placeholder="Describe cómo razona y se comporta este agente para tu empresa…" className={inputCls} />
        </Field>
        <Field label="Instrucciones específicas">
          <textarea value={form.custom_instructions || ''} onChange={(e) => set('custom_instructions', e.target.value)} disabled={ro} rows={3} className={inputCls} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tono de la marca"><input value={form.company_tone || ''} onChange={(e) => set('company_tone', e.target.value)} disabled={ro} className={inputCls} /></Field>
          <Field label="Valores"><input value={form.company_values || ''} onChange={(e) => set('company_values', e.target.value)} disabled={ro} className={inputCls} /></Field>
        </div>
        <Field label="Industria / contexto"><input value={form.industry_context || ''} onChange={(e) => set('industry_context', e.target.value)} disabled={ro} className={inputCls} /></Field>
        <Field label="Cultura de la empresa (directrices)"><textarea value={form.culture_prompt || ''} onChange={(e) => set('culture_prompt', e.target.value)} disabled={ro} rows={2} className={inputCls} /></Field>

        {!ro && (
          <div className="flex items-center gap-3 pt-1">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-cactus-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
            </button>
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          </div>
        )}
      </div>

      {scope === 'company' && <SecretsSection slug={slug} canManage={canManage} />}
    </div>
  );
}

// ── Credenciales del agente (contraseñas / tokens / API keys) — cifradas ─────
function SecretsSection({ slug, canManage }: { slug: string; canManage: boolean }) {
  const [list, setList] = useState<any[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('token');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/cactus/agents/${slug}/secrets`);
    const d = await r.json();
    setList(d.secrets || []); setConfigured(d.configured !== false);
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim() || !value.trim()) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/cactus/agents/${slug}/secrets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, kind, value }),
      });
      const d = await r.json();
      if (d.ok) { setName(''); setValue(''); await load(); } else { setErr(d.error || 'No se pudo guardar.'); }
    } finally { setBusy(false); }
  }
  async function del(id: string) {
    await fetch(`/api/cactus/agents/${slug}/secrets`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-cactus-green" />
        <h2 className="font-display font-semibold">Credenciales (contraseñas y tokens)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Se guardan <strong>cifradas</strong> (AES-256-GCM); el valor nunca se muestra ni vuelve al navegador. Úsalo para las llaves/tokens que este agente necesita.
      </p>
      {!configured && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Falta <code>CACTUS_SECRETS_KEY</code> en el servidor (Vercel). Mientras no esté, no guardo credenciales (para no dejarlas sin cifrar).
        </p>
      )}
      {list === null ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
        <ul className="space-y-1.5">
          {list.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 text-sm">
              <span className="flex-1 truncate"><span className="font-medium">{s.name}</span> <span className="text-[11px] text-muted-foreground">· {s.kind} · {s.last4 || '••••'}</span></span>
              {canManage && <button onClick={() => del(s.id)} className="rounded p-1 hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
            </li>
          ))}
          {!list.length && <p className="text-xs text-muted-foreground">Sin credenciales guardadas.</p>}
        </ul>
      )}
      {canManage && configured && (
        <div className="flex flex-wrap items-end gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej. WhatsApp token)" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
            <option value="token">token</option><option value="api_key">api_key</option><option value="password">password</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} type="password" placeholder="Valor (secreto)" autoComplete="new-password" className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
          <button onClick={add} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-cactus-green px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
