'use client'

import { Suspense } from 'react'
import { TunaDashboard } from '@/modules/tuna/components/tuna-dashboard'
import { CereusContextBar } from '@/modules/cereus/components/cereus-context-bar'

function TunaWithContext() {
  return (
    <>
      <CereusContextBar
        appName="Tuna"
        appDescription="Mide y consolida campanas de marketing de tus colecciones"
      />
      <TunaDashboard />
    </>
  )
}

export default function TunaRoute() {
  return <Suspense><TunaWithContext /></Suspense>
}
