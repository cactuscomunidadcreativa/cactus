import { useTranslations } from 'next-intl';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl">🌵</span>
            <h1 className="text-2xl font-display font-bold text-cactus-green">
              Cactus
            </h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
