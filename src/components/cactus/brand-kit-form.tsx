'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle2, BrainCircuit } from 'lucide-react';
import type { BrandKit } from '@/lib/cactus/brain';

const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none';

export function BrandKitForm() {
  const [brand, setBrand] = useState<BrandKit>({ name: '', industry: '', offer: '', audience: '', tone: '', values: [] });
  const [valuesText, setValuesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cactus/brand')
      .then((r) => r.json())
      .then((d) => {
        if (d.pendingSchema) setNotice('La tabla aún no existe (falta aplicar la migración 031). Puedes escribir tu marca, pero no se guardará hasta crearla.');
        if (d.brand) {
          setBrand(d.brand);
          setValuesText((d.brand.values || []).join(', '));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setNotice(null);
    const payload = { ...brand, values: valuesText.split(',').map((v) => v.trim()).filter(Boolean) };
    const res = await fetch('/api/cactus/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setNotice(data.error || 'Error al guardar'); return; }
    setBrand(data.brand);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando tu marca…</div>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
        <BrainCircuit className="h-5 w-5 text-cactus-green" />
        <p className="text-sm text-muted-foreground">
          Lo que cargues aquí es el <strong className="text-foreground">contexto de marca</strong> que todos los agentes
          (y el motor emocional) usan para hablar como tú.
        </p>
      </div>

      {notice && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">{notice}</p>}

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre de marca *</label>
          <input className={field} value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} placeholder="ROWI" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Industria</label>
            <input className={field} value={brand.industry || ''} onChange={(e) => setBrand({ ...brand, industry: e.target.value })} placeholder="EdTech / Bienestar" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tono</label>
            <input className={field} value={brand.tone || ''} onChange={(e) => setBrand({ ...brand, tone: e.target.value })} placeholder="Cálido, humano, con autoridad" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">¿Qué ofrece?</label>
          <textarea className={field} rows={2} value={brand.offer || ''} onChange={(e) => setBrand({ ...brand, offer: e.target.value })} placeholder="Plataforma de IA emocional sobre Six Seconds." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Audiencia</label>
          <input className={field} value={brand.audience || ''} onChange={(e) => setBrand({ ...brand, audience: e.target.value })} placeholder="Líderes de RRHH y coaches en LATAM" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Valores (separados por coma)</label>
          <input className={field} value={valuesText} onChange={(e) => setValuesText(e.target.value)} placeholder="empatía, ciencia, transformación" />
        </div>

        <button
          onClick={save}
          disabled={saving || !brand.name}
          className="flex items-center justify-center gap-2 rounded-md bg-cactus-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cactus-green/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Guardado' : 'Guardar marca'}
        </button>
      </div>
    </div>
  );
}
