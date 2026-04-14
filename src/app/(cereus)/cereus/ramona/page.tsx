import { Suspense } from 'react'
import { RamonaApp } from '@/modules/ramona/components/ramona-app'

export default function RamonaRoute() {
  return <Suspense><RamonaApp userId="" contentLimit={999} /></Suspense>
}
