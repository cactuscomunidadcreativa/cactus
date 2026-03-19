import { loadMaisonPublic } from '@/modules/cereus/lib/maison-auth';
import { notFound } from 'next/navigation';
import { MaisonLoginForm } from '@/modules/cereus/components/maison-login-form';

export default async function MaisonLoginPage({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const maison = await loadMaisonPublic(maisonId);
  if (!maison) notFound();

  const { maisonName, config } = maison;
  const primaryColor = config.branding?.primary_color || '#0A0A0A';
  const accentColor = config.branding?.accent_color || '#B8943A';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4">
      <style>{`
        :root {
          --maison-primary: ${primaryColor};
          --maison-accent: ${accentColor};
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {config.branding?.logo_url ? (
            <img src={config.branding.logo_url} alt={maisonName} className="h-10 mx-auto mb-2" />
          ) : (
            <h1 className="text-2xl font-display font-bold" style={{ color: primaryColor }}>
              {maisonName}
            </h1>
          )}
        </div>
        <MaisonLoginForm accentColor={accentColor} />
      </div>
    </div>
  );
}
