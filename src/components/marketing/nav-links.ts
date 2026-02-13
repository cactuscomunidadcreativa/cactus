// Centralized navigation for the marketing site

export const MARKETING_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/apps', label: 'Apps' },
  { href: '/blog', label: 'Blog' },
  { href: '/#contacto', label: 'Contacto' },
];

export const APP_INFO = {
  ramona: {
    id: 'ramona',
    name: 'RAMONA',
    emoji: '🎨',
    logo: '/ramona.png',
    tagline: 'Tu Asistente de Marketing con IA',
    color: '#9A4E9A',
    landing: '/landing/ramona',
    demo: '/apps/ramona/demo',
    app: '/apps/ramona',
  },
  tuna: {
    id: 'tuna',
    name: 'TUNA',
    emoji: '🐟',
    logo: '/tuna.png',
    tagline: 'Inteligencia Agrícola',
    color: '#0891B2',
    landing: '/landing/tuna',
    demo: '/apps/tuna/demo',
    app: '/apps/tuna',
  },
  agave: {
    id: 'agave',
    name: 'AGAVE',
    emoji: '🌵',
    logo: '/agave.png',
    tagline: 'Asistente de Precios Inteligente',
    color: '#16A34A',
    landing: '/landing/agave',
    demo: '/apps/agave/demo',
    app: '/apps/agave',
  },
  saguaro: {
    id: 'saguaro',
    name: 'SAGUARO',
    emoji: '🌿',
    logo: '/saguaro.png',
    tagline: 'Flujo de Trabajo en Flow',
    color: '#059669',
    landing: '/landing/saguaro',
    demo: '/apps/saguaro/demo',
    app: '/apps/saguaro',
  },
  pita: {
    id: 'pita',
    name: 'PITA',
    emoji: '🎤',
    logo: '/pita.png',
    tagline: 'Presentation & Co-Creation Vault',
    color: '#6B8F23',
    landing: '/landing/pita',
    demo: '/pita/own-your-impact',
    app: '/apps/pita',
  },
} as const;

export const FOOTER_LINKS = {
  apps: [
    { href: '/landing/ramona', label: 'RAMONA' },
    { href: '/landing/tuna', label: 'TUNA' },
    { href: '/landing/agave', label: 'AGAVE' },
    { href: '/landing/saguaro', label: 'SAGUARO' },
    { href: '/landing/pita', label: 'PITA' },
  ],
  community: [
    { href: '/blog', label: 'Blog' },
    { href: '/#contacto', label: 'Contacto' },
  ],
  legal: [
    { href: '/privacidad', label: 'Privacidad' },
    { href: '/terminos', label: 'Términos' },
  ],
};
