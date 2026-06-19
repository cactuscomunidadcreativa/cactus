import { cookies } from 'next/headers';

// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Efecto real de automatizaciones (Bloque 7, Fase 1)
// Las automatizaciones activas de un agente viajan en una cookie por slug
// (cactus_auto_<slug>). El route de IA las lee y las convierte en directivas
// que se anexan al prompt -> los toggles cambian el comportamiento de verdad,
// sin tener que tocar el componente de cada agente.
// ═══════════════════════════════════════════════════════════════════════════

/** Directiva de prompt por id de automatización (los ids se repiten entre agentes). */
const DIRECTIVES: Record<string, string> = {
  variants: 'Ofrece 2-3 variantes distintas entre sí para elegir.',
  hashtags: 'Incluye hashtags relevantes al final.',
  cta: 'Cierra con un llamado a la acción claro.',
  hook: 'Empieza con un gancho potente en la primera línea.',
  objections: 'Anticipa y responde las objeciones más comunes.',
  'seo-tags': 'Añade al final una línea "Etiquetas SEO:" con 5-8 palabras clave.',
  intent: 'Organiza el contenido por intención de búsqueda.',
  multichannel: 'Entrega una versión corta para redes y una larga para la tienda/web.',
  deescalate: 'Prioriza un tono que calma y desescala el conflicto.',
  'sizing-note': 'Incluye una guía de tallas y notas de cuidado del producto.',
  'risk-note': 'Incluye una sección breve de riesgos y recomendaciones.',
  // brand-voice -> ya lo garantiza el Canon; autosave/handoff -> efectos de cliente.
};

/** Lee las automatizaciones activas del agente (cookie) y devuelve el bloque de directivas. */
export async function getAutomationDirectives(slug: string): Promise<string> {
  try {
    const store = await cookies();
    const raw = store.get(`cactus_auto_${slug}`)?.value;
    if (!raw) return '';
    const keys = decodeURIComponent(raw).split(',').filter(Boolean);
    const lines = keys.map((k) => DIRECTIVES[k]).filter(Boolean);
    if (!lines.length) return '';
    return `\n\nAJUSTES ACTIVOS (respétalos):\n- ${lines.join('\n- ')}`;
  } catch {
    return '';
  }
}
