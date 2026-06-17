// Planes de la landing pública (vista 28). Distinto de PACKS (bundles por agente):
// aquí son tiers por precio. El cobro real se conecta luego con Stripe.
export interface PricingTier {
  key: string;
  name: string;
  price: string;       // "$0", "$29", "A medida"
  period?: string;     // "/mes"
  tagline: string;
  featured?: boolean;
  cta: { label: string; href: string };
  features: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    tagline: 'Prueba el ecosistema',
    cta: { label: 'Empezar gratis', href: '/register' },
    features: ['Ramona + 3 agentes', '200 créditos / mes', '1 marca', 'Soporte de la comunidad'],
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/mes',
    tagline: 'Arranca tu presencia con IA',
    cta: { label: 'Elegir Starter', href: '/register' },
    features: ['8 agentes', '5,000 créditos / mes', '3 marcas', 'Soporte por email'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/mes',
    tagline: 'Para creadores y pymes',
    featured: true,
    cta: { label: 'Elegir Pro', href: '/register' },
    features: ['Todos los agentes', '15,000 créditos / mes', 'Proyectos ilimitados', 'Soporte prioritario'],
  },
  {
    key: 'business',
    name: 'Business',
    price: '$199',
    period: '/mes',
    tagline: 'Tu negocio en piloto automático',
    cta: { label: 'Elegir Business', href: '/register' },
    features: ['Todos los agentes', '30,000 créditos / mes', 'Multiusuario', 'Integraciones + API'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'A medida',
    tagline: 'Escala con soporte dedicado',
    cta: { label: 'Contactar ventas', href: '/#contacto' },
    features: ['BYOK · créditos ilimitados', 'Modelos dedicados', 'SLA + onboarding', 'Soporte dedicado'],
  },
];

export const PRICING_FAQ: { q: string; a: string }[] = [
  { q: '¿Qué es un crédito Cactus?', a: 'Es la unidad con la que los agentes ejecutan tareas. Cada agente consume créditos según el modelo de IA y el tipo de trabajo (texto, imagen, video).' },
  { q: '¿Puedo cambiar de plan cuando quiera?', a: 'Sí. Subes o bajas de plan en cualquier momento; los créditos se ajustan al ciclo.' },
  { q: '¿Qué es BYOK?', a: 'Bring Your Own Keys: conectas tus propias llaves de IA (Anthropic, OpenAI, etc.) y usas el ecosistema sin límite de créditos.' },
  { q: '¿Necesito tarjeta para el plan Free?', a: 'No. El plan Free es para probar el ecosistema sin compromiso.' },
];
