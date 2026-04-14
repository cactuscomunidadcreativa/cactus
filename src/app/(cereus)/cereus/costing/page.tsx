import { Suspense } from 'react'
import { CereusCostingPage } from '@/modules/cereus/components/costing-page'

export default function CereusCostingRoute() {
  return <Suspense><CereusCostingPage /></Suspense>
}
