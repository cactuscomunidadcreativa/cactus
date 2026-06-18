'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
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
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/cactus/agents/${slug}`).then((r) => r.json()).then((d) => {
      setDefaults(d.defaults || null);
      setCanManage(!!d.canManage);
      setForm(d.config || {});
    });
  }, [slug]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`/api/cactus/agents/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const d = await r.json();
      setMsg(d.ok ? '✅ Guardado. El agente ya piensa así para tu empresa.' : (d.error || 'No se pudo guardar.'));
    } finally { setSaving(false); }
  }

  if (!defaults) return <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

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

      {ro && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">Solo el owner/admin de la empresa puede editar los agentes.</p>}

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Field label="Foto (URL de imagen)">
          <input value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} disabled={ro}
            placeholder={defaults.image} className={inputCls} />
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
