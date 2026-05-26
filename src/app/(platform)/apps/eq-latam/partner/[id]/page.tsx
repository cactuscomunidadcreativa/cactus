import { notFound } from 'next/navigation';
import { PartnerPortal } from '@/modules/eq-latam/components/partner-portal';
import { getPartnerById } from '@/modules/eq-latam';

interface PageProps {
  params: { id: string };
}

export default function PartnerPortalPage({ params }: PageProps) {
  const partner = getPartnerById(params.id);
  if (!partner) notFound();
  return <PartnerPortal partner={partner} />;
}
