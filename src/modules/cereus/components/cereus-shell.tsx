'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CereusDataProvider } from '../context/cereus-data-provider'
import {
  Layers, Users, DollarSign, Factory, Ruler, Shirt, Brain, Eye,
  BarChart3, Sparkles, PanelLeftClose, PanelLeftOpen, LogOut,
  Home, MessageSquare, Calendar, Presentation,
  ShoppingCart, FileSpreadsheet, ChevronDown, ChevronUp,
} from 'lucide-react'

const CEREUS_NAV = [
  { icon: Home, label: 'Dashboard', href: '/cereus' },
  { icon: Layers, label: 'Designer', href: '/cereus/designer' },
  { icon: Users, label: 'Clientes', href: '/cereus/clients' },
  { icon: DollarSign, label: 'Costeo', href: '/cereus/costing' },
  { icon: Factory, label: 'Produccion', href: '/cereus/production' },
  { icon: Ruler, label: 'Moldes', href: '/cereus/patterns' },
  { icon: Shirt, label: 'Closet', href: '/cereus/closet' },
  { icon: Brain, label: 'Advisor', href: '/cereus/advisor' },
  { icon: Eye, label: 'Catalogo', href: '/cereus/catalog' },
  { icon: BarChart3, label: 'Analytics', href: '/cereus/analytics' },
]

const OTHER_APPS = [
  { icon: MessageSquare, label: 'Ramona', description: 'Social Media AI', href: '/cereus/ramona', color: 'text-pink-400' },
  { icon: Presentation, label: 'PITA', description: 'Presentaciones', href: '/cereus/pita', color: 'text-violet-400' },
  { icon: Calendar, label: 'WeekFlow', description: 'Planificacion', href: '/cereus/weekflow', color: 'text-blue-400' },
  { icon: ShoppingCart, label: 'Agave', description: 'Pricing', href: '/cereus/agave', color: 'text-green-400' },
  { icon: FileSpreadsheet, label: 'Tuna', description: 'Campanas', href: '/cereus/tuna', color: 'text-cyan-400' },
]

export function CereusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(true)

  const renderNavItem = (item: typeof CEREUS_NAV[0], extraClass?: string) => {
    const isActive = pathname === item.href || (item.href !== '/cereus' && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all
          ${isActive
            ? 'bg-[#C9A84C]/20 text-[#C9A84C] font-medium'
            : 'text-white/60 hover:text-white hover:bg-white/5'
          }
          ${collapsed ? 'justify-center px-2' : ''}
          ${extraClass || ''}
        `}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#C9A84C]' : ''}`} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:relative z-50 h-full bg-[#0A0A0A] text-white flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-56'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 p-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <Sparkles className="w-6 h-6 text-[#C9A84C] flex-shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-display font-bold tracking-wider text-[#C9A84C]">CACTUS</h1>
              <p className="text-[9px] text-white/40 tracking-widest uppercase">Plataforma Creativa</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {/* Cereus section */}
          {!collapsed && (
            <p className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]/60">
              Cereus Atelier
            </p>
          )}
          {CEREUS_NAV.map(item => renderNavItem(item))}

          {/* Divider */}
          <div className="mx-4 my-3 border-t border-white/10" />

          {/* Other Apps */}
          {!collapsed ? (
            <>
              <button
                onClick={() => setAppsOpen(!appsOpen)}
                className="flex items-center justify-between w-full px-4 py-1 text-[10px] font-semibold tracking-widest uppercase text-white/40 hover:text-white/60 transition-colors"
              >
                <span>Otras Apps</span>
                {appsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {appsOpen && OTHER_APPS.map(app => {
                const isActive = pathname.startsWith(app.href)
                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all
                      ${isActive ? 'bg-white/10 font-medium text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <app.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? app.color : ''}`} />
                    <div className="min-w-0">
                      <span className="block text-sm leading-tight">{app.label}</span>
                      <span className="block text-[10px] text-white/30 leading-tight">{app.description}</span>
                    </div>
                  </Link>
                )
              })}
            </>
          ) : (
            OTHER_APPS.map(app => {
              const isActive = pathname.startsWith(app.href)
              return (
                <Link
                  key={app.href}
                  href={app.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center justify-center py-2 mx-2 rounded-lg transition-all
                    ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
                  `}
                  title={app.label}
                >
                  <app.icon className={`w-4 h-4 ${isActive ? app.color : 'text-white/40'}`} />
                </Link>
              )
            })
          )}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 w-full transition-all"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!collapsed && <span>Colapsar</span>}
          </button>
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
            title="Volver a Cactus"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Volver a Cactus</span>}
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-sm font-display font-bold text-[#C9A84C] tracking-wider">CACTUS</span>
          </div>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <CereusDataProvider>
            {children}
          </CereusDataProvider>
        </div>
      </main>
    </div>
  )
}
