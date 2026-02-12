import { PresentationSection, BrandConfig } from '../types';

// OWN YOUR IMPACT - First presentation in PITA
export const OWN_YOUR_IMPACT_BRAND: BrandConfig = {
  primaryColor: '#0E1B2C',
  secondaryColor: '#1F3D36',
  accentColor: '#4FAF8F',
  backgroundColor: '#0E1B2C',
  textColor: '#F5F7F9',
  fontFamily: 'Playfair Display',
};

export const OWN_YOUR_IMPACT_SECTIONS: Omit<PresentationSection, 'id' | 'presentation_id' | 'created_at'>[] = [
  {
    order_index: 0,
    title: 'OWN YOUR IMPACT',
    subtitle: 'Be. Grow. Lead.',
    content: `<div class="flex flex-col items-center justify-center min-h-[70vh] text-center relative">
      <div class="absolute inset-0 flex items-center justify-center opacity-20">
        <div class="w-[400px] h-[400px] rounded-full border border-[#4FAF8F]/30 animate-pita-ring"></div>
        <div class="w-[300px] h-[300px] rounded-full border border-[#4FAF8F]/40 animate-pita-ring" style="animation-delay: 0.5s"></div>
        <div class="w-[200px] h-[200px] rounded-full border border-[#C7A54A]/30 animate-pita-ring" style="animation-delay: 1s"></div>
      </div>
      <div class="relative z-10">
        <h1 class="font-editorial text-6xl md:text-8xl font-bold tracking-tight mb-6">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></h1>
        <p class="text-2xl md:text-3xl font-light text-[#F5F7F9]/80 mb-4">Be. Grow. Lead.</p>
        <div class="w-24 h-[1px] bg-[#C7A54A] mx-auto my-8"></div>
        <p class="text-lg text-[#F5F7F9]/60 max-w-xl mx-auto">Elevate Your EQ. Transform Your Leadership.</p>
        <p class="text-sm text-[#4FAF8F]/60 mt-8">A Strategic Platform by Six Seconds + B2Grow</p>
      </div>
    </div>`,
    section_type: 'cover',
    metadata: {},
  },
  {
    order_index: 1,
    title: 'The Purpose',
    subtitle: 'Why OWN YOUR IMPACT exists',
    content: `<div class="max-w-4xl mx-auto py-16">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-4 text-center">The <span class="text-[#4FAF8F]">Purpose</span></h2>
      <p class="text-center text-[#F5F7F9]/50 mb-16 text-lg">Una plataforma estratégica co-brandeada por Six Seconds + B2Grow</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="text-3xl mb-4">🧠</div>
          <h3 class="text-xl font-semibold mb-3 text-[#4FAF8F]">Transformación Personal Profunda</h3>
          <p class="text-[#F5F7F9]/60 leading-relaxed">El impacto real no comienza afuera. Comienza dentro. En tu capacidad de reconocer lo que sientes.</p>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="text-3xl mb-4">🎓</div>
          <h3 class="text-xl font-semibold mb-3 text-[#C7A54A]">Certificación Internacional Rigurosa</h3>
          <p class="text-[#F5F7F9]/60 leading-relaxed">Certificaciones Six Seconds con rigor metodológico global y aplicación estratégica regional.</p>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="text-3xl mb-4">🏢</div>
          <h3 class="text-xl font-semibold mb-3 text-[#2D6CDF]">Aplicación Organizacional Real</h3>
          <p class="text-[#F5F7F9]/60 leading-relaxed">Organizaciones que integran EQ en decisiones, cultura y desempeño medible.</p>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="text-3xl mb-4">🌍</div>
          <h3 class="text-xl font-semibold mb-3 text-[#4FAF8F]">Impacto Social Sostenible</h3>
          <p class="text-[#F5F7F9]/60 leading-relaxed">Una red que eleva el estándar de liderazgo emocional en la región.</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },
  {
    order_index: 2,
    title: 'Strategic Architecture',
    subtitle: 'The three pillars of impact',
    content: `<div class="max-w-5xl mx-auto py-16">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-4 text-center">Strategic <span class="text-[#C7A54A]">Architecture</span></h2>
      <p class="text-center text-[#F5F7F9]/50 mb-16 text-lg">Three territories. One integrated vision.</p>
      <div class="space-y-8">
        <div class="p-8 rounded-2xl bg-gradient-to-r from-[#4FAF8F]/10 to-transparent border border-[#4FAF8F]/20 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-6xl font-editorial font-bold text-[#4FAF8F]/10">01</div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-[#4FAF8F]/20 flex items-center justify-center text-xl flex-shrink-0">🎯</div>
            <div>
              <p class="text-sm text-[#4FAF8F] font-semibold mb-1 uppercase tracking-wider">The Leadership Formation Series</p>
              <h3 class="text-2xl font-bold mb-2">Impacto en mí</h3>
              <p class="text-[#F5F7F9]/60 leading-relaxed mb-4">Formación profunda en liderazgo emocional y certificación oficial.</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 text-xs rounded-full bg-[#4FAF8F]/10 text-[#4FAF8F] border border-[#4FAF8F]/20">Coaching Programs</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#4FAF8F]/10 text-[#4FAF8F] border border-[#4FAF8F]/20">EQ Week</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#4FAF8F]/10 text-[#4FAF8F] border border-[#4FAF8F]/20">Six Seconds Certs</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#4FAF8F]/10 text-[#4FAF8F] border border-[#4FAF8F]/20">Assessments</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-2xl bg-gradient-to-r from-[#2D6CDF]/10 to-transparent border border-[#2D6CDF]/20 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-6xl font-editorial font-bold text-[#2D6CDF]/10">02</div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-[#2D6CDF]/20 flex items-center justify-center text-xl flex-shrink-0">🏢</div>
            <div>
              <p class="text-sm text-[#2D6CDF] font-semibold mb-1 uppercase tracking-wider">The Organizational Impact Practice</p>
              <h3 class="text-2xl font-bold mb-2">Impacto en la organización</h3>
              <p class="text-[#F5F7F9]/60 leading-relaxed mb-4">Consultoría estratégica para transformar cultura y resultados.</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 text-xs rounded-full bg-[#2D6CDF]/10 text-[#2D6CDF] border border-[#2D6CDF]/20">Joint Consulting</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#2D6CDF]/10 text-[#2D6CDF] border border-[#2D6CDF]/20">Org Assessments</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#2D6CDF]/10 text-[#2D6CDF] border border-[#2D6CDF]/20">Custom Programs</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-2xl bg-gradient-to-r from-[#C7A54A]/10 to-transparent border border-[#C7A54A]/20 relative overflow-hidden">
          <div class="absolute top-4 right-4 text-6xl font-editorial font-bold text-[#C7A54A]/10">03</div>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-[#C7A54A]/20 flex items-center justify-center text-xl flex-shrink-0">🌍</div>
            <div>
              <p class="text-sm text-[#C7A54A] font-semibold mb-1 uppercase tracking-wider">The Social Impact Collective</p>
              <h3 class="text-2xl font-bold mb-2">Impacto en la sociedad</h3>
              <p class="text-[#F5F7F9]/60 leading-relaxed mb-4">Expandir la inteligencia emocional más allá de la empresa.</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 text-xs rounded-full bg-[#C7A54A]/10 text-[#C7A54A] border border-[#C7A54A]/20">Community</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#C7A54A]/10 text-[#C7A54A] border border-[#C7A54A]/20">Education</span>
                <span class="px-3 py-1 text-xs rounded-full bg-[#C7A54A]/10 text-[#C7A54A] border border-[#C7A54A]/20">Thought Leadership</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
    section_type: 'architecture',
    metadata: {},
  },
  {
    order_index: 3,
    title: 'EQ Week',
    subtitle: 'The central experience',
    content: `<div class="max-w-4xl mx-auto py-16 text-center">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-4">EQ <span class="text-[#4FAF8F]">Week</span></h2>
      <p class="text-[#F5F7F9]/50 mb-16 text-lg">La experiencia central de formación</p>
      <div class="flex flex-col md:flex-row gap-6 items-stretch justify-center">
        <div class="flex-1 max-w-sm p-8 rounded-2xl bg-gradient-to-b from-[#4FAF8F]/10 to-[#4FAF8F]/5 border border-[#4FAF8F]/20">
          <div class="text-5xl font-editorial font-bold text-[#4FAF8F] mb-2">3</div>
          <p class="text-xl font-semibold mb-4">días de transformación personal</p>
          <div class="space-y-3 text-left">
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#4FAF8F]"></div>
              <span>Self-awareness profundo</span>
            </div>
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#4FAF8F]"></div>
              <span>Emotional intelligence aplicada</span>
            </div>
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#4FAF8F]"></div>
              <span>Leadership coaching</span>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center">
          <div class="w-12 h-[1px] md:w-[1px] md:h-12 bg-[#C7A54A]/50"></div>
        </div>
        <div class="flex-1 max-w-sm p-8 rounded-2xl bg-gradient-to-b from-[#C7A54A]/10 to-[#C7A54A]/5 border border-[#C7A54A]/20">
          <div class="text-5xl font-editorial font-bold text-[#C7A54A] mb-2">2</div>
          <p class="text-xl font-semibold mb-4">días de metodología y certificación</p>
          <div class="space-y-3 text-left">
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#C7A54A]"></div>
              <span>Six Seconds methodology</span>
            </div>
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#C7A54A]"></div>
              <span>Official certification</span>
            </div>
            <div class="flex items-center gap-3 text-[#F5F7F9]/60">
              <div class="w-2 h-2 rounded-full bg-[#C7A54A]"></div>
              <span>Tools & assessments</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-12 p-6 rounded-xl bg-white/5 border border-white/10 max-w-2xl mx-auto">
        <p class="text-[#4FAF8F] font-semibold mb-2">Resultado</p>
        <p class="text-[#F5F7F9]/70">Profesionales que no solo entienden EQ — la aplican. Profesionales que quieren mejorar su aplicación y vivir algo distinto.</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },
  {
    order_index: 4,
    title: 'Expansion Logic',
    subtitle: 'From self to society',
    content: `<div class="max-w-4xl mx-auto py-16 text-center">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-16">The <span class="text-[#C7A54A]">Expansion</span></h2>
      <div class="relative">
        <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div class="group cursor-pointer">
            <div class="w-48 h-48 rounded-full bg-[#4FAF8F]/10 border-2 border-[#4FAF8F]/30 flex flex-col items-center justify-center transition-all group-hover:border-[#4FAF8F] group-hover:bg-[#4FAF8F]/20">
              <p class="text-xs text-[#4FAF8F] font-semibold uppercase tracking-widest mb-1">PRO</p>
              <p class="text-xl font-bold">Impacto</p>
              <p class="text-sm text-[#F5F7F9]/60">en mí</p>
            </div>
          </div>
          <div class="text-[#C7A54A]/50 text-2xl">→</div>
          <div class="group cursor-pointer">
            <div class="w-56 h-56 rounded-full bg-[#2D6CDF]/10 border-2 border-[#2D6CDF]/30 flex flex-col items-center justify-center transition-all group-hover:border-[#2D6CDF] group-hover:bg-[#2D6CDF]/20">
              <p class="text-xs text-[#2D6CDF] font-semibold uppercase tracking-widest mb-1">BIZ</p>
              <p class="text-xl font-bold">Impacto</p>
              <p class="text-sm text-[#F5F7F9]/60">en mi organización</p>
            </div>
          </div>
          <div class="text-[#C7A54A]/50 text-2xl">→</div>
          <div class="group cursor-pointer">
            <div class="w-64 h-64 rounded-full bg-[#C7A54A]/10 border-2 border-[#C7A54A]/30 flex flex-col items-center justify-center transition-all group-hover:border-[#C7A54A] group-hover:bg-[#C7A54A]/20">
              <p class="text-xs text-[#C7A54A] font-semibold uppercase tracking-widest mb-1">IMPACT</p>
              <p class="text-xl font-bold">Impacto</p>
              <p class="text-sm text-[#F5F7F9]/60">en la sociedad</p>
            </div>
          </div>
        </div>
        <p class="mt-12 text-[#F5F7F9]/40 text-sm">Una expansión natural del liderazgo.</p>
      </div>
    </div>`,
    section_type: 'visual',
    metadata: {},
  },
  {
    order_index: 5,
    title: 'Visual System',
    subtitle: 'The Human Pulse of Impact',
    content: `<div class="max-w-4xl mx-auto py-16">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-4 text-center">Visual <span class="text-[#4FAF8F]">System</span></h2>
      <p class="text-center text-[#F5F7F9]/50 mb-16 text-lg">"The Human Pulse of Impact"</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div>
            <p class="text-sm text-[#4FAF8F] font-semibold uppercase tracking-wider mb-3">Concept</p>
            <p class="text-[#F5F7F9]/70 leading-relaxed">La expansión del impacto desde el centro. Una energía que nace en una persona y se expande. Sofisticada. No mística. Elegante.</p>
          </div>
          <div>
            <p class="text-sm text-[#C7A54A] font-semibold uppercase tracking-wider mb-3">Style</p>
            <ul class="space-y-2 text-[#F5F7F9]/60">
              <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C7A54A]"></span> Minimalista</li>
              <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C7A54A]"></span> Fondo oscuro con luz radial</li>
              <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C7A54A]"></span> Presencia firme, elegante</li>
              <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#C7A54A]"></span> Premium, no motivacional</li>
            </ul>
          </div>
          <div>
            <p class="text-sm text-[#2D6CDF] font-semibold uppercase tracking-wider mb-3">Feeling</p>
            <p class="text-[#F5F7F9]/70 italic">"Este espacio es serio. Aquí se trabaja profundo. Aquí se forma liderazgo real."</p>
          </div>
        </div>
        <div class="relative flex items-center justify-center">
          <div class="absolute w-[300px] h-[300px] rounded-full border border-[#4FAF8F]/10 animate-pita-pulse"></div>
          <div class="absolute w-[250px] h-[250px] rounded-full border border-[#4FAF8F]/15 animate-pita-pulse" style="animation-delay: 0.3s"></div>
          <div class="absolute w-[200px] h-[200px] rounded-full border border-[#4FAF8F]/20 animate-pita-pulse" style="animation-delay: 0.6s"></div>
          <div class="absolute w-[150px] h-[150px] rounded-full bg-[#C7A54A]/10 border border-[#C7A54A]/20 animate-pita-pulse" style="animation-delay: 0.9s"></div>
          <div class="relative z-10 flex flex-col items-center gap-4">
            <div class="flex gap-3 text-sm text-[#4FAF8F]/80">
              <span>Know</span>
              <span class="text-[#C7A54A]/50">·</span>
              <span>Choose</span>
              <span class="text-[#C7A54A]/50">·</span>
              <span>Give</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-16 grid grid-cols-3 md:grid-cols-6 gap-4">
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#0E1B2C] border border-white/10 mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#0E1B2C</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#1F3D36] border border-white/10 mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#1F3D36</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#4FAF8F] mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#4FAF8F</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#2D6CDF] mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#2D6CDF</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#C7A54A] mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#C7A54A</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 rounded-xl bg-[#F5F7F9] mx-auto mb-2"></div>
          <p class="text-xs text-[#F5F7F9]/40">#F5F7F9</p>
        </div>
      </div>
    </div>`,
    section_type: 'visual',
    metadata: {},
  },
  {
    order_index: 6,
    title: 'Manifesto',
    subtitle: 'OWN YOUR IMPACT',
    content: `<div class="max-w-3xl mx-auto py-16 text-center">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-16">The <span class="text-[#C7A54A]">Manifesto</span></h2>
      <div class="space-y-6 text-lg leading-relaxed text-[#F5F7F9]/80">
        <p>El liderazgo ya no se trata de autoridad.<br/>Se trata de <span class="text-[#4FAF8F] font-semibold">impacto</span>.</p>
        <div class="w-12 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <p>Impacto en las conversaciones que eliges tener.<br/>Impacto en las decisiones que tomas bajo presión.<br/>Impacto en la cultura que construyes todos los días.</p>
        <div class="w-12 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <p>Pero el impacto real no comienza afuera.<br/><span class="text-[#C7A54A] font-semibold">Comienza dentro.</span></p>
        <p class="text-[#F5F7F9]/60">En tu capacidad de reconocer lo que sientes.<br/>En tu habilidad para elegir con conciencia.<br/>En tu compromiso de actuar con propósito.</p>
        <div class="w-12 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <p>La inteligencia emocional no es una habilidad blanda.<br/>Es la base del <span class="text-[#2D6CDF] font-semibold">liderazgo sostenible</span>.</p>
        <div class="w-12 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <p>No basta con inspirar.<br/>No basta con certificar.<br/>No basta con saber.</p>
        <p class="text-xl font-semibold text-[#4FAF8F]">Se trata de integrar.</p>
        <div class="w-12 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <p>Transformarte primero.<br/>Dominar la metodología después.<br/>Multiplicar el impacto siempre.</p>
      </div>
    </div>`,
    section_type: 'manifesto',
    metadata: {},
  },
  {
    order_index: 7,
    title: 'Be. Grow. Lead.',
    subtitle: 'The three pillars',
    content: `<div class="max-w-3xl mx-auto py-16 text-center">
      <div class="space-y-12">
        <div>
          <h3 class="font-editorial text-5xl md:text-7xl font-bold text-[#4FAF8F] mb-4">Be.</h3>
          <p class="text-xl text-[#F5F7F9]/60">Porque el liderazgo empieza en quién eres.</p>
        </div>
        <div class="w-24 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <div>
          <h3 class="font-editorial text-5xl md:text-7xl font-bold text-[#2D6CDF] mb-4">Grow.</h3>
          <p class="text-xl text-[#F5F7F9]/60">Porque el crecimiento es una elección consciente.</p>
        </div>
        <div class="w-24 h-[1px] bg-[#C7A54A]/30 mx-auto"></div>
        <div>
          <h3 class="font-editorial text-5xl md:text-7xl font-bold text-[#C7A54A] mb-4">Lead.</h3>
          <p class="text-xl text-[#F5F7F9]/60">Porque el mundo no necesita más títulos.<br/>Necesita más líderes emocionalmente inteligentes.</p>
        </div>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },
  {
    order_index: 8,
    title: 'Strategic Positioning',
    subtitle: 'A new category',
    content: `<div class="max-w-4xl mx-auto py-16 text-center">
      <h2 class="font-editorial text-4xl md:text-5xl font-bold mb-16">Strategic <span class="text-[#2D6CDF]">Positioning</span></h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10">
          <div class="text-3xl mb-4">🔬</div>
          <p class="text-sm text-[#4FAF8F] font-semibold uppercase tracking-wider mb-2">Six Seconds</p>
          <p class="text-xl font-bold mb-2">Rigor metodológico global</p>
          <p class="text-[#F5F7F9]/50">La ciencia detrás de la inteligencia emocional. Assessments validados y certificaciones reconocidas mundialmente.</p>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10">
          <div class="text-3xl mb-4">🚀</div>
          <p class="text-sm text-[#C7A54A] font-semibold uppercase tracking-wider mb-2">B2Grow</p>
          <p class="text-xl font-bold mb-2">Aplicación estratégica regional</p>
          <p class="text-[#F5F7F9]/50">La experiencia práctica y el conocimiento del mercado latinoamericano para una implementación real.</p>
        </div>
      </div>
      <div class="p-8 rounded-2xl bg-gradient-to-r from-[#4FAF8F]/5 via-[#C7A54A]/5 to-[#2D6CDF]/5 border border-[#C7A54A]/20">
        <p class="text-sm text-[#C7A54A] font-semibold uppercase tracking-wider mb-3">Together they create</p>
        <p class="text-2xl md:text-3xl font-editorial font-bold mb-4">Una nueva categoría</p>
        <p class="text-xl text-[#4FAF8F]">Liderazgo emocional aplicado con impacto real.</p>
      </div>
    </div>`,
    section_type: 'content',
    metadata: {},
  },
  {
    order_index: 9,
    title: 'Closing',
    subtitle: 'Own Your Impact',
    content: `<div class="flex flex-col items-center justify-center min-h-[70vh] text-center relative">
      <div class="absolute inset-0 bg-gradient-to-t from-[#4FAF8F]/5 via-transparent to-transparent"></div>
      <div class="relative z-10 space-y-8">
        <h2 class="font-editorial text-5xl md:text-7xl font-bold">OWN YOUR<br/><span class="text-[#4FAF8F]">IMPACT</span></h2>
        <div class="w-24 h-[1px] bg-[#C7A54A] mx-auto"></div>
        <div class="flex items-center justify-center gap-6 text-xl">
          <span class="text-[#4FAF8F]">Formation</span>
          <span class="text-[#C7A54A]/30">·</span>
          <span class="text-[#2D6CDF]">Practice</span>
          <span class="text-[#C7A54A]/30">·</span>
          <span class="text-[#C7A54A]">Collective</span>
        </div>
        <div class="max-w-2xl mx-auto mt-8">
          <p class="text-[#F5F7F9]/60 text-lg italic leading-relaxed">"Own Your Impact no es un evento. Es una declaración de liderazgo y una arquitectura que nos permite crecer, escalar y posicionar la alianza en el siguiente nivel."</p>
        </div>
        <div class="flex items-center justify-center gap-4 mt-8 text-sm text-[#F5F7F9]/40">
          <span>Elevate Your EQ</span>
          <span class="text-[#C7A54A]/30">·</span>
          <span>Transform Your Leadership</span>
        </div>
        <p class="text-xs text-[#F5F7F9]/20 mt-12">A Strategic Platform by Six Seconds + B2Grow</p>
      </div>
    </div>`,
    section_type: 'closing',
    metadata: {},
  },
];
