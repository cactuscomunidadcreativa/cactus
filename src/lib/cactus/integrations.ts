// ═══════════════════════════════════════════════════════════════════════════
// CACTUS — Catálogo de integraciones (Fase F). PURO (sin DB, usable en cliente).
// Define los proveedores externos que conectan los agentes con el mundo real:
// pagos, ads, email/WhatsApp, render de video/audio, 3D, Search Console…
//
// Dos formas de conectar:
//  • api_key  → el usuario pega su llave (se guarda CIFRADA). Funciona ya, sin
//               registrar apps OAuth.
//  • oauth    → requiere que Eduardo registre la app con el proveedor y ponga
//               client_id/secret en variables de entorno. La UI muestra el
//               redirect URI a registrar y queda lista para conectar.
// ═══════════════════════════════════════════════════════════════════════════

export type IntegrationCategory = 'pagos' | 'ads' | 'email' | 'whatsapp' | 'video' | 'audio' | '3d' | 'search';
export type IntegrationAuth = 'api_key' | 'oauth';

export interface IntegrationField {
  key: string;
  label: string;
  type?: 'text' | 'password';
  placeholder?: string;
  optional?: boolean;
}

export interface IntegrationOAuth {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** nombres de las env vars que Eduardo debe poner en Vercel */
  clientIdEnv: string;
  clientSecretEnv: string;
}

export interface IntegrationProvider {
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  auth: IntegrationAuth;
  /** campos para el modo api_key (uno o varios) */
  fields?: IntegrationField[];
  /** config del modo oauth */
  oauth?: IntegrationOAuth;
  /** slugs de agentes que usan esta integración */
  agents: string[];
  emoji: string;
  color: string;
  docsUrl?: string;
}

export const CATEGORY_META: Record<IntegrationCategory, { label: string; emoji: string }> = {
  pagos:    { label: 'Pagos',           emoji: '💳' },
  ads:      { label: 'Publicidad',      emoji: '📣' },
  email:    { label: 'Email',           emoji: '✉️' },
  whatsapp: { label: 'WhatsApp',        emoji: '🟢' },
  video:    { label: 'Render de video', emoji: '🎬' },
  audio:    { label: 'Audio & voz',     emoji: '🎙️' },
  '3d':     { label: '3D imprimible',   emoji: '🧊' },
  search:   { label: 'SEO & Search',    emoji: '📈' },
};

export const CATEGORY_ORDER: IntegrationCategory[] = ['pagos', 'email', 'whatsapp', 'ads', 'search', 'video', 'audio', '3d'];

const key = (label: string, placeholder?: string): IntegrationField => ({ key: 'api_key', label, type: 'password', placeholder });

export const INTEGRATIONS: IntegrationProvider[] = [
  // ─── PAGOS ────────────────────────────────────────────────────────────────
  {
    slug: 'stripe', name: 'Stripe', category: 'pagos', auth: 'api_key',
    description: 'Cobra suscripciones y pagos únicos. Conecta tu tienda Opuntia y los packs.',
    fields: [key('Secret key (sk_live_…)', 'sk_live_…')],
    agents: ['opuntia', 'cereus'], emoji: '💳', color: '#635BFF', docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    slug: 'mercadopago', name: 'Mercado Pago', category: 'pagos', auth: 'api_key',
    description: 'Pasarela de pago para LATAM. Checkout y cobros en tu sitio.',
    fields: [key('Access token', 'APP_USR-…')],
    agents: ['opuntia', 'cereus'], emoji: '🛒', color: '#009EE3', docsUrl: 'https://www.mercadopago.com/developers',
  },

  // ─── EMAIL ──────────────────────────────────────────────────────────────────
  {
    slug: 'resend', name: 'Resend', category: 'email', auth: 'api_key',
    description: 'Envío de emails transaccionales y campañas. Lo usan Aloe y Nopal.',
    fields: [key('API key (re_…)', 're_…')],
    agents: ['aloe', 'nopal'], emoji: '✉️', color: '#0F172A', docsUrl: 'https://resend.com/api-keys',
  },
  {
    slug: 'sendgrid', name: 'SendGrid', category: 'email', auth: 'api_key',
    description: 'Alternativa de envío de email a escala.',
    fields: [key('API key (SG.…)', 'SG.…')],
    agents: ['aloe'], emoji: '📧', color: '#1A82E2', docsUrl: 'https://app.sendgrid.com/settings/api_keys',
  },

  // ─── WHATSAPP ────────────────────────────────────────────────────────────────
  {
    slug: 'twilio', name: 'Twilio WhatsApp', category: 'whatsapp', auth: 'api_key',
    description: 'Atención por WhatsApp para Aloe (tickets, respuestas, postventa).',
    fields: [
      { key: 'account_sid', label: 'Account SID', type: 'text', placeholder: 'AC…' },
      { key: 'auth_token', label: 'Auth Token', type: 'password' },
      { key: 'from_number', label: 'Número (from)', type: 'text', placeholder: 'whatsapp:+521…', optional: true },
    ],
    agents: ['aloe'], emoji: '🟢', color: '#F22F46', docsUrl: 'https://console.twilio.com',
  },

  // ─── ADS (OAuth) ──────────────────────────────────────────────────────────────
  {
    slug: 'meta', name: 'Meta (Ads + Instagram)', category: 'ads', auth: 'oauth',
    description: 'Publicar en Instagram/Facebook y lanzar pauta. Nopal + Cholla.',
    oauth: {
      authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scopes: ['ads_management', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish'],
      clientIdEnv: 'META_CLIENT_ID', clientSecretEnv: 'META_CLIENT_SECRET',
    },
    agents: ['nopal', 'cholla'], emoji: '📘', color: '#1877F2', docsUrl: 'https://developers.facebook.com/apps',
  },
  {
    slug: 'google-ads', name: 'Google Ads', category: 'ads', auth: 'oauth',
    description: 'Campañas de búsqueda y display gestionadas por Cholla.',
    oauth: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/adwords'],
      clientIdEnv: 'GOOGLE_CLIENT_ID', clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    },
    agents: ['cholla'], emoji: '🔎', color: '#4285F4', docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    slug: 'tiktok-ads', name: 'TikTok Ads', category: 'ads', auth: 'oauth',
    description: 'Pauta en TikTok para Cholla.',
    oauth: {
      authUrl: 'https://business-api.tiktok.com/portal/auth',
      tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      scopes: ['ads.management'],
      clientIdEnv: 'TIKTOK_CLIENT_ID', clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    },
    agents: ['cholla'], emoji: '🎵', color: '#000000', docsUrl: 'https://business-api.tiktok.com',
  },
  {
    slug: 'linkedin', name: 'LinkedIn', category: 'ads', auth: 'oauth',
    description: 'Pauta B2B y publicación. Cholla + Ocotillo (talento).',
    oauth: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_ads', 'rw_ads', 'w_member_social'],
      clientIdEnv: 'LINKEDIN_CLIENT_ID', clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    },
    agents: ['cholla', 'ocotillo'], emoji: '💼', color: '#0A66C2', docsUrl: 'https://www.linkedin.com/developers/apps',
  },

  // ─── SEARCH (OAuth) ────────────────────────────────────────────────────────────
  {
    slug: 'search-console', name: 'Google Search Console', category: 'search', auth: 'oauth',
    description: 'Tráfico orgánico y rankings reales para Echinocereus (SEO).',
    oauth: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      clientIdEnv: 'GOOGLE_CLIENT_ID', clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    },
    agents: ['echinocereus'], emoji: '📈', color: '#458CF5', docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },

  // ─── VIDEO ──────────────────────────────────────────────────────────────────
  {
    slug: 'kling', name: 'Kling', category: 'video', auth: 'api_key',
    description: 'Genera video real desde los tratamientos de Candelabro.',
    fields: [key('API key')],
    agents: ['candelabro'], emoji: '🎬', color: '#6D28D9', docsUrl: 'https://klingai.com',
  },
  {
    slug: 'runway', name: 'Runway', category: 'video', auth: 'api_key',
    description: 'Video y motion para Candelabro y San Pedro.',
    fields: [key('API key')],
    agents: ['candelabro', 'sanpedro'], emoji: '🎞️', color: '#111827', docsUrl: 'https://dev.runwayml.com',
  },

  // ─── AUDIO ──────────────────────────────────────────────────────────────────
  {
    slug: 'elevenlabs', name: 'ElevenLabs', category: 'audio', auth: 'api_key',
    description: 'Voz, locución y doblaje para Garambullo.',
    fields: [key('API key')],
    agents: ['garambullo'], emoji: '🎙️', color: '#000000', docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
  },
  {
    slug: 'suno', name: 'Suno', category: 'audio', auth: 'api_key',
    description: 'Música y jingles para Pereskia.',
    fields: [key('API key')],
    agents: ['pereskia'], emoji: '🎵', color: '#F59E0B', docsUrl: 'https://suno.com',
  },

  // ─── 3D ──────────────────────────────────────────────────────────────────────
  {
    slug: 'meshy', name: 'Meshy', category: '3d', auth: 'api_key',
    description: '3D imprimible (STL/OBJ) desde personajes de Ariocarpus/Astrophytum.',
    fields: [key('API key')],
    agents: ['ariocarpus', 'astrophytum'], emoji: '🧊', color: '#7C3AED', docsUrl: 'https://www.meshy.ai',
  },
];

export const INTEGRATIONS_BY_SLUG: Record<string, IntegrationProvider> = Object.fromEntries(
  INTEGRATIONS.map((i) => [i.slug, i]),
);

export function getIntegration(slug: string): IntegrationProvider | undefined {
  return INTEGRATIONS_BY_SLUG[slug];
}

/** Campos requeridos (no opcionales) de un proveedor api_key. */
export function requiredFields(p: IntegrationProvider): IntegrationField[] {
  return (p.fields || []).filter((f) => !f.optional);
}

/** Redirect URI que Eduardo debe registrar con el proveedor OAuth. */
export function redirectUri(origin: string, slug: string): string {
  return `${origin}/api/integrations/${slug}/callback`;
}
