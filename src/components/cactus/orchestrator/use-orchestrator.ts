'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrchestratorState } from '@/lib/cactus/orchestrator';

const EMPTY: OrchestratorState = {
  project: null, tasks: [], messages: [], deliverables: [],
  stats: { projects: 0, tasks: 0, agents: 0 },
};

export interface BlockedInfo { reply: string; href: string }

const MAX_STEPS = 12; // tope de seguridad del bucle de ejecución

export function useOrchestrator() {
  const [state, setState] = useState<OrchestratorState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedInfo | null>(null);
  const [needsApproval, setNeedsApproval] = useState<string | null>(null);
  // Modo profundo (Fase C/D): el equipo ejecuta con sub-agentes acotados. Opt-in.
  const [deep, setDeep] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const deepRef = useRef(deep);
  deepRef.current = deep;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cactus/orchestrator/state');
      const data = await res.json();
      if (data?.state) setState(data.state);
    } catch {
      /* deja estado vacío */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Un paso de ejecución. Devuelve si hay que parar el bucle.
  const step = useCallback(async (projectId: string, taskId?: string): Promise<{ stop: boolean }> => {
    const res = await fetch('/api/cactus/orchestrator/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, taskId, deep: deepRef.current }),
    });
    const data = await res.json();
    if (data?.blocked) { setBlocked({ reply: data.reply, href: data.upgradeHref || '/packs' }); return { stop: true }; }
    if (!res.ok) { setError(data?.error || 'Error ejecutando'); return { stop: true }; }
    if (data?.state) setState(data.state);
    if (data?.needsApproval) { setNeedsApproval(data.needsApproval.taskId); return { stop: true }; }
    return { stop: !data?.hasMore };
  }, []);

  const runLoop = useCallback(async (projectId: string) => {
    setExecuting(true);
    setNeedsApproval(null);
    setError(null);
    try {
      for (let i = 0; i < MAX_STEPS; i++) {
        const { stop } = await step(projectId);
        if (stop) break;
      }
    } finally {
      setExecuting(false);
    }
  }, [step]);

  const send = useCallback(async (message: string) => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    setBlocked(null);
    try {
      const res = await fetch('/api/cactus/orchestrator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, projectId: stateRef.current.project?.id ?? null }),
      });
      const data = await res.json();
      if (data?.blocked) { setBlocked({ reply: data.reply, href: data.upgradeHref || '/packs' }); return; }
      if (!res.ok) throw new Error(data?.error || 'No se pudo coordinar.');
      if (data?.state) {
        setState(data.state);
        const projectId = data.state.project?.id;
        const hasPending = data.state.tasks?.some((t: { status: string }) => t.status === 'pending');
        if (projectId && hasPending) {
          setSending(false);
          await runLoop(projectId);
          return;
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setSending(false);
    }
  }, [runLoop]);

  const approve = useCallback(async (taskId: string) => {
    const projectId = stateRef.current.project?.id;
    if (!projectId) return;
    setNeedsApproval(null);
    await step(projectId, taskId);
    await runLoop(projectId);
  }, [step, runLoop]);

  return { state, loading, sending, executing, error, blocked, needsApproval, deep, setDeep, send, approve, refresh };
}
