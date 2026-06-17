'use client';

import { useState, useEffect } from 'react';
import { Database, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

interface Status { setup: boolean; tables: Record<string, boolean>; error?: string }
interface SetupResult { ok: boolean; total: number; okCount: number; failed: { i: number; head: string; error: string }[]; error?: string }

export function DbSetupPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  async function loadStatus() {
    try {
      const r = await fetch('/api/admin/db-status');
      setStatus(await r.json());
    } catch { /* noop */ }
  }
  useEffect(() => { loadStatus(); }, []);

  async function deploy() {
    setRunning(true); setResult(null);
    try {
      const r = await fetch('/api/admin/db-setup', { method: 'POST' });
      const data = await r.json();
      setResult(data);
      await loadStatus();
    } catch (e: any) {
      setResult({ ok: false, total: 0, okCount: 0, failed: [], error: e.message });
    } finally { setRunning(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Database className="h-5 w-5" /> Base de datos</h2>
        <p className="text-sm text-muted-foreground">
          Despliega/actualiza todo el esquema de Cactus con un clic — crea tablas, RLS, seeds y arregla políticas. Idempotente (puedes correrlo cuantas veces quieras).
        </p>
      </div>

      {/* Estado */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          {status?.setup ? <CheckCircle2 className="h-4 w-4 text-cactus-green" /> : <XCircle className="h-4 w-4 text-amber-500" />}
          {status ? (status.setup ? 'Base de datos al día' : 'Faltan tablas — despliega para completar') : 'Verificando…'}
        </div>
        <div className="flex flex-wrap gap-2">
          {status && Object.entries(status.tables).map(([t, ok]) => (
            <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] ${ok ? 'bg-cactus-green/10 text-cactus-green' : 'bg-amber-100 text-amber-700'}`}>
              {ok ? '✓' : '×'} {t.replace('cactus_', '')}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={deploy}
        disabled={running}
        className="flex items-center justify-center gap-2 rounded-md bg-cactus-green px-5 py-2.5 text-sm font-medium text-white hover:bg-cactus-green/90 disabled:opacity-60"
      >
        {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Desplegando…</> : <><Play className="h-4 w-4" /> Desplegar base de datos</>}
      </button>

      {result && (
        <div className={`rounded-lg border p-4 text-sm ${result.ok ? 'border-cactus-green/40 bg-cactus-green/5' : 'border-amber-300 bg-amber-50'}`}>
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <p className="font-medium">{result.ok ? '✅ Listo' : '⚠️ Con observaciones'} — {result.okCount}/{result.total} sentencias OK</p>
              {result.failed?.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {result.failed.map((f) => <li key={f.i}>• {f.head}… → {f.error}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
