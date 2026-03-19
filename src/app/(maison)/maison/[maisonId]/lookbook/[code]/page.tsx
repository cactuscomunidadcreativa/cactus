import { loadMaisonPublic } from '@/modules/cereus/lib/maison-auth';
import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ maisonId: string; code: string }>;
}): Promise<Metadata> {
  const { maisonId, code } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) return { title: 'Not Found' };

  return {
    title: `Lookbook - ${maison.maisonName}`,
    description: `${maison.maisonName} collection lookbook`,
  };
}

export default async function MaisonLookbookPage({
  params,
}: {
  params: Promise<{ maisonId: string; code: string }>;
}) {
  const { maisonId, code } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) notFound();

  const { maisonName, config } = maison;
  const primaryColor = config.branding?.primary_color || '#0A0A0A';
  const accentColor = config.branding?.accent_color || '#B8943A';

  // Load collection by lookbook code
  const service = createServiceClient();
  const collection = service
    ? (await service
        .from('cereus_collections')
        .select('*')
        .eq('maison_id', maisonId)
        .eq('lookbook_code', code)
        .single()
      ).data
    : null;

  if (!collection) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: config.branding?.background_color || '#FFFFFF' }}>
      <style>{`
        :root {
          --maison-primary: ${primaryColor};
          --maison-accent: ${accentColor};
        }
      `}</style>

      {/* Header */}
      <header className="py-8 text-center border-b border-gray-100">
        {config.branding?.logo_url ? (
          <img src={config.branding.logo_url} alt={maisonName} className="h-8 mx-auto mb-2" />
        ) : (
          <h1 className="text-xl font-display font-bold" style={{ color: primaryColor }}>
            {maisonName}
          </h1>
        )}
        <p className="text-sm text-gray-500 mt-1">Lookbook</p>
      </header>

      {/* Collection */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-display font-bold mb-2" style={{ color: primaryColor }}>
          {(collection as any).name}
        </h2>
        {(collection as any).description && (
          <p className="text-gray-500 mb-8">{(collection as any).description}</p>
        )}
        <p className="text-sm text-gray-400">
          Collection details will be displayed here.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {maisonName}
      </footer>
    </div>
  );
}
