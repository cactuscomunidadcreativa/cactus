import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Eye, BarChart3, Users } from 'lucide-react';

export default function PitaLandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0E1B2C] text-[#F5F7F9]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F3D36]/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="flex justify-center mb-8">
            <Image src="/pita.png" alt="PITA" width={80} height={80} className="opacity-90" />
          </div>
          <h1 className="font-editorial text-5xl md:text-7xl font-bold tracking-tight mb-4">
            PITA
          </h1>
          <p className="text-xl md:text-2xl text-[#4FAF8F] font-medium mb-4">
            Presentation & Feedback Vault
          </p>
          <p className="text-lg text-[#F5F7F9]/50 max-w-2xl mx-auto mb-12">
            Tu contenido en vitrina. Tu feedback bajo control.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/pita/own-your-impact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#4FAF8F] text-[#0E1B2C] rounded-xl font-semibold hover:bg-[#4FAF8F]/90 transition-all"
            >
              See it in action
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 rounded-xl text-[#F5F7F9]/70 hover:bg-white/5 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#0E1B2C] text-[#F5F7F9] py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-editorial text-3xl md:text-4xl font-bold text-center mb-16">
            The <span className="text-[#C7A54A]">Feedback Loop</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-[#4FAF8F]/20 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-[#4FAF8F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">La Siembra</h3>
              <p className="text-[#F5F7F9]/50 text-sm">
                Crea tu presentación y PITA genera un Link Mágico único para compartir.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-[#2D6CDF]/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#2D6CDF]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">El Acceso</h3>
              <p className="text-[#F5F7F9]/50 text-sm">
                Sin login. Solo un nombre. El cliente entra y PITA lo reconoce.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-[#C7A54A]/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#C7A54A]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">El Feedback</h3>
              <p className="text-[#F5F7F9]/50 text-sm">
                Reacciones rápidas y comentarios por sección. Todo en tiempo real.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-[#4FAF8F]/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-[#4FAF8F]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">La Recopilación</h3>
              <p className="text-[#F5F7F9]/50 text-sm">
                Dashboard con todos los comentarios organizados por sección y persona.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="bg-[#0E1B2C] text-[#F5F7F9] py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm text-[#4FAF8F] uppercase tracking-widest mb-4">PITA Philosophy</p>
          <p className="font-editorial text-3xl md:text-4xl font-bold mb-8 leading-relaxed">
            &ldquo;Pita lo guarda, el equipo lo mejora.&rdquo;
          </p>
          <p className="text-[#F5F7F9]/40 max-w-xl mx-auto">
            La Pita es un tipo de agave cuyas hojas anchas y fuertes se abren como un atril.
            Históricamente usada para fabricar fibras y papel, conecta directamente con el concepto
            de presentaciones y documentos.
          </p>
          <div className="mt-12">
            <Link
              href="/pita/own-your-impact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#4FAF8F] text-[#0E1B2C] rounded-xl font-semibold hover:bg-[#4FAF8F]/90 transition-all"
            >
              Experience PITA
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
