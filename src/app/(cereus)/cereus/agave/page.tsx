'use client'

import { Suspense } from 'react'
import { AgaveChat } from '@/modules/agave/components/agave-chat'
import { CereusContextBar } from '@/modules/cereus/components/cereus-context-bar'

function AgaveWithContext() {
  return (
    <>
      <CereusContextBar
        appName="Agave"
        appDescription="Analisis de pricing basado en costos y margenes de tus prendas"
      />
      <AgaveChat />
    </>
  )
}

export default function AgaveRoute() {
  return <Suspense><AgaveWithContext /></Suspense>
}
