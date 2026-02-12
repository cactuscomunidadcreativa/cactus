'use client';

import { useState } from 'react';
import {
  TunaAvatar,
  TunaLoading,
  TunaEmpty,
  TunaSuccess,
  TunaInline,
  TunaSeal,
} from '@/modules/tuna/components/tuna-avatar';

type AvatarState = 'idle' | 'processing' | 'consolidating' | 'success' | 'error' | 'waiting';

export default function TunaDemoPage() {
  const [currentState, setCurrentState] = useState<AvatarState>('idle');
  const [showDataNodes, setShowDataNodes] = useState(false);
  const [showOrbitIcons, setShowOrbitIcons] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [progress, setProgress] = useState(50);

  const states: AvatarState[] = ['idle', 'processing', 'consolidating', 'success', 'error', 'waiting'];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-2 bg-tuna-gradient bg-clip-text text-transparent">
            TUNA Avatar Demo
          </h1>
          <p className="text-muted-foreground">El Cierre de Campaña. Consolidado.</p>
        </div>

        {/* Interactive Demo */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Avatar Interactivo</h2>

          <div className="flex flex-col items-center gap-8">
            {/* Main Avatar */}
            <div className="relative">
              <TunaAvatar
                state={currentState}
                size="2xl"
                showDataNodes={showDataNodes}
                showOrbitIcons={showOrbitIcons}
                showGlow={showGlow}
                progress={progress}
                interactive
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
                      ? 'bg-tuna-magenta text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>

            {/* Progress slider (for processing state) */}
            {currentState === 'processing' && (
              <div className="w-full max-w-xs">
                <label className="text-sm text-muted-foreground mb-2 block">Progreso: {progress}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-tuna-magenta"
                />
              </div>
            )}

            {/* Toggle Options */}
            <div className="flex flex-wrap justify-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showDataNodes}
                  onChange={(e) => setShowDataNodes(e.target.checked)}
                  className="w-4 h-4 accent-tuna-magenta"
                />
                <span className="text-sm">Data Nodes 📊</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showOrbitIcons}
                  onChange={(e) => setShowOrbitIcons(e.target.checked)}
                  className="w-4 h-4 accent-tuna-magenta"
                />
                <span className="text-sm">Orbit Icons 🔄</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                <input
                  type="checkbox"
                  checked={showGlow}
                  onChange={(e) => setShowGlow(e.target.checked)}
                  className="w-4 h-4 accent-tuna-magenta"
                />
                <span className="text-sm">Glow ✨</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">💡 Haz clic en TUNA para ver la animación de sello!</p>
          </div>
        </section>

        {/* Size Variants */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Tamaños</h2>
          <div className="flex items-end justify-center gap-8">
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <TunaAvatar state="idle" size={size} />
                <span className="text-xs text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </section>

        {/* All States */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Todos los Estados</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {states.map((state) => (
              <div key={state} className="flex flex-col items-center gap-3">
                <TunaAvatar
                  state={state}
                  size="lg"
                  showDataNodes={state === 'consolidating'}
                  showOrbitIcons={state === 'processing'}
                  showGlow={state === 'success'}
                  progress={state === 'processing' ? 65 : 0}
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
                TunaLoading
              </h3>
              <TunaLoading text="Consolidando datos..." />
            </div>

            {/* Success */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                TunaSuccess
              </h3>
              <TunaSuccess
                title="¡Campaña Consolidada!"
                description="Todos los datos han sido validados"
              />
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              TunaEmpty
            </h3>
            <TunaEmpty
              title="No hay datos de campaña"
              description="Sube tu primer archivo para comenzar el cierre de campaña"
              action={
                <button className="px-4 py-2 bg-tuna-magenta text-white rounded-lg text-sm hover:bg-tuna-magenta-light">
                  Cargar Datos
                </button>
              }
            />
          </div>
        </section>

        {/* Seals */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Sellos TUNA</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <TunaSeal status="pending" size="lg" />
              <span className="text-xs text-muted-foreground">Pendiente</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TunaSeal status="approved" size="lg" />
              <span className="text-xs text-muted-foreground">Aprobado</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TunaSeal status="rejected" size="lg" />
              <span className="text-xs text-muted-foreground">Rechazado</span>
            </div>
          </div>
        </section>

        {/* Inline Usage */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">TunaInline</h2>
          <p className="text-center text-muted-foreground">
            El reporte fue generado por <TunaInline /> y está listo para su revisión.
          </p>
        </section>

        {/* Color Palette */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Paleta de Colores</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-magenta" />
              <span className="text-xs">magenta</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-magenta-light" />
              <span className="text-xs">magenta-light</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-magenta-lighter border" />
              <span className="text-xs">magenta-lighter</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-purple" />
              <span className="text-xs">purple</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-purple-light" />
              <span className="text-xs">purple-light</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-green" />
              <span className="text-xs">green</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-tuna-gradient" />
              <span className="text-xs">gradient</span>
            </div>
          </div>
        </section>

        {/* CSS Animation Classes */}
        <section className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Clases de Animación CSS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-float" />
              <code className="text-xs">animate-tuna-float</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-process" />
              <code className="text-xs">animate-tuna-process</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-glow" />
              <code className="text-xs">animate-tuna-glow</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-data-pulse" />
              <code className="text-xs">animate-tuna-data-pulse</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-full h-8 mx-auto mb-2 rounded-full animate-tuna-shimmer" />
              <code className="text-xs">animate-tuna-shimmer</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-sparkle" />
              <code className="text-xs">animate-tuna-sparkle</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="h-16 w-4 mx-auto mb-2 bg-tuna-gradient rounded animate-tuna-bar-grow" />
              <code className="text-xs">animate-tuna-bar-grow</code>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center relative">
              <div className="w-4 h-4 mx-auto mb-2 bg-tuna-magenta rounded-full animate-tuna-orbit" style={{ position: 'relative' }} />
              <code className="text-xs">animate-tuna-orbit</code>
            </div>
          </div>
        </section>

        {/* Concept */}
        <section className="bg-tuna-gradient-dark rounded-2xl border border-tuna-purple p-8 text-white">
          <div className="text-center space-y-4">
            <TunaAvatar state="success" size="xl" showGlow />
            <h2 className="text-2xl font-bold font-display">Si no está en TUNA, no existe.</h2>
            <p className="text-white/70 max-w-md mx-auto">
              TUNA es el punto único donde Producción, Costos, Ventas y Presupuesto
              se encuentran, se validan y se explican automáticamente para cerrar
              una campaña agrícola sin fricción.
            </p>
            <div className="pt-4">
              <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium">
                🍇 El Fruto de la Estrategia
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
