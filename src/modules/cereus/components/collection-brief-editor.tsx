'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  X,
  Plus,
  Palette,
  ChevronLeft,
  Image as ImageIcon,
  Type,
  FileText,
  Tag,
  DollarSign,
  Hash,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface TrendSilhouettePin {
  name: string;
  description: string;
  garmentTypes: string[];
  keywords: string[];
}

interface ColorStoryPin {
  name: string;
  colors: string[];
  mood: string;
  description: string;
}

interface FabricTrendPin {
  name: string;
  description: string;
  fabrics: string[];
  finish: string;
}

interface DetailTrendPin {
  name: string;
  description: string;
  elements: string[];
  placement: string[];
}

interface PinnedTrends {
  silhouettes: TrendSilhouettePin[];
  colorStories: ColorStoryPin[];
  fabricTrends: FabricTrendPin[];
  details: DetailTrendPin[];
  moodKeywords: string[];
}

interface ColorStoryItem {
  hex: string;
  name: string;
  role: string;
}

interface GarmentTypeItem {
  category: string;
  count: number;
  notes: string;
}

interface AIBriefResponse {
  name_suggestions: string[];
  code_suggestion: string;
  description: string;
  color_story: ColorStoryItem[];
  garment_types: GarmentTypeItem[];
  inspiration_notes: string;
  estimated_avg_price: number;
}

interface CollectionBriefEditorProps {
  maisonId: string;
  season: string;
  year: number;
  pinnedTrends: PinnedTrends;
  onComplete: (
    collectionId: string,
    brief: {
      name: string;
      description: string;
      targetPieces: number;
      targetRevenue: number;
      avgPricePoint: number;
    }
  ) => void;
  onBack: () => void;
}

// ============================================================
// Component
// ============================================================

export default function CollectionBriefEditor({
  maisonId,
  season,
  year,
  pinnedTrends,
  onComplete,
  onBack,
}: CollectionBriefEditorProps) {
  // ── AI brief state ────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moodBoardUrls, setMoodBoardUrls] = useState<string[]>([]);

  // ── Editable fields ───────────────────────────────────────
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [selectedNameIdx, setSelectedNameIdx] = useState(0);
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [colorStory, setColorStory] = useState<ColorStoryItem[]>([]);
  const [newColorHex, setNewColorHex] = useState('#B8860B');
  const [newColorName, setNewColorName] = useState('');
  const [garmentTypes, setGarmentTypes] = useState<GarmentTypeItem[]>([]);
  const [inspirationNotes, setInspirationNotes] = useState('');
  const [avgPrice, setAvgPrice] = useState(0);
  const [targetPieces, setTargetPieces] = useState(10);

  // ── Submission state ──────────────────────────────────────
  const [saving, setSaving] = useState(false);

  // ── Fetch brief from AI ───────────────────────────────────
  const fetchBrief = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cereus/ai/collection-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          season,
          year,
          targetPieces: 10,
          language: 'es',
          trendContext: JSON.stringify(pinnedTrends),
          autoCreate: false,
          generateMoodImages: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error generando el brief');
      }

      const data = await res.json();
      const brief: AIBriefResponse = data.brief;

      // Populate editable fields
      setNameSuggestions(brief.name_suggestions || []);
      setSelectedNameIdx(0);
      setUseCustomName(false);
      setCustomName('');
      setCode(brief.code_suggestion || '');
      setDescription(brief.description || '');
      setColorStory(brief.color_story || []);
      setGarmentTypes(brief.garment_types || []);
      setInspirationNotes(brief.inspiration_notes || '');
      setAvgPrice(brief.estimated_avg_price || 0);
      setMoodBoardUrls(data.moodBoardUrls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [maisonId, season, year, pinnedTrends]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  // ── Computed name ─────────────────────────────────────────
  const resolvedName = useCustomName
    ? customName
    : nameSuggestions[selectedNameIdx] || '';

  // ── Color helpers ─────────────────────────────────────────
  const removeColor = (idx: number) => {
    setColorStory((prev) => prev.filter((_, i) => i !== idx));
  };

  const addColor = () => {
    if (!newColorHex) return;
    setColorStory((prev) => [
      ...prev,
      { hex: newColorHex, name: newColorName || 'Nuevo color', role: 'accent' },
    ]);
    setNewColorName('');
    setNewColorHex('#B8860B');
  };

  // ── Garment chip removal ──────────────────────────────────
  const removeGarmentType = (idx: number) => {
    setGarmentTypes((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Approve & create collection ───────────────────────────
  const handleApprove = async () => {
    if (!resolvedName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        maisonId,
        name: resolvedName,
        code,
        description,
        season,
        year,
        status: 'concept',
        mood_board_urls: moodBoardUrls,
        inspiration_notes: inspirationNotes,
        target_pieces: targetPieces,
        avg_price_point: avgPrice,
        trend_context: pinnedTrends,
        color_story: colorStory,
        suggested_garment_types: garmentTypes,
      };

      const res = await fetch('/api/cereus/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error creando la coleccion');
      }

      const data = await res.json();
      const collectionId = data.collection?.id || data.id;

      onComplete(collectionId, {
        name: resolvedName,
        description,
        targetPieces,
        targetRevenue: targetPieces * avgPrice,
        avgPricePoint: avgPrice,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-cereus-gold/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cereus-gold animate-spin" />
          </div>
          <Sparkles className="w-5 h-5 text-cereus-gold absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-stone-800">
            Generando brief creativo...
          </p>
          <p className="text-sm text-stone-500 mt-1">
            La IA esta analizando tendencias y creando tu concepto de coleccion
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────

  if (error && nameSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-16 h-16 rounded-full border-2 border-red-200 bg-red-50 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-stone-800">
            Error al generar el brief
          </p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Volver
          </button>
          <button
            type="button"
            onClick={fetchBrief}
            className="px-4 py-2 text-sm rounded-lg bg-cereus-gold text-white hover:bg-cereus-gold-light transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Main editor ───────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">
            Brief Creativo
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {season} {year} &mdash; Revisa y edita el concepto generado por IA
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cereus-gold bg-cereus-gold/10 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Generado con IA
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Name selection ─────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4">
          <Type className="w-4 h-4 text-cereus-gold" />
          Nombre de la Coleccion
        </label>

        <div className="space-y-2">
          {nameSuggestions.map((name, idx) => (
            <label
              key={idx}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${
                  !useCustomName && selectedNameIdx === idx
                    ? 'border-cereus-gold bg-cereus-gold/5 ring-1 ring-cereus-gold/30'
                    : 'border-stone-200 hover:border-stone-300'
                }
              `}
            >
              <input
                type="radio"
                name="collectionName"
                checked={!useCustomName && selectedNameIdx === idx}
                onChange={() => {
                  setSelectedNameIdx(idx);
                  setUseCustomName(false);
                }}
                className="accent-[hsl(var(--cereus-gold))]"
              />
              <span className="text-stone-800 font-medium">{name}</span>
            </label>
          ))}

          {/* Custom name */}
          <label
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${
                useCustomName
                  ? 'border-cereus-gold bg-cereus-gold/5 ring-1 ring-cereus-gold/30'
                  : 'border-stone-200 hover:border-stone-300'
              }
            `}
          >
            <input
              type="radio"
              name="collectionName"
              checked={useCustomName}
              onChange={() => setUseCustomName(true)}
              className="accent-[hsl(var(--cereus-gold))]"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setUseCustomName(true);
              }}
              placeholder="Nombre personalizado..."
              className="flex-1 bg-transparent text-stone-800 placeholder:text-stone-400 outline-none text-sm"
            />
          </label>
        </div>
      </section>

      {/* ── Code ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
          <Hash className="w-4 h-4 text-cereus-gold" />
          Codigo
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-stone-800 text-sm
                     focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold
                     transition-all"
        />
      </section>

      {/* ── Description ────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
          <FileText className="w-4 h-4 text-cereus-gold" />
          Descripcion
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-stone-200 text-stone-800 text-sm
                     leading-relaxed resize-y
                     focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold
                     transition-all"
        />
      </section>

      {/* ── Color Story ────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4">
          <Palette className="w-4 h-4 text-cereus-gold" />
          Color Story
        </label>

        <div className="flex flex-wrap gap-3 mb-4">
          {colorStory.map((color, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-2.5 px-3 py-2 rounded-lg border border-stone-200
                         bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate">
                  {color.name}
                </p>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                  {color.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeColor(idx)}
                className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5
                           w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center
                           shadow-sm transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add color */}
        <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            placeholder="Nombre del color..."
            className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-800
                       placeholder:text-stone-400
                       focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold"
          />
          <button
            type="button"
            onClick={addColor}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-600
                       text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </section>

      {/* ── Garment Types ──────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4">
          <Tag className="w-4 h-4 text-cereus-gold" />
          Tipos de Prenda
        </label>

        <div className="flex flex-wrap gap-2">
          {garmentTypes.map((gt, idx) => (
            <div
              key={idx}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full
                         border border-stone-200 bg-stone-50 text-sm transition-colors hover:bg-stone-100"
            >
              <span className="font-medium text-stone-800">{gt.category}</span>
              <span className="text-cereus-gold font-semibold">&times;{gt.count}</span>
              {gt.notes && (
                <span className="text-stone-400 text-xs hidden sm:inline">
                  &mdash; {gt.notes}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeGarmentType(idx)}
                className="opacity-0 group-hover:opacity-100 ml-1 w-4 h-4 rounded-full
                           bg-red-500 text-white flex items-center justify-center
                           transition-opacity hover:bg-red-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {garmentTypes.length === 0 && (
            <p className="text-sm text-stone-400 italic">Sin tipos de prenda definidos</p>
          )}
        </div>
      </section>

      {/* ── Inspiration Notes ──────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
          <Sparkles className="w-4 h-4 text-cereus-gold" />
          Notas de Inspiracion
        </label>
        <textarea
          value={inspirationNotes}
          onChange={(e) => setInspirationNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-stone-200 text-stone-800 text-sm
                     leading-relaxed resize-y
                     focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold
                     transition-all"
        />
      </section>

      {/* ── Mood Board ─────────────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4">
          <ImageIcon className="w-4 h-4 text-cereus-gold" />
          Mood Board
        </label>

        {moodBoardUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {moodBoardUrls.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50"
              >
                <img
                  src={url}
                  alt={`Mood board ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed border-stone-200 text-stone-400">
            <ImageIcon className="w-10 h-10 mb-2" />
            <p className="text-sm">Sin imagenes de mood board</p>
            <p className="text-xs mt-1">
              Se generaran automaticamente al regenerar el brief
            </p>
          </div>
        )}
      </section>

      {/* ── Pricing & Pieces ───────────────────────────────── */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-4">
          <DollarSign className="w-4 h-4 text-cereus-gold" />
          Objetivos Financieros
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Precio Promedio (USD)
            </label>
            <input
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value))}
              min={0}
              step={100}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-stone-800 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold
                         transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Target Piezas
            </label>
            <input
              type="number"
              value={targetPieces}
              onChange={(e) => setTargetPieces(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-stone-800 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold
                         transition-all"
            />
          </div>
        </div>

        {avgPrice > 0 && targetPieces > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Ingreso estimado</span>
            <span className="text-sm font-semibold text-cereus-gold">
              ${(avgPrice * targetPieces).toLocaleString('en-US')} USD
            </span>
          </div>
        )}
      </section>

      {/* ── Action Bar ─────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-4 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">
        <div className="flex items-center justify-between gap-3 max-w-full">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-stone-300
                       text-stone-600 text-sm font-medium
                       hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchBrief}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300
                         text-stone-700 text-sm font-medium
                         hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenerar Brief
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={saving || !resolvedName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg
                         bg-cereus-gold text-white text-sm font-semibold
                         hover:bg-cereus-gold-light disabled:opacity-50
                         shadow-md hover:shadow-lg transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Aprobar Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
