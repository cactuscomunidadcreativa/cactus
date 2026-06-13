'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Counter, Marquee } from '../motion';
import { STATS, MARQUEE_ITEMS } from '../showcase-data';

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero() {
  return (
    <section className="relative bg-ink grain grid-lines overflow-hidden">
      {/* Orbes de luz */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cactus-green/20 blur-[120px] animate-orbit-drift" />
      <div
        className="absolute bottom-1/4 -right-32 w-[28rem] h-[28rem] rounded-full bg-cactus-green-light/15 blur-[140px] animate-orbit-drift"
        style={{ animationDelay: '-9s' }}
      />

      <div className="container relative mx-auto px-4 pt-24 pb-16 md:pt-36 md:pb-24">
        {/* Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex items-center gap-3 mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cactus-green/40 bg-cactus-green/10 text-cactus-green-light text-xs md:text-sm font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cactus-green-light animate-pulse-soft" />
            Estudio de IA &amp; Software
            <span className="hidden sm:inline">· Lima → LATAM</span>
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight text-5xl sm:text-7xl lg:text-[7rem] max-w-6xl">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          >
            Construimos
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease }}
          >
            software que{' '}
            <span className="font-editorial italic font-medium text-gradient-cactus">
              se siente
            </span>
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease }}
          >
            humano.
          </motion.span>
        </h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease }}
          className="mt-8 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed"
        >
          Productos con IA, automatizaciones y plataformas a medida.
          Del octágono de la UFC a los centros de arbitraje, de la
          inteligencia emocional a la financiera —{' '}
          <span className="text-white">si se puede imaginar, lo construimos.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.62, ease }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/proyectos"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-cactus-green text-white font-semibold text-base hover:bg-cactus-green-light hover:text-[#07120c] transition-all duration-300"
          >
            Ver lo que construimos
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/#contacto"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-base hover:border-cactus-green-light hover:text-cactus-green-light transition-all duration-300"
          >
            Hablemos de tu proyecto
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.85 }}
          className="mt-20 md:mt-28 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 border-t border-white/10 pt-10"
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-4xl md:text-5xl font-bold text-white">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm text-white/50 leading-snug max-w-[16rem]">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Marquee de proyectos */}
      <div className="relative border-t border-white/10 py-5">
        <Marquee
          items={MARQUEE_ITEMS}
          className="font-display text-sm md:text-base tracking-[0.25em] text-white/40"
        />
      </div>

      <div className="absolute bottom-24 right-8 hidden lg:flex flex-col items-center gap-2 text-white/30">
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  );
}
