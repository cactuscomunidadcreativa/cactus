'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { agentQuickActions } from '@/lib/cactus/agent-prompts';
import { extractText } from '@/lib/cactus/doc-extract';

interface AgentMeta {
  slug: string; name: string; role: string; emoji: string; color: string; image: string;
  tools: string[]; description: string;
}
// `full` = contenido enviado al modelo (puede incluir el texto del documento). `docName` = chip de UI.
interface Msg { role: 'user' | 'assistant'; content: string; credits?: number; full?: string; docName?: string }

export function AgentConsole({ agent }: { agent: AgentMeta }) {
  const t = useTranslations('ecosystem');
  const role = t(`agents.${agent.slug}.role`);
  const description = t(`agents.${agent.slug}.description`);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: t('console.greeting', { name: agent.name, emoji: agent.emoji, role, description }) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
  const [attaching, setAttaching] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const quickActions = agentQuickActions(agent.slug);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setAttaching(true); setError(null);
    try {
      const txt = await extractText(f);
      if (!txt) throw new Error('No pude leer texto de ese archivo. Prueba otro (PDF, imagen nítida, Excel).');
      setAttachment({ name: f.name, text: txt });
    } catch (err: any) {
      setError(err?.message || 'No pude leer el archivo.');
    } finally { setAttaching(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if ((!text && !attachment) || loading) return;
    setError(null);
    const display = text || (attachment ? `He adjuntado un documento: ${attachment.name}` : '');
    const full = attachment
      ? `${text || 'Te comparto este documento, ayúdame con él.'}\n\n[Documento adjunto: ${attachment.name}]\n"""\n${attachment.text.slice(0, 8000)}\n"""`
      : text;
    const next: Msg[] = [...messages, { role: 'user', content: display, full, docName: attachment?.name }];
    setMessages(next);
    setInput('');
    setAttachment(null);
    setLoading(true);
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: next.map((m) => ({ role: m.role, content: m.full ?? m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setMessages((m) => [...m, { role: 'assistant', content: data.content, credits: data.credits }]);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="group flex items-center gap-3 border-b border-border p-4" style={{ borderTopWidth: 3, borderTopColor: agent.color }}>
        <Image src={agent.image} alt={agent.name} width={40} height={40} className="rounded-lg motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle" />
        <div>
          <h2 className="font-display font-semibold leading-tight">{agent.name}</h2>
          <p className="text-xs" style={{ color: agent.color }}>{role}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {agent.tools.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user' ? 'bg-cactus-green text-white' : 'bg-muted text-foreground'
              }`}
            >
              {m.content}
              {m.docName && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-black/10 px-1.5 py-0.5 text-[10px]"><FileText className="h-3 w-3" /> {m.docName}</div>
              )}
              {m.credits != null && <div className="mt-1 text-[10px] opacity-60">{t('console.credits', { n: m.credits })}</div>}
            </div>
          </div>
        ))}
        {messages.length === 1 && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickActions.map((a) => (
              <button key={a} onClick={() => send(a)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-cactus-green hover:text-cactus-green">
                {a}
              </button>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm"><Loader2 className="h-4 w-4 animate-spin" /></div>
          </div>
        )}
        {error && <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        {(attachment || attaching) && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs">
            {attaching ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Leyendo documento…</> : (
              <>
                <FileText className="h-3.5 w-3.5" style={{ color: agent.color }} />
                <span className="max-w-[200px] truncate font-medium">{attachment!.name}</span>
                <span className="text-muted-foreground">· listo</span>
                <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading || attaching}
            title="Adjuntar documento (PDF, imagen, Excel)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf,.xlsx,.xls,.xlsm,.csv,.txt,.ods" hidden onChange={onFile} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={t('console.placeholder', { name: agent.name })}
            className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none"
          />
          <button onClick={() => send()} disabled={loading || (!input.trim() && !attachment)} className="flex h-9 w-9 items-center justify-center rounded-md bg-cactus-green text-white hover:bg-cactus-green/90 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
