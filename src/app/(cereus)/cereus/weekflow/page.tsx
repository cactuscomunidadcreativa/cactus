'use client'

import { Suspense } from 'react'
import { WeekFlowApp } from '@/modules/weekflow/components/weekflow-app'
import { CereusContextBar } from '@/modules/cereus/components/cereus-context-bar'

function WeekFlowWithContext() {
  return (
    <>
      <CereusContextBar
        appName="WeekFlow"
        appDescription="Planifica y organiza las tareas de produccion de tus colecciones"
      />
      <WeekFlowApp initialTeamId="" />
    </>
  )
}

export default function WeekFlowRoute() {
  return <Suspense><WeekFlowWithContext /></Suspense>
}
