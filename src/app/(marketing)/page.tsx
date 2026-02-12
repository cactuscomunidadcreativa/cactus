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
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronRight,
  Star,
  TrendingUp,
} from 'lucide-react';

// Ecosystem apps configuration
const apps = [
  {
    id: 'ramona',
    name: 'RAMONA',
    emoji: '🌸',
    image: '/ramona.png',
    color: '#9A4E9A',
    colorSecondary: '#FF6B35',
    attribute: 'Empatia',
    tagline: 'Tu mano derecha en el desierto digital.',
    title: 'Tu Asistente Personal IA',
    description: 'Ramona es mas que un bot; es la IA que organiza tu agenda, gestiona tus comunicaciones y te libera de tareas repetitivas. Experimenta la eficiencia con un toque humano.',
    cta: 'Quiero conocer a Ramona',
    link: '/landing/ramona',
    features: ['Gestion de contenido', 'Automatizacion de redes', 'Calendario inteligente'],
  },
  {
    id: 'tuna',
    name: 'TUNA',
    emoji: '🍇',
    image: '/tuna.png',
    color: '#C41E68',
    attribute: 'Verdad',
    tagline: 'Si no esta en TUNA, no existe.',
    title: 'El Cierre de Campana. Consolidado.',
    description: 'Nuestra IA que consolida cada dato de tus campanas, generando reportes finales con una precision inigualable. La verdad de tus resultados, en un solo clic.',
    cta: 'Analiza mis Campanas con TUNA',
    link: '/landing/tuna',
    features: ['Consolidacion de datos', 'Reportes automaticos', 'Analisis de ROI'],
  },
  {
    id: 'agave',
    name: 'AGAVE',
    emoji: '💎',
    image: '/agave.png',
    color: '#D4AF37',
    colorSecondary: '#1E3A8A',
    attribute: 'Rentabilidad',
    tagline: 'Pon los datos. Agave te dice el precio.',
    title: 'Pricing & Margin Intelligence',
    description: 'Nuestra IA financiera que optimiza tus margenes, identifica oportunidades de precios y maximiza tu rentabilidad. El cerebro de tu negocio al servicio de tus ganancias.',
    cta: 'Optimiza mis Margenes con AGAVE',
    link: '/landing/agave',
    features: ['Calculo de margenes', 'Recomendacion de precios', 'Analisis de rentabilidad'],
  },
  {
    id: 'saguaro',
    name: 'SAGUARO',
    emoji: '🔷',
    image: '/saguaro.png',
    color: '#00B4FF',
    colorSecondary: '#06B6D4',
    attribute: 'Disciplina',
    tagline: 'Orden en el desierto. Ritmo en tu equipo.',
    title: 'Workflow & Task Orchestrator',
    description: 'Saguaro es la IA que organiza tu flujo de trabajo, asigna tareas, monitorea el progreso y asegura que nada se pierda. La estructura que tu equipo necesita para florecer.',
    cta: 'Organiza mi Equipo con SAGUARO',
    link: '/landing/saguaro',
    features: ['Gestion de tareas', 'Flujos de trabajo', 'Seguimiento de equipo'],
  },
];

// Brand values
const values = [
  {
    icon: Shield,
    name: 'Resiliencia',
    description: 'Adaptabilidad y fortaleza ante los desafios tecnologicos.',
  },
  {
    icon: Zap,
    name: 'Eficiencia',
    description: 'Optimizacion de recursos para maximos resultados.',
  },
  {
    icon: Sparkles,
    name: 'Creatividad',
    description: 'Innovacion constante en el desarrollo de soluciones.',
  },
  {
    icon: Users,
    name: 'Comunidad',
    description: 'Colaboracion y co-creacion con clientes y dentro del equipo.',
  },
  {
    icon: Heart,
    name: 'Integridad',
    description: 'Transparencia y etica en cada interaccion y desarrollo.',
  },
];

// Success cases
const successCases = [
  {
    company: 'Distribuidora Andina',
    industry: 'Comercio',
    result: '+15% margen',
    description: 'Aumento de margenes en un 15% con AGAVE optimizando precios en tiempo real.',
    app: 'AGAVE',
    color: '#D4AF37',
  },
  {
    company: 'Agencia Digital Lima',
    industry: 'Marketing',
    result: '-30% tiempo',
    description: 'Reduccion del 30% del tiempo de equipo con RAMONA automatizando contenido.',
    app: 'RAMONA',
    color: '#9A4E9A',
  },
  {
    company: 'Startup Tech',
    industry: 'Tecnologia',
    result: '+40% productividad',
    description: 'Incremento del 40% en productividad del equipo con SAGUARO.',
    app: 'SAGUARO',
    color: '#00B4FF',
  },
];

export default async function HomePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-cactus-green/5 to-transparent" />
        <div className="absolute top-20 left-10 text-8xl opacity-10 animate-pulse">🌵</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-10 animate-pulse delay-1000">🌸</div>
        <div className="absolute top-40 right-20 text-5xl opacity-10 animate-pulse delay-500">💎</div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green/10 text-cactus-green rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Inteligencia Artificial para tu negocio
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
            Cactus Comunidad Creat<span className="text-cactus-green">IVA</span>
          </h1>

          <p className="text-xl text-cactus-green font-medium mb-4">
            Inteligencia en Cada Espina. Comunidad en Cada Especie.
          </p>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            En un mundo que cambia a la velocidad del desierto, te ofrecemos soluciones de inteligencia artificial que no solo sobreviven, sino que prosperan. Somos un ecosistema de IA disenado para optimizar cada gota de tu potencial.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-cactus-green text-white rounded-lg font-medium hover:bg-cactus-green/90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-cactus-green/25"
            >
              Empieza a florecer con la IA
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#contacto"
              className="px-8 py-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Agenda una Asesoria Gratuita
            </a>
          </div>
        </div>

        {/* Apps preview floating */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="flex justify-center gap-4 flex-wrap">
            {apps.map((app, i) => (
              <Link
                key={app.id}
                href={app.link}
                className="group bg-card border border-border rounded-2xl p-4 hover:shadow-xl transition-all hover:-translate-y-2"
                style={{
                  borderColor: app.color,
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center mb-2">
                  <span className="text-3xl">{app.emoji}</span>
                </div>
                <p className="font-semibold text-sm">{app.name}</p>
                <p className="text-xs text-muted-foreground">{app.attribute}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quienes Somos Section */}
      <section id="quienes-somos" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Somos la Resiliencia hecha Inteligencia
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Cactus Comunidad CreatIVA nace de la conviccion de que la tecnologia mas avanzada no tiene por que ser la mas compleja. Fusionamos la robustez del codigo con la creatividad humana para construir soluciones que se adaptan a tus necesidades, creciendo contigo como el cactus en el desierto.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 mb-12">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-cactus-green" />
              Nuestra Filosofia
            </h3>
            <p className="text-muted-foreground">
              Entendemos tu negocio como un ecosistema unico. Nuestra IA se integra, aprende y evoluciona para resolver tus desafios mas apremiantes, optimizando recursos y potenciando tu crecimiento.
            </p>
          </div>

          <h3 className="text-2xl font-semibold text-center mb-8">Nuestros Valores</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.name}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:border-cactus-green/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-cactus-green/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-cactus-green" />
                  </div>
                  <h4 className="font-semibold mb-2">{value.name}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Soluciones Section */}
      <section id="soluciones" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              El Oasis de Tu Productividad
            </h2>
            <p className="text-xl text-cactus-green font-medium mb-4">
              Conoce a Nuestras Especies IA
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Cada desafio tiene su solucion. Hemos desarrollado un equipo de Inteligencias Artificiales especializadas, disenadas para trabajar en armonia y llevar tu negocio al siguiente nivel.
            </p>
          </div>

          <div className="space-y-8">
            {apps.map((app, index) => (
              <div
                key={app.id}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
              >
                {/* Image/Visual */}
                <div className="lg:w-1/3">
                  <div
                    className="relative w-48 h-48 mx-auto rounded-3xl flex items-center justify-center"
                    style={{ backgroundColor: `${app.color}15` }}
                  >
                    <span className="text-8xl">{app.emoji}</span>
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
                    <span className="text-sm" style={{ color: app.color }}>{app.title}</span>
                  </div>

                  <p className="text-lg italic mb-4" style={{ color: app.color }}>
                    "{app.tagline}"
                  </p>

                  <p className="text-muted-foreground mb-6">
                    {app.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {app.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: `${app.color}15`, color: app.color }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={app.link}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
                    style={{ backgroundColor: app.color }}
                  >
                    {app.cta}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de Exito Section */}
      <section id="casos-exito" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
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
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
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

                <p className="text-muted-foreground mb-4">
                  {caseStudy.description}
                </p>

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
              className="inline-flex items-center gap-2 px-6 py-3 bg-cactus-green text-white rounded-lg font-medium hover:bg-cactus-green/90 transition-colors"
            >
              Unete a nuestros casos de exito
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Insight IA: Nuestro Blog
            </h2>
            <p className="text-lg text-muted-foreground">
              El Oasis del Conocimiento - Articulos sobre IA, tendencias y productividad.
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
                title: 'La importancia de TUNA en el reporting de marketing digital',
                category: 'Marketing',
                color: '#C41E68',
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

      {/* Contact Section */}
      <section id="contacto" className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Conectemos. Hagamos que tu negocio florezca.
            </h2>
            <p className="text-lg text-muted-foreground">
              Estamos listos para ayudarte a transformar tu negocio con inteligencia artificial.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">Envíanos un mensaje</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefono</label>
                  <input
                    type="tel"
                    placeholder="+51 999 999 999"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mensaje</label>
                  <textarea
                    rows={4}
                    placeholder="Cuentanos sobre tu proyecto..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-cactus-green text-white rounded-lg font-medium hover:bg-cactus-green/90 transition-colors flex items-center justify-center gap-2"
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
                  <div className="w-12 h-12 rounded-full bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
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
                  <div className="w-12 h-12 rounded-full bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
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
                  <div className="w-12 h-12 rounded-full bg-cactus-green/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-cactus-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ubicacion</h4>
                    <p className="text-muted-foreground">Lima, Peru</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h4 className="font-semibold mb-4">Síguenos</h4>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-cactus-green hover:text-white transition-colors"
                  >
                    <span className="text-sm font-bold">in</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-cactus-green hover:text-white transition-colors"
                  >
                    <span className="text-sm font-bold">f</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-cactus-green hover:text-white transition-colors"
                  >
                    <span className="text-sm font-bold">ig</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
