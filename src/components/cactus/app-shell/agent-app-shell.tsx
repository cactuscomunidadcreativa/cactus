'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell, Search, HelpCircle, Coins, Menu, X, ChevronRight, type LucideIcon,
} from 'lucide-react';
import type { CactusAgent } from '@/lib/cactus/agents-catalog';

export interface AppNavItem { key: string; label: string; icon: LucideIcon; href?: string; section?: string }
export interface ShellUser { name: string; email?: string; avatar?: string }
export interface HeaderCta { label: string; icon?: LucideIcon; href?: string; onClick?: () => void }

type ShellAgent = Pick<CactusAgent, 'slug' | 'name' | 'role' | 'color' | 'image'>;

interface Props {
  agent: ShellAgent;
  nav: AppNavItem[];
  activeNav?: string;
  onNav?: (key: string) => void;
  user?: ShellUser;
  credits?: number;          // -1 = ilimitado
  greeting?: string;         // ej. "¡Hola, Eduardo!"
  subtitle?: string;
  cta?: HeaderCta;
  children: React.ReactNode;
}

export function AgentAppShell({
  agent, nav, activeNav, onNav, user, credits, greeting, subtitle, cta, children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <div className="hidden lg:block">
        <AgentSidebar agent={agent} nav={nav} activeNav={activeNav} onNav={onNav} user={user} credits={credits} />
      </div>

      {/* Sidebar (mobile overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AgentSidebar agent={agent} nav={nav} activeNav={activeNav} onNav={(k) => { onNav?.(k); setMobileOpen(false); }} user={user} credits={credits} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader agent={agent} greeting={greeting} subtitle={subtitle} cta={cta} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 space-y-5 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

// ── Sidebar por agente ──────────────────────────────────────────────────────
function AgentSidebar({
  agent, nav, activeNav, onNav, user, credits, onClose,
}: {
  agent: ShellAgent; nav: AppNavItem[]; activeNav?: string; onNav?: (key: string) => void;
  user?: ShellUser; credits?: number; onClose?: () => void;
}) {
  // Agrupa por sección preservando el orden
  const sections: { name?: string; items: AppNavItem[] }[] = [];
  for (const item of nav) {
    const last = sections[sections.length - 1];
    if (!last || last.name !== item.section) sections.push({ name: item.section, items: [item] });
    else last.items.push(item);
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Identidad del agente */}
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <Image src={agent.image} alt={agent.name} width={38} height={38} className="rounded-xl" />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-sm font-bold">{agent.name}</div>
          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
          </div>
        </div>
        {onClose && <button onClick={onClose} className="ml-auto text-muted-foreground"><X className="h-4 w-4" /></button>}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-3 overflow-y-auto p-3">
        {sections.map((sec, i) => (
          <div key={i}>
            {sec.name && <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{sec.name}</p>}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const active = item.key === activeNav;
                const inner = (
                  <>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                );
                const cls = `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  active ? 'font-medium' : 'text-muted-foreground hover:bg-muted'
                }`;
                const style = active ? { backgroundColor: agent.color + '14', color: agent.color } : undefined;
                return item.href ? (
                  <Link key={item.key} href={item.href} className={cls} style={style}>{inner}</Link>
                ) : (
                  <button key={item.key} onClick={() => onNav?.(item.key)} className={`${cls} w-full text-left`} style={style}>{inner}</button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: créditos + usuario + ayuda */}
      <div className="space-y-2 border-t border-border p-3">
        {credits !== undefined && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs">
            <Coins className="h-4 w-4" style={{ color: agent.color }} />
            <span className="font-medium">{credits < 0 ? 'Ilimitado' : `${credits.toLocaleString('es')} créditos`}</span>
          </div>
        )}
        {user && (
          <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted">
            {user.avatar
              ? <Image src={user.avatar} alt={user.name} width={30} height={30} className="rounded-full" />
              : <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-muted text-xs font-semibold">{user.name.slice(0, 1)}</span>}
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="text-[10px] text-muted-foreground">Ver perfil</div>
            </div>
          </Link>
        )}
        <Link href="/orchestrator" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
          <HelpCircle className="h-3.5 w-3.5" /> ¿Necesitas ayuda? Pregúntale a Ramona <ChevronRight className="ml-auto h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
function AppHeader({
  agent, greeting, subtitle, cta, onMenu,
}: {
  agent: ShellAgent; greeting?: string; subtitle?: string; cta?: HeaderCta; onMenu?: () => void;
}) {
  const CtaIcon = cta?.icon;
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-6">
      <button onClick={onMenu} className="lg:hidden"><Menu className="h-5 w-5" /></button>

      <div className="min-w-0 flex-1">
        {greeting && <h1 className="truncate font-display text-lg font-bold leading-tight">{greeting}</h1>}
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Buscador (desktop) */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar…"
          className="w-44 rounded-lg border border-border bg-card py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-1"
          style={{ ['--tw-ring-color' as string]: agent.color }}
        />
      </div>

      <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Notificaciones">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>

      {/* Atajo a Ramona */}
      <Link href="/orchestrator" className="hidden rounded-full ring-2 ring-transparent transition hover:ring-emerald-300 sm:block" title="Pídele a Ramona">
        <Image src="/agents/ramona.png" alt="Ramona" width={32} height={32} className="rounded-full" />
      </Link>

      {cta && (
        cta.href ? (
          <Link href={cta.href} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>
            {CtaIcon && <CtaIcon className="h-4 w-4" />} {cta.label}
          </Link>
        ) : (
          <button onClick={cta.onClick} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>
            {CtaIcon && <CtaIcon className="h-4 w-4" />} {cta.label}
          </button>
        )
      )}
    </header>
  );
}
