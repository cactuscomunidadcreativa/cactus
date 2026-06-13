'use client';

import { Reveal } from '../motion';

const BELIEFS = [
  {
    title: 'Las emociones son datos',
    text: 'Dirigimos Six Seconds LATAM, la red de inteligencia emocional más grande del mundo. Esa ciencia vive dentro de cada producto que construimos.',
  },
  {
    title: 'La adopción es humana',
    text: 'El mejor software del mundo fracasa si la gente no lo abraza. Diseñamos para personas reales, con miedos reales y días difíciles.',
  },
  {
    title: 'La IA amplifica, no reemplaza',
    text: 'Usamos IA para devolverle tiempo a tu equipo — no para borrarlo de la ecuación. Tecnología que cuida a quien la usa.',
  },
];

export function ManifestoSection() {
  return (
    <section className="relative bg-ink grain py-24 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-cactus-green/10 blur-[160px]" />

      <div className="container relative mx-auto px-4">
        <Reveal>
          <p className="text-center text-sm font-semibold tracking-[0.25em] uppercase text-cactus-green-light mb-8">
            Nuestro manifiesto
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <blockquote className="text-center max-w-4xl mx-auto">
            <p className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Programar es{' '}
              <span className="font-editorial italic font-medium text-gradient-cactus">
                inteligencia emocional
              </span>
              .
            </p>
            <p className="mt-8 text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              Cada línea de código es una decisión sobre cómo va a sentirse
              una persona al otro lado de la pantalla. Por eso no construimos
              solo software: construimos confianza, claridad y alivio.
            </p>
          </blockquote>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
          {BELIEFS.map((belief, i) => (
            <Reveal key={belief.title} delay={0.15 * i} className="h-full">
              <div className="h-full bg-[#0a1810]/90 p-8 md:p-10">
                <span className="font-mono text-xs text-cactus-green-light/60">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  {belief.title}
                </h3>
                <p className="mt-3 text-sm md:text-base text-white/55 leading-relaxed">
                  {belief.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
