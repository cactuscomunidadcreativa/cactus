// ═══════════════════════════════════════════════════════════════════════════
// CACTUS COMUNIDAD CREATIVA — Catálogo maestro de agentes
// Fuente única de los cactus-agentes. Funciona sin DB (data tipada).
// Las caras viven en /public/agents/{slug}.png (extraídas del PDF maestro).
// ═══════════════════════════════════════════════════════════════════════════

export type DivisionKey =
  | 'nucleo' | 'business' | 'agency' | 'media'
  | 'avatar' | 'web' | 'sales' | 'support' | 'people' | 'moda';

/** live = usable ya · beta = reusa módulo existente · soon = por construir */
export type AgentStatus = 'core' | 'live' | 'beta' | 'soon';

export interface Division {
  key: DivisionKey;
  label: string;
  tagline: string;
  color: string;
}

export interface CactusAgent {
  slug: string;
  name: string;
  role: string;
  division: DivisionKey;
  description: string;
  /** integraciones / herramientas que puede usar */
  tools: string[];
  /** modelos IA sugeridos (el router elige por costo/calidad/privacidad) */
  models: string[];
  emoji: string;
  color: string;
  /** ruta del avatar extraído del PDF */
  image: string;
  status: AgentStatus;
  /** módulo existente que reutiliza, si aplica */
  reuses?: string;
  /** ruta interna cuando el agente ya es operable */
  href?: string;
}

export const DIVISIONS: Record<DivisionKey, Division> = {
  nucleo:   { key: 'nucleo',   label: 'Núcleo',              tagline: 'Cerebro y orquestación', color: '#0D6E4F' },
  business: { key: 'business', label: 'Cactus Business',     tagline: 'BI, CRM, finanzas y operación', color: '#3E8E40' },
  agency:   { key: 'agency',   label: 'Cactus Agency',       tagline: 'Estrategia, copy, diseño y social', color: '#D6336C' },
  media:    { key: 'media',    label: 'Cactus Media',        tagline: 'Video, animación, voz y música', color: '#8B5CF6' },
  avatar:   { key: 'avatar',   label: 'Cactus Avatar Studio', tagline: 'Humanos digitales y personajes', color: '#14B8A6' },
  web:      { key: 'web',      label: 'Cactus Web',          tagline: 'Sitios, funnels y SEO', color: '#2D6CDF' },
  sales:    { key: 'sales',    label: 'Cactus Sales',        tagline: 'Prospección, propuestas y cierre', color: '#C7A54A' },
  support:  { key: 'support',  label: 'Cactus Support',      tagline: 'Atención al cliente y comunidad', color: '#F97316' },
  people:   { key: 'people',   label: 'Cactus People',       tagline: 'Talento, hábitos y compliance', color: '#0EA5A0' },
  moda:     { key: 'moda',     label: 'Cactus Moda',         tagline: 'Producto, colecciones y e-commerce', color: '#E11D74' },
};

export const DIVISION_ORDER: DivisionKey[] = [
  'nucleo', 'business', 'agency', 'media', 'avatar', 'web', 'sales', 'support', 'people', 'moda',
];

const img = (slug: string) => `/agents/${slug}.png`;

export const AGENTS: CactusAgent[] = [
  // ─── NÚCLEO ───────────────────────────────────────────────────────────────
  {
    slug: 'cactus-ia', name: 'Cactus IA', role: 'Cerebro central', division: 'nucleo',
    description: 'La base de conocimiento, memoria, brand kit, RAG e integraciones que alimenta a todos los agentes.',
    tools: ['Brand Kit', 'Knowledge Vault', 'RAG', 'Memoria', '+50 IAs'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '🧠', color: '#0D6E4F', image: '/cactus-ia-logo.png', status: 'core', href: '/brain',
  },
  {
    slug: 'ramona', name: 'Ramona', role: 'Coordinadora general', division: 'nucleo',
    description: 'Tu asistente ejecutiva. Recibe el pedido, arma el brief, delega a los agentes y asegura que todo se entregue.',
    tools: ['Email', 'Calendar', 'WhatsApp', 'Todos los agentes'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '🌵', color: '#A855C7', image: img('ramona'), status: 'live', reuses: 'ramona', href: '/orchestrator',
  },

  // ─── BUSINESS ─────────────────────────────────────────────────────────────
  {
    slug: 'saguaro', name: 'Saguaro', role: 'Workflow & Tasks', division: 'business',
    description: 'Procesos, SOPs, tareas, checklists, aprobaciones y recordatorios. El tablero operativo del negocio.',
    tools: ['Calendar', 'Slack', 'Teams', 'Make', 'n8n'],
    models: ['Claude', 'Gemini Flash', 'GPT'],
    emoji: '✅', color: '#3E8E40', image: img('saguaro'), status: 'beta', reuses: 'weekflow', href: '/apps/saguaro',
  },
  {
    slug: 'agave', name: 'Agave', role: 'Business Intelligence', division: 'business',
    description: 'KPIs, forecast, pricing, márgenes, cashflow, dashboards y decisiones financieras.',
    tools: ['Sheets', 'Excel', 'Power BI', 'Looker', 'ERP'],
    models: ['Claude', 'Gemini', 'GPT'],
    emoji: '📊', color: '#16A34A', image: img('agave'), status: 'beta', reuses: 'agave', href: '/apps/agave',
  },
  {
    slug: 'tuna', name: 'Tuna', role: 'CRM & Revenue', division: 'business',
    description: 'Leads, pipeline, embudos, seguimiento, cierre y reportes comerciales.',
    tools: ['HubSpot', 'Salesforce', 'Zoho', 'Pipedrive', 'WhatsApp'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '🎯', color: '#E11D48', image: img('tuna'), status: 'beta', reuses: 'tuna', href: '/apps/tuna',
  },
  {
    slug: 'pita', name: 'Pita', role: 'Presentaciones & Feedback', division: 'business',
    description: 'Decks, propuestas visuales, minutas y vault de feedback por cliente.',
    tools: ['Drive', 'Slides', 'PowerPoint', 'Notion'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '🪧', color: '#7BB343', image: '/pita.png', status: 'beta', reuses: 'pita', href: '/apps/pita',
  },
  {
    slug: 'biznaga', name: 'Biznaga', role: 'Market Intelligence', division: 'business',
    description: 'Investigación de mercado, competencia, tendencias, benchmark y pricing externo.',
    tools: ['Web', 'Perplexity', 'PDFs', 'Fuentes públicas'],
    models: ['Perplexity', 'Gemini', 'Claude'],
    emoji: '🔍', color: '#15803D', image: img('biznaga'), status: 'soon',
  },
  {
    slug: 'ferocactus', name: 'Ferocactus', role: 'Contratos & Documentos', division: 'business',
    description: 'Cotizaciones, contratos base, términos, acuerdos y órdenes de servicio.',
    tools: ['Docs', 'PDF', 'Drive'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '📄', color: '#65A30D', image: img('ferocactus'), status: 'soon',
  },

  // ─── AGENCY ───────────────────────────────────────────────────────────────
  {
    slug: 'nopal', name: 'Nopal', role: 'Social Media Manager', division: 'agency',
    description: 'Grillas, captions, calendarios, community management, formatos virales y publicación.',
    tools: ['Meta', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Buffer'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '📣', color: '#D6336C', image: img('nopal'), status: 'beta', reuses: 'ramona', href: '/apps/ramona',
  },
  {
    slug: 'pitaya', name: 'Pitaya', role: 'Copywriter Creativo', division: 'agency',
    description: 'Storytelling, anuncios, guiones, emails, landing pages, slogans y conceptos de campaña.',
    tools: ['Brand Kit', 'Motor Emocional', 'Biznaga'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '✍️', color: '#E8589A', image: img('pitaya'), status: 'beta', reuses: 'ramona', href: '/apps/ramona',
  },
  {
    slug: 'cardon', name: 'Cardón', role: 'Diseñador Gráfico', division: 'agency',
    description: 'Branding, layouts, carruseles, banners, flyers, packaging y piezas para pauta.',
    tools: ['Canvas', 'Plantillas', 'Export PNG/JPG/PDF'],
    models: ['GPT Image', 'Gemini', 'Adobe Firefly'],
    emoji: '🎨', color: '#DB2777', image: '/cactus-ia-logo.png', status: 'live', href: '/studio',
  },
  {
    slug: 'lente', name: 'Lente', role: 'Fotógrafo IA', division: 'agency',
    description: 'Dirección fotográfica, shotlists, moodboards, producto y e-commerce con avatares o modelos.',
    tools: ['Avatares', 'Producto', 'E-commerce'],
    models: ['GPT Image', 'Midjourney', 'Gemini'],
    emoji: '📷', color: '#BE185D', image: img('lente'), status: 'live', reuses: 'cereus', href: '/studio?agent=lente',
  },
  {
    slug: 'peyote', name: 'Peyote', role: 'Estratega Creativo · EQ', division: 'agency',
    description: 'La idea madre. Define el ángulo emocional de cada campaña, audita las piezas y dirige al equipo creativo.',
    tools: ['Motor Emocional', 'Pitaya', 'Cardón', 'Nopal', 'Lente'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '💡', color: '#9333EA', image: img('peyote'), status: 'live', href: '/campaign',
  },

  // ─── MEDIA ────────────────────────────────────────────────────────────────
  {
    slug: 'candelabro', name: 'Candelabro', role: 'Video Maker', division: 'media',
    description: 'Reels, comerciales, TikToks, videos corporativos y storyboards. Usa guiones de Pitaya y fotos de Lente.',
    tools: ['Storyboards', 'Avatares'],
    models: ['Kling', 'Runway', 'Google Veo'],
    emoji: '🎬', color: '#8B5CF6', image: img('candelabro'), status: 'soon',
  },
  {
    slug: 'sanpedro', name: 'San Pedro', role: 'Animator', division: 'media',
    description: 'Motion graphics, logos animados, transiciones, personajes, intros y microanimaciones.',
    tools: ['Cardón', 'Astrophytum', 'Candelabro'],
    models: ['Runway', 'Kling', 'Luma'],
    emoji: '✨', color: '#7C3AED', image: img('sanpedro'), status: 'soon',
  },
  {
    slug: 'garambullo', name: 'Garambullo', role: 'Voice & Audio Studio', division: 'media',
    description: 'Locución, podcast, voice-over, doblaje, audiolibros y sonic identity de marca.',
    tools: ['Avatares', 'Podcasts', 'Capacitaciones'],
    models: ['OpenAI TTS', 'Gemini TTS', 'ElevenLabs'],
    emoji: '🎙️', color: '#6D28D9', image: img('garambullo'), status: 'live', href: '/voice',
  },
  {
    slug: 'pereskia', name: 'Pereskia', role: 'Music Producer', division: 'media',
    description: 'Jingles, música, sound design, ambientación y audio branding. Entrega pistas a Candelabro.',
    tools: ['Sound design', 'Audio branding'],
    models: ['Google Lyria', 'Suno', 'Udio'],
    emoji: '🎵', color: '#5B21B6', image: img('pereskia'), status: 'soon',
  },

  // ─── AVATAR STUDIO ────────────────────────────────────────────────────────
  {
    slug: 'ariocarpus', name: 'Ariocarpus', role: 'Avatar & Digital Human', division: 'avatar',
    description: 'Crea avatares, influencers virtuales, vendedores, presentadores y embajadores de marca con rostro, voz e historia consistentes.',
    tools: ['Lente', 'Candelabro', 'San Pedro', 'Garambullo'],
    models: ['GPT Image', 'Kling', 'Google Veo'],
    emoji: '🧑‍🚀', color: '#14B8A6', image: img('ariocarpus'), status: 'soon',
  },
  {
    slug: 'astrophytum', name: 'Astrophytum', role: 'Character Designer', division: 'avatar',
    description: 'Mascotas, personajes, universos de marca, avatares estilizados y story bibles consistentes.',
    tools: ['San Pedro', 'Cardón'],
    models: ['GPT Image', 'Gemini', 'Midjourney'],
    emoji: '⭐', color: '#0D9488', image: img('astrophytum'), status: 'live', href: '/studio?agent=astrophytum',
  },

  // ─── WEB ──────────────────────────────────────────────────────────────────
  {
    slug: 'opuntia', name: 'Opuntia', role: 'Website Builder', division: 'web',
    description: 'Constructor web: landings, sitios, funnels, micrositios, formularios, blogs y e-commerce.',
    tools: ['Next.js', 'Tailwind', 'CMS', 'Formularios', 'Checkout'],
    models: ['GPT', 'Claude', 'Gemini'],
    emoji: '🌐', color: '#2D6CDF', image: img('opuntia'), status: 'soon',
  },
  {
    slug: 'echinocereus', name: 'Echinocereus', role: 'SEO & Growth', division: 'web',
    description: 'SEO técnico, keywords, contenidos, metadata, arquitectura web, interlinking y tráfico orgánico.',
    tools: ['Opuntia', 'Pitaya', 'Biznaga'],
    models: ['Gemini', 'Perplexity', 'Claude'],
    emoji: '📈', color: '#1D4ED8', image: img('echinocereus'), status: 'soon',
  },

  // ─── SALES ────────────────────────────────────────────────────────────────
  {
    slug: 'maguey', name: 'Maguey', role: 'Ventas & Propuestas', division: 'sales',
    description: 'Scripts, seguimiento, objeciones, prospección, propuestas, cotizaciones y cierre comercial.',
    tools: ['Tuna CRM', 'Ferocactus'],
    models: ['GPT', 'Claude', 'Gemini'],
    emoji: '💰', color: '#C7A54A', image: img('maguey'), status: 'soon',
  },

  // ─── MODA ─────────────────────────────────────────────────────────────────
  {
    slug: 'cereus', name: 'Cereus', role: 'Fashion & Product Studio', division: 'moda',
    description: 'Moda, drops, colecciones, catálogo, producto, e-commerce y merchandising. El atelier emocional.',
    tools: ['Lente', 'Ariocarpus', 'Candelabro', 'Opuntia'],
    models: ['GPT Image', 'Gemini', 'Claude'],
    emoji: '👗', color: '#E11D74', image: img('cereus'), status: 'beta', reuses: 'cereus', href: '/apps/cereus',
  },

  // ─── SUPPORT ──────────────────────────────────────────────────────────────
  {
    slug: 'aloe', name: 'Aloe', role: 'Customer Care', division: 'support',
    description: 'WhatsApp, correo, DMs, comentarios, tickets, FAQs, reclamos y soporte postventa.',
    tools: ['WhatsApp API', 'Gmail', 'Outlook', 'Helpdesk', 'CRM'],
    models: ['GPT', 'Claude', 'Gemini'],
    emoji: '💬', color: '#F97316', image: img('aloe'), status: 'soon', reuses: 'whatsapp',
  },

  // ─── PEOPLE ───────────────────────────────────────────────────────────────
  {
    slug: 'ocotillo', name: 'Ocotillo', role: 'Talento & Reclutamiento', division: 'people',
    description: 'Perfiles, entrevistas, filtros, evaluaciones, shortlists y seguimiento de candidatos.',
    tools: ['LinkedIn', 'Gmail', 'ATS', 'Calendar'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '🧑‍💼', color: '#0EA5A0', image: img('ocotillo'), status: 'soon',
  },
  {
    slug: 'yuca', name: 'Yuca', role: 'Productividad & Hábitos', division: 'people',
    description: 'Metas, foco, bienestar, capacitación, rutinas y seguimiento personal y de equipos.',
    tools: ['Calendar', 'WeekFlow'],
    models: ['GPT', 'Claude', 'Gemini'],
    emoji: '🧘', color: '#10B981', image: img('yuca'), status: 'soon', reuses: 'weekflow',
  },
  {
    slug: 'huernia', name: 'Huernia', role: 'Legal & Compliance', division: 'people',
    description: 'Políticas, riesgos, términos, compliance, alertas regulatorias y revisión documental preliminar.',
    tools: ['Docs', 'Ferocactus'],
    models: ['Claude', 'GPT', 'Gemini'],
    emoji: '⚖️', color: '#059669', image: img('huernia'), status: 'soon',
  },
];

// Normalización: todo agente es operable via su consola (/agent/{slug}) si no
// tiene una superficie propia. Ninguno queda "Pronto": todos responden ya.
for (const a of AGENTS) {
  if (!a.href) a.href = `/agent/${a.slug}`;
  if (a.status === 'soon') a.status = 'beta';
}

// ─── Helpers ──────────────────────────────────────────────────────────────
export const AGENTS_BY_SLUG: Record<string, CactusAgent> = Object.fromEntries(
  AGENTS.map((a) => [a.slug, a]),
);

export function agentsByDivision(division: DivisionKey): CactusAgent[] {
  return AGENTS.filter((a) => a.division === division);
}

export function getAgent(slug: string): CactusAgent | undefined {
  return AGENTS_BY_SLUG[slug];
}

export const STATUS_LABEL: Record<AgentStatus, string> = {
  core: 'Núcleo',
  live: 'Disponible',
  beta: 'En servicio',
  soon: 'Próximamente',
};
