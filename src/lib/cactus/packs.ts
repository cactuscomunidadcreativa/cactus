// ═══════════════════════════════════════════════════════════════════════════
// Packs comerciales de Cactus Comunidad Creativa
// Cada pack = un set de agentes + créditos/mes. Espejo del PDF maestro.
// ═══════════════════════════════════════════════════════════════════════════

import { PLAN_CREDITS } from './credits';

export interface Pack {
  key: string;
  name: string;
  tagline: string;
  agents: string[]; // slugs del catálogo
  credits: number;  // -1 = ilimitado / BYOK
  featured?: boolean;
}

export const PACKS: Pack[] = [
  {
    key: 'starter', name: 'Cactus Starter', tagline: 'Arranca tu presencia con IA.',
    agents: ['cactus-ia', 'ramona', 'nopal', 'pitaya'], credits: PLAN_CREDITS.starter,
  },
  {
    key: 'business', name: 'Cactus Business', tagline: 'Opera, mide y decide.',
    agents: ['cactus-ia', 'ramona', 'agave', 'tuna', 'saguaro', 'pita'], credits: PLAN_CREDITS.business,
  },
  {
    key: 'agency', name: 'Cactus Agency', tagline: 'Tu agencia creativa completa.',
    agents: ['peyote', 'pitaya', 'cardon', 'lente', 'nopal', 'candelabro'], credits: PLAN_CREDITS.agency,
    featured: true,
  },
  {
    key: 'moda', name: 'Cactus Moda', tagline: 'Del concepto al e-commerce.',
    agents: ['cereus', 'lente', 'ariocarpus', 'cardon', 'opuntia', 'nopal'], credits: PLAN_CREDITS.moda,
  },
  {
    key: 'avatar', name: 'Cactus Avatar Studio', tagline: 'Humanos digitales y personajes.',
    agents: ['ariocarpus', 'astrophytum', 'lente', 'candelabro', 'sanpedro', 'garambullo'], credits: PLAN_CREDITS.avatar,
  },
  {
    key: 'full', name: 'Cactus One · Full', tagline: 'Todo el ecosistema + BYOK + soporte.',
    agents: [], credits: PLAN_CREDITS.full,
  },
];
