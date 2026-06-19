'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { TunaDashboard } from '@/modules/tuna/components/tuna-dashboard';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

interface TunaAgent { slug: string; name: string; role: string; color: string; image: string }

export function TunaApp({ agent, user, credits }: { agent: TunaAgent; user?: ShellUser; credits?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/apps/clients?appId=tuna');
        const data = await res.json();
        if (res.status === 401 || data.error === 'Unauthorized') { router.push('/login?redirect=/apps/tuna'); return; }
        if (data.error) { setError(data.error); return; }
        if (!data.hasAccess || !data.client) { setError('No se pudo aprovisionar tu cuenta de Tuna.'); return; }
        setClientName(data.client.nombre || null);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    })();
  }, [router]);

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [{ key: 'dashboard', label: 'CRM & Revenue', icon: LayoutDashboard }];

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav="dashboard"
      user={user} credits={credits}
      greeting={`¡Hola${firstName ? `, ${firstName}` : ''}! 🌵`}
      subtitle={clientName ? `CRM & Revenue · ${clientName}` : 'CRM & Revenue con Tuna'}
    >
      {loading ? (
        <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: agent.color }} /></div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="mb-3 text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>Reintentar</button>
        </div>
      ) : (
        <TunaDashboard />
      )}
    </AgentAppShell>
  );
}
