import { Suspense } from 'react'
import { WeekFlowApp } from '@/modules/weekflow/components/weekflow-app'

export default function WeekFlowRoute() {
  return <Suspense><WeekFlowApp /></Suspense>
}
