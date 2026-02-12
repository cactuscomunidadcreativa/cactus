'use client';

import { PitaViewer } from '@/modules/pita/components/pita-viewer';
import { PresentationSection, BrandConfig } from '@/modules/pita/types';

interface Props {
  presentationId: string;
  slug: string;
  title: string;
  subtitle?: string;
  sections: PresentationSection[];
  brandConfig: BrandConfig;
}

export function PitaViewerClient(props: Props) {
  return <PitaViewer {...props} />;
}
