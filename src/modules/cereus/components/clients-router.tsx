'use client';

import { useSearchParams } from 'next/navigation';
import { CereusClientsPage } from './clients-page';
import { ClientDetail } from './client-detail';

export function CereusClientsRouter() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('id');

  if (clientId) {
    return <ClientDetail clientId={clientId} />;
  }

  return <CereusClientsPage />;
}
