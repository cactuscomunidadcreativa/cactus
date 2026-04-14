'use client'

import { useState } from 'react'
import { useCereusData } from '../context/cereus-data-provider'
import { Sparkles, ChevronDown, Layers, Shirt, Users, Loader2 } from 'lucide-react'

interface CereusContextBarProps {
  appName: string
  appDescription: string
  onCollectionSelect?: (collectionId: string | null) => void
  selectedCollectionId?: string | null
}

export function CereusContextBar({ appName, appDescription, onCollectionSelect, selectedCollectionId }: CereusContextBarProps) {
  const { collections, garments, clients, loading, maisonId, maison } = useCereusData()
  const [showPicker, setShowPicker] = useState(false)

  const activeCollections = collections.filter(c => c.status !== 'archived')
  const selectedCollection = selectedCollectionId ? collections.find(c => c.id === selectedCollectionId) : null
  const collectionGarments = selectedCollectionId ? garments.filter(g => g.collection_id === selectedCollectionId) : garments

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A]/5 rounded-lg mb-4">
        <Loader2 className="w-4 h-4 animate-spin text-[#C9A84C]" />
        <span className="text-sm text-muted-foreground">Cargando contexto Cereus...</span>
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Context info bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0A0A0A] to-[#1a1a1a] rounded-xl px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          <div>
            <p className="text-sm font-medium">
              {appName} <span className="text-white/40">con contexto de</span>{' '}
              <span className="text-[#C9A84C]">{maison?.nombre || 'Cereus'}</span>
            </p>
            <p className="text-[10px] text-white/40">{appDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {activeCollections.length} colecciones</span>
          <span className="flex items-center gap-1"><Shirt className="w-3 h-3" /> {garments.length} prendas</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {clients.length} clientes</span>
        </div>
      </div>

      {/* Collection picker */}
      {onCollectionSelect && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors w-full"
          >
            <Layers className="w-4 h-4 text-[#C9A84C]" />
            <span className="flex-1 text-left">
              {selectedCollection ? (
                <span>{selectedCollection.name} <span className="text-muted-foreground">({selectedCollection.season} {selectedCollection.year})</span></span>
              ) : (
                <span className="text-muted-foreground">Todas las colecciones</span>
              )}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showPicker && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <button
                onClick={() => { onCollectionSelect(null); setShowPicker(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${!selectedCollectionId ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : ''}`}
              >
                Todas las colecciones
              </button>
              {activeCollections.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onCollectionSelect(c.id); setShowPicker(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${selectedCollectionId === c.id ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : ''}`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.season} {c.year}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
