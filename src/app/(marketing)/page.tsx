import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  Heart,
  Target,
  Brain,
  BarChart3,
  DollarSign,
  Calendar,
  FileText,
  Eye,
  MessageSquare,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronRight,
  Star,
  TrendingUp,
  Globe,
  Code,
  Layers,
  ExternalLink,
} from 'lucide-react';

// ═══════════════════════════════════════
// ECOSYSTEM APPS — The Cactus Species
// ═══════════════════════════════════════
const apps = [
  {
    id: 'ramona',
    name: 'RAMONA',
    emoji: '🌸',
    color: '#9A4E9A',
    attribute: 'Empatia',
    taglineEs: 'Tu mano derecha en el desierto digital.',
    taglineEn: 'Your right hand in the digital desert.',
    titleEs: 'Asistente Personal IA',
    titleEn: 'Personal AI Assistant',
    descriptionEs: 'Organiza tu agenda, gestiona comunicaciones, automatiza contenido para redes sociales y te libera de tareas repetitivas. Eficiencia con un toque humano.',
    descriptionEn: 'Organize your schedule, manage communications, automate social media content, and free yourself from repetitive tasks. Efficiency with a human touch.',
    link: '/landing/ramona',
    demoLink: '/apps/ramona/demo',
    featuresEs: ['Gestion de contenido', 'Automatizacion de redes', 'Calendario inteligente'],
    featuresEn: ['Content management', 'Social automation', 'Smart calendar'],
  },
  {
    id: 'tuna',
    name: 'TUNA',
    emoji: '🍇',
    color: '#C41E68',
    attribute: 'Verdad',
    taglineEs: 'Si no esta en TUNA, no existe.',
    taglineEn: 'If it\'s not in TUNA, it doesn\'t exist.',
    titleEs: 'El Cierre de Campana. Consolidado.',
    titleEn: 'Campaign Close. Consolidated.',
    descriptionEs: 'Consolida cada dato de tus campanas de marketing, genera reportes finales con precision inigualable. La verdad de tus resultados, en un solo clic.',
    descriptionEn: 'Consolidate every data point from your marketing campaigns, generate final reports with unmatched precision. The truth of your results, in one click.',
    link: '/landing/tuna',
    demoLink: '/apps/tuna/demo',
    featuresEs: ['Consolidacion de datos', 'Reportes automaticos', 'Analisis de ROI'],
    featuresEn: ['Data consolidation', 'Automated reports', 'ROI analysis'],
  },
  {
    id: 'agave',
    name: 'AGAVE',
    emoji: '💎',
    color: '#D4AF37',
    attribute: 'Rentabilidad',
    taglineEs: 'Pon los datos. Agave te dice el precio.',
    taglineEn: 'Give the data. Agave gives the price.',
    titleEs: 'Pricing & Margin Intelligence',
    titleEn: 'Pricing & Margin Intelligence',
    descriptionEs: 'IA financiera que optimiza tus margenes, identifica oportunidades de precios y maximiza tu rentabilidad. El cerebro financiero de tu negocio.',
    descriptionEn: 'Financial AI that optimizes your margins, identifies pricing opportunities, and maximizes profitability. The financial brain of your business.',
    link: '/landing/agave',
    demoLink: '/apps/agave/demo',
    featuresEs: ['Calculo de margenes', 'Recomendacion de precios', 'Analisis de rentabilidad'],
    featuresEn: ['Margin calculation', 'Price recommendations', 'Profitability analysis'],
  },
  {
    id: 'saguaro',
    name: 'SAGUARO',
    emoji: '🔷',
    color: '#00B4FF',
    attribute: 'Disciplina',
    taglineEs: 'Orden en el desierto. Ritmo en tu equipo.',
    taglineEn: 'Order in the desert. Rhythm in your team.',
    titleEs: 'Workflow & Task Orchestrator',
    titleEn: 'Workflow & Task Orchestrator',
    descriptionEs: 'Organiza tu flujo de trabajo, asigna tareas, monitorea el progreso y asegura que nada se pierda. La estructura que tu equipo necesita.',
    descriptionEn: 'Organize your workflow, assign tasks, monitor progress, and ensure nothing falls through the cracks. The structure your team needs.',
    link: '/landing/saguaro',
    demoLink: '/apps/saguaro/demo',
    featuresEs: ['Gestion de tareas', 'Flujos de trabajo', 'Seguimiento de equipo'],
    featuresEn: ['Task management', 'Workflows', 'Team tracking'],
  },
  {
    id: 'pita',
    name: 'PITA',
    emoji: '📄',
    color: '#4FAF8F',
    attribute: 'Impacto',
    taglineEs: 'Tu contenido en vitrina. Tu feedback bajo control.',
    taglineEn: 'Your content on display. Your feedback under control.',
    titleEs: 'Presentation & Feedback Vault',
    titleEn: 'Presentation & Feedback Vault',
    descriptionEs: 'Comparte presentaciones con link magico, recibe feedback por seccion en tiempo real con solo un nombre — sin login. Dashboard con todo organizado.',
    descriptionEn: 'Share presentations with a magic link, receive section-by-section feedback in real time with just a name — no login. Dashboard with everything organized.',
    link: '/landing/pita',
    demoLink: '/pita/own-your-impact',
    featuresEs: ['Link magico', 'Feedback por seccion', 'Dashboard de resultados'],
    featuresEn: ['Magic link', 'Section feedback', 'Results dashboard'],
  },
  {
    id: 'cereus',
    name: 'CEREUS',
    emoji: '🖤',
    color: '#B8943A',
    attribute: 'Emocion',
    taglineEs: 'La moda no se calcula. Se siente. Y despues se calcula.',
    taglineEn: 'Fashion is not calculated. It\'s felt. And then calculated.',
    titleEs: 'Atelier Algoritmico Emocional',
    titleEn: 'Emotional Algorithmic Atelier',
    descriptionEs: 'Sistema operativo de alta costura. Inteligencia emocional, costeo automatizado, tracking de produccion y armario digital en una sola plataforma.',
    descriptionEn: 'Haute couture operating system. Emotional intelligence, automated costing, production tracking and digital wardrobe in a single platform.',
    link: '/landing/cereus',
    demoLink: '/apps/cereus',
    featuresEs: ['Perfil emocional IA', 'Motor de costeo', 'Tracking de taller'],
    featuresEn: ['AI emotional profile', 'Costing engine', 'Workshop tracking'],
  },
];

// ═══════════════════════════════════════
// TEAM & VALUES
// ═══════════════════════════════════════
const values = [
  {
    icon: Shield,
    nameEs: 'Resiliencia Adaptativa',
    nameEn: 'Adaptive Resilience',
    descriptionEs: 'Crecemos donde otros se detienen. Soluciones que se adaptan y evolucionan.',
    descriptionEn: 'We grow where others stop. Solutions that adapt and evolve.',
  },
  {
    icon: Code,
    nameEs: 'IE como Motor',
    nameEn: 'EI as the Engine',
    descriptionEs: 'Programar es inteligencia emocional. Cada linea de codigo es un ejercicio de consciencia.',
    descriptionEn: 'Coding is emotional intelligence. Every line of code is an exercise in awareness.',
  },
  {
    icon: Zap,
    nameEs: 'Sostenibilidad Digital',
    nameEn: 'Digital Sustainability',
    descriptionEs: 'Soluciones eticas, duraderas y escalables para un crecimiento real.',
    descriptionEn: 'Ethical, lasting, and scalable solutions for real growth.',
  },
  {
    icon: Users,
    nameEs: 'Comunidad',
    nameEn: 'Community',
    descriptionEs: 'Colaboracion y co-creacion. Tu exito es nuestro exito.',
    descriptionEn: 'Collaboration and co-creation. Your success is our success.',
  },
  {
    icon: Heart,
    nameEs: 'Tecnologia con Alma',
    nameEn: 'Technology with Soul',
    descriptionEs: 'La mejor IA es la que florece con empatia y conexion humana.',
    descriptionEn: 'The best AI is the one that flourishes with empathy and human connection.',
  },
];

// ═══════════════════════════════════════
// SUCCESS STORIES
// ═══════════════════════════════════════
const successCases = [
  {
    company: 'Distribuidora Andina',
    industry: 'Comercio',
    result: '+15% margen',
    descriptionEs: 'Aumento de margenes en un 15% con AGAVE optimizando precios en tiempo real.',
    descriptionEn: 'Margin increase of 15% with AGAVE optimizing prices in real time.',
    app: 'AGAVE',
    color: '#D4AF37',
  },
  {
    company: 'Agencia Digital Lima',
    industry: 'Marketing',
    result: '-30% tiempo',
    descriptionEs: 'Reduccion del 30% del tiempo de equipo con RAMONA automatizando contenido.',
    descriptionEn: '30% reduction in team time with RAMONA automating content.',
    app: 'RAMONA',
    color: '#9A4E9A',
  },
  {
    company: 'Startup Tech',
    industry: 'Tecnologia',
    result: '+40% productividad',
    descriptionEs: 'Incremento del 40% en productividad del equipo con SAGUARO.',
    descriptionEn: '40% increase in team productivity with SAGUARO.',
    app: 'SAGUARO',
    color: '#00B4FF',
  },
];

// ═══════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════
const services = [
  {
    icon: Brain,
    titleEs: 'Publicidad con IA',
    titleEn: 'AI-Powered Advertising',
    descriptionEs: 'Campanas que entienden el sentimiento. Segmentacion predictiva, copys generativos y optimizacion en tiempo real.',
    descriptionEn: 'Campaigns that understand sentiment. Predictive targeting, generative copy, and real-time optimization.',
    color: '#9A4E9A',
  },
  {
    icon: Layers,
    titleEs: 'Desarrollo Sostenible',
    titleEn: 'Sustainable Development',
    descriptionEs: 'IA escalable, etica y mantenible. Aplicaciones web, APIs inteligentes y arquitectura moderna.',
    descriptionEn: 'Scalable, ethical, and maintainable AI. Web applications, smart APIs, and modern architecture.',
    color: '#00B4FF',
  },
  {
    icon: Globe,
    titleEs: 'Consultoria EQ + Tech',
    titleEn: 'EQ + Tech Consultancy',
    descriptionEs: 'Liderando equipos tecnologicos con empatia. Inteligencia emocional aplicada al desarrollo de productos.',
    descriptionEn: 'Leading tech teams with empathy. Emotional intelligence applied to product development.',
    color: '#4FAF8F',
  },
];

export default async function HomePage() {
  return (
    <div className="bg-background">

      {/* ═══════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cactus-green/5 via-transparent to-transparent" />

        {/* Decorative elements */}
        <div className="absolute top-16 left-8 w-72 h-72 bg-cactus-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-16 right-8 w-72 h-72 bg-[#9A4E9A]/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green/10 text-cactus-green rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Where AI Learns to Feel
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
            Cactus Comunidad<br />Creat<span className="text-cactus-green">IVA</span>
          </h1>

          <p className="text-xl md:text-2xl text-cactus-green font-medium mb-4">
            Inteligencia en Cada Espina. Comunidad en Cada Especie.
          </p>

          <p className="text-lg text-muted-foreground mb-4 max-w-3xl mx-auto">
            Soluciones digitales sostenibles. Publicidad, desarrollo e Inteligencia Emocional integrados en un solo ecosistema.
          </p>
          <p className="text-base text-muted-foreground/60 mb-10 max-w-2xl mx-auto italic">
            Sustainable digital solutions. Advertising, development, and Emotional Intelligence integrated into a single ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-cactus-green text-white rounded-xl font-medium hover:bg-cactus-green/90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-cactus-green/25"
            >
              Explorar Ecosistema
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#quienes-somos"
              className="px-8 py-4 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              Conocenos
            </a>
          </div>
        </div>

        {/* App Species Cards */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={app.link}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-xl transition-all hover:-translate-y-2 text-center"
                style={{ borderColor: `${app.color}30` }}
              >
                <Image src={`/${app.id}.png`} alt={app.name} width={56} height={56} className="mx-auto mb-3" />
                <p className="font-bold text-sm" style={{ color: app.color }}>{app.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{app.attribute}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PHILOSOPHY — CODE IS EI
          ═══════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#0E1B2C] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-6">Nuestra Filosofia / Our Philosophy</p>
          <h2 className="text-3xl sm:text-5xl font-display font-bold mb-8 leading-tight">
            &ldquo;Programar es<br /><span className="text-cactus-green">Inteligencia Emocional.</span>&rdquo;
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-4">
            Creemos que no hay practica mas inmersiva para desarrollar tu IE que codificar. Cada linea de codigo es un ejercicio de autorregulacion, paciencia y empatia.
          </p>
          <p className="text-base text-white/30 max-w-2xl mx-auto italic">
            We believe there is no practice more immersive for developing your EI than coding. Every line of code is an exercise in self-regulation, patience, and empathy.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          QUIENES SOMOS
          ═══════════════════════════════════════ */}
      <section id="quienes-somos" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Quienes Somos / Who We Are</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Somos la Resiliencia hecha Inteligencia
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-3">
              Cactus Comunidad CreatIVA es una agencia digital que crea soluciones sostenibles basadas en IA. Somos el punto de encuentro entre el desarrollo avanzado, la publicidad de impacto y la Inteligencia Emocional.
            </p>
            <p className="text-base text-muted-foreground/60 max-w-3xl mx-auto italic">
              Cactus is a digital agency creating AI-driven sustainable solutions. We are the meeting point for advanced development, high-impact advertising, and Emotional Intelligence.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-cactus-green/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-cactus-green" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mision / Mission</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Empoderar empresas mediante tecnologia que no solo procesa datos, sino que genera conexiones humanas reales.
              </p>
              <p className="text-muted-foreground/60 text-sm italic">
                To empower businesses through technology that generates real human connections.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-[#4FAF8F]/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-[#4FAF8F]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Vision / Vision</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Ser el estandar global de &ldquo;Tecnologia con Alma&rdquo;, demostrando que la mejor IA es la que florece con empatia.
              </p>
              <p className="text-muted-foreground/60 text-sm italic">
                To be the global standard for &ldquo;Technology with Soul&rdquo;.
              </p>
            </div>
          </div>

          {/* Values */}
          <h3 className="text-2xl font-semibold text-center mb-8">Valores Centrales / Core Values</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.nameEs}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:border-cactus-green/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-cactus-green/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-cactus-green" />
                  </div>
                  <h4 className="font-semibold mb-1 text-sm">{value.nameEs}</h4>
                  <p className="text-xs text-muted-foreground/60 italic mb-2">{value.nameEn}</p>
                  <p className="text-xs text-muted-foreground">{value.descriptionEs}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          THE CACTUS APP STORE
          ═══════════════════════════════════════ */}
      <section id="soluciones" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Nuestro Jardin Digital / Our Digital Garden</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              The Cactus App Store
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
              Todas nuestras soluciones en IA, centralizadas y listas para usar desde nuestro ecosistema.
            </p>
            <p className="text-base text-muted-foreground/60 max-w-3xl mx-auto italic">
              All our AI solutions — centralized and ready to use from our ecosystem.
            </p>
          </div>

          <div className="space-y-8">
            {apps.map((app, index) => (
              <div
                key={app.id}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
              >
                {/* Visual */}
                <div className="lg:w-1/3">
                  <div
                    className="relative w-48 h-48 mx-auto rounded-3xl flex items-center justify-center"
                    style={{ backgroundColor: `${app.color}12` }}
                  >
                    <Image src={`/${app.id}.png`} alt={app.name} width={96} height={96} />
                    <div
                      className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.attribute}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="lg:w-2/3 bg-card border border-border rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-display font-bold">{app.name}</h3>
                    <span className="text-sm text-muted-foreground">|</span>
                    <span className="text-sm" style={{ color: app.color }}>{app.titleEs}</span>
                  </div>

                  <p className="text-lg italic mb-2" style={{ color: app.color }}>
                    &ldquo;{app.taglineEs}&rdquo;
                  </p>
                  <p className="text-sm italic text-muted-foreground/50 mb-4">
                    &ldquo;{app.taglineEn}&rdquo;
                  </p>

                  <p className="text-muted-foreground mb-2 text-sm">{app.descriptionEs}</p>
                  <p className="text-muted-foreground/50 mb-6 text-xs italic">{app.descriptionEn}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {app.featuresEs.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: `${app.color}12`, color: app.color }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={app.link}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                      style={{ backgroundColor: app.color }}
                    >
                      Conocer mas
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={app.demoLink}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border transition-all hover:scale-105"
                      style={{ borderColor: app.color, color: app.color }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver Demo
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SERVICES
          ═══════════════════════════════════════ */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Servicios / Services</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              IA Power House
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tres pilares de servicio para transformar tu negocio.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.titleEs} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${service.color}12` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: service.color }} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{service.titleEs}</h3>
                  <p className="text-sm text-muted-foreground/50 italic mb-4">{service.titleEn}</p>
                  <p className="text-sm text-muted-foreground mb-2">{service.descriptionEs}</p>
                  <p className="text-xs text-muted-foreground/40 italic">{service.descriptionEn}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURED: PITA — OWN YOUR IMPACT
          ═══════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-[#4FAF8F] mb-4">Destacado / Featured</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              OWN YOUR <span className="text-[#4FAF8F]">IMPACT</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Nuestra primera presentacion PITA: una plataforma co-branded entre Six Seconds y B2Grow sobre liderazgo e inteligencia emocional.
            </p>
            <p className="text-base text-muted-foreground/50 max-w-2xl mx-auto italic">
              Our first PITA presentation: a co-branded platform between Six Seconds &amp; B2Grow on leadership and emotional intelligence.
            </p>
          </div>

          <div className="bg-[#0E1B2C] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            {/* Wave rings decoration */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 800 400" fill="none">
              <circle cx="400" cy="200" r="60" stroke="#4FAF8F" strokeWidth="0.5"/>
              <circle cx="400" cy="200" r="120" stroke="#4FAF8F" strokeWidth="0.5"/>
              <circle cx="400" cy="200" r="180" stroke="#2D6CDF" strokeWidth="0.5"/>
              <circle cx="400" cy="200" r="240" stroke="#E9EEF2" strokeWidth="0.3"/>
            </svg>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-6 text-xs text-white/30 tracking-widest uppercase">
                <span>Six Seconds</span>
                <span className="text-[#C7A54A]">x</span>
                <span>B2Grow</span>
              </div>

              <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                OWN YOUR <span className="text-[#4FAF8F]">IMPACT</span>
              </h3>
              <p className="text-lg font-light text-white/40 mb-2">Be. Grow. Lead.</p>
              <div className="w-12 h-[1px] bg-[#C7A54A] mx-auto mb-6"></div>
              <p className="text-sm text-white/30 mb-8 max-w-md mx-auto">
                23 slides · Bilingual ES/EN · EQ Week April 2026
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/pita/own-your-impact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#4FAF8F] text-[#0E1B2C] rounded-xl font-semibold hover:bg-[#4FAF8F]/90 transition-all"
                >
                  <Eye className="w-5 h-5" />
                  Ver Presentacion
                </Link>
                <Link
                  href="/landing/pita"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 rounded-xl text-white/70 hover:bg-white/5 transition-all"
                >
                  Conocer PITA
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SUCCESS CASES
          ═══════════════════════════════════════ */}
      <section id="casos-exito" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Impacto / Impact</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Historias que Florecen con IA
            </h2>
            <p className="text-lg text-muted-foreground">
              Nuestros clientes estan transformando sus negocios con el ecosistema Cactus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {successCases.map((caseStudy) => (
              <div
                key={caseStudy.company}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${caseStudy.color}15`, color: caseStudy.color }}
                >
                  {caseStudy.app}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{caseStudy.result}</span>
                </div>

                <p className="text-muted-foreground text-sm mb-1">{caseStudy.descriptionEs}</p>
                <p className="text-muted-foreground/50 text-xs italic mb-4">{caseStudy.descriptionEn}</p>

                <div className="pt-4 border-t border-border">
                  <p className="font-semibold">{caseStudy.company}</p>
                  <p className="text-sm text-muted-foreground">{caseStudy.industry}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cactus-green text-white rounded-xl font-medium hover:bg-cactus-green/90 transition-colors"
            >
              Unete a nuestros casos de exito
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BLOG PREVIEW
          ═══════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Insight IA</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              El Oasis del Conocimiento
            </h2>
            <p className="text-lg text-muted-foreground">
              Articulos sobre IA, tendencias y productividad.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: '5 formas en que SAGUARO esta cambiando la gestion de proyectos',
                category: 'Productividad',
                color: '#00B4FF',
              },
              {
                title: 'PITA: como revolucionar el feedback en presentaciones con IA',
                category: 'Innovacion',
                color: '#4FAF8F',
              },
              {
                title: 'Como AGAVE puede aumentar tus margenes en un 15%',
                category: 'Finanzas',
                color: '#D4AF37',
              },
            ].map((post) => (
              <div
                key={post.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
                  style={{ backgroundColor: `${post.color}15`, color: post.color }}
                >
                  {post.category}
                </span>
                <h3 className="font-semibold mb-2 group-hover:text-cactus-green transition-colors">
                  {post.title}
                </h3>
                <span className="text-sm text-cactus-green flex items-center gap-1">
                  Leer mas <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CONTACT
          ═══════════════════════════════════════ */}
      <section id="contacto" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-cactus-green mb-4">Conectemos / Connect</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Hagamos que tu negocio florezca.
            </h2>
            <p className="text-lg text-muted-foreground">
              Estamos listos para transformar tu negocio con inteligencia artificial.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">Envianos un mensaje</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mensaje</label>
                  <textarea
                    rows={4}
                    placeholder="Cuentanos sobre tu proyecto..."
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-cactus-green text-white rounded-xl font-medium hover:bg-cactus-green/90 transition-colors flex items-center justify-center gap-2"
                >
                  Enviar Mensaje
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-cactus-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className="text-muted-foreground">hola@cactuscomunidadcreativa.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-cactus-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Telefono</h4>
                    <p className="text-muted-foreground">+51 999 999 999</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-cactus-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ubicacion</h4>
                    <p className="text-muted-foreground">Lima, Peru</p>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className="bg-cactus-green/10 border border-cactus-green/20 rounded-2xl p-6 text-center">
                <p className="font-semibold mb-2">No solo construimos apps</p>
                <p className="text-sm text-muted-foreground mb-4">Cultivamos futuro.</p>
                <p className="text-xs text-muted-foreground/60 italic">We don&apos;t just build apps — we cultivate the future.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
