import { Suspense } from 'react'
import { CereusAnalyticsDashboard } from '@/modules/cereus/components/analytics-dashboard'

export default function CereusAnalyticsRoute() {
  return <Suspense><CereusAnalyticsDashboard /></Suspense>
}
