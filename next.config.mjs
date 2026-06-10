import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  async rewrites() {
    return [
      // Tracker público de la segunda vuelta 2026 (HTML estático en /public)
      { source: '/tracker-segunda-vuelta', destination: '/tracker-segunda-vuelta.html' },
    ];
  },
};

export default withNextIntl(nextConfig);
