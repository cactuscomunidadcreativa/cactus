import { Suspense } from 'react'
import { CereusDashboard } from '@/modules/cereus/components/cereus-dashboard'

export default function CereusHomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Suspense>
        <CereusDashboard />
      </Suspense>
    </div>
  )
}
