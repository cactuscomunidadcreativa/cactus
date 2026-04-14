import { Suspense } from 'react'
import { DesignerPage } from '@/modules/cereus/components/designer-page'

export default function CereusDesignerRoute() {
  return (
    <Suspense>
      <DesignerPage />
    </Suspense>
  )
}
