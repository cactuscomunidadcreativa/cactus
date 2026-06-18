'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plug, Check, X, KeyRound, ExternalLink, Copy, ShieldAlert, ChevronDown } from 'lucide-react';
import {
  INTEGRATIONS, CATEGORY_META, CATEGORY_ORDER,
  type IntegrationProvider, type IntegrationCategory,
} from '@/lib/cactus/integrations';
import { AGENTS_BY_SLUG } from '@/lib/cactus/agents-catalog';

interface Status { slug: string; connected: boolean; fields: Record<string, string | null> }

const OAUTH_ERROR: Record<string, string> = {
  sin_config: 'Falta registrar la app OAuth: agrega client_id/secret a las variables de entorno del servidor.',
  denegado: 'Cancelaste el permiso en el proveedor.',
  token: 'No se pudo intercambiar el código por un token. Revisa client_id/secret y el redirect URI.',
  sin_empresa: 'No hay empresa activa.',
  sin_sesion: 'Sesión no disponible.',
  guardar: 'Se obtuvo el token pero no se pudo guardar.',
  proveedor: 'Proveedor desconocido.',
  sin_code: 'El proveedor no devolvió un código.',
};

export function IntegrationsHub() {
  const [status, setStatus] = useState<Record<string, Status> | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [secretsOk, setSecretsOk] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const load = () => {
    fetch('/api/cactus/integrations')
      .then((r) => r.json())
      .then((d) => { setStatus(d.status || {}); setCanManage(!!d.canManage); setSecretsOk(d.secretsConfigured !== false); })
      .catch(() => setStatus({}));
  };
  useEffect(load, []);

  // Resultado del flujo OAuth (?ok=1 / ?error=...&provider=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const provider = q.get('provider') || '';
    const name = INTEGRATIONS.find((i) => i.slug === provider)?.name || provider;
    if (q.get('ok')) setBanner({ kind: 'ok', text: `${name} conectado correctamente.` });
    else if (q.get('error')) setBanner({ kind: 'error', text: `${name}: ${OAUTH_ERROR[q.get('error') || ''] || 'No se pudo conectar.'}` });
    if (q.get('ok') || q.get('error')) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const byCategory = useMemo(() => {
    const m: Record<string, IntegrationProvider[]> = {};
    for (const p of INTEGRATIONS) (m[p.category] ||= []).push(p);
    return m;
  }, []);

  const connectedCount = status ? Object.values(status).filter((s) => s.connected).length : 0;

  if (!status) return <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Avisos */}
      {!secretsOk && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Falta <code className="rounded bg-amber-100 px-1">CACTUS_SECRETS_KEY</code> en el servidor. No puedo guardar llaves cifradas hasta que se configure en Vercel.</span>
        </div>
      )}
      {banner && (
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${banner.kind === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {banner.kind === 'ok' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {banner.text}
        </div>
      )}
      {!canManage && (
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Solo el owner/admin de la empresa puede conectar o desconectar integraciones. Lo ves en modo lectura.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <Plug className="h-3.5 w-3.5" /> {connectedCount} de {INTEGRATIONS.length} conectadas
        </span>
        <span className="text-xs">Las llaves se guardan cifradas (AES-256-GCM) y nunca vuelven al navegador.</span>
      </div>

      {CATEGORY_ORDER.filter((c) => byCategory[c]?.length).map((cat) => (
        <section key={cat} className="space-y-2.5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <span>{CATEGORY_META[cat as IntegrationCategory].emoji}</span> {CATEGORY_META[cat as IntegrationCategory].label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {byCategory[cat].map((p) => (
              <ProviderCard
                key={p.slug}
                p={p}
                st={status[p.slug]}
                origin={origin}
                canManage={canManage && secretsOk}
                onChanged={load}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProviderCard({
  p, st, origin, canManage, onChanged,
}: {
  p: IntegrationProvider;
  st?: Status;
  origin: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const connected = !!st?.connected;

  const redirect = `${origin}/api/integrations/${p.slug}/callback`;

  async function save() {
    setBusy(true); setErr(null);
    const res = await fetch('/api/cactus/integrations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: p.slug, values }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok || !d.ok) { setErr(d.error || 'No se pudo guardar.'); return; }
    setOpen(false); setValues({}); onChanged();
  }

  async function disconnect() {
    setBusy(true);
    await fetch('/api/cactus/integrations', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: p.slug }),
    });
    setBusy(false); onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${p.color}1a` }}>
          {p.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{p.name}</h3>
            {connected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"><Check className="h-2.5 w-2.5" /> Conectado</span>
            ) : (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{p.auth === 'oauth' ? 'OAuth' : 'API key'}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {p.agents.map((a) => {
              const ag = AGENTS_BY_SLUG[a];
              return <span key={a} className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{ag?.emoji} {ag?.name || a}</span>;
            })}
          </div>
        </div>
      </div>

      {/* Acción */}
      <div className="mt-3 border-t border-border pt-3">
        {connected ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {p.auth === 'oauth' ? 'Token guardado ·' : ''} {Object.entries(st!.fields).map(([k, v]) => v ? `••••${v}` : k).join(' · ')}
            </span>
            {canManage && (
              <button onClick={disconnect} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-red-300 hover:text-red-600 disabled:opacity-50">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Desconectar
              </button>
            )}
          </div>
        ) : p.auth === 'api_key' ? (
          !open ? (
            <button onClick={() => setOpen(true)} disabled={!canManage} className="inline-flex items-center gap-1.5 rounded-lg bg-cactus-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-cactus-green/90 disabled:opacity-50">
              <KeyRound className="h-3.5 w-3.5" /> Conectar
            </button>
          ) : (
            <div className="space-y-2">
              {(p.fields || []).map((f) => (
                <div key={f.key}>
                  <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">{f.label}{f.optional ? ' (opcional)' : ''}</label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-cactus-green focus:outline-none"
                  />
                </div>
              ))}
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div className="flex items-center gap-2">
                <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-cactus-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-cactus-green/90 disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
                </button>
                <button onClick={() => { setOpen(false); setErr(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                {p.docsUrl && <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-cactus-green hover:underline">Obtener llave <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </div>
          )
        ) : (
          // OAuth
          <div className="space-y-2">
            <a
              href={canManage ? `/api/integrations/${p.slug}/start` : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${canManage ? 'bg-cactus-green hover:bg-cactus-green/90' : 'pointer-events-none bg-muted-foreground/40'}`}
            >
              <Plug className="h-3.5 w-3.5" /> Conectar con {p.name}
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Para registrar la app <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="space-y-1.5 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <p>1. Registra una app en <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" className="text-cactus-green hover:underline">el panel del proveedor</a>.</p>
                <p>2. Usa este <strong>redirect URI</strong>:</p>
                <div className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1">
                  <code className="min-w-0 flex-1 truncate">{redirect}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(redirect); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p>3. Pon <code className="rounded bg-background px-1">{p.oauth?.clientIdEnv}</code> y <code className="rounded bg-background px-1">{p.oauth?.clientSecretEnv}</code> en las variables de entorno (Vercel).</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
