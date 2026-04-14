'use client'

import { Suspense, useState } from 'react'
import { RamonaApp } from '@/modules/ramona/components/ramona-app'
import { CereusContextBar } from '@/modules/cereus/components/cereus-context-bar'
import { useCereusData } from '@/modules/cereus/context/cereus-data-provider'

function RamonaWithContext() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const { garments, collections, getGarmentsByCollection } = useCereusData()

  const collectionGarments = selectedCollection
    ? getGarmentsByCollection(selectedCollection)
    : garments

  // Build brand context from Cereus data for Ramona's AI
  const collection = selectedCollection ? collections.find(c => c.id === selectedCollection) : null
  const brandContext = collection
    ? `Coleccion activa: "${collection.name}" (${collection.season} ${collection.year}). ${collection.description || ''}. Prendas: ${collectionGarments.map(g => g.name).join(', ')}. Inspiracion: ${collection.inspiration_notes || 'N/A'}.`
    : `Maison con ${collections.length} colecciones y ${garments.length} prendas.`

  return (
    <>
      <CereusContextBar
        appName="Ramona"
        appDescription="Genera contenido social media basado en tus colecciones y prendas"
        onCollectionSelect={setSelectedCollection}
        selectedCollectionId={selectedCollection}
      />
      <RamonaApp userId="" contentLimit={999} />
    </>
  )
}

export default function RamonaRoute() {
  return <Suspense><RamonaWithContext /></Suspense>
}
