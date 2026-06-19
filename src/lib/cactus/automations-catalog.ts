// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Automatizaciones por defecto por agente (Bloque 7)
// Catálogo de datos (sin 'use client') para que CADA agente tenga
// automatizaciones útiles desde el primer uso. El hook useAutomations las
// carga; los toggles persisten por agente en localStorage.
// ═══════════════════════════════════════════════════════════════════════════

import type { AutomationDef } from '@/components/cactus/apps/shared/automations';

/** Automatizaciones genéricas útiles para cualquier agente generativo. */
const GENERIC: AutomationDef[] = [
  { id: 'brand-voice', name: 'Aplicar voz de marca', desc: 'Usa siempre el núcleo de marca (Canon) al generar.', trigger: 'Al generar', enabled: true },
  { id: 'autosave', name: 'Guardar resultados', desc: 'Guarda automáticamente cada pieza generada en tu biblioteca.', trigger: 'Resultado listo', enabled: true },
  { id: 'variants', name: 'Proponer variantes', desc: 'Ofrece 2–3 variantes para elegir, en vez de una sola.', trigger: 'Al generar', enabled: false },
  { id: 'handoff', name: 'Sugerir siguiente paso', desc: 'Recomienda a qué agente pasar el resultado.', trigger: 'Resultado listo', enabled: false },
];

/** Automatizaciones específicas por agente (se suman/priorizan sobre las genéricas). */
const SPECIFIC: Record<string, AutomationDef[]> = {
  nopal: [
    { id: 'brand-voice', name: 'Aplicar voz de marca', desc: 'Usa el núcleo de marca en cada caption.', trigger: 'Al generar', enabled: true },
    { id: 'hashtags', name: 'Sugerir hashtags', desc: 'Añade hashtags relevantes al final de cada post.', trigger: 'Al generar', enabled: true },
    { id: 'autosave', name: 'Guardar borradores', desc: 'Guarda los borradores en la biblioteca local.', trigger: 'Resultado listo', enabled: true },
    { id: 'cta', name: 'Cerrar con CTA', desc: 'Asegura un llamado a la acción claro en cada pieza.', trigger: 'Al generar', enabled: false },
  ],
  pitaya: [
    { id: 'brand-voice', name: 'Aplicar voz de marca', desc: 'Mantén el tono de marca en cada texto.', trigger: 'Al generar', enabled: true },
    { id: 'hook', name: 'Hook fuerte primero', desc: 'Empieza siempre con un gancho potente.', trigger: 'Al generar', enabled: true },
    { id: 'variants', name: 'Proponer variantes', desc: 'Ofrece 2–3 versiones del copy.', trigger: 'Al generar', enabled: false },
  ],
  ferocactus: [
    { id: 'brand-voice', name: 'Datos de la empresa', desc: 'Usa el núcleo de marca en encabezados y firmas.', trigger: 'Al generar', enabled: true },
    { id: 'risk-note', name: 'Nota de riesgos', desc: 'Añade una sección de riesgos/recomendaciones.', trigger: 'Al generar', enabled: true },
    { id: 'autosave', name: 'Guardar documentos', desc: 'Archiva cada documento generado.', trigger: 'Resultado listo', enabled: true },
  ],
  maguey: [
    { id: 'brand-voice', name: 'Aplicar voz de marca', desc: 'Vende con el tono y valores de la marca.', trigger: 'Al generar', enabled: true },
    { id: 'objections', name: 'Anticipar objeciones', desc: 'Incluye respuestas a objeciones comunes.', trigger: 'Al generar', enabled: false },
    { id: 'autosave', name: 'Guardar propuestas', desc: 'Guarda cada propuesta en tu biblioteca.', trigger: 'Resultado listo', enabled: true },
  ],
  aloe: [
    { id: 'brand-voice', name: 'Tono de marca', desc: 'Responde con la voz y empatía de la marca.', trigger: 'Al generar', enabled: true },
    { id: 'deescalate', name: 'Desescalar reclamos', desc: 'Prioriza un tono que calma y resuelve.', trigger: 'Al generar', enabled: true },
    { id: 'autosave', name: 'Guardar respuestas', desc: 'Archiva las respuestas útiles para reutilizarlas.', trigger: 'Resultado listo', enabled: false },
  ],
  echinocereus: [
    { id: 'brand-voice', name: 'Contexto de marca', desc: 'Optimiza para el negocio descrito en el núcleo.', trigger: 'Al generar', enabled: true },
    { id: 'intent', name: 'Agrupar por intención', desc: 'Organiza keywords/contenido por intención de búsqueda.', trigger: 'Al generar', enabled: true },
    { id: 'autosave', name: 'Guardar planes', desc: 'Guarda los planes SEO en tu biblioteca.', trigger: 'Resultado listo', enabled: true },
  ],
};

/** Devuelve las automatizaciones por defecto de un agente (específicas o genéricas). */
export function defaultAutomationsFor(slug: string): AutomationDef[] {
  return SPECIFIC[slug] || GENERIC;
}
