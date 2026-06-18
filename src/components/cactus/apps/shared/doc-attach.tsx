'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { extractText } from '@/lib/cactus/doc-extract';

export interface Attached { name: string; text: string }

// Botón reutilizable para adjuntar un documento (PDF, imagen, Excel, csv, txt).
// La extracción de texto es GRATIS (sin IA); el padre decide cómo usar el texto.
export function DocAttach({
  accent, attached, onChange, label = 'Adjuntar documento',
}: {
  accent: string;
  attached: Attached | null;
  onChange: (a: Attached | null) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setErr(null);
    try {
      const txt = await extractText(f);
      if (!txt) throw new Error('No pude leer ese archivo.');
      onChange({ name: f.name, text: txt });
    } catch (e: any) { setErr(e?.message || 'No pude leer el archivo.'); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  }

  return (
    <div>
      {attached ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5" style={{ color: accent }} />
          <span className="max-w-[200px] truncate font-medium">{attached.name}</span>
          <span className="text-muted-foreground">· leído</span>
          <button onClick={() => onChange(null)} className="ml-auto text-muted-foreground hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />} {busy ? 'Leyendo…' : label}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*,application/pdf,.xlsx,.xls,.xlsm,.csv,.txt,.ods" hidden onChange={onFile} />
      {err && <p className="mt-1 text-[10px] text-red-500">{err}</p>}
    </div>
  );
}

// Helper: anexa el documento leído a un prompt como material de referencia.
export function withDoc(prompt: string, attached: Attached | null, intro = 'Material de referencia adjunto'): string {
  if (!attached) return prompt;
  return `${prompt}\n\n${intro} (${attached.name}):\n"""\n${attached.text.slice(0, 7000)}\n"""`;
}
