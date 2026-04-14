import { Suspense } from 'react'
import { CereusClientsRouter } from '@/modules/cereus/components/clients-router'

export default function CereusClientsRoute() {
  return <Suspense><CereusClientsRouter /></Suspense>
}
