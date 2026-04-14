'use client'

import { useRef, useCallback } from 'react'
import { PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, X } from 'lucide-react'
import { useCollapsibleSidebar } from '../hooks/use-collapsible-sidebar'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  side?: 'left' | 'right'
  width?: string
  title?: string
}

export function CollapsibleSidebar({ children, side = 'left', width = 'w-72', title }: CollapsibleSidebarProps) {
  const { isOpen, toggle, close } = useCollapsibleSidebar()
  const touchStartX = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const threshold = 80
    if (side === 'left' && dx < -threshold) close()
    if (side === 'right' && dx > threshold) close()
  }, [side, close])

  const OpenIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose

  return (
    <>
      {/* Toggle button - visible only on tablet and below */}
      <button
        onClick={toggle}
        className="lg:hidden fixed z-40 flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
        style={{
          [side]: isOpen ? '0.5rem' : '0.5rem',
          top: '5rem',
        }}
        aria-label={isOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        {isOpen ? <CloseIcon className="w-5 h-5 text-gray-600" /> : <OpenIcon className="w-5 h-5 text-gray-600" />}
      </button>

      {/* Backdrop overlay - tablet/mobile only */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          ${width} flex-shrink-0 overflow-y-auto bg-white border-${side === 'left' ? 'r' : 'l'} border-gray-200
          lg:relative lg:translate-x-0 lg:z-auto
          fixed top-0 ${side}-0 h-full z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'}
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile header with close button */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">{title || 'Panel'}</span>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
