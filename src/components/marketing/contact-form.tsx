'use client';

/**
 * Contact form — no backend required.
 * Builds the message and hands it off to WhatsApp (primary) or email.
 */

import { useState } from 'react';
import { Send, Mail } from 'lucide-react';

const WHATSAPP_NUMBER = '17863954654';
const CONTACT_EMAIL = 'eduardo@cactuscomunidadcreativa.com';

export function ContactForm() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');

  const buildText = () =>
    `Hola Cactus 🌵 Soy ${nombre || '…'}.\n\n${mensaje || 'Quiero conversar sobre un proyecto.'}\n\nMi email: ${email || '—'}`;

  const sendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildText())}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(
      `Proyecto con Cactus — ${nombre || 'nuevo contacto'}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(buildText())}`;
  };

  return (
    <form className="space-y-4" onSubmit={sendWhatsApp}>
      <div>
        <label htmlFor="contact-nombre" className="block text-sm font-medium mb-2">
          Nombre
        </label>
        <input
          id="contact-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          required
          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green transition-shadow"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green transition-shadow"
        />
      </div>
      <div>
        <label htmlFor="contact-mensaje" className="block text-sm font-medium mb-2">
          Mensaje
        </label>
        <textarea
          id="contact-mensaje"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Cuentanos sobre tu proyecto..."
          required
          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cactus-green resize-none transition-shadow"
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#1fb858] hover:shadow-lg hover:shadow-[#25D366]/30 transition-all flex items-center justify-center gap-2"
      >
        Enviar por WhatsApp
        <Send className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={sendEmail}
        className="w-full px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:border-cactus-green hover:text-cactus-green transition-colors flex items-center justify-center gap-2"
      >
        O enviar por email
        <Mail className="w-4 h-4" />
      </button>
    </form>
  );
}
