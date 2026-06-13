'use client';

import { MessageCircle, Mail, MapPin } from 'lucide-react';
import { Reveal } from '../motion';
import { ContactForm } from '../contact-form';

const CHANNELS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+1 (786) 395-4654',
    href: 'https://wa.me/17863954654',
    note: 'Respuesta en minutos',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'eduardo@cactuscomunidadcreativa.com',
    href: 'mailto:eduardo@cactuscomunidadcreativa.com',
    note: 'Para propuestas y proyectos',
  },
  {
    icon: MapPin,
    label: 'Base',
    value: 'Lima, Perú → LATAM',
    href: undefined,
    note: 'Trabajamos con toda la región',
  },
];

export function ContactSection() {
  return (
    <section id="contacto" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Columna izquierda: pitch */}
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cactus-green/30 bg-cactus-green/5 text-cactus-green text-xs font-medium tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cactus-green animate-pulse-soft" />
              Disponibles ahora
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              Tienes una idea.{' '}
              <span className="font-editorial italic font-medium text-cactus-green">
                Nosotros, las espinas
              </span>{' '}
              para defenderla.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Cuéntanos qué quieres construir, automatizar o transformar.
              Te respondemos con una propuesta concreta — no con una
              reunión para agendar otra reunión.
            </p>

            <div className="mt-10 space-y-4">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const content = (
                  <div className="flex items-center gap-4 rounded-xl border bg-card p-4 card-glow hover:shadow-lg hover:border-cactus-green/40">
                    <span className="flex w-11 h-11 shrink-0 items-center justify-center rounded-full bg-cactus-green/10 text-cactus-green">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{channel.label}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {channel.value}
                      </p>
                    </div>
                    <span className="ml-auto hidden sm:block text-xs text-muted-foreground/70 whitespace-nowrap">
                      {channel.note}
                    </span>
                  </div>
                );
                return channel.href ? (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target={channel.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={channel.label}>{content}</div>
                );
              })}
            </div>
          </Reveal>

          {/* Columna derecha: formulario */}
          <Reveal delay={0.15}>
            <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-xl shadow-cactus-green/5">
              <h3 className="font-display text-xl font-bold mb-1">
                Hablemos de tu proyecto
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tres campos. Treinta segundos. Una conversación real.
              </p>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
