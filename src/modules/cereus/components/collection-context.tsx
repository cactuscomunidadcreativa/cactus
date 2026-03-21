'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  Thermometer,
  Droplets,
  Calendar,
  Crown,
  Minus,
  Heart,
  Zap,
  Leaf,
  Briefcase,
  Star,
  Box,
  DollarSign,
  Hash,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Scissors,
  Palette,
  Layers,
  X,
  Pencil,
  Plus,
  RotateCcw,
  Check,
  FileText,
  CloudSun,
  Users,
  StickyNote,
  ImageIcon,
} from 'lucide-react';
import { ImageUploader } from './image-uploader';
import type {
  TrendSilhouette,
  ColorStory,
  FabricTrend,
  DetailTrend,
} from '../lib/trend-engine';

// ─── TYPES ──────────────────────────────────────────────────

export interface PinnedTrends {
  silhouettes: TrendSilhouette[];
  colorStories: ColorStory[];
  fabricTrends: FabricTrend[];
  details: DetailTrend[];
  moodKeywords: string[];
}

export interface MarketContext {
  city: string;
  country: string;
  avgTemp: number;
  humidity: string;
  targetArchetypes: string[];
  budgetMin: number;
  budgetMax: number;
  targetPieces: number;
  referenceImageUrls: string[];
  notes: string;
}

interface CollectionContextProps {
  maisonId: string;
  onComplete: (
    pinnedTrends: PinnedTrends,
    season: string,
    year: number,
    marketContext: MarketContext,
  ) => void;
}

interface GeneratedTrends {
  silhouettes: TrendSilhouette[];
  colorStories: ColorStory[];
  fabricTrends: (FabricTrend & { weight?: number; composition?: string })[];
  details: DetailTrend[];
  moodKeywords: string[];
  climateNotes: string;
  archetypeNotes: string;
}

// ─── CONSTANTS ──────────────────────────────────────────────

const SEASONS = [
  { value: 'spring_summer', label: 'Primavera/Verano' },
  { value: 'fall_winter', label: 'Otono/Invierno' },
  { value: 'resort', label: 'Resort' },
  { value: 'capsule', label: 'Capsula' },
  { value: 'bridal', label: 'Nupcial' },
] as const;

const HUMIDITY_OPTIONS = [
  { value: 'humedo', label: 'Humedo' },
  { value: 'seco', label: 'Seco' },
  { value: 'templado', label: 'Templado' },
  { value: 'tropical', label: 'Tropical' },
  { value: 'frio', label: 'Frio' },
] as const;

const ARCHETYPES = [
  {
    id: 'classic_elegance',
    name: 'Elegancia Clasica',
    description: 'Sofisticacion atemporal, detalles refinados',
    icon: Crown,
  },
  {
    id: 'modern_minimalist',
    name: 'Minimalista Moderna',
    description: 'Lineas limpias, simplicidad arquitectonica',
    icon: Minus,
  },
  {
    id: 'romantic_dreamer',
    name: 'Romantica Sonadora',
    description: 'Telas suaves, formas fluidas, detalles femeninos',
    icon: Heart,
  },
  {
    id: 'bold_avant_garde',
    name: 'Vanguardista Audaz',
    description: 'Experimental, piezas declaracion',
    icon: Zap,
  },
  {
    id: 'bohemian_free',
    name: 'Bohemia Libre',
    description: 'Lujo relajado, texturas naturales',
    icon: Leaf,
  },
  {
    id: 'power_executive',
    name: 'Ejecutiva Poderosa',
    description: 'Sastreria afilada, presencia imponente',
    icon: Briefcase,
  },
  {
    id: 'ethereal_goddess',
    name: 'Diosa Eterea',
    description: 'Telas drapeadas, paletas celestiales',
    icon: Star,
  },
  {
    id: 'structured_architectural',
    name: 'Arquitectonica',
    description: 'Formas geometricas, construccion como arte',
    icon: Box,
  },
] as const;

// ─── HELPERS ────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function totalItems(t: GeneratedTrends): number {
  return (
    t.silhouettes.length +
    t.colorStories.length +
    t.fabricTrends.length +
    t.details.length +
    t.moodKeywords.length
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function CollectionContext({ maisonId, onComplete }: CollectionContextProps) {
  // Phase
  const [phase, setPhase] = useState<'input' | 'results'>('input');
  const [generating, setGenerating] = useState(false);

  // Market context form
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [avgTemp, setAvgTemp] = useState(25);
  const [humidity, setHumidity] = useState('templado');
  const [season, setSeason] = useState('spring_summer');
  const [year, setYear] = useState(2026);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState(50);
  const [budgetMax, setBudgetMax] = useState(300);
  const [targetPieces, setTargetPieces] = useState(10);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Generated trends (editable)
  const [trends, setTrends] = useState<GeneratedTrends | null>(null);

  // Editing state
  const [editingIndex, setEditingIndex] = useState<{ section: string; index: number } | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  // ─── Archetype toggle ─────────────────────────────────────

  const toggleArchetype = useCallback((id: string) => {
    setSelectedArchetypes((prev) => {
      if (prev.includes(id)) return prev.filter((a) => a !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // ─── Image handling ───────────────────────────────────────

  const handleImageUpload = useCallback((url: string) => {
    setReferenceUrls((prev) => [...prev, url]);
  }, []);

  const handleImageRemove = useCallback((url: string) => {
    setReferenceUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  // ─── Generate trends ─────────────────────────────────────

  const canGenerate = city.trim().length > 0 && selectedArchetypes.length > 0;

  const generateTrends = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true);

    const marketContext: MarketContext = {
      city,
      country,
      avgTemp,
      humidity,
      targetArchetypes: selectedArchetypes,
      budgetMin,
      budgetMax,
      targetPieces,
      referenceImageUrls: referenceUrls,
      notes,
    };

    try {
      const res = await fetch('/api/cereus/ai/generate-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          season,
          year,
          marketContext,
        }),
      });

      if (!res.ok) throw new Error('Error generando tendencias');

      const data = await res.json();
      setTrends(data);
      setPhase('results');
    } catch (err) {
      console.error('Error generating trends:', err);
      // Fallback: generate placeholder data so the UI still works
      setTrends({
        silhouettes: [
          {
            name: 'Silueta Fluida',
            description: `Formas drapeadas adaptadas al clima de ${city}. Frescura y movimiento.`,
            garmentTypes: ['dress', 'blouse', 'skirt'],
            keywords: ['fluido', 'drapeado', 'fresco'],
          },
          {
            name: 'Estructura Liviana',
            description: 'Sastreria con materiales ligeros. Forma sin peso.',
            garmentTypes: ['blazer', 'pants', 'jumpsuit'],
            keywords: ['estructurado', 'ligero', 'moderno'],
          },
        ],
        colorStories: [
          {
            name: 'Tierra y Sol',
            description: 'Tonos terrosos con acentos dorados inspirados en el paisaje local.',
            colors: ['#C9A84C', '#8B7355', '#D4C4A8', '#2C1810', '#E8D5B7'],
            mood: 'Calido, organico, sofisticado',
          },
          {
            name: 'Mar Profundo',
            description: 'Azules intensos con toques de espuma y arena.',
            colors: ['#1B3A4B', '#6FB3B8', '#E8E8E8', '#2C3E50', '#88C0D0'],
            mood: 'Sereno, profundo, misterioso',
          },
        ],
        fabricTrends: [
          {
            name: 'Algodones Nobles',
            description: 'Algodones de alta densidad con acabados sedosos.',
            fabrics: ['Algodon Pima', 'Popelina', 'Batista'],
            finish: 'Mercerizado',
            weight: 140,
            composition: '100% Algodon Pima',
          },
          {
            name: 'Linos Estructurados',
            description: 'Linos con cuerpo para piezas con forma definida.',
            fabrics: ['Lino Belga', 'Lino-Algodon', 'Lino Lavado'],
            finish: 'Stone wash',
            weight: 180,
            composition: '85% Lino / 15% Algodon',
          },
        ],
        details: [
          {
            name: 'Botones Artesanales',
            description: 'Botones de materiales naturales como coco, hueso o nacar.',
            elements: ['boton coco', 'nacar', 'hueso'],
            placement: ['centro frente', 'puno', 'cintura'],
          },
          {
            name: 'Bordado Sutil',
            description: 'Bordados tonales discretos que aportan textura.',
            elements: ['bordado tonal', 'punto cadena', 'calado'],
            placement: ['cuello', 'bolsillo', 'dobladillo'],
          },
        ],
        moodKeywords: [
          'fresco',
          'artesanal',
          'luminoso',
          'relajado',
          'sofisticado',
          'organico',
          'movimiento',
          'textura',
        ],
        climateNotes: `Para ${city} con temperatura promedio de ${avgTemp} grados C y humedad ${humidity}, se recomiendan telas transpirables y construcciones que permitan circulacion de aire. Priorizar fibras naturales y acabados frescos.`,
        archetypeNotes: `Perfil de cliente: ${selectedArchetypes.map((a) => ARCHETYPES.find((ar) => ar.id === a)?.name).join(', ')}. Se combinan elementos de cada arquetipo para crear una propuesta coherente y diferenciada.`,
      });
      setPhase('results');
    } finally {
      setGenerating(false);
    }
  }, [
    canGenerate,
    city,
    country,
    avgTemp,
    humidity,
    selectedArchetypes,
    budgetMin,
    budgetMax,
    targetPieces,
    referenceUrls,
    notes,
    maisonId,
    season,
    year,
  ]);

  // ─── Edit helpers ─────────────────────────────────────────

  const removeSilhouette = (index: number) => {
    setTrends((prev) => prev && { ...prev, silhouettes: prev.silhouettes.filter((_, i) => i !== index) });
  };

  const removeColorStory = (index: number) => {
    setTrends((prev) => prev && { ...prev, colorStories: prev.colorStories.filter((_, i) => i !== index) });
  };

  const removeFabric = (index: number) => {
    setTrends((prev) => prev && { ...prev, fabricTrends: prev.fabricTrends.filter((_, i) => i !== index) });
  };

  const removeDetail = (index: number) => {
    setTrends((prev) => prev && { ...prev, details: prev.details.filter((_, i) => i !== index) });
  };

  const removeMoodKeyword = (keyword: string) => {
    setTrends((prev) => prev && { ...prev, moodKeywords: prev.moodKeywords.filter((k) => k !== keyword) });
  };

  const addMoodKeyword = () => {
    if (!newKeyword.trim() || !trends) return;
    setTrends({ ...trends, moodKeywords: [...trends.moodKeywords, newKeyword.trim()] });
    setNewKeyword('');
  };

  const addSilhouette = () => {
    if (!trends) return;
    setTrends({
      ...trends,
      silhouettes: [
        ...trends.silhouettes,
        { name: 'Nueva Silueta', description: '', garmentTypes: [], keywords: [] },
      ],
    });
    setEditingIndex({ section: 'silhouettes', index: trends.silhouettes.length });
  };

  const addColorStory = () => {
    if (!trends) return;
    setTrends({
      ...trends,
      colorStories: [
        ...trends.colorStories,
        { name: 'Nueva Paleta', description: '', colors: ['#C9A84C'], mood: '' },
      ],
    });
    setEditingIndex({ section: 'colorStories', index: trends.colorStories.length });
  };

  const addFabric = () => {
    if (!trends) return;
    setTrends({
      ...trends,
      fabricTrends: [
        ...trends.fabricTrends,
        { name: 'Nueva Tela', description: '', fabrics: [], finish: '', weight: 0, composition: '' },
      ],
    });
    setEditingIndex({ section: 'fabricTrends', index: trends.fabricTrends.length });
  };

  const addDetail = () => {
    if (!trends) return;
    setTrends({
      ...trends,
      details: [
        ...trends.details,
        { name: 'Nuevo Detalle', description: '', elements: [], placement: [] },
      ],
    });
    setEditingIndex({ section: 'details', index: trends.details.length });
  };

  // ─── Approve & Complete ───────────────────────────────────

  const handleApprove = useCallback(() => {
    if (!trends) return;

    const pinnedTrends: PinnedTrends = {
      silhouettes: trends.silhouettes,
      colorStories: trends.colorStories,
      fabricTrends: trends.fabricTrends.map(({ weight, composition, ...rest }) => rest),
      details: trends.details,
      moodKeywords: trends.moodKeywords,
    };

    const marketContext: MarketContext = {
      city,
      country,
      avgTemp,
      humidity,
      targetArchetypes: selectedArchetypes,
      budgetMin,
      budgetMax,
      targetPieces,
      referenceImageUrls: referenceUrls,
      notes,
    };

    onComplete(pinnedTrends, season, year, marketContext);
  }, [
    trends,
    city,
    country,
    avgTemp,
    humidity,
    selectedArchetypes,
    budgetMin,
    budgetMax,
    targetPieces,
    referenceUrls,
    notes,
    season,
    year,
    onComplete,
  ]);

  // ─── RENDER: Phase 1 — Input Form ────────────────────────

  if (phase === 'input') {
    return (
      <div className="relative min-h-screen bg-cereus-noir pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-white/5 bg-cereus-noir/95 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-6 py-5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-cereus-gold" />
              <h1 className="text-lg font-semibold tracking-tight text-white/90 font-display">
                Contexto del Mercado
              </h1>
            </div>
            <p className="mt-1 text-xs text-white/35">
              Define el contexto de tu coleccion. La IA generara tendencias personalizadas.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 py-8 space-y-10">
          {/* ── Section 1: Mercado Destino ──────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <MapPin className="h-4 w-4 text-cereus-gold" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Mercado Destino
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lima"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Pais</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Peru"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  <Thermometer className="inline h-3 w-3 mr-1" />
                  Temperatura promedio
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={avgTemp}
                    onChange={(e) => setAvgTemp(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                    grados C
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  <Droplets className="inline h-3 w-3 mr-1" />
                  Humedad
                </label>
                <div className="relative">
                  <select
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-9 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                  >
                    {HUMIDITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Temporada ───────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Calendar className="h-4 w-4 text-cereus-gold" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Temporada
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Temporada</label>
                <div className="relative">
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-9 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                  >
                    {SEASONS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-neutral-900 text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Ano</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2024}
                  max={2030}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
            </div>
          </section>

          {/* ── Section 3: Arquetipos ──────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Users className="h-4 w-4 text-cereus-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                  Arquetipos de Cliente
                </h2>
                <p className="text-[11px] text-white/35 mt-0.5">
                  Selecciona entre 1 y 3 arquetipos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ARCHETYPES.map((arch) => {
                const selected = selectedArchetypes.includes(arch.id);
                const Icon = arch.icon;
                const disabled = !selected && selectedArchetypes.length >= 3;

                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => !disabled && toggleArchetype(arch.id)}
                    disabled={disabled}
                    className={cn(
                      'group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-300',
                      selected
                        ? 'border-cereus-gold/60 bg-cereus-gold/10 shadow-lg shadow-cereus-gold/10'
                        : disabled
                          ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] cursor-pointer',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                        selected
                          ? 'bg-cereus-gold/20 text-cereus-gold'
                          : 'bg-white/5 text-white/40 group-hover:text-white/60',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          'text-xs font-semibold transition-colors',
                          selected ? 'text-cereus-gold' : 'text-white/70',
                        )}
                      >
                        {arch.name}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5 line-clamp-2">
                        {arch.description}
                      </p>
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cereus-gold">
                        <Check className="h-3 w-3 text-cereus-noir" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Section 4: Presupuesto y Cantidad ──────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <DollarSign className="h-4 w-4 text-cereus-gold" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Presupuesto y Cantidad
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Precio minimo por pieza (USD)
                </label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Precio maximo por pieza (USD)
                </label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Cantidad de piezas objetivo
                </label>
                <input
                  type="number"
                  value={targetPieces}
                  onChange={(e) => setTargetPieces(Number(e.target.value))}
                  min={1}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
                />
              </div>
            </div>
          </section>

          {/* ── Section 5: Referencias ─────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <ImageIcon className="h-4 w-4 text-cereus-gold" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Referencias de Inspiracion
              </h2>
            </div>

            <ImageUploader
              bucket="cereus-garment-images"
              folder="references"
              multiple
              label="Upload inspiration images"
              labelEs="Sube imagenes de inspiracion"
              onUpload={handleImageUpload}
              existingImages={referenceUrls}
              onRemove={handleImageRemove}
            />
          </section>

          {/* ── Section 6: Notas ───────────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <StickyNote className="h-4 w-4 text-cereus-gold" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Notas del Disenador
              </h2>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe tu vision, inspiracion, restricciones..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20 resize-none"
            />
          </section>
        </div>

        {/* ── Generate Button (sticky bottom) ──────────────── */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/8 bg-cereus-noir/95 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <button
              type="button"
              onClick={generateTrends}
              disabled={!canGenerate || generating}
              className={cn(
                'w-full group inline-flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300',
                canGenerate && !generating
                  ? 'bg-cereus-gold text-cereus-noir shadow-lg shadow-cereus-gold/20 hover:shadow-cereus-gold/30 hover:brightness-110 active:scale-[0.98]'
                  : 'bg-white/5 text-white/25 cursor-not-allowed',
              )}
            >
              {generating ? (
                <>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span>Generando tendencias con IA...</span>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generar Tendencias con IA
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            {!canGenerate && !generating && (
              <p className="text-center text-[11px] text-white/30 mt-2">
                Completa al menos la ciudad y selecciona 1 arquetipo para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Phase 2 — Results (Editable) ─────────────────

  if (!trends) return null;

  const itemCount = totalItems(trends);

  return (
    <div className="relative min-h-screen bg-cereus-noir pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-cereus-noir/95 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-cereus-gold" />
                <h1 className="text-lg font-semibold tracking-tight text-white/90 font-display">
                  Tendencias Generadas
                </h1>
              </div>
              <p className="mt-1 text-xs text-white/35">
                {city}, {country} — {SEASONS.find((s) => s.value === season)?.label} {year}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPhase('input')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              Editar Contexto
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6 space-y-8">
        {/* ── Siluetas ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Scissors className="h-4 w-4 text-cereus-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                  Siluetas Sugeridas
                </h2>
                <p className="text-[11px] text-white/35">{trends.silhouettes.length} siluetas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addSilhouette}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Agregar Silueta
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trends.silhouettes.map((item, i) => {
              const isEditing = editingIndex?.section === 'silhouettes' && editingIndex.index === i;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15"
                >
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingIndex(isEditing ? null : { section: 'silhouettes', index: i })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSilhouette(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pr-16">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...trends.silhouettes];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setTrends({ ...trends, silhouettes: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-cereus-gold/50"
                        placeholder="Nombre"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...trends.silhouettes];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setTrends({ ...trends, silhouettes: updated });
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50 resize-none"
                        placeholder="Descripcion"
                      />
                      <input
                        type="text"
                        value={item.garmentTypes.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.silhouettes];
                          updated[i] = {
                            ...updated[i],
                            garmentTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, silhouettes: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Tipos de prenda (separados por coma)"
                      />
                      <input
                        type="text"
                        value={item.keywords.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.silhouettes];
                          updated[i] = {
                            ...updated[i],
                            keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, silhouettes: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Keywords (separadas por coma)"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-medium text-white/90 pr-16 font-display">
                        {item.name}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.garmentTypes.map((g) => (
                          <span
                            key={g}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                      {item.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.keywords.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded-full border border-cereus-gold/15 bg-cereus-gold/5 px-2 py-0.5 text-[10px] text-cereus-gold/60"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Paletas de Color ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Palette className="h-4 w-4 text-cereus-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                  Paletas de Color
                </h2>
                <p className="text-[11px] text-white/35">{trends.colorStories.length} paletas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addColorStory}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Agregar Paleta
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trends.colorStories.map((item, i) => {
              const isEditing = editingIndex?.section === 'colorStories' && editingIndex.index === i;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15"
                >
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingIndex(isEditing ? null : { section: 'colorStories', index: i })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColorStory(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pr-16">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...trends.colorStories];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setTrends({ ...trends, colorStories: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-cereus-gold/50"
                        placeholder="Nombre de la paleta"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...trends.colorStories];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setTrends({ ...trends, colorStories: updated });
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50 resize-none"
                        placeholder="Descripcion"
                      />
                      <input
                        type="text"
                        value={item.colors.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.colorStories];
                          updated[i] = {
                            ...updated[i],
                            colors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, colorStories: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Colores hex (separados por coma)"
                      />
                      <input
                        type="text"
                        value={item.mood}
                        onChange={(e) => {
                          const updated = [...trends.colorStories];
                          updated[i] = { ...updated[i], mood: e.target.value };
                          setTrends({ ...trends, colorStories: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Mood"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-medium text-white/90 pr-16 font-display">
                        {item.name}
                      </h4>
                      <div className="mt-3 flex items-center gap-1.5">
                        {item.colors.map((color, ci) => (
                          <div
                            key={ci}
                            className="h-7 w-7 rounded-full border border-white/10 shadow-inner"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-white/45 line-clamp-2">
                        {item.description}
                      </p>
                      <p className="mt-2 text-[11px] italic text-cereus-gold/60">{item.mood}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Telas Sugeridas ──────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Layers className="h-4 w-4 text-cereus-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                  Telas Sugeridas
                </h2>
                <p className="text-[11px] text-white/35">{trends.fabricTrends.length} telas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addFabric}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Agregar Tela
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trends.fabricTrends.map((item, i) => {
              const isEditing = editingIndex?.section === 'fabricTrends' && editingIndex.index === i;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15"
                >
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingIndex(isEditing ? null : { section: 'fabricTrends', index: i })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFabric(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pr-16">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...trends.fabricTrends];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setTrends({ ...trends, fabricTrends: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-cereus-gold/50"
                        placeholder="Nombre"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...trends.fabricTrends];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setTrends({ ...trends, fabricTrends: updated });
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50 resize-none"
                        placeholder="Descripcion"
                      />
                      <input
                        type="text"
                        value={item.fabrics.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.fabricTrends];
                          updated[i] = {
                            ...updated[i],
                            fabrics: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, fabricTrends: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Telas (separadas por coma)"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.finish}
                          onChange={(e) => {
                            const updated = [...trends.fabricTrends];
                            updated[i] = { ...updated[i], finish: e.target.value };
                            setTrends({ ...trends, fabricTrends: updated });
                          }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                          placeholder="Acabado"
                        />
                        <input
                          type="number"
                          value={item.weight || ''}
                          onChange={(e) => {
                            const updated = [...trends.fabricTrends];
                            updated[i] = { ...updated[i], weight: Number(e.target.value) };
                            setTrends({ ...trends, fabricTrends: updated });
                          }}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                          placeholder="Gramaje (g/m2)"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.composition || ''}
                        onChange={(e) => {
                          const updated = [...trends.fabricTrends];
                          updated[i] = { ...updated[i], composition: e.target.value };
                          setTrends({ ...trends, fabricTrends: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Composicion (ej: 100% Algodon)"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-medium text-white/90 pr-16 font-display">
                        {item.name}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.fabrics.map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] text-white/30">
                        <span>
                          <span className="text-white/50">Acabado:</span> {item.finish}
                        </span>
                        {item.weight && (
                          <span>
                            <span className="text-white/50">Gramaje:</span> {item.weight} g/m2
                          </span>
                        )}
                        {item.composition && (
                          <span>
                            <span className="text-white/50">Composicion:</span> {item.composition}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Detalles de Construccion ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
                <Sparkles className="h-4 w-4 text-cereus-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                  Detalles de Construccion
                </h2>
                <p className="text-[11px] text-white/35">{trends.details.length} detalles</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addDetail}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Agregar Detalle
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trends.details.map((item, i) => {
              const isEditing = editingIndex?.section === 'details' && editingIndex.index === i;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-white/15"
                >
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingIndex(isEditing ? null : { section: 'details', index: i })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDetail(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pr-16">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...trends.details];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setTrends({ ...trends, details: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-cereus-gold/50"
                        placeholder="Nombre"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...trends.details];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setTrends({ ...trends, details: updated });
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50 resize-none"
                        placeholder="Descripcion"
                      />
                      <input
                        type="text"
                        value={item.elements.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.details];
                          updated[i] = {
                            ...updated[i],
                            elements: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, details: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Elementos (separados por coma)"
                      />
                      <input
                        type="text"
                        value={item.placement.join(', ')}
                        onChange={(e) => {
                          const updated = [...trends.details];
                          updated[i] = {
                            ...updated[i],
                            placement: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          };
                          setTrends({ ...trends, details: updated });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-cereus-gold/50"
                        placeholder="Ubicaciones (separadas por coma)"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-medium text-white/90 pr-16 font-display">
                        {item.name}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.elements.map((el) => (
                          <span
                            key={el}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.placement.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Mood Keywords ─────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cereus-gold/10">
              <Hash className="h-4 w-4 text-cereus-gold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Mood Keywords
              </h2>
              <p className="text-[11px] text-white/35">{trends.moodKeywords.length} keywords</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {trends.moodKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => removeMoodKeyword(keyword)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-cereus-gold/30 bg-cereus-gold/10 px-4 py-2 text-sm text-cereus-gold transition-all hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400"
              >
                <span className="italic">{keyword}</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {/* Add keyword input */}
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMoodKeyword()}
                placeholder="Agregar keyword..."
                className="bg-transparent text-sm text-white/70 placeholder:text-white/25 outline-none w-28"
              />
              <button
                type="button"
                onClick={addMoodKeyword}
                disabled={!newKeyword.trim()}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-cereus-gold/20 text-cereus-gold disabled:opacity-30 transition-opacity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Notas del Clima (read-only) ──────────────────── */}
        {trends.climateNotes && (
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <CloudSun className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Notas del Clima
              </h2>
            </div>
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-5">
              <p className="text-xs leading-relaxed text-blue-200/70">{trends.climateNotes}</p>
            </div>
          </section>
        )}

        {/* ── Notas de Arquetipos (read-only) ──────────────── */}
        {trends.archetypeNotes && (
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                Notas de Arquetipos
              </h2>
            </div>
            <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
              <p className="text-xs leading-relaxed text-purple-200/70">{trends.archetypeNotes}</p>
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky Bottom Bar ──────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/8 bg-cereus-noir/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setGenerating(false);
                generateTrends();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerar Todo
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cereus-gold/15 text-sm font-bold tabular-nums text-cereus-gold">
                {itemCount}
              </div>
              <span className="text-xs text-white/50">
                {itemCount === 1 ? '1 elemento' : `${itemCount} elementos`} aprobados
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApprove}
            disabled={itemCount === 0}
            className={cn(
              'group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300',
              itemCount > 0
                ? 'bg-cereus-gold text-cereus-noir shadow-lg shadow-cereus-gold/20 hover:shadow-cereus-gold/30 hover:brightness-110 active:scale-[0.98]'
                : 'bg-white/5 text-white/25 cursor-not-allowed',
            )}
          >
            Aprobar y Continuar
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                itemCount > 0 && 'group-hover:translate-x-0.5',
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
