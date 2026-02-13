'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Leaf, Snowflake, Sun, Cloud } from 'lucide-react';

interface EmotionalProfile {
  id: string;
  client_id: string;
  primary_archetype: string;
  style_archetypes: string[];
  archetype_scores: Record<string, number>;
  emotional_season: string;
  mood_tags: string[];
  style_summary: string | null;
  questionnaire_responses: Record<string, unknown>;
  version: number;
  created_at: string;
}

interface ColorPalette {
  id: string;
  colors: { hex: string; name: string; role: string }[];
  warmth: string;
  season: string;
}

interface EmotionalProfileResultsProps {
  profile: EmotionalProfile;
  palette?: ColorPalette | null;
  onRegenerate?: () => void;
}

const ARCHETYPE_INFO: Record<string, { label: string; labelEs: string; description: string; color: string }> = {
  classic_elegance: { label: 'Classic Elegance', labelEs: 'Elegancia Clasica', description: 'Sofisticacion atemporal, prendas nobles, refinamiento discreto', color: '#1E3A5F' },
  modern_minimalist: { label: 'Modern Minimalist', labelEs: 'Minimalista Moderna', description: 'Lineas limpias, monocromo, menos es mas', color: '#4A4A4A' },
  romantic_dreamer: { label: 'Romantic Dreamer', labelEs: 'Romantica Sonadora', description: 'Telas suaves, formas fluidas, detalles delicados', color: '#C77DBA' },
  bold_avant_garde: { label: 'Bold Avant-Garde', labelEs: 'Audaz Vanguardista', description: 'Experimental, piezas statement, rompedora', color: '#DC2626' },
  bohemian_free: { label: 'Bohemian Free', labelEs: 'Bohemia Libre', description: 'Lujo relajado, texturas naturales, espiritu libre', color: '#92702B' },
  power_executive: { label: 'Power Executive', labelEs: 'Ejecutiva Poderosa', description: 'Sastreria impecable, autoridad, sofisticacion sharp', color: '#1A1A1A' },
  ethereal_goddess: { label: 'Ethereal Goddess', labelEs: 'Diosa Eterea', description: 'Drapeados celestiales, otherworldly, movimiento fluido', color: '#8B5CF6' },
  structured_architectural: { label: 'Structured Architectural', labelEs: 'Arquitectonica Estructurada', description: 'Geometrica, escultural, formas definidas', color: '#059669' },
};

const ALL_ARCHETYPES = Object.keys(ARCHETYPE_INFO);

function SeasonIcon({ season }: { season: string }) {
  switch (season) {
    case 'spring': return <Leaf className="w-4 h-4" />;
    case 'summer': return <Sun className="w-4 h-4" />;
    case 'autumn': return <Cloud className="w-4 h-4" />;
    case 'winter': return <Snowflake className="w-4 h-4" />;
    default: return null;
  }
}

const SEASON_LABELS: Record<string, { es: string; color: string }> = {
  spring: { es: 'Primavera', color: '#22C55E' },
  summer: { es: 'Verano', color: '#3B82F6' },
  autumn: { es: 'Otono', color: '#F97316' },
  winter: { es: 'Invierno', color: '#8B5CF6' },
};

const WARMTH_LABELS: Record<string, { es: string }> = {
  warm: { es: 'Calido' },
  cool: { es: 'Frio' },
  neutral: { es: 'Neutro' },
};

// SVG Radar Chart
function RadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const angleStep = (2 * Math.PI) / ALL_ARCHETYPES.length;

  function getPoint(index: number, value: number): [number, number] {
    const angle = angleStep * index - Math.PI / 2;
    return [
      center + radius * value * Math.cos(angle),
      center + radius * value * Math.sin(angle),
    ];
  }

  // Grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = ALL_ARCHETYPES.map((arch, i) => getPoint(i, scores[arch] || 0));
  const dataPath = dataPoints.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {gridCircles.map((r) => (
        <polygon
          key={r}
          points={ALL_ARCHETYPES.map((_, i) => getPoint(i, r).join(',')).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      {ALL_ARCHETYPES.map((_, i) => {
        const [x, y] = getPoint(i, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map(p => p.join(',')).join(' ')}
        fill="#B8943A"
        fillOpacity={0.2}
        stroke="#B8943A"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4}
          fill="#B8943A"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {ALL_ARCHETYPES.map((arch, i) => {
        const [x, y] = getPoint(i, 1.25);
        const info = ARCHETYPE_INFO[arch];
        return (
          <text
            key={arch}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={8}
          >
            {info.labelEs.split(' ')[0]}
          </text>
        );
      })}

      {/* No path d attribute needed */}
      <path d={dataPath} fill="none" stroke="none" />
    </svg>
  );
}

export function EmotionalProfileResults({ profile, palette, onRegenerate }: EmotionalProfileResultsProps) {
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [styleSummary, setStyleSummary] = useState(profile.style_summary);

  const primaryInfo = ARCHETYPE_INFO[profile.primary_archetype] || {
    label: profile.primary_archetype,
    labelEs: profile.primary_archetype,
    description: '',
    color: '#B8943A',
  };

  const secondaryArchetypes = (profile.style_archetypes || []).slice(1, 3);
  const seasonInfo = SEASON_LABELS[profile.emotional_season] || { es: profile.emotional_season, color: '#888' };
  const warmthInfo = WARMTH_LABELS[profile.archetype_scores ? 'warm' : 'neutral'];

  async function generateSummary() {
    setGeneratingSummary(true);
    try {
      const res = await fetch('/api/cereus/ai/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      });
      const data = await res.json();
      if (res.ok && data.style_summary) {
        setStyleSummary(data.style_summary);
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setGeneratingSummary(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">Mapa de Arquetipos</h4>
        <RadarChart scores={profile.archetype_scores || {}} />
      </div>

      {/* Primary Archetype */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryInfo.color}, ${primaryInfo.color}DD)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Arquetipo Principal</p>
            <h3 className="text-xl font-display font-bold mt-1">{primaryInfo.labelEs}</h3>
            <p className="text-sm opacity-90 mt-2">{primaryInfo.description}</p>
          </div>
          <div className="text-3xl font-display font-bold opacity-50">
            {Math.round((profile.archetype_scores?.[profile.primary_archetype] || 0) * 100)}%
          </div>
        </div>
      </div>

      {/* Secondary Archetypes */}
      {secondaryArchetypes.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {secondaryArchetypes.map((arch) => {
            const info = ARCHETYPE_INFO[arch] || { labelEs: arch, description: '', color: '#888' };
            const score = Math.round((profile.archetype_scores?.[arch] || 0) * 100);
            return (
              <div key={arch} className="p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="text-sm font-medium">{info.labelEs}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: info.color }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{score}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Season + Warmth */}
      <div className="flex gap-3">
        <div className="flex-1 p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${seasonInfo.color}20` }}>
            <SeasonIcon season={profile.emotional_season} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estacion Emocional</p>
            <p className="text-sm font-medium" style={{ color: seasonInfo.color }}>{seasonInfo.es}</p>
          </div>
        </div>
        <div className="flex-1 p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cereus-gold/10 flex items-center justify-center">
            <span className="text-lg">
              {profile.emotional_season === 'spring' || profile.emotional_season === 'autumn' ? '🔥' : '❄️'}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Temperatura</p>
            <p className="text-sm font-medium">{warmthInfo?.es || 'Neutro'}</p>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      {palette && palette.colors?.length > 0 && (
        <div className="p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-3">Paleta de Color</p>
          <div className="flex gap-2">
            {palette.colors.map((c, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className="w-full h-12 rounded-lg border border-border/50"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Style Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cereus-gold" />
            Narrativa de Estilo IA
          </h4>
          {styleSummary && (
            <button
              onClick={generateSummary}
              disabled={generatingSummary}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${generatingSummary ? 'animate-spin' : ''}`} />
              Regenerar
            </button>
          )}
        </div>
        {styleSummary ? (
          <blockquote className="text-sm italic text-foreground/80 border-l-2 border-cereus-gold pl-4 font-serif leading-relaxed">
            {styleSummary}
          </blockquote>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Genera una narrativa de estilo personalizada con IA
            </p>
            <button
              onClick={generateSummary}
              disabled={generatingSummary}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-60 transition-colors"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generar Narrativa
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Regenerate profile button */}
      {onRegenerate && (
        <div className="text-center">
          <button
            onClick={onRegenerate}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retomar cuestionario
          </button>
        </div>
      )}

      {/* Version info */}
      <p className="text-xs text-muted-foreground text-center">
        Perfil v{profile.version} — {new Date(profile.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}
