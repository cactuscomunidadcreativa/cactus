// Navegación centralizada para el sitio de marketing

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
    tagline: 'Tu Asistente de Arte con IA',
    color: '#9A4E9A',
    landing: '/landing/ramona',
    demo: '/apps/ramona/demo',
    app: '/apps/ramona',
  },
  tuna: {
    id: 'tuna',
    name: 'TUNA',
    emoji: '🐟',
    tagline: 'Gestión Inteligente de Proyectos',
    color: '#0891B2',
    landing: '/landing/tuna',
    demo: '/apps/tuna/demo',
    app: '/apps/tuna',
  },
  agave: {
    id: 'agave',
    name: 'AGAVE',
    emoji: '🌵',
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
    tagline: 'Bienestar y Productividad',
    color: '#059669',
    landing: '/landing/saguaro',
    demo: '/apps/saguaro/demo',
    app: '/apps/saguaro',
  },
} as const;

export const FOOTER_LINKS = {
  apps: [
    { href: '/landing/ramona', label: 'RAMONA' },
    { href: '/landing/tuna', label: 'TUNA' },
    { href: '/landing/agave', label: 'AGAVE' },
    { href: '/landing/saguaro', label: 'SAGUARO' },
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
