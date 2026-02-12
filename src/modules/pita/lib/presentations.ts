import { PresentationSection, BrandConfig } from '../types';

// ═══════════════════════════════════════════════════════
// INCLUSION BY DESIGN — Diversa Peru × Six Seconds
// ═══════════════════════════════════════════════════════

export const INCLUSION_BY_DESIGN_BRAND: BrandConfig = {
  primaryColor: '#1E2A38',
  secondaryColor: '#4FAF8F',
  accentColor: '#A38DFF',
  backgroundColor: '#FFFFFF',
  textColor: '#1E2A38',
  fontFamily: 'Inter',
};

// Geometric circular connections motif (NOT waves — elegant interlocking circles)
const GEOMETRIC_CIRCLES = `<svg class="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="300" cy="250" r="120" stroke="#4FAF8F" stroke-width="0.5"/>
  <circle cx="400" cy="300" r="100" stroke="#A38DFF" stroke-width="0.5"/>
  <circle cx="500" cy="250" r="120" stroke="#4FAF8F" stroke-width="0.5"/>
  <circle cx="350" cy="350" r="80" stroke="#FF6B6B" stroke-width="0.4"/>
  <circle cx="450" cy="350" r="80" stroke="#A38DFF" stroke-width="0.4"/>
  <circle cx="400" cy="200" r="60" stroke="#4FAF8F" stroke-width="0.3"/>
</svg>`;

// Small geometric accent for inline use
const GEO_ACCENT = `<svg class="w-16 h-16 mx-auto opacity-20" viewBox="0 0 100 100" fill="none">
  <circle cx="40" cy="45" r="25" stroke="#4FAF8F" stroke-width="0.8"/>
  <circle cx="60" cy="45" r="25" stroke="#A38DFF" stroke-width="0.8"/>
  <circle cx="50" cy="60" r="20" stroke="#FF6B6B" stroke-width="0.6"/>
</svg>`;

export const INCLUSION_BY_DESIGN_SECTIONS: Omit<PresentationSection, 'id' | 'presentation_id' | 'created_at'>[] = [

  // ═══════════════════════════════════════
  // SLIDE 1 — COVER
  // ═══════════════════════════════════════
  {
    order_index: 0,
    title: 'INCLUSION BY DESIGN',
    subtitle: 'Cover',
    content: `<div class="flex flex-col items-center justify-center min-h-[75vh] text-center relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10 space-y-6">
        <p class="text-xs font-medium tracking-[0.35em] uppercase text-[#1E2A38]/40">Official Six Seconds Certification Pathway</p>
        <h1 class="text-5xl md:text-[6.5rem] font-black tracking-tight leading-[0.9] text-[#1E2A38]">INCLUSION<br/>BY <span class="text-[#4FAF8F]">DESIGN</span></h1>
        <p class="text-xl md:text-2xl font-light tracking-wide text-[#1E2A38]/50">Know. Choose. Give.</p>
        <div class="w-16 h-[1px] bg-[#A38DFF] mx-auto"></div>
        <p class="text-sm md:text-base text-[#1E2A38]/40 max-w-md mx-auto">${bi('Formando líderes emocionalmente inteligentes que diseñan organizaciones inclusivas.', 'Developing emotionally intelligent leaders who design inclusive organizations.')}</p>
        <div class="flex items-center justify-center gap-3 mt-8 text-xs text-[#1E2A38]/30 tracking-widest uppercase">
          <span>Six Seconds</span>
          <span class="text-[#A38DFF]">×</span>
          <span>Diversa Peru</span>
        </div>
      </div>
    </div>`,
    section_type: 'cover',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 2 — PERU CONTEXT
  // ═══════════════════════════════════════
  {
    order_index: 1,
    title: bi('Contexto Peru', 'Peru Context'),
    subtitle: bi('Un mercado que necesita estructura', 'A market that needs structure'),
    content: `<div class="max-w-3xl mx-auto py-20 relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">${bi('Contexto', 'Context')}</p>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-16 leading-tight">${bi('El mercado peruano<br/>necesita <span class="text-[#4FAF8F]">estructura</span>.', 'The Peruvian market<br/>needs <span class="text-[#4FAF8F]">structure</span>.')}</h2>
        <div class="space-y-6 text-lg text-[#1E2A38]/60 leading-relaxed">
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#4FAF8F] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Creciente demanda corporativa por desarrollo de liderazgo basado en evidencia.', 'Growing corporate demand for evidence-based leadership development.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#A38DFF] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Escasa oferta de certificaciones internacionales con aplicación local.', 'Scarce international certifications with local application.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#FF6B6B] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Oportunidad para posicionar la inteligencia emocional como ventaja estratégica.', 'Opportunity to position emotional intelligence as a strategic advantage.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#4FAF8F] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Necesidad de profesionales certificados que lideren inclusión organizacional.', 'Need for certified professionals who lead organizational inclusion.')}</p>
          </div>
        </div>
        <div class="mt-16 pt-8 border-t border-[#F2F4F7]">
          <p class="text-2xl md:text-3xl font-bold text-[#1E2A38]">${bi('Diversa Peru lleva Six Seconds al mercado con<br/><span class="text-[#A38DFF]">rigor, diseño y propósito.</span>', 'Diversa Peru brings Six Seconds to market with<br/><span class="text-[#A38DFF]">rigor, design, and purpose.</span>')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 3 — WHY EQ (Know · Choose · Give)
  // ═══════════════════════════════════════
  {
    order_index: 2,
    title: bi('Por qué EQ', 'Why EQ'),
    subtitle: 'Know · Choose · Give',
    content: `<div class="max-w-4xl mx-auto py-20 text-center relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#A38DFF] mb-6">${bi('El Modelo Six Seconds', 'The Six Seconds Model')}</p>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#1E2A38] mb-4">${bi('¿Por qué Inteligencia Emocional?', 'Why Emotional Intelligence?')}</h2>
        <p class="text-lg text-[#1E2A38]/40 mb-16 max-w-xl mx-auto">${bi('Un modelo validado globalmente con tres competencias clave.', 'A globally validated model with three core competencies.')}</p>
        <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#4FAF8F]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#4FAF8F]">K</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#1E2A38]">Know<br/>Yourself</h3>
            <p class="text-sm text-[#1E2A38]/40 max-w-[180px] mx-auto">${bi('Reconoce tus patrones emocionales y cómo impactan a otros.', 'Recognize your emotional patterns and how they impact others.')}</p>
          </div>
          <div class="hidden md:block w-12 h-[1px] bg-[#F2F4F7]"></div>
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#A38DFF]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#A38DFF]">C</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#1E2A38]">Choose<br/>Yourself</h3>
            <p class="text-sm text-[#1E2A38]/40 max-w-[180px] mx-auto">${bi('Decide con intención, no con impulso. Lidera tu respuesta.', 'Decide with intention, not impulse. Lead your response.')}</p>
          </div>
          <div class="hidden md:block w-12 h-[1px] bg-[#F2F4F7]"></div>
          <div class="space-y-3">
            <div class="w-24 h-24 rounded-full border-2 border-[#FF6B6B]/30 flex items-center justify-center mx-auto">
              <span class="text-3xl font-bold text-[#FF6B6B]">G</span>
            </div>
            <h3 class="text-xl font-bold tracking-wide uppercase text-[#1E2A38]">Give<br/>Yourself</h3>
            <p class="text-sm text-[#1E2A38]/40 max-w-[180px] mx-auto">${bi('Actúa con propósito. Conecta con tu visión y la de tu equipo.', 'Act with purpose. Connect with your vision and your team\'s.')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 4 — CERTIFICATION PATHWAY
  // ═══════════════════════════════════════
  {
    order_index: 3,
    title: bi('Ruta de Certificación', 'Certification Pathway'),
    subtitle: 'EQPC → EQPM → Practitioner',
    content: `<div class="max-w-4xl mx-auto py-20">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">${bi('Ruta Oficial', 'Official Pathway')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#1E2A38] mb-4">${bi('Certificación<br/><span class="text-[#4FAF8F]">Six Seconds</span> en Peru', 'Six Seconds<br/><span class="text-[#4FAF8F]">Certification</span> in Peru')}</h2>
      <p class="text-lg text-[#1E2A38]/40 mb-16 max-w-xl">${bi('Tres niveles progresivos. Una ruta integrada.', 'Three progressive levels. One integrated pathway.')}</p>
      <div class="space-y-6">
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#F2F4F7] hover:border-[#4FAF8F]/30 transition-colors group">
          <div class="text-3xl font-black text-[#4FAF8F]/20 group-hover:text-[#4FAF8F]/40 transition-colors">01</div>
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-bold text-[#1E2A38] uppercase tracking-wide">EQPC</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#4FAF8F]/10 text-[#4FAF8F] font-medium">EQ Performance Coach</span>
            </div>
            <p class="text-sm text-[#1E2A38]/40">${bi('Coaching individual con inteligencia emocional. Domina el modelo y las herramientas de evaluación SEI.', 'Individual coaching with emotional intelligence. Master the model and SEI assessment tools.')}</p>
          </div>
        </div>
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#F2F4F7] hover:border-[#A38DFF]/30 transition-colors group">
          <div class="text-3xl font-black text-[#A38DFF]/20 group-hover:text-[#A38DFF]/40 transition-colors">02</div>
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-bold text-[#1E2A38] uppercase tracking-wide">EQPM</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#A38DFF]/10 text-[#A38DFF] font-medium">EQ Performance Manager</span>
            </div>
            <p class="text-sm text-[#1E2A38]/40">${bi('Gestión de equipos con EQ. Mide clima, diseña intervenciones y lidera cambio organizacional.', 'Team management with EQ. Measure climate, design interventions and lead organizational change.')}</p>
          </div>
        </div>
        <div class="flex items-start gap-6 p-6 rounded-xl border border-[#F2F4F7] hover:border-[#FF6B6B]/30 transition-colors group">
          <div class="text-3xl font-black text-[#FF6B6B]/20 group-hover:text-[#FF6B6B]/40 transition-colors">03</div>
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-bold text-[#1E2A38] uppercase tracking-wide">Practitioner Track</h3>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] font-medium">${bi('Facilitador Certificado', 'Certified Facilitator')}</span>
            </div>
            <p class="text-sm text-[#1E2A38]/40">${bi('Facilita programas de EQ para organizaciones. Licencia para usar contenido y herramientas Six Seconds.', 'Facilitate EQ programs for organizations. License to use Six Seconds content and tools.')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'architecture',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 5 — EQPC DETAIL
  // ═══════════════════════════════════════
  {
    order_index: 4,
    title: 'EQPC',
    subtitle: 'EQ Performance Coach',
    content: `<div class="max-w-3xl mx-auto py-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-lg bg-[#4FAF8F]/10 flex items-center justify-center text-[#4FAF8F] font-bold text-sm">01</div>
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F]">EQ Performance Coach</p>
      </div>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-4">EQPC</h2>
      <p class="text-lg text-[#1E2A38]/50 mb-12 max-w-xl leading-relaxed">${bi(
        'La base del viaje. Coaching individual con herramientas científicas de inteligencia emocional.',
        'The foundation of the journey. Individual coaching with scientific emotional intelligence tools.'
      )}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Duración', 'Duration')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('3 días intensivos', '3 intensive days')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Formato', 'Format')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Presencial · Cohorte reducida', 'In-person · Small cohort')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Herramientas', 'Tools')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Evaluaciones SEI · Brain Profiles', 'SEI Assessments · Brain Profiles')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Resultado', 'Outcome')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Certificación EQPC Six Seconds', 'Six Seconds EQPC Certification')}</p>
        </div>
      </div>
      <div class="p-5 rounded-xl bg-[#4FAF8F]/[0.04] border border-[#4FAF8F]/15">
        <p class="text-sm text-[#1E2A38]/50 text-center">${bi(
          '✦ Domina el modelo Know–Choose–Give a nivel personal y aprende a aplicarlo en sesiones de coaching.',
          '✦ Master the Know–Choose–Give model at a personal level and learn to apply it in coaching sessions.'
        )}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 6 — EQPM DETAIL
  // ═══════════════════════════════════════
  {
    order_index: 5,
    title: 'EQPM',
    subtitle: 'EQ Performance Manager',
    content: `<div class="max-w-3xl mx-auto py-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-lg bg-[#A38DFF]/10 flex items-center justify-center text-[#A38DFF] font-bold text-sm">02</div>
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#A38DFF]">EQ Performance Manager</p>
      </div>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-4">EQPM</h2>
      <p class="text-lg text-[#1E2A38]/50 mb-12 max-w-xl leading-relaxed">${bi(
        'De lo individual a lo organizacional. Gestiona equipos y diseña cultura con inteligencia emocional.',
        'From individual to organizational. Manage teams and design culture with emotional intelligence.'
      )}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Duración', 'Duration')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('2 días intensivos', '2 intensive days')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Prerequisito', 'Prerequisite')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('EQPC completado', 'EQPC completed')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Herramientas', 'Tools')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('VS Assessment · Team Vital Signs', 'VS Assessment · Team Vital Signs')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Resultado', 'Outcome')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Certificación EQPM Six Seconds', 'Six Seconds EQPM Certification')}</p>
        </div>
      </div>
      <div class="p-5 rounded-xl bg-[#A38DFF]/[0.04] border border-[#A38DFF]/15">
        <p class="text-sm text-[#1E2A38]/50 text-center">${bi(
          '✦ Mide el clima emocional de tu equipo, diseña intervenciones y lidera transformación cultural.',
          '✦ Measure your team\'s emotional climate, design interventions and lead cultural transformation.'
        )}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 7 — PRACTITIONER TRACK DETAIL
  // ═══════════════════════════════════════
  {
    order_index: 6,
    title: 'Practitioner Track',
    subtitle: bi('Facilitador Certificado', 'Certified Facilitator'),
    content: `<div class="max-w-3xl mx-auto py-20">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-lg bg-[#FF6B6B]/10 flex items-center justify-center text-[#FF6B6B] font-bold text-sm">03</div>
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#FF6B6B]">Practitioner Track</p>
      </div>
      <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-4">${bi('Facilitador<br/><span class="text-[#FF6B6B]">Certificado</span>', 'Certified<br/><span class="text-[#FF6B6B]">Facilitator</span>')}</h2>
      <p class="text-lg text-[#1E2A38]/50 mb-12 max-w-xl leading-relaxed">${bi(
        'El nivel más alto. Facilita programas completos de EQ para organizaciones con licencia oficial.',
        'The highest level. Facilitate complete EQ programs for organizations with official license.'
      )}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Acceso', 'Access')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Post EQPC + EQPM', 'Post EQPC + EQPM')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Licencia', 'License')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Contenido Six Seconds oficial', 'Official Six Seconds content')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Herramientas', 'Tools')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Kits de facilitación · Guías', 'Facilitation kits · Guides')}</p>
        </div>
        <div class="p-6 rounded-xl border border-[#F2F4F7]">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-2">${bi('Resultado', 'Outcome')}</p>
          <p class="text-lg font-semibold text-[#1E2A38]">${bi('Practitioner certificado', 'Certified Practitioner')}</p>
        </div>
      </div>
      <div class="p-5 rounded-xl bg-[#FF6B6B]/[0.04] border border-[#FF6B6B]/15">
        <p class="text-sm text-[#1E2A38]/50 text-center">${bi(
          '✦ Multiplica el impacto: facilita talleres, programas corporativos y procesos de transformación cultural.',
          '✦ Multiply the impact: facilitate workshops, corporate programs and cultural transformation processes.'
        )}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 8 — 2026 FLAGSHIP EVENT
  // ═══════════════════════════════════════
  {
    order_index: 7,
    title: bi('Evento 2026', '2026 Event'),
    subtitle: 'EQ Certification Week',
    content: `<div class="max-w-4xl mx-auto py-20 text-center relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#A38DFF] mb-6">${bi('Evento Inaugural', 'Flagship Event')}</p>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-4">${bi('Semana de Certificación EQ', 'EQ Certification Week')}</h2>
        <p class="text-xl text-[#A38DFF] font-medium mb-16">2026 · Lima, Peru</p>
        <div class="flex flex-col md:flex-row gap-8 items-stretch justify-center">
          <div class="flex-1 max-w-sm p-8 rounded-2xl border border-[#4FAF8F]/20 bg-[#4FAF8F]/[0.03]">
            <div class="text-5xl font-black text-[#4FAF8F] mb-3">3</div>
            <p class="text-lg font-semibold text-[#1E2A38] mb-1">${bi('Días EQPC', 'Days EQPC')}</p>
            <p class="text-sm text-[#1E2A38]/40">${bi('Certificación de coaching con EQ', 'EQ Coaching certification')}</p>
          </div>
          <div class="flex items-center justify-center">
            <div class="w-8 h-[1px] md:w-[1px] md:h-8 bg-[#A38DFF]/40"></div>
          </div>
          <div class="flex-1 max-w-sm p-8 rounded-2xl border border-[#A38DFF]/20 bg-[#A38DFF]/[0.03]">
            <div class="text-5xl font-black text-[#A38DFF] mb-3">2</div>
            <p class="text-lg font-semibold text-[#1E2A38] mb-1">${bi('Días EQPM', 'Days EQPM')}</p>
            <p class="text-sm text-[#1E2A38]/40">${bi('Gestión de equipos con EQ', 'EQ Team management')}</p>
          </div>
        </div>
        <div class="mt-12 space-y-4">
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#F2F4F7]">
            <p class="text-sm font-semibold text-[#1E2A38]">${bi('5 días · Presencial · Cohorte limitada', '5 days · In-person · Limited cohort')}</p>
          </div>
          <p class="text-xs text-[#1E2A38]/25 tracking-widest uppercase">${bi('Primera edición oficial en Peru', 'First official edition in Peru')}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 9 — IMPACT FOR PERU
  // ═══════════════════════════════════════
  {
    order_index: 8,
    title: bi('Impacto para Peru', 'Impact for Peru'),
    subtitle: '',
    content: `<div class="max-w-3xl mx-auto py-20 relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#FF6B6B] mb-6">${bi('Visión', 'Vision')}</p>
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight text-[#1E2A38] mb-16 leading-tight">${bi('El impacto que<br/><span class="text-[#4FAF8F]">diseñamos</span>.', 'The impact we<br/><span class="text-[#4FAF8F]">design</span>.')}</h2>
        <div class="space-y-6 text-lg text-[#1E2A38]/60 leading-relaxed">
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#4FAF8F] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Profesionales certificados con estándar global y sensibilidad local.', 'Certified professionals with global standards and local sensitivity.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#A38DFF] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Organizaciones que miden y gestionan su clima emocional con herramientas validadas.', 'Organizations that measure and manage emotional climate with validated tools.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#FF6B6B] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Líderes que integran inclusión como práctica de diseño, no como discurso.', 'Leaders who integrate inclusion as a design practice, not as discourse.')}</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-[#4FAF8F] mt-2.5 flex-shrink-0"></div>
            <p>${bi('Una comunidad de práctica que posiciona a Peru como referente en EQ en Latinoamérica.', 'A community of practice that positions Peru as an EQ leader in Latin America.')}</p>
          </div>
        </div>
        <div class="mt-16 pt-8 border-t border-[#F2F4F7]">
          <p class="text-xl font-bold text-[#1E2A38]">${bi(
            'No es solo formación. Es <span class="text-[#A38DFF]">infraestructura emocional</span> para el mercado peruano.',
            'It\'s not just training. It\'s <span class="text-[#A38DFF]">emotional infrastructure</span> for the Peruvian market.'
          )}</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 10 — MANIFESTO I
  // ═══════════════════════════════════════
  {
    order_index: 9,
    title: 'Manifesto I',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-2xl md:text-4xl font-light leading-relaxed text-[#1E2A38]/80">${bi(
          'La inclusión no se declara.<br/><br/>Se <strong class="text-[#4FAF8F] font-bold">diseña</strong>.',
          'Inclusion is not declared.<br/><br/>It is <strong class="text-[#4FAF8F] font-bold">designed</strong>.'
        )}</p>
      </div>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 11 — MANIFESTO II
  // ═══════════════════════════════════════
  {
    order_index: 10,
    title: 'Manifesto II',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-3xl font-light leading-relaxed text-[#1E2A38]/60">${bi(
        'Se diseña en cómo escuchas.<br/>En cómo decides.<br/>En cómo lideras.<br/>En cómo construyes espacios<br/>donde todos pueden contribuir.',
        'It\'s designed in how you listen.<br/>In how you decide.<br/>In how you lead.<br/>In how you build spaces<br/>where everyone can contribute.'
      )}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 12 — MANIFESTO III
  // ═══════════════════════════════════════
  {
    order_index: 11,
    title: 'Manifesto III',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-2xl md:text-4xl font-light leading-relaxed text-[#1E2A38]/70">${bi(
          'La inteligencia emocional<br/>no es un lujo.<br/><br/>Es la <strong class="text-[#A38DFF] font-bold">infraestructura</strong><br/>de la inclusión.',
          'Emotional intelligence<br/>is not a luxury.<br/><br/>It is the <strong class="text-[#A38DFF] font-bold">infrastructure</strong><br/>of inclusion.'
        )}</p>
      </div>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 13 — MANIFESTO IV
  // ═══════════════════════════════════════
  {
    order_index: 12,
    title: 'Manifesto IV',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-2xl mx-auto">
      <p class="text-xl md:text-2xl font-light leading-relaxed text-[#1E2A38]/50 mb-8">${bi(
        'No buscamos activismo.<br/>No buscamos trending topics.<br/>No buscamos aplausos.',
        'We don\'t seek activism.<br/>We don\'t seek trending topics.<br/>We don\'t seek applause.'
      )}</p>
      <div class="w-12 h-[1px] bg-[#A38DFF] mx-auto mb-8"></div>
      <p class="text-3xl md:text-5xl font-bold text-[#4FAF8F]">${bi('Buscamos diseño.', 'We seek design.')}</p>
      <p class="text-lg text-[#1E2A38]/40 mt-4">${bi('Diseño organizacional con inteligencia emocional.', 'Organizational design with emotional intelligence.')}</p>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 14 — KNOW. CHOOSE. GIVE.
  // ═══════════════════════════════════════
  {
    order_index: 13,
    title: 'Know. Choose. Give.',
    subtitle: '',
    content: `<div class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-3xl mx-auto space-y-12">
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#4FAF8F] mb-3">Know.</h3>
        <p class="text-base text-[#1E2A38]/40">${bi('Reconoce tus sesgos. Entiende tu impacto emocional.', 'Recognize your biases. Understand your emotional impact.')}</p>
      </div>
      <div class="w-16 h-[1px] bg-[#F2F4F7]"></div>
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#A38DFF] mb-3">Choose.</h3>
        <p class="text-base text-[#1E2A38]/40">${bi('Decide con consciencia. Lidera con intención.', 'Decide with awareness. Lead with intention.')}</p>
      </div>
      <div class="w-16 h-[1px] bg-[#F2F4F7]"></div>
      <div>
        <h3 class="text-5xl md:text-7xl font-black text-[#FF6B6B] mb-3">Give.</h3>
        <p class="text-base text-[#1E2A38]/40">${bi('Actúa con propósito. Diseña para todos.', 'Act with purpose. Design for everyone.')}</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 15 — BRAND IDENTITY
  // ═══════════════════════════════════════
  {
    order_index: 14,
    title: bi('Identidad Visual', 'Visual Identity'),
    subtitle: '',
    content: `<div class="max-w-4xl mx-auto py-16 relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#A38DFF] mb-6">${bi('Identidad Visual', 'Visual Identity')}</p>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#1E2A38] mb-16">${bi('Línea <span class="text-[#4FAF8F]">Gráfica</span>', 'Brand <span class="text-[#4FAF8F]">Identity</span>')}</h2>

        <!-- Color Palette -->
        <div class="mb-12">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-4">${bi('Paleta de Color', 'Color Palette')}</p>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-white border-2 border-[#F2F4F7] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#FFFFFF</p>
              <p class="text-[10px] text-[#1E2A38]/25">${bi('Base', 'Base')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#1E2A38] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#1E2A38</p>
              <p class="text-[10px] text-[#1E2A38]/25">Deep Blue</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#4FAF8F] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#4FAF8F</p>
              <p class="text-[10px] text-[#1E2A38]/25">Jade Green</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#A38DFF] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#A38DFF</p>
              <p class="text-[10px] text-[#1E2A38]/25">Lavender</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#FF6B6B] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#FF6B6B</p>
              <p class="text-[10px] text-[#1E2A38]/25">Soft Coral</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#F2F4F7] mb-2"></div>
              <p class="text-[10px] font-mono text-[#1E2A38]/40">#F2F4F7</p>
              <p class="text-[10px] text-[#1E2A38]/25">Light Grey</p>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div class="mb-12">
          <p class="text-xs tracking-[0.2em] uppercase text-[#1E2A38]/30 mb-4">${bi('Tipografía', 'Typography')}</p>
          <div class="space-y-4">
            <div class="p-5 rounded-xl border border-[#F2F4F7]">
              <p class="text-2xl font-bold text-[#1E2A38] mb-1" style="font-family: Inter, sans-serif">Inter</p>
              <p class="text-sm text-[#1E2A38]/40">Body · UI · ${bi('Comunicación', 'Communication')}</p>
            </div>
            <div class="p-5 rounded-xl border border-[#F2F4F7]">
              <p class="text-2xl font-bold text-[#1E2A38] mb-1" style="font-family: 'Space Grotesk', sans-serif">Space Grotesk</p>
              <p class="text-sm text-[#1E2A38]/40">Display · Headlines · ${bi('Títulos', 'Titles')}</p>
            </div>
          </div>
        </div>

        <!-- Geometric Motif -->
        <div class="text-center p-8 rounded-xl border border-[#F2F4F7] bg-[#1E2A38]/[0.01]">
          ${GEO_ACCENT}
          <p class="text-sm font-semibold text-[#1E2A38]/60 mt-4">${bi('Conexiones Circulares', 'Circular Connections')}</p>
          <p class="text-xs text-[#1E2A38]/30 mt-1">${bi('Motivo visual — geometría de la inclusión', 'Visual motif — geometry of inclusion')}</p>
        </div>

        <p class="text-center text-sm italic text-[#1E2A38]/30 mt-8">${bi('"Espacio blanco generoso. Geometría elegante. Conexiones visibles."', '"Generous white space. Elegant geometry. Visible connections."')}</p>
      </div>
    </div>`,
    section_type: 'brand',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 16 — NEXT STEPS
  // ═══════════════════════════════════════
  {
    order_index: 15,
    title: bi('Próximos Pasos', 'Next Steps'),
    subtitle: '',
    content: `<div class="max-w-3xl mx-auto py-20 text-center">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#4FAF8F] mb-6">${bi('Siguiente', 'Next')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#1E2A38] mb-16">${bi('Próximos <span class="text-[#4FAF8F]">Pasos</span>', 'Next <span class="text-[#4FAF8F]">Steps</span>')}</h2>
      <div class="space-y-6 text-left max-w-md mx-auto">
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#F2F4F7]">
          <div class="w-8 h-8 rounded-full bg-[#4FAF8F]/10 flex items-center justify-center text-sm font-bold text-[#4FAF8F] flex-shrink-0">1</div>
          <div>
            <p class="font-semibold text-[#1E2A38]">${bi('Conversación estratégica', 'Strategic conversation')}</p>
            <p class="text-sm text-[#1E2A38]/40">${bi('Agenda una sesión para explorar la ruta ideal para tu organización', 'Schedule a session to explore the ideal pathway for your organization')}</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#F2F4F7]">
          <div class="w-8 h-8 rounded-full bg-[#A38DFF]/10 flex items-center justify-center text-sm font-bold text-[#A38DFF] flex-shrink-0">2</div>
          <div>
            <p class="font-semibold text-[#1E2A38]">${bi('Selección de certificación', 'Certification selection')}</p>
            <p class="text-sm text-[#1E2A38]/40">${bi('EQPC, EQPM o Practitioner — según tus metas profesionales', 'EQPC, EQPM or Practitioner — based on your professional goals')}</p>
          </div>
        </div>
        <div class="flex items-start gap-4 p-5 rounded-xl border border-[#F2F4F7]">
          <div class="w-8 h-8 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-sm font-bold text-[#FF6B6B] flex-shrink-0">3</div>
          <div>
            <p class="font-semibold text-[#1E2A38]">${bi('Reserva tu lugar', 'Reserve your spot')}</p>
            <p class="text-sm text-[#1E2A38]/40">${bi('Cohorte limitada — primera edición en Peru 2026', 'Limited cohort — first edition in Peru 2026')}</p>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 17 — CLOSING
  // ═══════════════════════════════════════
  {
    order_index: 16,
    title: 'INCLUSION BY DESIGN',
    subtitle: 'Closing',
    content: `<div class="flex flex-col items-center justify-center min-h-[75vh] text-center relative">
      ${GEOMETRIC_CIRCLES}
      <div class="relative z-10 space-y-8">
        <h2 class="text-5xl md:text-[6rem] font-black tracking-tight leading-[0.9] text-[#1E2A38]">INCLUSION<br/>BY <span class="text-[#4FAF8F]">DESIGN</span></h2>
        <div class="w-16 h-[1px] bg-[#A38DFF] mx-auto"></div>
        <p class="text-lg font-light tracking-wide text-[#1E2A38]/40">Know. Choose. Give.</p>
        <div class="flex items-center justify-center gap-4 text-sm text-[#1E2A38]/30">
          <span class="text-[#4FAF8F]">EQPC</span>
          <span class="text-[#F2F4F7]">·</span>
          <span class="text-[#A38DFF]">EQPM</span>
          <span class="text-[#F2F4F7]">·</span>
          <span class="text-[#FF6B6B]">Practitioner</span>
        </div>
        <p class="text-base font-medium text-[#A38DFF] mt-4">${bi('Primera edición · Peru 2026', 'First edition · Peru 2026')}</p>
        <div class="flex items-center justify-center gap-3 mt-8 text-xs text-[#1E2A38]/20 tracking-widest uppercase">
          <span>Six Seconds</span>
          <span class="text-[#A38DFF]">×</span>
          <span>Diversa Peru</span>
        </div>
      </div>
    </div>`,
    section_type: 'closing',
    metadata: {},
  },
];


// ═══════════════════════════════════════════════════════
// OWN YOUR IMPACT — B2Grow × Six Seconds
// ═══════════════════════════════════════════════════════

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
  // SLIDE 19 — LÍNEA GRÁFICA: PALETA & TIPOGRAFÍA
  // ═══════════════════════════════════════
  {
    order_index: 18,
    title: bi('Línea Gráfica — Paleta & Tipografía', 'Brand Identity — Palette & Typography'),
    subtitle: '',
    content: `<div class="max-w-4xl mx-auto py-16 relative">
      ${WAVE_RINGS}
      <div class="relative z-10">
        <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Identidad Visual', 'Visual Identity')}</p>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('Línea <span class="text-[#4FAF8F]">Gráfica</span>', 'Brand <span class="text-[#4FAF8F]">Identity</span>')}</h2>

        <!-- Color Palette -->
        <div class="mb-12">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-4">${bi('Paleta de Color', 'Color Palette')}</p>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-white border-2 border-[#E9EEF2] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#FFFFFF</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Base', 'Base')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#0E1B2C] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#0E1B2C</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Texto', 'Text')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#4FAF8F] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#4FAF8F</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Crecimiento', 'Growth')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#2D6CDF] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#2D6CDF</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Confianza', 'Trust')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#C7A54A] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#C7A54A</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Excelencia', 'Excellence')}</p>
            </div>
            <div class="text-center">
              <div class="aspect-square rounded-xl bg-[#E9EEF2] mb-2"></div>
              <p class="text-[10px] font-mono text-[#0E1B2C]/40">#E9EEF2</p>
              <p class="text-[10px] text-[#0E1B2C]/25">${bi('Neutro', 'Neutral')}</p>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div class="mb-12">
          <p class="text-xs tracking-[0.2em] uppercase text-[#0E1B2C]/30 mb-4">${bi('Tipografía', 'Typography')}</p>
          <div class="space-y-4">
            <div class="p-5 rounded-xl border border-[#E9EEF2]">
              <p class="text-2xl font-bold text-[#0E1B2C] mb-1" style="font-family: Inter, sans-serif">Inter</p>
              <p class="text-sm text-[#0E1B2C]/40">Body · UI · ${bi('Comunicación', 'Communication')}</p>
              <p class="text-xs text-[#0E1B2C]/20 mt-2" style="font-family: Inter, sans-serif">Aa Bb Cc Dd Ee Ff Gg — 0123456789</p>
            </div>
            <div class="p-5 rounded-xl border border-[#E9EEF2]">
              <p class="text-2xl font-bold text-[#0E1B2C] mb-1" style="font-family: 'Space Grotesk', sans-serif">Space Grotesk</p>
              <p class="text-sm text-[#0E1B2C]/40">Display · Headlines · ${bi('Títulos', 'Titles')}</p>
              <p class="text-xs text-[#0E1B2C]/20 mt-2" style="font-family: 'Space Grotesk', sans-serif">Aa Bb Cc Dd Ee Ff Gg — 0123456789</p>
            </div>
            <div class="p-5 rounded-xl border border-[#E9EEF2]">
              <p class="text-2xl font-bold text-[#0E1B2C] mb-1 font-editorial">Playfair Display</p>
              <p class="text-sm text-[#0E1B2C]/40">Editorial · ${bi('Momentos especiales', 'Special moments')}</p>
              <p class="text-xs text-[#0E1B2C]/20 mt-2 font-editorial">Aa Bb Cc Dd Ee Ff Gg — 0123456789</p>
            </div>
          </div>
        </div>

        <!-- Wave Rings Motif -->
        <div class="text-center p-8 rounded-xl border border-[#E9EEF2] bg-[#0E1B2C]/[0.01]">
          <svg class="w-24 h-24 mx-auto mb-4 opacity-30" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="30" stroke="#4FAF8F" stroke-width="1"/>
            <circle cx="100" cy="100" r="50" stroke="#4FAF8F" stroke-width="0.7"/>
            <circle cx="100" cy="100" r="70" stroke="#2D6CDF" stroke-width="0.5"/>
            <circle cx="100" cy="100" r="90" stroke="#E9EEF2" stroke-width="0.5"/>
          </svg>
          <p class="text-sm font-semibold text-[#0E1B2C]/60">${bi('Ondas de Impacto', 'Impact Waves')}</p>
          <p class="text-xs text-[#0E1B2C]/30 mt-1">${bi('Motivo visual central — expansión desde el centro', 'Core visual motif — expansion from the center')}</p>
        </div>

        <p class="text-center text-sm italic text-[#0E1B2C]/30 mt-8">${bi('"Fondo blanco. Líneas limpias. Impacto silencioso."', '"White background. Clean lines. Silent impact."')}</p>
      </div>
    </div>`,
    section_type: 'brand',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 20 — LÍNEA GRÁFICA: APLICACIONES
  // ═══════════════════════════════════════
  {
    order_index: 19,
    title: bi('Línea Gráfica — Aplicaciones', 'Brand Identity — Applications'),
    subtitle: '',
    content: `<div class="max-w-4xl mx-auto py-16">
      <p class="text-xs font-medium tracking-[0.3em] uppercase text-[#C7A54A] mb-6">${bi('Aplicaciones', 'Applications')}</p>
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-[#0E1B2C] mb-16">${bi('Línea Gráfica en <span class="text-[#4FAF8F]">Acción</span>', 'Brand Identity in <span class="text-[#4FAF8F]">Action</span>')}</h2>

      <!-- Logo Lockup -->
      <div class="mb-10 p-8 rounded-2xl border border-[#E9EEF2] text-center bg-[#0E1B2C]/[0.01]">
        <div class="flex items-center justify-center gap-3 mb-4 text-lg text-[#0E1B2C]/30 tracking-widest uppercase">
          <span class="font-semibold text-[#2D6CDF]">Six Seconds</span>
          <span class="text-[#C7A54A] text-xl font-bold">×</span>
          <span class="font-semibold text-[#4FAF8F]">B2Grow</span>
        </div>
        <p class="text-3xl md:text-4xl font-black tracking-tight text-[#0E1B2C]">OWN YOUR <span class="text-[#4FAF8F]">IMPACT</span></p>
        <p class="text-xs text-[#0E1B2C]/25 tracking-widest uppercase mt-3">Be. Grow. Lead.</p>
      </div>

      <!-- Application Mockups -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Business Card -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-all">
          <div class="aspect-[1.6/1] rounded-lg bg-white border border-[#E9EEF2] p-4 flex flex-col justify-between mb-3">
            <div>
              <p class="text-[8px] font-black text-[#0E1B2C]">OWN YOUR <span class="text-[#4FAF8F]">IMPACT</span></p>
            </div>
            <div>
              <p class="text-[7px] font-semibold text-[#0E1B2C]">Nombre Apellido</p>
              <p class="text-[6px] text-[#0E1B2C]/40">Director · B2Grow</p>
              <div class="w-4 h-[0.5px] bg-[#C7A54A] mt-1"></div>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">${bi('Tarjeta de Presentación', 'Business Card')}</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Minimalista · Fondo blanco', 'Minimalist · White background')}</p>
        </div>

        <!-- Email Signature -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-all">
          <div class="aspect-[1.6/1] rounded-lg bg-white border border-[#E9EEF2] p-3 flex flex-col justify-center mb-3">
            <div class="border-t border-[#E9EEF2] pt-2">
              <p class="text-[7px] font-bold text-[#0E1B2C]">Nombre Apellido</p>
              <p class="text-[6px] text-[#0E1B2C]/40">EQ Practitioner · B2Grow</p>
              <div class="flex items-center gap-1 mt-1">
                <div class="w-1.5 h-1.5 rounded-full bg-[#4FAF8F]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-[#2D6CDF]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-[#C7A54A]"></div>
              </div>
              <p class="text-[5px] text-[#0E1B2C]/25 mt-1">ownyourimpact.com</p>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">${bi('Firma de Email', 'Email Signature')}</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Colores de marca · Ondas', 'Brand colors · Waves')}</p>
        </div>

        <!-- Corporate Folder -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#C7A54A]/30 transition-all">
          <div class="aspect-[1.6/1] rounded-lg bg-[#0E1B2C] p-4 flex flex-col justify-between mb-3 relative overflow-hidden">
            <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 120" fill="none"><circle cx="160" cy="90" r="30" stroke="#4FAF8F" stroke-width="0.5"/><circle cx="160" cy="90" r="50" stroke="#4FAF8F" stroke-width="0.3"/><circle cx="160" cy="90" r="70" stroke="#2D6CDF" stroke-width="0.3"/></svg>
            <div class="relative z-10">
              <p class="text-[8px] font-black text-white">OWN YOUR <span class="text-[#4FAF8F]">IMPACT</span></p>
            </div>
            <div class="relative z-10">
              <div class="w-4 h-[0.5px] bg-[#C7A54A]"></div>
              <p class="text-[6px] text-white/40 mt-1">Be. Grow. Lead.</p>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">${bi('Carpeta Corporativa', 'Corporate Folder')}</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Versión oscura · Ondas', 'Dark version · Waves')}</p>
        </div>

        <!-- Tote Bag -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#4FAF8F]/30 transition-all">
          <div class="aspect-[1/1.2] rounded-lg bg-[#F5F7F9] flex items-center justify-center mb-3">
            <div class="text-center">
              <p class="text-sm font-black text-[#0E1B2C]">OWN YOUR</p>
              <p class="text-sm font-black text-[#4FAF8F]">IMPACT</p>
              <svg class="w-8 h-8 mx-auto mt-2 opacity-20" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="15" stroke="#4FAF8F" stroke-width="0.5"/><circle cx="50" cy="50" r="25" stroke="#4FAF8F" stroke-width="0.3"/><circle cx="50" cy="50" r="35" stroke="#2D6CDF" stroke-width="0.3"/></svg>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">Tote Bag</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Merchandising', 'Merchandise')}</p>
        </div>

        <!-- Notebook -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#2D6CDF]/30 transition-all">
          <div class="aspect-[1/1.4] rounded-lg bg-[#0E1B2C] flex items-center justify-center mb-3 relative overflow-hidden">
            <svg class="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 200 280" fill="none"><circle cx="100" cy="200" r="40" stroke="#4FAF8F" stroke-width="0.5"/><circle cx="100" cy="200" r="70" stroke="#4FAF8F" stroke-width="0.3"/><circle cx="100" cy="200" r="100" stroke="#2D6CDF" stroke-width="0.3"/></svg>
            <div class="relative z-10 text-center">
              <p class="text-xs font-black text-white tracking-tight">OWN YOUR</p>
              <p class="text-xs font-black text-[#4FAF8F] tracking-tight">IMPACT</p>
              <div class="w-6 h-[0.5px] bg-[#C7A54A] mx-auto mt-2"></div>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">Notebook</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Merchandising', 'Merchandise')}</p>
        </div>

        <!-- Social Media Template -->
        <div class="p-5 rounded-xl border border-[#E9EEF2] hover:border-[#C7A54A]/30 transition-all">
          <div class="aspect-square rounded-lg bg-white border border-[#E9EEF2] p-4 flex flex-col items-center justify-center text-center mb-3 relative overflow-hidden">
            <svg class="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="40" stroke="#4FAF8F" stroke-width="0.5"/><circle cx="100" cy="100" r="60" stroke="#4FAF8F" stroke-width="0.3"/></svg>
            <div class="relative z-10">
              <p class="text-[7px] tracking-[0.2em] uppercase text-[#0E1B2C]/25">Six Seconds × B2Grow</p>
              <p class="text-sm font-black text-[#0E1B2C] mt-1">OWN YOUR</p>
              <p class="text-sm font-black text-[#4FAF8F]">IMPACT</p>
            </div>
          </div>
          <p class="text-xs font-medium text-[#0E1B2C]">${bi('Redes Sociales', 'Social Media')}</p>
          <p class="text-[10px] text-[#0E1B2C]/30">${bi('Plantilla base', 'Base template')}</p>
        </div>
      </div>

      <div class="mt-10 pt-8 border-t border-[#E9EEF2] text-center">
        <p class="text-lg font-semibold text-[#0E1B2C]">${bi('Coherencia visual = <span class="text-[#4FAF8F]">Credibilidad profesional</span>', 'Visual coherence = <span class="text-[#4FAF8F]">Professional credibility</span>')}</p>
        <p class="text-xs text-[#0E1B2C]/30 mt-2">${bi('Cada punto de contacto refuerza el mismo mensaje.', 'Every touchpoint reinforces the same message.')}</p>
      </div>
    </div>`,
    section_type: 'brand',
    metadata: {},
  },

  // ═══════════════════════════════════════
  // SLIDE 21 — EVENT VISUAL / SOCIAL POSTS
  // ═══════════════════════════════════════
  {
    order_index: 20,
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
  // SLIDE 22 — NEXT STEPS
  // ═══════════════════════════════════════
  {
    order_index: 21,
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
  // SLIDE 23 — CLOSING
  // ═══════════════════════════════════════
  {
    order_index: 22,
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
