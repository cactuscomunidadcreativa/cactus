import { notFound } from 'next/navigation';
import { PartnerPortal } from '@/modules/eq-latam/components/partner-portal';
import { getPartnerById } from '@/modules/eq-latam';

interface PageProps {
  params: { id: string };
}

export default function PartnerPortalPreviewPage({ params }: PageProps) {
  const partner = getPartnerById(params.id);
  if (!partner) notFound();
  return (
    <div>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center">
        🔍 PREVIEW del portal partner. La versión con auth real vive en{' '}
        <code className="font-mono">/apps/eq-latam/partner/{params.id}</code>
      </div>
      <PartnerPortal partner={partner} />
    </div>
  );
}
