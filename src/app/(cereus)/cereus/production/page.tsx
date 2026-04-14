import { Suspense } from 'react'
import { CereusProductionPage } from '@/modules/cereus/components/production-page'

export default function CereusProductionRoute() {
  return <Suspense><CereusProductionPage /></Suspense>
}
