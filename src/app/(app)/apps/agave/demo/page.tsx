'use client';

import { AgaveChat } from '@/modules/agave/components';

export default function AgaveDemoPage() {
  const initialMsg = [
    'Hola! Soy AGAVE, tu asistente de pricing.',
    '',
    '**Esto es un demo** - puedes probar como funciono:',
    '',
    '- Escribe: "A cuanto debo vender si mi costo es $7?"',
    '- O sube un archivo Excel con tus datos',
    '- Pregunta: "Que pasa si doy 10% de descuento?"',
    '',
    'En que te puedo ayudar?',
  ].join('\n');

  return (
    <div className="min-h-screen bg-agave-gradient-soft">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-agave-petrol mb-2">
            AGAVE Demo
          </h1>
          <p className="text-muted-foreground">
            Prueba el asistente de pricing. Pregunta sobre precios, sube archivos o simula escenarios.
          </p>
        </div>

        <div className="h-[600px] shadow-lg rounded-xl overflow-hidden">
          <AgaveChat demoMode={true} initialMessage={initialMsg} />
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard title="Conversacional" desc="Pregunta como hablarias" icon="chat" />
          <FeatureCard title="Sube Excel" desc="O PDF, foto, factura" icon="file" />
          <FeatureCard title="Precio optimo" desc="Basado en tus datos" icon="target" />
          <FeatureCard title="Simula" desc="Escenarios de descuento" icon="refresh" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  const iconMap: Record<string, string> = {
    chat: '\u{1F4AC}',
    file: '\u{1F4CA}',
    target: '\u{1F3AF}',
    refresh: '\u{1F504}',
  };

  return (
    <div className="bg-white rounded-lg p-4 text-center border border-agave-gold/20">
      <div className="text-2xl mb-1">{iconMap[icon]}</div>
      <div className="font-medium text-sm text-agave-petrol">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
