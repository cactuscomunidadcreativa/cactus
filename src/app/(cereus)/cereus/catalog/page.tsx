import { Suspense } from 'react'
import { CatalogPage } from '@/modules/cereus/components/catalog-page'

export default function CereusCatalogRoute() {
  return <Suspense><CatalogPage /></Suspense>
}
