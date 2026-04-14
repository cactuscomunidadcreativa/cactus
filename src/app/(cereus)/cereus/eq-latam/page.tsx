import { Suspense } from 'react'
import { EqDashboard } from '@/modules/eq-latam/components/eq-dashboard'

export default function EQLatamRoute() {
  return <Suspense><EqDashboard /></Suspense>
}
