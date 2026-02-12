import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Eye, BarChart3, Users, ExternalLink } from 'lucide-react';

export default function PitaLandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white text-[#0E1B2C]">
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 600" fill="none">
          <circle cx="400" cy="300" r="80" stroke="#4FAF8F" strokeWidth="0.5"/>
          <circle cx="400" cy="300" r="140" stroke="#4FAF8F" strokeWidth="0.5"/>
          <circle cx="400" cy="300" r="200" stroke="#2D6CDF" strokeWidth="0.5"/>
          <circle cx="400" cy="300" r="260" stroke="#E9EEF2" strokeWidth="0.5"/>
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="flex justify-center mb-8">
            <Image src="/pita.png" alt="PITA" width={80} height={80} className="opacity-80" />
          </div>
          <h1 className="font-editorial text-5xl md:text-7xl font-bold tracking-tight mb-4">
            PITA
          </h1>
          <p className="text-xl md:text-2xl text-[#4FAF8F] font-medium mb-4">
            Presentation & Feedback Vault
          </p>
          <p className="text-lg text-[#0E1B2C]/40 max-w-2xl mx-auto mb-4">
            Tu contenido en vitrina. Tu feedback bajo control.
          </p>
          <p className="text-base text-[#0E1B2C]/25 max-w-2xl mx-auto mb-12 italic">
            Your content on display. Your feedback under control.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/pita/own-your-impact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#4FAF8F] text-white rounded-xl font-semibold hover:bg-[#4FAF8F]/90 transition-all"
            >
              <Eye className="w-5 h-5" />
              See it in action
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#E9EEF2] rounded-xl text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.03] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white text-[#0E1B2C] py-24 border-t border-[#E9EEF2]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-editorial text-3xl md:text-4xl font-bold text-center mb-16">
            The <span className="text-[#C7A54A]">Feedback Loop</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#4FAF8F]/[0.08] flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-[#4FAF8F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">La Siembra</h3>
              <p className="text-[#0E1B2C]/40 text-sm">
                Crea tu presentacion y PITA genera un Link Magico unico para compartir.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#2D6CDF]/[0.08] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#2D6CDF]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">El Acceso</h3>
              <p className="text-[#0E1B2C]/40 text-sm">
                Sin login. Solo un nombre. El cliente entra y PITA lo reconoce.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-[#E9EEF2] hover:border-[#C7A54A]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#C7A54A]/[0.08] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#C7A54A]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">El Feedback</h3>
              <p className="text-[#0E1B2C]/40 text-sm">
                Reacciones rapidas y comentarios por seccion. Todo en tiempo real.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#4FAF8F]/[0.08] flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-[#4FAF8F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">La Recopilacion</h3>
              <p className="text-[#0E1B2C]/40 text-sm">
                Dashboard con todos los comentarios organizados por seccion y persona.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Presentation */}
      <section className="bg-white text-[#0E1B2C] py-24 border-t border-[#E9EEF2]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-[#0E1B2C] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 800 400" fill="none">
              <circle cx="400" cy="200" r="60" stroke="#4FAF8F" strokeWidth="0.5"/>
              <circle cx="400" cy="200" r="120" stroke="#4FAF8F" strokeWidth="0.5"/>
              <circle cx="400" cy="200" r="180" stroke="#2D6CDF" strokeWidth="0.5"/>
            </svg>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4 text-xs text-white/30 tracking-widest uppercase">
                <span>Six Seconds</span>
                <span className="text-[#C7A54A]">x</span>
                <span>B2Grow</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-3">OWN YOUR <span className="text-[#4FAF8F]">IMPACT</span></h3>
              <p className="text-white/40 mb-6">Be. Grow. Lead. — 21 slides, bilingual ES/EN</p>
              <Link
                href="/pita/own-your-impact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#4FAF8F] text-[#0E1B2C] rounded-xl font-semibold hover:bg-[#4FAF8F]/90 transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                Experience it
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="bg-white text-[#0E1B2C] py-24 border-t border-[#E9EEF2]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-[#4FAF8F] uppercase tracking-widest mb-4">PITA Philosophy</p>
          <p className="font-editorial text-3xl md:text-4xl font-bold mb-8 leading-relaxed">
            &ldquo;Pita lo guarda, el equipo lo mejora.&rdquo;
          </p>
          <p className="text-[#0E1B2C]/30 max-w-xl mx-auto">
            La Pita es un tipo de agave cuyas hojas anchas y fuertes se abren como un atril.
            Historicamente usada para fabricar fibras y papel, conecta directamente con el concepto
            de presentaciones y documentos.
          </p>
        </div>
      </section>
    </>
  );
}
