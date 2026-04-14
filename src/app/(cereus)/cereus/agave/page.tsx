import { Suspense } from 'react'
import { AgaveChat } from '@/modules/agave/components/agave-chat'

export default function AgaveRoute() {
  return <Suspense><AgaveChat /></Suspense>
}
