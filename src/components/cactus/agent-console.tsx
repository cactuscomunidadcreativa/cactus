'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Send, Loader2 } from 'lucide-react';
import { agentQuickActions } from '@/lib/cactus/agent-prompts';

interface AgentMeta {
  slug: string; name: string; role: string; emoji: string; color: string; image: string;
  tools: string[]; description: string;
}
interface Msg { role: 'user' | 'assistant'; content: string; credits?: number }

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const quickActions = agentQuickActions(agent.slug);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, messages: next.map(({ role, content }) => ({ role, content })) }),
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
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={t('console.placeholder', { name: agent.name })}
            className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-cactus-green focus:outline-none"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-md bg-cactus-green text-white hover:bg-cactus-green/90 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
