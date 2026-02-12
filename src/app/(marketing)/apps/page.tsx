import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { APP_INFO } from '@/components/marketing';

const APPS = Object.values(APP_INFO).map(app => ({
  ...app,
  gradient: app.id === 'ramona' ? 'from-purple-500/20 to-pink-500/20' :
            app.id === 'tuna' ? 'from-cyan-500/20 to-blue-500/20' :
            app.id === 'agave' ? 'from-green-500/20 to-emerald-500/20' :
            'from-teal-500/20 to-green-500/20',
  features: app.id === 'ramona' ? ['Análisis de estilo', 'Paletas de color', 'Feedback constructivo', 'Composición'] :
            app.id === 'tuna' ? ['Gestión de tareas', 'Colaboración', 'Analytics', 'IA Asistente'] :
            app.id === 'agave' ? ['Cálculo de márgenes', 'Análisis de costos', 'Precios óptimos', 'Reportes'] :
            ['Check-ins', 'Planificación', 'Hábitos', 'Pomodoro'],
  description: app.id === 'ramona' ? 'Análisis de estilo artístico, sugerencias de composición, paletas de colores y feedback constructivo para tus obras.' :
               app.id === 'tuna' ? 'Organiza tareas, colabora en equipo y mantén el ritmo de tus proyectos con asistencia de IA.' :
               app.id === 'agave' ? 'Calcula márgenes, analiza costos y obtén recomendaciones de precios optimizados para tu negocio.' :
               'Equilibra tu semana con check-ins de bienestar, seguimiento de hábitos y herramientas de enfoque.',
}));

export default function AppsMarketplacePage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-cactus-green/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cactus-green/10 rounded-full text-sm text-cactus-green mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Ecosistema de Apps con IA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Nuestras Apps
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas de inteligencia artificial diseñadas para potenciar tu creatividad,
            optimizar tus procesos y conectarte con una comunidad que crece junta.
          </p>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {APPS.map((app) => (
              <div
                key={app.id}
                className={`relative rounded-2xl border overflow-hidden bg-gradient-to-br ${app.gradient} hover:shadow-lg transition-shadow`}
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{app.emoji}</span>
                      <div>
                        <h2 className="text-2xl font-display font-bold">{app.name}</h2>
                        <p className="text-sm text-muted-foreground">{app.tagline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">{app.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {app.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 text-xs rounded-full bg-background/80"
                        style={{ borderColor: app.color, borderWidth: 1 }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={app.demo}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: app.color }}
                    >
                      Probar Demo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={app.landing}
                      className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors"
                    >
                      Más Info
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cactus-green/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            ¿Listo para transformar tu trabajo?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Únete a nuestra comunidad y accede a todas nuestras herramientas de IA
            diseñadas para potenciar tu creatividad y productividad.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-cactus-green text-white rounded-lg font-medium hover:bg-cactus-green/90 transition-colors"
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              href="/#contacto"
              className="px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
