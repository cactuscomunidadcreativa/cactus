// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Taxonomía de navegación (cambio total — barra unificada)
// Agrupa los 26 agentes en 5 categorías por USO (lenguaje simple), para que la
// barra no maree con 27 nombres. Núcleo (Ramona/Cerebro) va fijo aparte.
// ═══════════════════════════════════════════════════════════════════════════

import { getAgent, type CactusAgent } from '@/lib/cactus/agents-catalog';

export interface NavCategory {
  key: string;
  label: string;
  /** nombre de icono lucide (se resuelve en el componente) */
  icon: string;
  color: string;
  slugs: string[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  { key: 'marketing', label: 'Marketing & Contenido', icon: 'Megaphone', color: '#D6336C',
    slugs: ['peyote', 'nopal', 'cholla', 'pitaya'] },
  { key: 'creativo', label: 'Creativo', icon: 'Palette', color: '#14B8A6',
    slugs: ['cardon', 'lente', 'candelabro', 'sanpedro', 'garambullo', 'pereskia', 'ariocarpus', 'astrophytum', 'cereus'] },
  { key: 'web', label: 'Web & SEO', icon: 'Globe', color: '#2D6CDF',
    slugs: ['opuntia', 'echinocereus'] },
  { key: 'negocio', label: 'Negocio & Ventas', icon: 'Briefcase', color: '#3E8E40',
    slugs: ['saguaro', 'agave', 'tuna', 'maguey', 'ferocactus', 'biznaga', 'pita'] },
  { key: 'personas', label: 'Personas & Operación', icon: 'Users', color: '#F97316',
    slugs: ['ocotillo', 'yuca', 'huernia', 'aloe'] },
];

/** Núcleo: fijos arriba de la barra. */
export const NAV_CORE = [
  { key: 'ramona', label: 'Ramona', sub: 'Coordinadora', icon: 'Bot', href: '/orchestrator', slug: 'ramona' },
  { key: 'brain', label: 'Cerebro', sub: 'Conocimiento', icon: 'Brain', href: '/brain', slug: undefined as string | undefined },
];

export interface NavAgentLite { slug: string; name: string; role: string; color: string; image: string; href: string }

function toLite(a: CactusAgent): NavAgentLite {
  return { slug: a.slug, name: a.name, role: a.role, color: a.color, image: a.image, href: a.href || `/apps/${a.slug}` };
}

/** Agentes resueltos de una categoría (omite los que no existan en el catálogo). */
export function agentsOfCategory(key: string): NavAgentLite[] {
  const cat = NAV_CATEGORIES.find((c) => c.key === key);
  if (!cat) return [];
  return cat.slugs.map((s) => getAgent(s)).filter((a): a is CactusAgent => !!a).map(toLite);
}

/** Todos los agentes navegables (para buscador y recientes), en orden de categoría. */
export function allNavAgents(): NavAgentLite[] {
  const seen = new Set<string>();
  const out: NavAgentLite[] = [];
  for (const cat of NAV_CATEGORIES) {
    for (const a of agentsOfCategory(cat.key)) {
      if (!seen.has(a.slug)) { seen.add(a.slug); out.push(a); }
    }
  }
  return out;
}

/** Categoría a la que pertenece un slug (para resaltar en la barra). */
export function categoryOf(slug: string): NavCategory | undefined {
  return NAV_CATEGORIES.find((c) => c.slugs.includes(slug));
}
