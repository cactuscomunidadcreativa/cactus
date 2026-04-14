'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface Collection {
  id: string
  name: string
  code: string | null
  season: string
  year: number
  status: string
  description: string | null
  cover_image_url: string | null
  mood_board_urls: string[] | null
  inspiration_notes: string | null
  target_pieces: number | null
  lookbook_code: string | null
}

interface Garment {
  id: string
  name: string
  code: string | null
  category: string
  description: string | null
  collection_id: string | null
  images: { url: string; type: string }[] | null
  base_price: number | null
  status: string
  tags: string[] | null
}

interface CereusClient {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  vip_tier: string
  role: string
}

interface Material {
  id: string
  name: string
  type: string
  color: string | null
  supplier: string | null
  cost_per_unit: number | null
}

interface Maison {
  id: string
  nombre: string
  config: Record<string, any>
}

interface CereusDataContextType {
  maison: Maison | null
  maisonId: string
  collections: Collection[]
  garments: Garment[]
  clients: CereusClient[]
  materials: Material[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  // Helpers for other apps
  getCollection: (id: string) => Collection | undefined
  getGarmentsByCollection: (collectionId: string) => Garment[]
  getActiveCollections: () => Collection[]
  getSummary: () => {
    maisonName: string
    totalCollections: number
    totalGarments: number
    totalClients: number
    activeCollections: string[]
    recentGarments: string[]
  }
}

const CereusDataContext = createContext<CereusDataContextType | null>(null)

export function useCereusData() {
  const ctx = useContext(CereusDataContext)
  if (!ctx) {
    // Return a safe fallback instead of throwing - allows use outside provider
    return {
      maison: null,
      maisonId: '',
      collections: [],
      garments: [],
      clients: [],
      materials: [],
      loading: true,
      error: null,
      refresh: async () => {},
      getCollection: () => undefined,
      getGarmentsByCollection: () => [],
      getActiveCollections: () => [],
      getSummary: () => ({
        maisonName: '', totalCollections: 0, totalGarments: 0,
        totalClients: 0, activeCollections: [], recentGarments: [],
      }),
    } as CereusDataContextType
  }
  return ctx
}

export function CereusDataProvider({ children }: { children: ReactNode }) {
  const [maison, setMaison] = useState<Maison | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [garments, setGarments] = useState<Garment[]>([])
  const [clients, setClients] = useState<CereusClient[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const maisonId = maison?.id || ''

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Get maison
      const maisonRes = await fetch('/api/cereus/maison')
      const maisonData = await maisonRes.json()
      if (!maisonData.maison) {
        setError('No maison access')
        setLoading(false)
        return
      }
      setMaison(maisonData.maison)
      const mId = maisonData.maison.id

      // 2. Fetch all data in parallel
      const [collRes, garmRes, clientRes, matRes] = await Promise.all([
        fetch(`/api/cereus/collections?maisonId=${mId}`),
        fetch(`/api/cereus/garments?maisonId=${mId}`),
        fetch(`/api/cereus/clients?maisonId=${mId}&limit=200`),
        fetch(`/api/cereus/materials?maisonId=${mId}`),
      ])

      const [collData, garmData, clientData, matData] = await Promise.all([
        collRes.json(), garmRes.json(), clientRes.json(), matRes.json(),
      ])

      setCollections(collData.collections || [])
      setGarments(garmData.garments || [])
      setClients(clientData.clients || [])
      setMaterials(matData.materials || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const getCollection = useCallback(
    (id: string) => collections.find(c => c.id === id),
    [collections]
  )

  const getGarmentsByCollection = useCallback(
    (collectionId: string) => garments.filter(g => g.collection_id === collectionId),
    [garments]
  )

  const getActiveCollections = useCallback(
    () => collections.filter(c => c.status !== 'archived'),
    [collections]
  )

  const getSummary = useCallback(() => ({
    maisonName: maison?.nombre || '',
    totalCollections: collections.length,
    totalGarments: garments.length,
    totalClients: clients.length,
    activeCollections: collections.filter(c => c.status !== 'archived').map(c => c.name),
    recentGarments: garments.slice(0, 10).map(g => `${g.name} (${g.category})`),
  }), [maison, collections, garments, clients])

  return (
    <CereusDataContext.Provider value={{
      maison, maisonId, collections, garments, clients, materials,
      loading, error, refresh: fetchAll,
      getCollection, getGarmentsByCollection, getActiveCollections, getSummary,
    }}>
      {children}
    </CereusDataContext.Provider>
  )
}
