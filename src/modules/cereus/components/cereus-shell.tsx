'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layers, Users, DollarSign, Factory, Ruler, Shirt, Brain, Eye,
  BarChart3, Sparkles, PanelLeftClose, PanelLeftOpen, LogOut,
  Home, Settings, ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
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

export function CereusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
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
              <h1 className="text-sm font-display font-bold tracking-wider text-[#C9A84C]">CEREUS</h1>
              <p className="text-[9px] text-white/40 tracking-widest uppercase">Atelier</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/cereus' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all
                  ${isActive
                    ? 'bg-[#C9A84C]/20 text-[#C9A84C] font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#C9A84C]' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 px-4 py-2 mx-0 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 w-full transition-all"
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

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-sm font-display font-bold text-[#C9A84C] tracking-wider">CEREUS</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
