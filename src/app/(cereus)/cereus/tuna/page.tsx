import { Suspense } from 'react'
import { TunaDashboard } from '@/modules/tuna/components/tuna-dashboard'

export default function TunaRoute() {
  return <Suspense><TunaDashboard /></Suspense>
}
