// ═══════════════════════════════════════════════════════════
// SHOWCASE DATA — Proyectos reales, servicios y proceso
// Fuente única para homepage, /proyectos y /servicios
// ═══════════════════════════════════════════════════════════

export interface Project {
  id: string;
  name: string;
  client: string;
  category: string;
  year: string;
  url?: string;
  internalUrl?: string;
  tagline: string;
  description: string;
  highlights: string[];
  stack: string[];
  color: string;
  colorDark: string;
  accent: string;
  featured: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: 'rowi',
    name: 'ROWI',
    client: 'Six Seconds LATAM',
    category: 'Plataforma de IA Emocional',
    year: '2026',
    url: 'https://rowiia.com',
    tagline: 'La práctica diaria que transforma tus relaciones.',
    description:
      'Plataforma de inteligencia emocional potenciada con IA, construida sobre la ciencia de Six Seconds. Lee la compatibilidad emocional entre personas, sugiere estrategias de comunicación y acompaña con un coach de IA disponible 24/7.',
    highlights: [
      'Espejo Emocional: assessment SEI con 8 competencias y 18 talentos',
      'Rowi Coach: coaching personal con IA, entrenado en tu perfil',
      'Sistema de Afinidad entre personas y equipos',
      'ECO: mensajes optimizados por IA para email, WhatsApp y presentaciones',
    ],
    stack: ['Next.js', 'IA Generativa', 'Supabase', 'Six Seconds SEI'],
    color: '#1A8A7A',
    colorDark: '#0D2B26',
    accent: '#5BD0BC',
    featured: true,
  },
  {
    id: 'madcat',
    name: 'MADCAT',
    client: 'Rodrigo "MadCat" Vera · UFC',
    category: 'Sitio Cinematográfico + E-commerce',
    year: '2026',
    url: 'https://madacat.info',
    tagline: 'Always lands on his feet.',
    description:
      'Sitio oficial del peleador peruano de UFC. Landing cinematográfica con garras que desgarran las secciones, chispas de fuego en canvas, tienda con Stripe, sistema de noticias, sponsors y panel de administración. Trilingüe automático ES / EN / PT.',
    highlights: [
      'Identidad brutal: brochazos reales con filtros SVG de turbulencia',
      'Tienda oficial con checkout Stripe',
      'CMS propio: noticias, peleas y sponsors administrables',
      'Trilingüe automático con contenido traducido',
    ],
    stack: ['Next.js 15', 'Tailwind 4', 'Framer Motion', 'Stripe', 'Supabase'],
    color: '#E0312E',
    colorDark: '#1A0606',
    accent: '#FF6B47',
    featured: true,
  },
  {
    id: 'ego',
    name: 'EGO Intelligence Cloud',
    client: 'EGO Outsourcing',
    category: 'SaaS de Inteligencia Financiera',
    year: '2026',
    tagline: 'Conectamos tus datos. Convertimos tus números en decisiones.',
    description:
      'Plataforma SaaS que conecta ERPs, archivos y fuentes externas — SAP, CONCAR, SISCONT, Odoo, Excel, APIs bancarias — y transforma información contable, comercial y productiva en dashboards, alertas y proyecciones para decidir con claridad.',
    highlights: [
      'Conectores para los ERPs más usados de la región',
      'Dashboards de ventas, costos, utilidad y flujo de caja en tiempo real',
      'Alertas de vencimientos y riesgos, multi-empresa',
      'Análisis presupuestal y proyecciones automáticas',
    ],
    stack: ['Next.js 16', 'PostgreSQL', 'Prisma', 'JWT'],
    color: '#2D6CDF',
    colorDark: '#091529',
    accent: '#6FA2FF',
    featured: true,
  },
  {
    id: 'sca',
    name: 'SCA',
    client: 'CAARD · Centro de Arbitraje',
    category: 'LegalTech · Software de Control Arbitral',
    year: '2026',
    tagline: 'Cada expediente, cada orden de pago, bajo control.',
    description:
      'Sistema integral de gestión arbitral: expedientes, órdenes de pago con split automático entre partes, motor de re-liquidación con versionado histórico, fraccionamientos que arrastran impuestos (RXH / Factura) y flujos de aprobación por roles.',
    highlights: [
      'Motor de re-liquidación con versionado y recálculo instantáneo',
      'Órdenes de pago autogeneradas con split DTE/DDO',
      'Fraccionamiento con cálculo de impuestos automático',
      'Roles, aprobaciones y auditoría completa',
    ],
    stack: ['Next.js', 'Prisma', 'PostgreSQL', 'TypeScript'],
    color: '#C7A54A',
    colorDark: '#171204',
    accent: '#E8CC7A',
    featured: true,
  },
  {
    id: 'coach',
    name: 'eduardogonzalez.coach',
    client: 'Marca personal',
    category: 'Sitio Editorial de Marca Personal',
    year: '2026',
    url: 'https://eduardogonzalez.coach',
    tagline: 'Emotions · Decisions · Human Systems.',
    description:
      'Presencia digital del Director Regional de Six Seconds LATAM. Una premisa: las emociones son datos que transforman la toma de decisiones. Marco de Emotional Budgeting, liderazgo consciente y sistemas humanos.',
    highlights: [
      'Narrativa editorial: emociones como datos',
      'Emotional Budgeting: gestión de energía, confianza y compromiso',
      'Puente entre Six Seconds LATAM y el ecosistema Cactus',
    ],
    stack: ['Next.js', 'Diseño editorial', 'SEO'],
    color: '#4FAF8F',
    colorDark: '#0B1F19',
    accent: '#8AD8BC',
    featured: false,
  },
  {
    id: 'cactus-platform',
    name: 'Cactus Platform',
    client: 'Producto propio',
    category: 'Plataforma Multi-App con IA',
    year: '2025–2026',
    internalUrl: '/apps',
    tagline: 'Seis especies de software. Un solo ecosistema.',
    description:
      'Nuestra plataforma madre: seis aplicaciones con IA viviendo bajo un mismo techo — marketing, datos agrícolas, pricing, flujos de trabajo, presentaciones con feedback y un atelier algorítmico emocional. Multi-tenant, bilingüe y en producción.',
    highlights: [
      'RAMONA · asistente de marketing con IA',
      'TUNA · consolidación y cierre de campañas',
      'AGAVE · inteligencia de precios y márgenes',
      'PITA · presentaciones con feedback en vivo',
    ],
    stack: ['Next.js', 'Supabase', 'Claude AI', 'Stripe', 'next-intl'],
    color: '#3E8E40',
    colorDark: '#07150D',
    accent: '#79BB74',
    featured: false,
  },
];

export interface Service {
  id: string;
  number: string;
  title: string;
  hook: string;
  description: string;
  deliverables: string[];
  proof: string;
  proofProject: string;
  color: string;
}

export const SERVICES: Service[] = [
  {
    id: 'productos-ia',
    number: '01',
    title: 'Productos digitales con IA',
    hook: 'De la idea al producto en producción.',
    description:
      'Diseñamos y construimos productos completos donde la IA no es un adorno: coaches conversacionales, motores de recomendación, generación de contenido y assessments inteligentes integrados al corazón del producto.',
    deliverables: ['Producto completo en producción', 'Integración con modelos de IA (Claude, GPT)', 'Onboarding y analítica', 'Iteración continua'],
    proof: 'Rowi: coach de IA emocional 24/7 sobre la ciencia de Six Seconds',
    proofProject: 'rowi',
    color: '#1A8A7A',
  },
  {
    id: 'automatizacion',
    number: '02',
    title: 'Automatización e integraciones',
    hook: 'Tu operación, sin trabajo manual.',
    description:
      'Conectamos lo que hoy vive separado: ERPs, WhatsApp, Stripe, hojas de cálculo, APIs bancarias. Reportes que se generan solos, alertas que llegan antes del problema, flujos que no necesitan que nadie los empuje.',
    deliverables: ['Conectores ERP (SAP, CONCAR, Odoo...)', 'Bots y flujos de WhatsApp', 'Reportería automática', 'Webhooks y APIs a medida'],
    proof: 'EGO Cloud: ERPs y archivos convertidos en dashboards y alertas',
    proofProject: 'ego',
    color: '#2D6CDF',
  },
  {
    id: 'saas',
    number: '03',
    title: 'Plataformas SaaS a medida',
    hook: 'Software serio para operaciones serias.',
    description:
      'Sistemas multi-tenant con roles, aprobaciones, versionado y auditoría. Construimos el software crítico que tu industria necesita y que ningún producto de estantería resuelve.',
    deliverables: ['Arquitectura multi-tenant', 'Roles y flujos de aprobación', 'Migración de datos históricos', 'Auditoría y trazabilidad'],
    proof: 'SCA: control arbitral completo para CAARD, con motor de re-liquidación',
    proofProject: 'sca',
    color: '#C7A54A',
  },
  {
    id: 'experiencias',
    number: '04',
    title: 'Experiencias web cinematográficas',
    hook: 'Sitios que se sienten, no solo se ven.',
    description:
      'Branding digital con alma: animación, canvas, texturas reales y dirección de arte. Landing pages y e-commerce que convierten porque emocionan primero.',
    deliverables: ['Dirección de arte digital', 'Animación y micro-interacciones', 'E-commerce con Stripe', 'Sitios multi-idioma'],
    proof: 'MadCat: garras, fuego y una tienda oficial para un peleador de UFC',
    proofProject: 'madcat',
    color: '#E0312E',
  },
  {
    id: 'datos',
    number: '05',
    title: 'Inteligencia de datos',
    hook: 'Tus números, convertidos en decisiones.',
    description:
      'Dashboards ejecutivos, consolidación de campañas, análisis de márgenes y pricing. Tomamos datos dispersos y devolvemos claridad: qué está pasando, por qué, y qué hacer.',
    deliverables: ['Dashboards ejecutivos en tiempo real', 'Consolidación multi-fuente', 'Modelos de pricing y márgenes', 'Proyecciones y alertas'],
    proof: 'TUNA y AGAVE: cierre de campañas y pricing inteligente en producción',
    proofProject: 'cactus-platform',
    color: '#D4AF37',
  },
  {
    id: 'eq-tech',
    number: '06',
    title: 'Consultoría EQ + Tech',
    hook: 'Tecnología con inteligencia emocional.',
    description:
      'Lo que nadie más ofrece: la ciencia de Six Seconds aplicada a productos y equipos. Diseñamos sistemas donde las emociones son datos — porque la adopción de tecnología es, primero, un fenómeno humano.',
    deliverables: ['Diagnóstico EQ organizacional', 'Diseño de producto con base emocional', 'Workshops y certificaciones', 'Emotional Budgeting'],
    proof: 'Six Seconds LATAM: dirección regional de la red de EQ más grande del mundo',
    proofProject: 'coach',
    color: '#4FAF8F',
  },
];

export const STATS = [
  { value: 12, suffix: '+', label: 'Productos construidos y en producción' },
  { value: 5, suffix: '', label: 'Industrias: deporte, legal, finanzas, agro, educación' },
  { value: 3, suffix: '', label: 'Idiomas: ES · EN · PT' },
  { value: 24, suffix: '/7', label: 'IA trabajando mientras duermes' },
];

export const PROCESS = [
  {
    step: '01',
    title: 'Escuchamos',
    subtitle: 'Sentir el problema',
    description:
      'Antes de escribir una línea de código, entendemos tu operación, tu gente y lo que de verdad duele. La tecnología que no nace de escuchar, muere en un cajón.',
  },
  {
    step: '02',
    title: 'Diseñamos',
    subtitle: 'Prototipo en días, no meses',
    description:
      'Convertimos la conversación en algo que puedes tocar: prototipos navegables, dirección de arte y arquitectura técnica. Decides viendo, no imaginando.',
  },
  {
    step: '03',
    title: 'Construimos',
    subtitle: 'Sprints con demos reales',
    description:
      'Desarrollo en ciclos cortos con entregas que funcionan. Cada semana ves avance real en producción, no promesas en una presentación.',
  },
  {
    step: '04',
    title: 'Acompañamos',
    subtitle: 'El lanzamiento es el inicio',
    description:
      'Medimos, iteramos y mejoramos contigo. Nuestros productos siguen vivos porque nosotros seguimos ahí: automatizando, optimizando y haciendo crecer.',
  },
];

export const MARQUEE_ITEMS = [
  'ROWI',
  'MADCAT · UFC',
  'EGO INTELLIGENCE CLOUD',
  'SCA · CONTROL ARBITRAL',
  'SIX SECONDS LATAM',
  'RAMONA',
  'TUNA',
  'AGAVE',
  'PITA',
  'CEREUS',
  'SAGUARO',
];
