import { loadMaisonPublic } from '@/modules/cereus/lib/maison-auth';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MaisonStorefront } from '@/modules/cereus/components/maison-storefront';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}): Promise<Metadata> {
  const { maisonId } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) return { title: 'Not Found' };

  const title = maison.config.branding?.meta_title || maison.maisonName;
  return {
    title,
    description: maison.config.maison_tagline || `${maison.maisonName} - Official Store`,
  };
}

export default async function MaisonLandingPage({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) notFound();

  return <MaisonStorefront maisonId={maisonId} maisonName={maison.maisonName} config={maison.config} />;
}
