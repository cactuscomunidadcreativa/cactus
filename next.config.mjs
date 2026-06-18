import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  images: {
    // Fotos de agentes subidas a Supabase Storage (host <ref>.supabase.co)
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  async rewrites() {
    return [
      // Tracker público de la segunda vuelta 2026 (HTML estático en /public)
      { source: '/tracker-segunda-vuelta', destination: '/tracker-segunda-vuelta.html' },
    ];
  },
};

export default withNextIntl(nextConfig);
