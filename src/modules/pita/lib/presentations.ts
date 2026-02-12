import { PresentationSection, BrandConfig } from '../types';

// OWN YOUR IMPACT — White Premium Edition
export const OWN_YOUR_IMPACT_BRAND: BrandConfig = {
  primaryColor: '#0E1B2C',
  secondaryColor: '#4FAF8F',
  accentColor: '#C7A54A',
  backgroundColor: '#FFFFFF',
  textColor: '#0E1B2C',
  fontFamily: 'Inter',
};

// ─── HELPER: Bilingual section builder ───
function bi(es: string, en: string) {
  return `<span class="lang-es">${es}</span><span class="lang-en hidden">${en}</span>`;
}

// Reusable wave rings SVG (impact wave motif)
const WAVE_RINGS = `<svg class="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="400" cy="300" r="80" stroke="#4FAF8F" stroke-width="0.5"/>
  <circle cx="400" cy="300" r="140" stroke="#4FAF8F" stroke-width="0.5"/>
  <circle cx="400" cy="300" r="200" stroke="#2D6CDF" stroke-width="0.5"/>
  <circle cx="400" cy="300" r="260" stroke="#E9EEF2" stroke-width="0.5"/>
  <circle cx="400" cy="300" r="320" stroke="#E9EEF2" stroke-width="0.3"/>
</svg>`;

export const OWN_YOUR_IMPACT_SECTIONS: Omit<PresentationSection, 'id' | 'presentation_id' | 'created_at'>[] = [

  // ═══════════════════════════════════════
  // SLIDE 1 — COVER
  // ═══════════════════════════════════════
  {
    order_index: 0,
    title: 'OWN YOUR IMPACT',
    subtitle: 'Cover',
    content: `<div class="flex flex-col items-center justify-center min-h-[75vh] text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10 space-y-6">
        <p class="text-xs font-medium tracking-[0.35em] uppercase text-[#0E1B2C]/40">Co-Branded Strategic Platform</p>
        <h1 class="text-6xl md:text-[7rem] font-black tracking-tight leading-[0.9] text-[#0E1B2C]">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></h1>
        <p class="text-xl md:text-2xl font-light tracking-wide text-[#0E1B2C]/50">Be. Grow. Lead.</p>
        <div class="w-16 h-[1px] bg-[#C7A54A] mx-auto"></div>
        <p class="text-sm md:text-base text-[#0E1B2C]/40 max-w-md mx-auto">${bi('Eleva tu EQ. Transforma tu liderazgo.', 'Elevate Your EQ. Transform Your Leadership.')}</p>
        <div class="flex items-center justify-center gap-3 mt-8 text-xs text-[#0E1B2C]/30 tracking-widest uppercase">
          <span>Six Seconds</span>
          <span class="text-[#C7A54A]">×</span>
          <span>B2Grow</span>
        </div>
      </div>
    </div>`,
    section_type: 'cover',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 2 — CONTEXT
  // ═══════════════════════════════════════
  {
    order_index: 1,
    title: bi('Contexto', 'Context'),
    subtitle: bi('El liderazgo está siendo redefinido', 'Leadership is being redefined'),
    content: `<div class="max-w-3xl mx-auto py-20 relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">Context</p>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#0E1B2C] mb-16 leading-tight">${bi('El liderazgo está<br/>siendo redefinido.', 'Leadership is being<br/>redefined.')}</h2>
        <div class="space-y-6 text-lg text-[#0E1B2C]/60 leading-relaxed">
          <div class="flex items-start gap-4">
            <div class="w-1.5 h-1.5 rounded-full bg-[#E9EEF2] mt-3 flex-shrink-0"></div>
            <p>${bi('La autoridad ya no es suficiente.', 'Authority is no longer enough.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-1.5 h-1.5 rounded-full bg-[#E9EEF2] mt-3 flex-shrink-0"></div>
            <p>${bi('La complejidad aumenta.', 'Complexity is increasing.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-1.5 h-1.5 rounded-full bg-[#E9EEF2] mt-3 flex-shrink-0"></div>
            <p>${bi('El desempeño depende de la capacidad emocional.', 'Performance depends on emotional capacity.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-1.5 h-1.5 rounded-full bg-[#E9EEF2] mt-3 flex-shrink-0"></div>
            <p>${bi('La cultura define los resultados.', 'Culture defines results.')}</p>
          </div>
        </div>
        <div class="mt-16 pt-8 border-t border-[#E9EEF2]">
          <p class="text-2xl md:text-3xl font-bold text-[#0E1B2C]">${bi('La Inteligencia Emocional es una<br/><span class="text-[#2D6CDF]">ventaja estratégica.</span>', 'Emotional Intelligence is a<br/><span class="text-[#2D6CDF]">strategic advantage.</span>')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 3 — B2GROW
  // ═══════════════════════════════════════
  {
    order_index: 2,
    title: 'B2Grow',
    subtitle: bi('Socio regional', 'Regional partner'),
    content: `<div class="max-w-3xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Socio Regional', 'Regional Partner')}</p>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#0E1B2C] mb-6">B2Grow</h2>
      <p class="text-lg text-[#0E1B2C]/50 mb-16 max-w-xl leading-relaxed">${bi(
        'Socio regional enfocado en liderazgo consciente, crecimiento organizacional y transformación cultural sostenible.',
        'Regional partner focused on conscious leadership, organizational growth and sustainable cultural transformation.'
      )}</p>
      <div class="grid grid-cols-2 gap-6">
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#4FAF8F]/[0.08] flex items-center justify-center text-[#4FAF8F] mb-4 text-lg">🌱</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Desarrollo humano profundo', 'Deep human development')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#2D6CDF]/[0.08] flex items-center justify-center text-[#2D6CDF] mb-4 text-lg">🏢</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Acceso corporativo', 'Corporate access')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#C7A54A]/[0.08] flex items-center justify-center text-[#C7A54A] mb-4 text-lg">⚡</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Implementación estratégica', 'Strategic implementation')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#4FAF8F]/[0.08] flex items-center justify-center text-[#4FAF8F] mb-4 text-lg">🤝</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Construcción de comunidad', 'Community building')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 4 — SIX SECONDS
  // ═══════════════════════════════════════
  {
    order_index: 3,
    title: 'Six Seconds',
    subtitle: bi('Red global de EQ', 'Global EQ network'),
    content: `<div class="max-w-3xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#2D6CDF] mb-6">${bi('Red Global', 'Global Network')}</p>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#0E1B2C] mb-6">Six Seconds</h2>
      <p class="text-lg text-[#0E1B2C]/50 mb-16 max-w-xl leading-relaxed">${bi(
        'Red global de inteligencia emocional con modelo validado, evaluaciones científicas y certificaciones internacionales en más de 150 países.',
        'Global emotional intelligence network with validated models, scientific assessments and international certifications across 150+ countries.'
      )}</p>
      <div class="grid grid-cols-2 gap-6">
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#2D6CDF]/[0.08] flex items-center justify-center text-[#2D6CDF] mb-4 text-lg">🔬</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Metodología', 'Methodology')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#4FAF8F]/[0.08] flex items-center justify-center text-[#4FAF8F] mb-4 text-lg">📊</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">Assessments (SEI)</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#C7A54A]/[0.08] flex items-center justify-center text-[#C7A54A] mb-4 text-lg">🎓</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Certificación', 'Certification')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-[#2D6CDF]/[0.08] flex items-center justify-center text-[#2D6CDF] mb-4 text-lg">🌐</div>
          <p class="font-semibold text-[#0E1B2C] mb-1">${bi('Estándar global', 'Global standard')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 5 — THE MODEL
  // ═══════════════════════════════════════
  {
    order_index: 4,
    title: bi('El Modelo', 'The Model'),
    subtitle: 'Know · Choose · Give',
    content: `<div class="max-w-4xl mx-auto py-20 text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-16">${bi('El Modelo Six Seconds', 'The Six Seconds Model')}</p>
        <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#4FAF8F]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#4FAF8F]">K</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#0E1B2C]">Know<br/>Yourself</h3>
            <p class="text-sm text-[#0E1B2C]/40 max-w-[180px] mx-auto">${bi('Reconoce tus patrones emocionales', 'Recognize your emotional patterns')}</p>
          </div>
          <div class="hidden md:block w-12 h-[1px] bg-[#E9EEF2]"></div>
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#2D6CDF]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#2D6CDF]">C</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#0E1B2C]">Choose<br/>Yourself</h3>
            <p class="text-sm text-[#0E1B2C]/40 max-w-[180px] mx-auto">${bi('Decide con intención y consciencia', 'Decide with intention and awareness')}</p>
          </div>
          <div class="hidden md:block w-12 h-[1px] bg-[#E9EEF2]"></div>
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#C7A54A]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#C7A54A]">G</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#0E1B2C]">Give<br/>Yourself</h3>
            <p class="text-sm text-[#0E1B2C]/40 max-w-[180px] mx-auto">${bi('Actúa con propósito y visión', 'Act with purpose and vision')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 6 — THE CONVERGENCE
  // ═══════════════════════════════════════
  {
    order_index: 5,
    title: bi('La Convergencia', 'The Convergence'),
    subtitle: '',
    content: `<div class="max-w-4xl mx-auto py-20 text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <div class="flex items-center justify-center gap-4 md:gap-8 mb-16">
          <div class="text-right">
            <p class="text-xs tracking-[0.3em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Metodología Global', 'Global Methodology')}</p>
            <p class="text-2xl md:text-3xl font-bold text-[#2D6CDF]">Six Seconds</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-[#C7A54A]/10 flex items-center justify-center text-[#C7A54A] text-xl font-bold">×</div>
          <div class="text-left">
            <p class="text-xs tracking-[0.3em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Aplicación Regional', 'Regional Application')}</p>
            <p class="text-2xl md:text-3xl font-bold text-[#4FAF8F]">B2Grow</p>
          </div>
        </div>
        <div class="w-16 h-[1px] bg-[#C7A54A] mx-auto mb-12"></div>
        <h2 class="text-4xl md:text-6xl font-black tracking-tight text-[#0E1B2C] mb-6">OWN YOUR <span class="text-[#4FAF8F]">IMPACT</span></h2>
        <p class="text-lg text-[#0E1B2C]/40 max-w-md mx-auto">${bi(
          'No es colaboración puntual.<br/>Es integración de plataforma.',
          'This is not a one-time collaboration.<br/>This is platform integration.'
        )}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 7 — THE PLATFORM
  // ═══════════════════════════════════════
  {
    order_index: 6,
    title: bi('La Plataforma', 'The Platform'),
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10 space-y-6">
        <p class="text-xs font-medium tracking-[0.35em] uppercase text-[#C7A54A]">${bi('La Plataforma', 'The Platform')}</p>
        <h2 class="text-5xl md:text-7xl font-black tracking-tight text-[#0E1B2C]">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></h2>
        <p class="text-xl font-light tracking-wide text-[#0E1B2C]/40">Be. Grow. Lead.</p>
        <div class="w-16 h-[1px] bg-[#C7A54A] mx-auto"></div>
        <p class="text-sm text-[#0E1B2C]/35">Elevate Your EQ. Transform Your Leadership.</p>
        <p class="text-xs text-[#0E1B2C]/25 mt-8 tracking-widest uppercase">${bi('Arquitectura escalable', 'Scalable architecture')}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 8 — PREMIUM ARCHITECTURE
  // ═══════════════════════════════════════
  {
    order_index: 7,
    title: bi('Arquitectura Premium', 'Premium Architecture'),
    subtitle: '',
    content: `<div class="max-w-4xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Arquitectura', 'Architecture')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('Tres Dimensiones<br/>de <span class="text-[#4FAF8F]">Impacto</span>', 'Three Dimensions<br/>of <span class="text-[#4FAF8F]">Impact</span>')}</h2>
      <div class="space-y-6">
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-colors group">
          <div class="text-3xl font-black text-[#4FAF8F]/20 group-hover:text-[#4FAF8F]/40 transition-colors">01</div>
          <div>
            <h3 class="text-lg font-bold text-[#0E1B2C] uppercase tracking-wide mb-1">The Leadership Formation Series</h3>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Formación profunda + certificación. Impacto en mí.', 'Deep formation + certification. Impact on me.')}</p>
          </div>
        </div>
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-colors group">
          <div class="text-3xl font-black text-[#2D6CDF]/20 group-hover:text-[#2D6CDF]/40 transition-colors">02</div>
          <div>
            <h3 class="text-lg font-bold text-[#0E1B2C] uppercase tracking-wide mb-1">The Organizational Impact Practice</h3>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Consultoría estratégica + implementación. Impacto en la organización.', 'Strategic consulting + implementation. Impact on the organization.')}</p>
          </div>
        </div>
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#E9EEF2] hover:border-[#C7A54A]/30 transition-colors group">
          <div class="text-3xl font-black text-[#C7A54A]/20 group-hover:text-[#C7A54A]/40 transition-colors">03</div>
          <div>
            <h3 class="text-lg font-bold text-[#0E1B2C] uppercase tracking-wide mb-1">The Social Impact Collective</h3>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Expansión cultural y comunitaria. Impacto en la sociedad.', 'Cultural and community expansion. Impact on society.')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'architecture',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 9 — WHO IS THIS FOR
  // ═══════════════════════════════════════
  {
    order_index: 8,
    title: bi('¿Para quién es?', 'Who Is This For?'),
    subtitle: '',
    content: `<div class="max-w-3xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">${bi('Perfil', 'Profile')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('¿Para quién<br/>es <span class="text-[#4FAF8F]">esto</span>?', 'Who is this<br/><span class="text-[#4FAF8F]">for</span>?')}</h2>
      <div class="space-y-5">
        <div class="flex items-center gap-5 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-12 h-12 rounded-full bg-[#4FAF8F]/[0.08] flex items-center justify-center text-lg flex-shrink-0">👔</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('C-Level y Directores', 'C-Level & Directors')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Líderes que transforman cultura desde arriba', 'Leaders who transform culture from the top')}</p>
          </div>
        </div>
        <div class="flex items-center gap-5 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-12 h-12 rounded-full bg-[#2D6CDF]/[0.08] flex items-center justify-center text-lg flex-shrink-0">🎯</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">HR Business Partners</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Arquitectos del talento y la experiencia del empleado', 'Architects of talent and employee experience')}</p>
          </div>
        </div>
        <div class="flex items-center gap-5 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-12 h-12 rounded-full bg-[#C7A54A]/[0.08] flex items-center justify-center text-lg flex-shrink-0">🧭</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('Coaches y Consultores', 'Coaches & Consultants')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Profesionales que quieren certificación + herramientas', 'Professionals seeking certification + tools')}</p>
          </div>
        </div>
        <div class="flex items-center gap-5 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-12 h-12 rounded-full bg-[#4FAF8F]/[0.08] flex items-center justify-center text-lg flex-shrink-0">🚀</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('Líderes emergentes', 'Emerging Leaders')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Alto potencial que busca diferenciarse', 'High-potentials seeking differentiation')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 10 — EQ WEEK APRIL 2026
  // ═══════════════════════════════════════
  {
    order_index: 9,
    title: 'EQ Week',
    subtitle: 'April 2026',
    content: `<div class="max-w-4xl mx-auto py-20 text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#2D6CDF] mb-6">${bi('Experiencia Central', 'Core Experience')}</p>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#0E1B2C] mb-4">EQ Week</h2>
        <p class="text-xl text-[#C7A54A] font-medium mb-16">${bi('Abril 2026', 'April 2026')}</p>
        <div class="flex flex-col md:flex-row gap-8 items-stretch justify-center">
          <div class="flex-1 max-w-sm p-8 rounded-2xl border border-[#4FAF8F]/20 bg-[#4FAF8F]/[0.03]">
            <div class="text-5xl font-black text-[#4FAF8F] mb-3">3</div>
            <p class="text-lg font-semibold text-[#0E1B2C] mb-1">${bi('Días', 'Days')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Transformación personal', 'Inner work')}</p>
          </div>
          <div class="flex items-center justify-center">
            <div class="w-8 h-[1px] md:w-[1px] md:h-8 bg-[#C7A54A]/40"></div>
          </div>
          <div class="flex-1 max-w-sm p-8 rounded-2xl border border-[#C7A54A]/20 bg-[#C7A54A]/[0.03]">
            <div class="text-5xl font-black text-[#C7A54A] mb-3">2</div>
            <p class="text-lg font-semibold text-[#0E1B2C] mb-1">${bi('Días', 'Days')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Metodología aplicada', 'Applied methodology')}</p>
          </div>
        </div>
        <div class="mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#E9EEF2]">
          <p class="text-sm font-semibold text-[#0E1B2C]">${bi('Certificado. Aplicado. Transformador.', 'Certified. Applied. Transformational.')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 11 — EQ WEEK LOGISTICS
  // ═══════════════════════════════════════
  {
    order_index: 10,
    title: bi('Logística EQ Week', 'EQ Week Logistics'),
    subtitle: '',
    content: `<div class="max-w-3xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Detalles', 'Details')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">EQ Week — <span class="text-[#C7A54A]">${bi('Abril 2026', 'April 2026')}</span></h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 rounded-xl border border-[#E9EEF2]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Formato', 'Format')}</p>
          <p class="text-lg font-semibold text-[#0E1B2C]">${bi('Presencial e intensivo', 'In-person & intensive')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Grupo', 'Group')}</p>
          <p class="text-lg font-semibold text-[#0E1B2C]">${bi('Máximo 25 personas', 'Maximum 25 people')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Sede', 'Venue')}</p>
          <p class="text-lg font-semibold text-[#0E1B2C]">${bi('Por confirmar', 'To be confirmed')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#E9EEF2]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-2">${bi('Inversión', 'Investment')}</p>
          <p class="text-lg font-semibold text-[#0E1B2C]">${bi('Por definir según paquete', 'Based on selected package')}</p>
        </div>
      </div>
      <div class="mt-8 p-5 rounded-xl bg-[#4FAF8F]/[0.04] border border-[#4FAF8F]/15 text-center">
        <p class="text-sm text-[#0E1B2C]/50">${bi('Edición limitada · Por invitación', 'Limited edition · By invitation')}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDES 12-17 — MANIFESTO
  // ═══════════════════════════════════════
  {
    order_index: 11,
    title: 'Manifesto I',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-2xl md:text-4xl font-light leading-relaxed text-[#0E1B2C]/80">${bi(
        'El liderazgo ya no se trata de autoridad.<br/><br/>Se trata de <strong class="text-[#4FAF8F] font-bold">impacto</strong>.',
        'Leadership is no longer about authority.<br/><br/>It\'s about <strong class="text-[#4FAF8F] font-bold">impact</strong>.'
      )}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 12,
    title: 'Manifesto II',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-3xl font-light leading-relaxed text-[#0E1B2C]/60">${bi(
        'Impacto en las conversaciones que eliges tener.<br/>Impacto en las decisiones que tomas bajo presión.<br/>Impacto en la cultura que construyes todos los días.',
        'Impact on the conversations you choose to have.<br/>Impact on the decisions you make under pressure.<br/>Impact on the culture you build every day.'
      )}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 13,
    title: 'Manifesto III',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <p class="text-2xl md:text-4xl font-light leading-relaxed text-[#0E1B2C]/70">${bi(
          'Pero el impacto real<br/>no comienza afuera.<br/><br/><strong class="text-[#C7A54A] font-bold">Comienza dentro.</strong>',
          'But real impact<br/>doesn\'t start outside.<br/><br/><strong class="text-[#C7A54A] font-bold">It starts within.</strong>'
        )}</p>
      </div>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 14,
    title: 'Manifesto IV',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-3xl font-light leading-relaxed text-[#0E1B2C]/70">${bi(
        'La inteligencia emocional no es una habilidad blanda.<br/><br/>Es la base del<br/><strong class="text-[#2D6CDF] font-bold">liderazgo sostenible</strong>.',
        'Emotional intelligence is not a soft skill.<br/><br/>It is the foundation of<br/><strong class="text-[#2D6CDF] font-bold">sustainable leadership</strong>.'
      )}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 15,
    title: 'Manifesto V',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-2xl font-light leading-relaxed text-[#0E1B2C]/50 mb-8">${bi(
        'No basta con inspirar.<br/>No basta con certificar.<br/>No basta con saber.',
        'Inspiration is not enough.<br/>Certification is not enough.<br/>Knowledge is not enough.'
      )}</p>
      <div class="w-12 h-[1px] bg-[#C7A54A] mx-auto mb-8"></div>
      <p class="text-3xl md:text-5xl font-bold text-[#4FAF8F]">${bi('Se trata de integrar.', 'It\'s about integration.')}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 16,
    title: 'Manifesto VI',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-3xl font-light leading-relaxed text-[#0E1B2C]/60">${bi(
        'Transformarte primero.<br/>Dominar la metodología después.<br/>Multiplicar el impacto <strong class="text-[#C7A54A] font-bold">siempre</strong>.',
        'Transform yourself first.<br/>Master the methodology second.<br/>Multiply the impact <strong class="text-[#C7A54A] font-bold">always</strong>.'
      )}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 18 — BE. GROW. LEAD.
  // ═══════════════════════════════════════
  {
    order_index: 17,
    title: 'Be. Grow. Lead.',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-3xl mx-auto space-y-12">
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#4FAF8F] mb-3">Be.</h3>
        <p class="text-base text-[#0E1B2C]/40">${bi('Porque el liderazgo empieza en quién eres.', 'Because leadership starts with who you are.')}</p>
      </div>
      <div class="w-16 h-[1px] bg-[#E9EEF2]"></div>
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#2D6CDF] mb-3">Grow.</h3>
        <p class="text-base text-[#0E1B2C]/40">${bi('Porque el crecimiento es una elección consciente.', 'Because growth is a conscious choice.')}</p>
      </div>
      <div class="w-16 h-[1px] bg-[#E9EEF2]"></div>
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#C7A54A] mb-3">Lead.</h3>
        <p class="text-base text-[#0E1B2C]/40">${bi('Porque el mundo necesita líderes emocionalmente inteligentes.', 'Because the world needs emotionally intelligent leaders.')}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 19 — EVENT VISUAL / SOCIAL POSTS
  // ═══════════════════════════════════════
  {
    order_index: 18,
    title: bi('Visual del Evento', 'Event Visual'),
    subtitle: '',
    content: `<div class="max-w-5xl mx-auto py-16">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Sistema Visual', 'Visual System')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('Comunicación del <span class="text-[#4FAF8F]">Evento</span>', '<span class="text-[#4FAF8F]">Event</span> Communication')}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden hover:border-[#4FAF8F]/30 transition-all">
          <svg class="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="40" stroke="#4FAF8F" stroke-width="0.5"/><circle cx="100" cy="100" r="60" stroke="#4FAF8F" stroke-width="0.3"/><circle cx="100" cy="100" r="80" stroke="#E9EEF2" stroke-width="0.3"/></svg>
          <div class="relative z-10">
            <p class="text-[10px] tracking-[0.2em] uppercase text-[#0E1B2C]/25 mb-3">Six Seconds × B2Grow</p>
            <p class="text-lg font-black text-[#0E1B2C] leading-tight">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></p>
          </div>
        </div>
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-6 flex flex-col items-center justify-center text-center hover:border-[#4FAF8F]/30 transition-all">
          <p class="text-4xl font-black text-[#4FAF8F]">Be.</p>
          <div class="w-8 h-[1px] bg-[#E9EEF2] my-3"></div>
          <p class="text-[10px] text-[#0E1B2C]/30 tracking-widest uppercase">Own Your Impact</p>
        </div>
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-6 flex flex-col items-center justify-center text-center hover:border-[#2D6CDF]/30 transition-all">
          <p class="text-4xl font-black text-[#2D6CDF]">Grow.</p>
          <div class="w-8 h-[1px] bg-[#E9EEF2] my-3"></div>
          <p class="text-[10px] text-[#0E1B2C]/30 tracking-widest uppercase">Own Your Impact</p>
        </div>
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-6 flex flex-col items-center justify-center text-center hover:border-[#C7A54A]/30 transition-all">
          <p class="text-4xl font-black text-[#C7A54A]">Lead.</p>
          <div class="w-8 h-[1px] bg-[#E9EEF2] my-3"></div>
          <p class="text-[10px] text-[#0E1B2C]/30 tracking-widest uppercase">Own Your Impact</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-5 flex flex-col items-center justify-center text-center col-span-2 hover:border-[#C7A54A]/30 transition-all">
          <p class="text-xs tracking-[0.2em] uppercase text-[#C7A54A] mb-4">EQ Week · ${bi('Abril', 'April')} 2026</p>
          <p class="text-xl md:text-2xl font-bold text-[#0E1B2C] leading-tight">Elevate Your EQ.<br/><span class="text-[#0E1B2C]/40">Transform Your Leadership.</span></p>
          <div class="flex items-center gap-3 mt-4 text-[10px] text-[#0E1B2C]/25 tracking-widest uppercase">
            <span>Six Seconds</span><span class="text-[#C7A54A]">×</span><span>B2Grow</span>
          </div>
        </div>
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-5 flex flex-col items-center justify-center text-center hover:border-[#4FAF8F]/30 transition-all">
          <div class="space-y-2">
            <p class="text-sm font-bold text-[#4FAF8F]">Know</p>
            <p class="text-sm font-bold text-[#2D6CDF]">Choose</p>
            <p class="text-sm font-bold text-[#C7A54A]">Give</p>
          </div>
          <div class="w-8 h-[1px] bg-[#E9EEF2] my-3"></div>
          <p class="text-[10px] text-[#0E1B2C]/30 tracking-widest uppercase">The Model</p>
        </div>
        <div class="aspect-square rounded-2xl border border-[#E9EEF2] p-5 flex flex-col items-center justify-center text-center hover:border-[#2D6CDF]/30 transition-all">
          <p class="text-xs italic text-[#0E1B2C]/50 leading-relaxed px-2">${bi('"La inteligencia emocional no es una habilidad blanda."', '"Emotional intelligence is not a soft skill."')}</p>
          <div class="w-8 h-[1px] bg-[#E9EEF2] my-3"></div>
          <p class="text-[10px] text-[#0E1B2C]/30 tracking-widest uppercase">Manifesto</p>
        </div>
      </div>
      <p class="text-center text-xs text-[#0E1B2C]/20 tracking-widest uppercase mt-8">${bi('Estética coherente · Ondas de impacto · Fondo blanco', 'Coherent aesthetic · Impact waves · White background')}</p>
    </div>`,
    section_type: 'visual',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 20 — NEXT STEPS
  // ═══════════════════════════════════════
  {
    order_index: 19,
    title: bi('Próximos Pasos', 'Next Steps'),
    subtitle: '',
    content: `<div class="max-w-3xl mx-auto py-20 text-center">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">${bi('Siguiente', 'Next')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('Próximos <span class="text-[#4FAF8F]">Pasos</span>', 'Next <span class="text-[#4FAF8F]">Steps</span>')}</h2>
      <div class="space-y-6 text-left max-w-md mx-auto">
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-8 h-8 rounded-full bg-[#4FAF8F]/10 flex items-center justify-center text-sm font-bold text-[#4FAF8F] flex-shrink-0">1</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('Conversación exploratoria', 'Exploratory conversation')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Agenda una sesión para conocer tu contexto', 'Schedule a session to understand your context')}</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-8 h-8 rounded-full bg-[#2D6CDF]/10 flex items-center justify-center text-sm font-bold text-[#2D6CDF] flex-shrink-0">2</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('Selección de paquete', 'Package selection')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Formation, Practice, o Collective — según tus metas', 'Formation, Practice, or Collective — based on your goals')}</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#E9EEF2]">
          <div class="w-8 h-8 rounded-full bg-[#C7A54A]/10 flex items-center justify-center text-sm font-bold text-[#C7A54A] flex-shrink-0">3</div>
          <div>
            <p class="font-semibold text-[#0E1B2C]">${bi('Reserva tu lugar', 'Reserve your spot')}</p>
            <p class="text-sm text-[#0E1B2C]/40">${bi('Edición limitada — máximo 25 participantes', 'Limited edition — maximum 25 participants')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 21 — CLOSING
  // ═══════════════════════════════════════
  {
    order_index: 20,
    title: 'OWN YOUR IMPACT',
    subtitle: 'Closing',
    content: `<div class="flex flex-col items-center justify-center min-h-[75vh] text-center relative">
      ${WAVE_RINGS}
      <div class="relative z-10 space-y-8">
        <h2 class="text-5xl md:text-[6rem] font-black tracking-tight leading-[0.9] text-[#0E1B2C]">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></h2>
        <div class="w-16 h-[1px] bg-[#C7A54A] mx-auto"></div>
        <p class="text-lg font-light tracking-wide text-[#0E1B2C]/40">Be. Grow. Lead.</p>
        <div class="flex items-center justify-center gap-4 text-sm text-[#0E1B2C]/30">
          <span class="text-[#4FAF8F]">Formation</span>
          <span class="text-[#E9EEF2]">·</span>
          <span class="text-[#2D6CDF]">Practice</span>
          <span class="text-[#E9EEF2]">·</span>
          <span class="text-[#C7A54A]">Collective</span>
        </div>
        <p class="text-base font-medium text-[#C7A54A] mt-4">EQ Week · ${bi('Abril', 'April')} 2026</p>
        <div class="flex items-center justify-center gap-3 mt-8 text-xs text-[#0E1B2C]/20 tracking-widest uppercase">
          <span>Six Seconds</span>
          <span class="text-[#C7A54A]">×</span>
          <span>B2Grow</span>
        </div>
      </div>
    </div>`,
    section_type: 'closing',
    metadata: {},
  },
];
