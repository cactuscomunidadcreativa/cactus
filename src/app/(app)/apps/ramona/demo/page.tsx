'use client';

import { useState } from 'react';
import {
  RamonaAvatar,
  RamonaLoading,
  RamonaEmpty,
  RamonaCelebrate,
} from '@/modules/ramona/components/ramona-avatar';
import { Confetti } from '@/modules/ramona/components/confetti';

type AvatarState = 'idle' | 'thinking' | 'talking' | 'celebrating' | 'sleeping' | 'waving' | 'love';

export default function RamonaDemoPage() {
  const [currentState, setCurrentState] = useState<AvatarState>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [showHearts, setShowHearts] = useState(false);

  const states: AvatarState[] = ['idle', 'thinking', 'talking', 'celebrating', 'sleeping', 'waving', 'love'];

  return (
    <div className="min-h-screen bg-background p-8">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-2 bg-ramona-gradient bg-clip-text text-transparent">
            Ramona Avatar Demo
          </h1>
          <p className="text-muted-foreground">Animaciones y estados del avatar de Ramona</p>
        </div>

        {/* Interactive Demo */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Avatar Interactivo</h2>

          <div className="flex flex-col items-center gap-8">
            {/* Main Avatar */}
            <div className="relative">
              <RamonaAvatar
                state={currentState}
                size="2xl"
                showSparkles={showSparkles}
                showSpeechBubble={showSpeechBubble}
                speechText="¡Hola! Soy Ramona, tu asistente de marketing con IA 🌵"
                interactive
                showHearts={showHearts}
              />
            </div>

            {/* State Selector */}
            <div className="flex flex-wrap justify-center gap-2">
              {states.map((state) => (
                <button
                  key={state}
                  onClick={() => setCurrentState(state)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentState === state
                      ? 'bg-ramona-purple text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>

            {/* Toggle Options */}
            <div className="flex flex-wrap justify-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showSparkles}
                  onChange={(e) => setShowSparkles(e.target.checked)}
                  className="w-4 h-4 accent-ramona-purple"
                />
                <span className="text-sm">Sparkles ✨</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showHearts}
                  onChange={(e) => setShowHearts(e.target.checked)}
                  className="w-4 h-4 accent-ramona-purple"
                />
                <span className="text-sm">Hearts 💜</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showSpeechBubble}
                  onChange={(e) => setShowSpeechBubble(e.target.checked)}
                  className="w-4 h-4 accent-ramona-purple"
                />
                <span className="text-sm">Speech 💬</span>
              </label>
              <button
                onClick={() => setShowConfetti(true)}
                className="px-4 py-2 bg-ramona-orange text-white rounded-lg text-sm hover:scale-105 transition-transform font-medium"
              >
                🎉 Confetti!
              </button>
            </div>
            <p className="text-xs text-muted-foreground">💡 Haz clic en Ramona para que salte!</p>
          </div>
        </section>

        {/* Size Variants */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Tamaños</h2>
          <div className="flex items-end justify-center gap-8">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <RamonaAvatar state="idle" size={size} />
                <span className="text-xs text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </section>

        {/* All States */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Todos los Estados</h2>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            {states.map((state) => (
              <div key={state} className="flex flex-col items-center gap-3">
                <RamonaAvatar
                  state={state}
                  size="lg"
                  showSparkles={state === 'celebrating'}
                  showHearts={state === 'love'}
                />
                <span className="text-xs font-medium capitalize text-muted-foreground">{state}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Utility Components */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-center">Componentes de Utilidad</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loading */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                RamonaLoading
              </h3>
              <RamonaLoading text="Generando contenido..." />
            </div>

            {/* Celebrate */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                RamonaCelebrate
              </h3>
              <RamonaCelebrate
                title="¡Contenido generado!"
                description="Tu post está listo para publicar"
              />
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              RamonaEmpty
            </h3>
            <RamonaEmpty
              title="No hay contenido aún"
              description="Comienza una conversación conmigo para crear tu primer post"
              action={
                <button className="px-4 py-2 bg-ramona-purple text-white rounded-lg text-sm hover:bg-ramona-purple-light">
                  Empezar ahora
                </button>
              }
            />
          </div>
        </section>

        {/* Color Palette */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Paleta de Colores</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-purple" />
              <span className="text-xs">purple</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-purple-light" />
              <span className="text-xs">purple-light</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-purple-lighter border" />
              <span className="text-xs">purple-lighter</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-orange" />
              <span className="text-xs">orange</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-orange-light" />
              <span className="text-xs">orange-light</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-ramona-gradient" />
              <span className="text-xs">gradient</span>
            </div>
          </div>
        </section>

        {/* CSS Animation Classes */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Clases de Animación CSS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-ramona-purple rounded-full animate-ramona-float" />
              <code className="text-xs">animate-ramona-float</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-ramona-purple rounded-full animate-ramona-bounce" />
              <code className="text-xs">animate-ramona-bounce</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-ramona-purple rounded-full animate-ramona-pulse" />
              <code className="text-xs">animate-ramona-pulse</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-full h-8 mx-auto mb-2 rounded-full animate-ramona-shimmer" />
              <code className="text-xs">animate-ramona-shimmer</code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
