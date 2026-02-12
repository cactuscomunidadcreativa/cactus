import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, type Locale, locales } from './config';

export default getRequestConfig(async () => {
  // Read locale from NEXT_LOCALE cookie (set by LanguageSelector)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  const locale: Locale = cookieLocale && locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`./messages/${locale}/common.json`)).default,
      ...(await import(`./messages/${locale}/auth.json`)).default,
      ...(await import(`./messages/${locale}/platform.json`)).default,
      ...(await import(`./messages/${locale}/marketplace.json`)).default,
      ...(await import(`./messages/${locale}/weekflow.json`)).default,
      ...(await import(`./messages/${locale}/ramona.json`)).default,
      ...(await import(`./messages/${locale}/admin.json`)).default,
      ...(await import(`./messages/${locale}/whatsapp.json`)).default,
      ...(await import(`./messages/${locale}/home.json`)).default,
      ...(await import(`./messages/${locale}/landing.json`)).default,
    },
  };
});
