import { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { LookbookClient } from './client';

async function loadCollection(code: string) {
  const db = createServiceClient();
  if (!db) return null;

  const { data: collection } = await db
    .from('cereus_collections')
    .select('*, maison:app_clients(nombre)')
    .eq('lookbook_code', code)
    .eq('status', 'launched')
    .single();

  if (!collection) return null;

  // Fetch garments with preset variants
  const { data: garments } = await db
    .from('cereus_garments')
    .select('id, name, code, description, category, images, base_price, status')
    .eq('collection_id', collection.id)
    .in('status', ['approved', 'design', 'draft'])
    .order('created_at', { ascending: true });

  // Fetch preset variants (no client_id)
  const garmentIds = (garments || []).map(g => g.id);
  let variants: any[] = [];
  if (garmentIds.length > 0) {
    const { data: variantData } = await db
      .from('cereus_variants')
      .select('id, garment_id, variant_name, color, color_hex, preview_image_url, final_price, status')
      .in('garment_id', garmentIds)
      .is('client_id', null)
      .in('status', ['approved', 'proposed'])
      .order('created_at', { ascending: true });
    variants = variantData || [];
  }

  return {
    collection,
    garments: garments || [],
    variants,
    maisonName: (collection.maison as any)?.nombre || 'Maison',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const data = await loadCollection(code);

  if (!data) {
    return { title: 'Collection Not Found | CEREUS' };
  }

  return {
    title: `${data.collection.name} | ${data.maisonName} — CEREUS Lookbook`,
    description: data.collection.description || `${data.collection.name} — ${data.maisonName}`,
    openGraph: {
      title: `${data.collection.name} | ${data.maisonName}`,
      description: data.collection.description || undefined,
      images: data.collection.cover_image_url ? [data.collection.cover_image_url] : undefined,
    },
  };
}

export default async function LookbookPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await loadCollection(code);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Collection Not Found
          </h1>
          <p className="text-white/50">This lookbook may not be published yet or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  return (
    <LookbookClient
      collection={data.collection}
      garments={data.garments}
      variants={data.variants}
      maisonName={data.maisonName}
    />
  );
}
