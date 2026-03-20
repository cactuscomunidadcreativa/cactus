'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Palette,
  Layers,
  Sparkles,
  Pin,
  PinOff,
  ChevronRight,
  ChevronDown,
  Scissors,
  Hash,
  Check,
} from 'lucide-react';
import {
  getTrendData,
  getAllTrendSeasons,
  type TrendSilhouette,
  type ColorStory,
  type FabricTrend,
  type DetailTrend,
} from '../lib/trend-engine';

// ─── TYPES ──────────────────────────────────────────────────

export interface PinnedTrends {
  silhouettes: TrendSilhouette[];
  colorStories: ColorStory[];
  fabricTrends: FabricTrend[];
  details: DetailTrend[];
  moodKeywords: string[];
}

export interface TrendExplorerProps {
  onComplete: (pinnedTrends: PinnedTrends, season: string, year: number) => void;
}

// ─── HELPERS ────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function emptyPinned(): PinnedTrends {
  return {
    silhouettes: [],
    colorStories: [],
    fabricTrends: [],
    details: [],
    moodKeywords: [],
  };
}

function totalPinned(p: PinnedTrends): number {
  return (
    p.silhouettes.length +
    p.colorStories.length +
    p.fabricTrends.length +
    p.details.length +
    p.moodKeywords.length
  );
}

// ─── SECTION HEADER ─────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  open,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 py-4 group text-left"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cereus-gold/10 text-cereus-gold transition-colors group-hover:bg-cereus-gold/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/90">
            {title}
          </h3>
          {count > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cereus-gold/20 px-1.5 text-[10px] font-bold text-cereus-gold tabular-nums">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      </div>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-white/30 transition-transform duration-300',
          open && 'rotate-180',
        )}
      />
    </button>
  );
}

// ─── PILL ───────────────────────────────────────────────────

function Pill({ label, small }: { label: string; small?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/5 text-white/60',
        small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
      )}
    >
      {label}
    </span>
  );
}

// ─── PIN BUTTON ─────────────────────────────────────────────

function PinButton({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
        pinned
          ? 'bg-cereus-gold text-cereus-noir shadow-lg shadow-cereus-gold/25 scale-110'
          : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60',
      )}
      aria-label={pinned ? 'Desfijar tendencia' : 'Fijar tendencia'}
    >
      {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── SILHOUETTE CARD ────────────────────────────────────────

function SilhouetteCard({
  item,
  pinned,
  onToggle,
}: {
  item: TrendSilhouette;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative group rounded-2xl border p-5 transition-all duration-300 cursor-pointer',
        pinned
          ? 'border-cereus-gold/40 bg-cereus-gold/5 shadow-lg shadow-cereus-gold/5'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]',
      )}
      onClick={onToggle}
    >
      <PinButton pinned={pinned} onToggle={onToggle} />
      <h4 className="text-base font-medium text-white/90 pr-10 font-display">
        {item.name}
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-3">
        {item.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.garmentTypes.map((g) => (
          <Pill key={g} label={g} />
        ))}
      </div>
    </div>
  );
}

// ─── COLOR STORY CARD ───────────────────────────────────────

function ColorStoryCard({
  item,
  pinned,
  onToggle,
}: {
  item: ColorStory;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative group rounded-2xl border p-5 transition-all duration-300 cursor-pointer',
        pinned
          ? 'border-cereus-gold/40 bg-cereus-gold/5 shadow-lg shadow-cereus-gold/5'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]',
      )}
      onClick={onToggle}
    >
      <PinButton pinned={pinned} onToggle={onToggle} />
      <h4 className="text-base font-medium text-white/90 pr-10 font-display">
        {item.name}
      </h4>
      <div className="mt-3 flex items-center gap-1.5">
        {item.colors.map((color, i) => (
          <div
            key={i}
            className="h-7 w-7 rounded-full border border-white/10 shadow-inner transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45 line-clamp-2">
        {item.description}
      </p>
      <p className="mt-2 text-[11px] italic text-cereus-gold/60">
        {item.mood}
      </p>
    </div>
  );
}

// ─── FABRIC CARD ────────────────────────────────────────────

function FabricCard({
  item,
  pinned,
  onToggle,
}: {
  item: FabricTrend;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative group rounded-2xl border p-5 transition-all duration-300 cursor-pointer',
        pinned
          ? 'border-cereus-gold/40 bg-cereus-gold/5 shadow-lg shadow-cereus-gold/5'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]',
      )}
      onClick={onToggle}
    >
      <PinButton pinned={pinned} onToggle={onToggle} />
      <h4 className="text-base font-medium text-white/90 pr-10 font-display">
        {item.name}
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-2">
        {item.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.fabrics.map((f) => (
          <Pill key={f} label={f} />
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-white/30">
        <span className="text-white/50">Acabado:</span> {item.finish}
      </p>
    </div>
  );
}

// ─── DETAIL CARD ────────────────────────────────────────────

function DetailCard({
  item,
  pinned,
  onToggle,
}: {
  item: DetailTrend;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'relative group rounded-2xl border p-5 transition-all duration-300 cursor-pointer',
        pinned
          ? 'border-cereus-gold/40 bg-cereus-gold/5 shadow-lg shadow-cereus-gold/5'
          : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]',
      )}
      onClick={onToggle}
    >
      <PinButton pinned={pinned} onToggle={onToggle} />
      <h4 className="text-base font-medium text-white/90 pr-10 font-display">
        {item.name}
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-white/45 line-clamp-2">
        {item.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.elements.map((el) => (
          <Pill key={el} label={el} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {item.placement.map((p) => (
          <Pill key={p} label={p} small />
        ))}
      </div>
    </div>
  );
}

// ─── MOOD KEYWORD TOGGLE ────────────────────────────────────

function MoodKeyword({
  keyword,
  pinned,
  onToggle,
}: {
  keyword: string;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-200',
        pinned
          ? 'border-cereus-gold/50 bg-cereus-gold/15 text-cereus-gold shadow-sm shadow-cereus-gold/10'
          : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70',
      )}
    >
      {pinned && <Check className="h-3 w-3" />}
      <span className="italic">{keyword}</span>
    </button>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function TrendExplorer({ onComplete }: TrendExplorerProps) {
  const seasons = useMemo(() => getAllTrendSeasons(), []);
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.value ?? '');
  const [pinned, setPinned] = useState<PinnedTrends>(emptyPinned());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    silhouettes: true,
    colors: true,
    fabrics: true,
    details: true,
    moods: true,
  });

  const trendData = useMemo(() => getTrendData(selectedSeason), [selectedSeason]);
  const currentSeason = useMemo(
    () => seasons.find((s) => s.value === selectedSeason),
    [seasons, selectedSeason],
  );

  const count = totalPinned(pinned);

  // ─── toggle helpers ────────────────────────────────────────

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSilhouette = useCallback((item: TrendSilhouette) => {
    setPinned((prev) => {
      const exists = prev.silhouettes.some((s) => s.name === item.name);
      return {
        ...prev,
        silhouettes: exists
          ? prev.silhouettes.filter((s) => s.name !== item.name)
          : [...prev.silhouettes, item],
      };
    });
  }, []);

  const toggleColor = useCallback((item: ColorStory) => {
    setPinned((prev) => {
      const exists = prev.colorStories.some((c) => c.name === item.name);
      return {
        ...prev,
        colorStories: exists
          ? prev.colorStories.filter((c) => c.name !== item.name)
          : [...prev.colorStories, item],
      };
    });
  }, []);

  const toggleFabric = useCallback((item: FabricTrend) => {
    setPinned((prev) => {
      const exists = prev.fabricTrends.some((f) => f.name === item.name);
      return {
        ...prev,
        fabricTrends: exists
          ? prev.fabricTrends.filter((f) => f.name !== item.name)
          : [...prev.fabricTrends, item],
      };
    });
  }, []);

  const toggleDetail = useCallback((item: DetailTrend) => {
    setPinned((prev) => {
      const exists = prev.details.some((d) => d.name === item.name);
      return {
        ...prev,
        details: exists
          ? prev.details.filter((d) => d.name !== item.name)
          : [...prev.details, item],
      };
    });
  }, []);

  const toggleMood = useCallback((keyword: string) => {
    setPinned((prev) => {
      const exists = prev.moodKeywords.includes(keyword);
      return {
        ...prev,
        moodKeywords: exists
          ? prev.moodKeywords.filter((k) => k !== keyword)
          : [...prev.moodKeywords, keyword],
      };
    });
  }, []);

  // ─── season change resets pins ─────────────────────────────

  const handleSeasonChange = useCallback((value: string) => {
    setSelectedSeason(value);
    setPinned(emptyPinned());
  }, []);

  // ─── submit ────────────────────────────────────────────────

  const handleComplete = useCallback(() => {
    if (count === 0 || !currentSeason) return;
    onComplete(pinned, currentSeason.value, currentSeason.year);
  }, [count, currentSeason, onComplete, pinned]);

  // ─── render ────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-cereus-noir pb-28">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-cereus-noir/95 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-cereus-gold" />
                <h1 className="text-lg font-semibold tracking-tight text-white/90 font-display">
                  Explorar Tendencias
                </h1>
              </div>
              <p className="mt-1 text-xs text-white/35">
                Fija las tendencias que inspiran tu coleccion. Paso 1 del flujo creativo.
              </p>
            </div>

            {/* Season selector */}
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-9 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cereus-gold/50 focus:ring-1 focus:ring-cereus-gold/20"
              >
                {seasons.map((s) => (
                  <option key={s.value} value={s.value} className="bg-neutral-900 text-white">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-6 space-y-2">
        {/* ── Silhouettes ─────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Scissors}
            title="Siluetas trending"
            subtitle="Formas y proporciones de la temporada"
            count={pinned.silhouettes.length}
            open={!!openSections.silhouettes}
            onToggle={() => toggleSection('silhouettes')}
          />
          {openSections.silhouettes && (
            <div className="grid gap-4 sm:grid-cols-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {trendData.silhouettes.map((item) => (
                <SilhouetteCard
                  key={item.name}
                  item={item}
                  pinned={pinned.silhouettes.some((s) => s.name === item.name)}
                  onToggle={() => toggleSilhouette(item)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-white/5" />

        {/* ── Color Stories ───────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Palette}
            title="Paletas de color"
            subtitle="Historias de color y mood de la temporada"
            count={pinned.colorStories.length}
            open={!!openSections.colors}
            onToggle={() => toggleSection('colors')}
          />
          {openSections.colors && (
            <div className="grid gap-4 sm:grid-cols-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {trendData.colorStories.map((item) => (
                <ColorStoryCard
                  key={item.name}
                  item={item}
                  pinned={pinned.colorStories.some((c) => c.name === item.name)}
                  onToggle={() => toggleColor(item)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-white/5" />

        {/* ── Fabric Trends ───────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Layers}
            title="Telas en tendencia"
            subtitle="Texturas, acabados y materiales clave"
            count={pinned.fabricTrends.length}
            open={!!openSections.fabrics}
            onToggle={() => toggleSection('fabrics')}
          />
          {openSections.fabrics && (
            <div className="grid gap-4 sm:grid-cols-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {trendData.fabricTrends.map((item) => (
                <FabricCard
                  key={item.name}
                  item={item}
                  pinned={pinned.fabricTrends.some((f) => f.name === item.name)}
                  onToggle={() => toggleFabric(item)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-white/5" />

        {/* ── Detail Trends ───────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Sparkles}
            title="Detalles trending"
            subtitle="Elementos decorativos y ubicaciones"
            count={pinned.details.length}
            open={!!openSections.details}
            onToggle={() => toggleSection('details')}
          />
          {openSections.details && (
            <div className="grid gap-4 sm:grid-cols-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {trendData.details.map((item) => (
                <DetailCard
                  key={item.name}
                  item={item}
                  pinned={pinned.details.some((d) => d.name === item.name)}
                  onToggle={() => toggleDetail(item)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="border-t border-white/5" />

        {/* ── Mood Keywords ───────────────────────────────── */}
        <section>
          <SectionHeader
            icon={Hash}
            title="Mood keywords"
            subtitle="Palabras clave que definen la esencia de la temporada"
            count={pinned.moodKeywords.length}
            open={!!openSections.moods}
            onToggle={() => toggleSection('moods')}
          />
          {openSections.moods && (
            <div className="flex flex-wrap gap-2.5 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {trendData.moodKeywords.map((keyword) => (
                <MoodKeyword
                  key={keyword}
                  keyword={keyword}
                  pinned={pinned.moodKeywords.includes(keyword)}
                  onToggle={() => toggleMood(keyword)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Sticky Bottom Bar ──────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/8 bg-cereus-noir/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors',
                count > 0
                  ? 'bg-cereus-gold/15 text-cereus-gold'
                  : 'bg-white/5 text-white/30',
              )}
            >
              {count}
            </div>
            <span className="text-sm text-white/50">
              {count === 0
                ? 'Ninguna tendencia fijada'
                : count === 1
                  ? '1 tendencia fijada'
                  : `${count} tendencias fijadas`}
            </span>
          </div>

          <button
            onClick={handleComplete}
            disabled={count === 0}
            className={cn(
              'group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300',
              count > 0
                ? 'bg-cereus-gold text-cereus-noir shadow-lg shadow-cereus-gold/20 hover:shadow-cereus-gold/30 hover:brightness-110 active:scale-[0.98]'
                : 'bg-white/5 text-white/25 cursor-not-allowed',
            )}
          >
            Crear Coleccion con estas tendencias
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                count > 0 && 'group-hover:translate-x-0.5',
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
