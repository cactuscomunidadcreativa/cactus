'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, ExternalLink } from 'lucide-react'

interface ImageViewerProps {
  src: string
  alt?: string
  onClose: () => void
}

export function ImageViewer({ src, alt = '', onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.min(Math.max(prev * delta, 0.25), 8))
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return // handled by touch events
    setDragging(true)
    setLastPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    setPan(prev => ({
      x: prev.x + (e.clientX - lastPos.x),
      y: prev.y + (e.clientY - lastPos.y),
    }))
    setLastPos({ x: e.clientX, y: e.clientY })
  }, [dragging, lastPos])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  // Touch: pinch zoom + pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      setLastPinchDist(dist)
    } else if (e.touches.length === 1) {
      setDragging(true)
      setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      const scale = dist / lastPinchDist
      setZoom(prev => Math.min(Math.max(prev * scale, 0.25), 8))
      setLastPinchDist(dist)
    } else if (e.touches.length === 1 && dragging) {
      setPan(prev => ({
        x: prev.x + (e.touches[0].clientX - lastPos.x),
        y: prev.y + (e.touches[0].clientY - lastPos.y),
      }))
      setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }, [dragging, lastPos, lastPinchDist])

  const handleTouchEnd = useCallback(() => {
    setDragging(false)
    setLastPinchDist(null)
  }, [])

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  const zoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8))
  const zoomOut = () => setZoom(prev => Math.max(prev * 0.7, 0.25))

  // Double tap to zoom
  const lastTapRef = useRef(0)
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1.5) {
      reset()
    } else {
      setZoom(3)
    }
  }, [zoom])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === '0') reset()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Zoom out (-)">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-white/60 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Zoom in (+)">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={reset} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Reset (0)">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-white/40 hidden sm:block">{alt || 'Imagen'}</p>

        <div className="flex items-center gap-1">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Abrir original"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <a
            href={src}
            download
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Descargar"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>
          <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="Cerrar (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={{ touchAction: 'none' }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            draggable={false}
          />
        </div>
      </div>

      {/* Hint */}
      <div className="text-center py-2 text-xs text-white/30">
        Scroll o pinch para zoom &middot; Arrastra para mover &middot; Doble click para zoom 3x &middot; Esc para cerrar
      </div>
    </div>
  )
}
