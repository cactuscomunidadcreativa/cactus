// ═══════════════════════════════════════════════════════════════════════════
// CACTUS · Motor Emocional — los 8 perfiles + ejes
// Nativo de Cactus, POTENCIADO por la ciencia Six Seconds que validamos en ROWI
// (estilos cerebrales / Brain Brief). No es una dependencia de ROWI: es propio.
// Cada perfil trae su RECETA de mensaje (cómo le hablas) y su VENENO (qué evitar).
// ═══════════════════════════════════════════════════════════════════════════

export type ProfileKey =
  | 'cientifico' | 'visionario' | 'inventor' | 'guardian'
  | 'estratega' | 'energizador' | 'hacedor' | 'sabio';

export interface EmotionalProfile {
  key: ProfileKey;
  name: string;
  emoji: string;
  color: string;
  /** cómo decide / qué lo mueve */
  decides: string;
  /** receta de mensaje — el ángulo con el que le hablas */
  angle: string;
  /** qué NO hacer con este perfil */
  avoid: string;
  /** palanca emocional dominante */
  trigger: string;
}

export const PROFILES: Record<ProfileKey, EmotionalProfile> = {
  cientifico: {
    key: 'cientifico', name: 'Científico', emoji: '🔬', color: '#3b82f6',
    decides: 'Con lógica, precisión y evidencia.',
    angle: 'Lógica + datos + ejemplos concretos. Afirmaciones verificables.',
    avoid: 'Emoción sin fundamento, hipérbole, promesas vagas.',
    trigger: 'Confianza por rigor',
  },
  visionario: {
    key: 'visionario', name: 'Visionario', emoji: '🔮', color: '#8b5cf6',
    decides: 'Por el panorama amplio y el impacto futuro.',
    angle: 'Visión amplia + propósito + transformación a futuro.',
    avoid: 'Frenarlo con datos anti-riesgo o detalles operativos.',
    trigger: 'Aspiración',
  },
  inventor: {
    key: 'inventor', name: 'Inventor', emoji: '💡', color: '#f59e0b',
    decides: 'Explorando posibilidades y conexiones nuevas.',
    angle: 'Curiosidad + posibilidades + “qué pasaría si…”.',
    avoid: 'Concreción rígida temprana, fórmulas cerradas.',
    trigger: 'Curiosidad',
  },
  guardian: {
    key: 'guardian', name: 'Guardián', emoji: '🛡️', color: '#22c55e',
    decides: 'Por seguridad, confianza y pasos claros.',
    angle: 'Confianza + pasos concretos + garantías + cuidado.',
    avoid: 'Hechos fríos sin contexto humano, presión al cambio.',
    trigger: 'Seguridad',
  },
  estratega: {
    key: 'estratega', name: 'Estratega', emoji: '♟️', color: '#6366f1',
    decides: 'Con estructura, opciones claras y largo plazo.',
    angle: 'Largo plazo + estructura + opciones comparadas.',
    avoid: 'Presión sin estrategia, desorden, urgencia gratuita.',
    trigger: 'Control',
  },
  energizador: {
    key: 'energizador', name: 'Energizador', emoji: '⚡', color: '#ec4899',
    decides: 'Por la energía, el movimiento y el impacto visible.',
    angle: 'Movimiento + ejemplos reales + impacto inmediato. Chispa.',
    avoid: 'Lentitud, burocracia, teoría larga.',
    trigger: 'Entusiasmo',
  },
  hacedor: {
    key: 'hacedor', name: 'Hacedor', emoji: '🎯', color: '#ef4444',
    decides: 'Por resultados prácticos y eficiencia.',
    angle: 'Resultados + razones prácticas + autonomía. Directo.',
    avoid: 'Solo emoción, teoría excesiva, rodeos.',
    trigger: 'Logro',
  },
  sabio: {
    key: 'sabio', name: 'Sabio', emoji: '🦉', color: '#14b8a6',
    decides: 'Por el significado profundo y los valores.',
    angle: 'Significado + valores + reflexión + propósito.',
    avoid: 'Urgencia sin propósito, superficialidad.',
    trigger: 'Trascendencia',
  },
};

export const PROFILE_ORDER: ProfileKey[] = [
  'cientifico', 'visionario', 'inventor', 'guardian',
  'estratega', 'energizador', 'hacedor', 'sabio',
];

// ─── Ejes que modulan cada variante ─────────────────────────────────────────
export const AXES = {
  procesamiento: { racional: 'Racional', emocional: 'Emocional' },
  cambio: { motivar: 'Motivar el cambio (chispa, rápido)', sostener: 'Sostener el cambio (datos, evidencia)' },
  horizonte: { corto: 'Resultado a corto plazo', largo: 'Visión a largo plazo' },
} as const;

/** Inclinación natural de cada perfil en los ejes (punto de partida del motor). */
export const PROFILE_AXIS: Record<ProfileKey, { procesamiento: 'racional' | 'emocional'; cambio: 'motivar' | 'sostener'; horizonte: 'corto' | 'largo' }> = {
  cientifico:  { procesamiento: 'racional', cambio: 'sostener', horizonte: 'largo' },
  visionario:  { procesamiento: 'emocional', cambio: 'motivar', horizonte: 'largo' },
  inventor:    { procesamiento: 'emocional', cambio: 'motivar', horizonte: 'corto' },
  guardian:    { procesamiento: 'racional', cambio: 'sostener', horizonte: 'corto' },
  estratega:   { procesamiento: 'racional', cambio: 'sostener', horizonte: 'largo' },
  energizador: { procesamiento: 'emocional', cambio: 'motivar', horizonte: 'corto' },
  hacedor:     { procesamiento: 'racional', cambio: 'motivar', horizonte: 'corto' },
  sabio:       { procesamiento: 'emocional', cambio: 'sostener', horizonte: 'largo' },
};

// ─── Objetivos emocionales (qué queremos gatillar) ──────────────────────────
export const OBJECTIVES = [
  { key: 'deseo', label: 'Deseo de compra', hint: 'Provocar el querer tenerlo ya.' },
  { key: 'confianza', label: 'Confianza', hint: 'Reducir el riesgo percibido, dar seguridad.' },
  { key: 'urgencia', label: 'Urgencia', hint: 'Motivar la acción ahora.' },
  { key: 'pertenencia', label: 'Pertenencia', hint: 'Hacer sentir parte de algo.' },
  { key: 'aspiracion', label: 'Aspiración', hint: 'Conectar con la mejor versión de sí.' },
  { key: 'curiosidad', label: 'Curiosidad', hint: 'Abrir un loop que pida ser resuelto.' },
] as const;

export type ObjectiveKey = typeof OBJECTIVES[number]['key'];

/** Canales con su forma de escritura. */
export const CHANNELS = [
  { key: 'instagram', label: 'Instagram', hint: 'visual, gancho fuerte, 1-2 líneas + hashtags' },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'cercano, directo, conversacional' },
  { key: 'email', label: 'Email', hint: 'asunto + cuerpo claro, un solo CTA' },
  { key: 'landing', label: 'Landing', hint: 'headline + subhead + CTA' },
  { key: 'tiktok', label: 'TikTok', hint: 'hook en 3s, hablado, ritmo rápido' },
  { key: 'linkedin', label: 'LinkedIn', hint: 'profesional, con criterio, sin clickbait' },
] as const;

export type ChannelKey = typeof CHANNELS[number]['key'];
