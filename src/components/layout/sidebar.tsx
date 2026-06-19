'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, Settings, Shield,
  Layers, DollarSign, Brain, Palette, Sparkles, Bot, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgent, type CactusAgent } from '@/lib/cactus/agents-catalog';
import { AgentBrowser } from '@/components/cactus/app-shell/agent-browser';

// Tarjeta del agente activo: avatar animado + nombre + rol + estado en línea
export function ActiveAgentBadge({ agent }: { agent: CactusAgent }) {
  return (
    <Link
      href={`/agent/${agent.slug}`}
      className="group flex items-center gap-3 rounded-xl border p-3 transition-shadow hover:shadow-md"
      style={{
        borderColor: agent.color + '33',
        background: `linear-gradient(135deg, ${agent.color}1f, ${agent.color}08)`,
        ['--tw-shadow-color' as string]: agent.color + '40',
      }}
    >
      <span className="relative shrink-0">
        <Image
          src={agent.image}
          alt={agent.name}
          width={46}
          height={46}
          className="rounded-full ring-2 motion-safe:animate-cactus-float motion-safe:group-hover:animate-cactus-wiggle"
          style={{ ['--tw-ring-color' as string]: agent.color }}
        />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-500" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold leading-tight text-foreground">
          {agent.name}
        </span>
        <span className="block truncate text-xs font-medium" style={{ color: agent.color }}>
          {agent.role}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En línea
        </span>
      </span>
    </Link>
  );
}

interface AppSubscription {
  app_id: string;
  app_name: string;
  app_icon: string;
  app_color: string;
  status: string;
}

interface SidebarProps {
  subscriptions: AppSubscription[];
  isAdmin?: boolean;
}

interface NavItem { href: string; label: string; icon: typeof Layers }

export function Sidebar({ isAdmin }: SidebarProps) {
  const t = useTranslations('platform.sidebar');
  const pathname = usePathname();

  // Agente activo: cuando estás dentro de /agent/[slug] lo destacamos arriba
  const agentSlug = pathname.match(/^\/agent\/([^/]+)/)?.[1];
  const activeAgent = agentSlug ? getAgent(agentSlug) : undefined;

  const plataforma: NavItem[] = [
    { href: '/ecosystem', label: 'Ecosistema', icon: Layers },
    { href: '/orchestrator', label: 'Ramona', icon: Bot },
    { href: '/brain', label: 'Cerebro', icon: Brain },
    { href: '/empresa', label: 'Empresa', icon: Building2 },
  ];
  const crear: NavItem[] = [
    { href: '/campaign', label: 'Campañas', icon: Sparkles },
    { href: '/studio', label: 'Diseño', icon: Palette },
  ];
  const cuenta: NavItem[] = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/marketplace', label: t('marketplace'), icon: Store },
    { href: '/packs', label: 'Packs', icon: DollarSign },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  const SectionLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={cn('px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1', className)}>
      {children}
    </p>
  );

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/ecosystem" className="flex items-center gap-2.5">
          <Image src="/cactus-ia-logo.png" alt="Cactus IA" width={34} height={34} className="rounded-full" />
          <div className="leading-tight">
            <div className="font-display font-bold text-base text-cactus-green">Cactus</div>
            <div className="text-[10px] text-muted-foreground">Comunidad Creativa</div>
          </div>
        </Link>
      </div>

      {/* Agente activo destacado */}
      {activeAgent && (
        <div className="px-3 pt-3">
          <ActiveAgentBadge agent={activeAgent} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <SectionLabel>Plataforma</SectionLabel>
        {plataforma.map(renderLink)}

        <SectionLabel className="mt-4">Crear</SectionLabel>
        {crear.map(renderLink)}

        {/* Agentes — explorador unificado (categorías + buscador + Ramona) */}
        <SectionLabel className="mt-4">Agentes</SectionLabel>
        <div className="h-[56vh] min-h-[320px] px-1">
          <AgentBrowser activeSlug={agentSlug} />
        </div>

        {/* Cuenta */}
        <SectionLabel className="mt-4">Cuenta</SectionLabel>
        {cuenta.map(renderLink)}
        {isAdmin && renderLink({ href: '/admin', label: t('admin'), icon: Shield })}
      </nav>
    </aside>
  );
}
