import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { logEnvStatus } from '@/lib/env';
import { ToastProvider } from '@/components/shared/toast';
import './globals.css';

logEnvStatus();

export const metadata: Metadata = {
  title: {
    default: 'Cactus - Comunidad Creativa',
    template: '%s | Cactus',
  },
  description: 'Inteligencia que echa raices. Tu plataforma de herramientas inteligentes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Cactus - Comunidad Creativa',
    description: 'Inteligencia que echa raices. Tu plataforma de herramientas inteligentes.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
