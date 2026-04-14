'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Scissors, Ruler, Save, Plus, X, Check, ChevronLeft,
  Loader2, FileText,
} from 'lucide-react';
import { CollapsibleSidebar } from './collapsible-sidebar';

// ============================================================
// Types & Constants
// ============================================================

interface PatternStepProps {
  maisonId: string;
  collectionId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface GarmentRow {
  id: string;
  name: string;
  code: string | null;
  category: string;
  body_zone: string;
  collection_id: string | null;
  status: string;
  design_brief?: DesignBrief | null;
  pattern_data?: PatternData | null;
}

interface DesignBrief {
  constructionDetails?: string;
  [key: string]: unknown;
}

type SizeSystemKey = 'international' | 'numeric_us' | 'numeric_eu' | 'bespoke';
type BodyZoneKey = 'upper' | 'lower' | 'full';
type PieceStatus = 'pendiente' | 'cortado' | 'cosido' | 'terminado';

interface PatternPiece {
  id: string;
  name: string;
  fabric_meters: number;
  notes: string;
  status: PieceStatus;
}

interface PatternData {
  sizeSystem: SizeSystemKey;
  measurements: Record<string, Record<string, number>>;
  pieces: PatternPiece[];
  constructionNotes: string;
}

const SIZE_SYSTEMS: Record<SizeSystemKey, string[]> = {
  international: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  numeric_us: ['0', '2', '4', '6', '8', '10', '12', '14', '16'],
  numeric_eu: ['32', '34', '36', '38', '40', '42', '44', '46', '48'],
  bespoke: ['Custom / A medida'],
};

const SIZE_SYSTEM_LABELS: Record<SizeSystemKey, string> = {
  international: 'Internacional (XXS-XXXL)',
  numeric_us: 'Numerico US (0-16)',
  numeric_eu: 'Numerico EU (32-48)',
  bespoke: 'A Medida',
};

const MEASUREMENT_POINTS: Record<BodyZoneKey, string[]> = {
  upper: ['busto', 'cintura', 'hombros', 'largo_manga', 'largo_torso'],
  lower: ['cintura', 'cadera', 'largo_pierna', 'entrepierna', 'muslo'],
  full: ['busto', 'cintura', 'hombros', 'largo_manga', 'largo_torso', 'cadera', 'largo_pierna', 'entrepierna', 'muslo'],
};

const MEASUREMENT_LABELS: Record<string, string> = {
  busto: 'Busto',
  cintura: 'Cintura',
  cadera: 'Cadera',
  hombros: 'Hombros',
  largo_manga: 'Largo Manga',
  largo_torso: 'Largo Torso',
  largo_pierna: 'Largo Pierna',
  entrepierna: 'Entrepierna',
  muslo: 'Muslo',
};

const DEFAULT_MEASUREMENTS: Record<string, Record<string, number>> = {
  XXS:  { busto: 76, cintura: 58, hombros: 36, largo_manga: 58, largo_torso: 38, cadera: 82, largo_pierna: 100, entrepierna: 74, muslo: 48 },
  XS:   { busto: 80, cintura: 62, hombros: 37, largo_manga: 59, largo_torso: 39, cadera: 86, largo_pierna: 101, entrepierna: 75, muslo: 50 },
  S:    { busto: 84, cintura: 66, hombros: 38, largo_manga: 60, largo_torso: 40, cadera: 90, largo_pierna: 102, entrepierna: 76, muslo: 52 },
  M:    { busto: 88, cintura: 70, hombros: 39, largo_manga: 61, largo_torso: 41, cadera: 94, largo_pierna: 103, entrepierna: 77, muslo: 54 },
  L:    { busto: 94, cintura: 76, hombros: 41, largo_manga: 62, largo_torso: 42, cadera: 100, largo_pierna: 104, entrepierna: 78, muslo: 57 },
  XL:   { busto: 100, cintura: 82, hombros: 43, largo_manga: 63, largo_torso: 43, cadera: 106, largo_pierna: 105, entrepierna: 79, muslo: 60 },
  XXL:  { busto: 108, cintura: 90, hombros: 45, largo_manga: 64, largo_torso: 44, cadera: 114, largo_pierna: 106, entrepierna: 80, muslo: 64 },
  XXXL: { busto: 116, cintura: 98, hombros: 47, largo_manga: 65, largo_torso: 45, cadera: 122, largo_pierna: 107, entrepierna: 81, muslo: 68 },
  '0':  { busto: 78, cintura: 60, hombros: 36, largo_manga: 58, largo_torso: 38, cadera: 84, largo_pierna: 100, entrepierna: 74, muslo: 48 },
  '2':  { busto: 80, cintura: 62, hombros: 37, largo_manga: 59, largo_torso: 39, cadera: 86, largo_pierna: 101, entrepierna: 75, muslo: 50 },
  '4':  { busto: 84, cintura: 66, hombros: 38, largo_manga: 60, largo_torso: 40, cadera: 90, largo_pierna: 102, entrepierna: 76, muslo: 52 },
  '6':  { busto: 88, cintura: 70, hombros: 39, largo_manga: 61, largo_torso: 41, cadera: 94, largo_pierna: 103, entrepierna: 77, muslo: 54 },
  '8':  { busto: 92, cintura: 74, hombros: 40, largo_manga: 61, largo_torso: 41, cadera: 98, largo_pierna: 104, entrepierna: 78, muslo: 56 },
  '10': { busto: 96, cintura: 78, hombros: 41, largo_manga: 62, largo_torso: 42, cadera: 102, largo_pierna: 104, entrepierna: 78, muslo: 58 },
  '12': { busto: 100, cintura: 82, hombros: 43, largo_manga: 63, largo_torso: 43, cadera: 106, largo_pierna: 105, entrepierna: 79, muslo: 60 },
  '14': { busto: 106, cintura: 88, hombros: 44, largo_manga: 64, largo_torso: 44, cadera: 112, largo_pierna: 106, entrepierna: 80, muslo: 63 },
  '16': { busto: 112, cintura: 94, hombros: 46, largo_manga: 65, largo_torso: 45, cadera: 118, largo_pierna: 107, entrepierna: 81, muslo: 66 },
  '32': { busto: 76, cintura: 58, hombros: 36, largo_manga: 58, largo_torso: 38, cadera: 82, largo_pierna: 100, entrepierna: 74, muslo: 48 },
  '34': { busto: 80, cintura: 62, hombros: 37, largo_manga: 59, largo_torso: 39, cadera: 86, largo_pierna: 101, entrepierna: 75, muslo: 50 },
  '36': { busto: 84, cintura: 66, hombros: 38, largo_manga: 60, largo_torso: 40, cadera: 90, largo_pierna: 102, entrepierna: 76, muslo: 52 },
  '38': { busto: 88, cintura: 70, hombros: 39, largo_manga: 61, largo_torso: 41, cadera: 94, largo_pierna: 103, entrepierna: 77, muslo: 54 },
  '40': { busto: 92, cintura: 74, hombros: 40, largo_manga: 61, largo_torso: 41, cadera: 98, largo_pierna: 104, entrepierna: 78, muslo: 56 },
  '42': { busto: 96, cintura: 78, hombros: 41, largo_manga: 62, largo_torso: 42, cadera: 102, largo_pierna: 104, entrepierna: 78, muslo: 58 },
  '44': { busto: 100, cintura: 82, hombros: 43, largo_manga: 63, largo_torso: 43, cadera: 106, largo_pierna: 105, entrepierna: 79, muslo: 60 },
  '46': { busto: 106, cintura: 88, hombros: 44, largo_manga: 64, largo_torso: 44, cadera: 112, largo_pierna: 106, entrepierna: 80, muslo: 63 },
  '48': { busto: 112, cintura: 94, hombros: 46, largo_manga: 65, largo_torso: 45, cadera: 118, largo_pierna: 107, entrepierna: 81, muslo: 66 },
  'Custom / A medida': { busto: 0, cintura: 0, hombros: 0, largo_manga: 0, largo_torso: 0, cadera: 0, largo_pierna: 0, entrepierna: 0, muslo: 0 },
};

const DEFAULT_PIECES: Record<string, string[]> = {
  dress: ['Panel Frontal', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Cinturilla', 'Forro'],
  blouse: ['Panel Frontal', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Cuello', 'Punos'],
  skirt: ['Panel Frontal', 'Panel Trasero', 'Cinturilla', 'Forro'],
  pants: ['Pierna Frontal Izq', 'Pierna Frontal Der', 'Pierna Trasera Izq', 'Pierna Trasera Der', 'Cinturilla', 'Bolsillos'],
  jacket: ['Panel Frontal Izq', 'Panel Frontal Der', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Solapa', 'Forro'],
  top: ['Panel Frontal', 'Panel Trasero'],
  shirt: ['Panel Frontal', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Cuello', 'Punos'],
  gown: ['Panel Frontal', 'Panel Trasero', 'Falda Frontal', 'Falda Trasera', 'Corpino', 'Forro'],
  suit: ['Saco Frente Izq', 'Saco Frente Der', 'Saco Espalda', 'Pantalon Frontal Izq', 'Pantalon Frontal Der', 'Pretina'],
  jumpsuit: ['Corpino Frente', 'Corpino Espalda', 'Pierna Frontal Izq', 'Pierna Frontal Der', 'Pierna Trasera Izq', 'Pierna Trasera Der'],
  coat: ['Panel Frontal Izq', 'Panel Frontal Der', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Cuello', 'Forro'],
  blazer: ['Panel Frontal Izq', 'Panel Frontal Der', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Solapa', 'Forro'],
  corset: ['Panel Frontal', 'Panel Lateral Izq', 'Panel Lateral Der', 'Panel Trasero', 'Forro'],
  cape: ['Panel Principal', 'Cuello', 'Forro'],
  accessory: ['Pieza Principal', 'Forro'],
  other: ['Pieza Principal'],
};

const CATEGORY_LABELS: Record<string, string> = {
  dress: 'Vestido', gown: 'Vestido de Gala', suit: 'Traje', blazer: 'Blazer',
  coat: 'Abrigo', skirt: 'Falda', pants: 'Pantalon', blouse: 'Blusa',
  shirt: 'Camisa', jumpsuit: 'Jumpsuit', cape: 'Capa', corset: 'Corse',
  top: 'Top', accessory: 'Accesorio', other: 'Otro',
};

const PIECE_STATUS_OPTIONS: { value: PieceStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'cortado', label: 'Cortado' },
  { value: 'cosido', label: 'Cosido' },
  { value: 'terminado', label: 'Terminado' },
];

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultMeasurements(sizeSystem: SizeSystemKey, bodyZone: BodyZoneKey): Record<string, Record<string, number>> {
  const sizes = SIZE_SYSTEMS[sizeSystem];
  const points = MEASUREMENT_POINTS[bodyZone];
  const result: Record<string, Record<string, number>> = {};
  for (const size of sizes) {
    result[size] = {};
    for (const point of points) {
      result[size][point] = DEFAULT_MEASUREMENTS[size]?.[point] ?? 0;
    }
  }
  return result;
}

function buildDefaultPieces(category: string): PatternPiece[] {
  const names = DEFAULT_PIECES[category] || DEFAULT_PIECES['other'];
  return names.map((name) => ({
    id: generateId(),
    name,
    fabric_meters: 0,
    notes: '',
    status: 'pendiente' as PieceStatus,
  }));
}

function resolveBodyZone(zone: string): BodyZoneKey {
  if (zone === 'upper' || zone === 'lower') return zone;
  return 'full';
}

// ============================================================
// Component
// ============================================================

export default function PatternStep({ maisonId, collectionId, onComplete, onBack }: PatternStepProps) {
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Local editable pattern data per garment
  const [editData, setEditData] = useState<Record<string, PatternData>>({});

  // ----------------------------------------------------------
  // Fetch garments
  // ----------------------------------------------------------
  const fetchGarments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}&collectionId=${collectionId}`);
      const json = await res.json();
      const all: GarmentRow[] = json.garments || [];
      // Client-side filter as safety net
      const filtered = all.filter((g) => g.collection_id === collectionId);
      setGarments(filtered);

      // Initialize edit data from existing pattern_data or defaults
      const data: Record<string, PatternData> = {};
      for (const g of filtered) {
        if (g.pattern_data) {
          data[g.id] = g.pattern_data;
        } else {
          const zone = resolveBodyZone(g.body_zone);
          data[g.id] = {
            sizeSystem: 'international',
            measurements: buildDefaultMeasurements('international', zone),
            pieces: buildDefaultPieces(g.category),
            constructionNotes: '',
          };
        }
      }
      setEditData(data);

      if (filtered.length > 0 && !selectedId) {
        setSelectedId(filtered[0].id);
      }
    } catch (err) {
      console.error('Error fetching garments:', err);
    } finally {
      setLoading(false);
    }
  }, [maisonId, collectionId, selectedId]);

  useEffect(() => { fetchGarments(); }, [fetchGarments]);

  // ----------------------------------------------------------
  // Edit helpers
  // ----------------------------------------------------------
  const currentGarment = garments.find((g) => g.id === selectedId) ?? null;
  const currentPattern = selectedId ? editData[selectedId] : null;

  function updatePattern(garmentId: string, updater: (prev: PatternData) => PatternData) {
    setEditData((prev) => {
      const current = prev[garmentId];
      if (!current) return prev;
      return { ...prev, [garmentId]: updater(current) };
    });
  }

  function handleSizeSystemChange(garmentId: string, system: SizeSystemKey) {
    const garment = garments.find((g) => g.id === garmentId);
    if (!garment) return;
    const zone = resolveBodyZone(garment.body_zone);
    updatePattern(garmentId, (prev) => ({
      ...prev,
      sizeSystem: system,
      measurements: buildDefaultMeasurements(system, zone),
    }));
  }

  function handleMeasurementChange(garmentId: string, size: string, point: string, value: number) {
    updatePattern(garmentId, (prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [size]: { ...prev.measurements[size], [point]: value },
      },
    }));
  }

  function handlePieceChange(garmentId: string, pieceId: string, field: keyof PatternPiece, value: string | number) {
    updatePattern(garmentId, (prev) => ({
      ...prev,
      pieces: prev.pieces.map((p) => (p.id === pieceId ? { ...p, [field]: value } : p)),
    }));
  }

  function handleAddPiece(garmentId: string) {
    updatePattern(garmentId, (prev) => ({
      ...prev,
      pieces: [...prev.pieces, { id: generateId(), name: 'Nueva Pieza', fabric_meters: 0, notes: '', status: 'pendiente' }],
    }));
  }

  function handleRemovePiece(garmentId: string, pieceId: string) {
    updatePattern(garmentId, (prev) => ({
      ...prev,
      pieces: prev.pieces.filter((p) => p.id !== pieceId),
    }));
  }

  function handleConstructionNotesChange(garmentId: string, notes: string) {
    updatePattern(garmentId, (prev) => ({ ...prev, constructionNotes: notes }));
  }

  // ----------------------------------------------------------
  // Save
  // ----------------------------------------------------------
  async function handleSave(garmentId: string) {
    const patternData = editData[garmentId];
    if (!patternData) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/cereus/garments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: garmentId, pattern_data: patternData }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      // Update local garment to reflect saved state
      setGarments((prev) =>
        prev.map((g) => (g.id === garmentId ? { ...g, pattern_data: patternData } : g))
      );
      setSaveMessage('Guardado correctamente');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (err) {
      console.error(err);
      setSaveMessage('Error al guardar');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // Progress
  // ----------------------------------------------------------
  const totalPieces = garments.length;
  const piecesWithPattern = garments.filter((g) => g.pattern_data != null).length;
  const allHavePatterns = totalPieces > 0 && piecesWithPattern === totalPieces;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
        <span className="ml-3 text-muted-foreground">Cargando piezas...</span>
      </div>
    );
  }

  if (garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Scissors className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">No hay piezas en esta coleccion. Agrega prendas antes de definir patrones.</p>
        <button onClick={onBack} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 inline mr-1" />Volver
        </button>
      </div>
    );
  }

  const zone = currentGarment ? resolveBodyZone(currentGarment.body_zone) : 'full';
  const measurementPoints = MEASUREMENT_POINTS[zone];
  const sizes = currentPattern ? SIZE_SYSTEMS[currentPattern.sizeSystem] : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header / Progress */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-cereus-gold" />
          <h2 className="text-lg font-semibold">Paso 6: Definir Patrones y Moldes</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ruler className="w-4 h-4" />
          <span className="font-medium">
            {piecesWithPattern} de {totalPieces} piezas con patron
          </span>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-cereus-gold rounded-full transition-all"
              style={{ width: `${totalPieces > 0 ? (piecesWithPattern / totalPieces) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content: sidebar + editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: piece list */}
        <CollapsibleSidebar side="left" width="w-72" title="Medidas">
          <div className="p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Piezas de la Coleccion
            </p>
            <div className="space-y-1.5">
              {garments.map((g) => {
                const hasPattern = g.pattern_data != null;
                const isSelected = g.id === selectedId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedId(g.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      isSelected
                        ? 'bg-cereus-gold/10 border border-cereus-gold/40 text-foreground'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{g.name}</span>
                      {hasPattern ? (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABELS[g.category] || g.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CollapsibleSidebar>

        {/* Right: Pattern editor */}
        <div className="flex-1 overflow-y-auto">
          {currentGarment && currentPattern ? (
            <div className="p-6 space-y-8 max-w-5xl">
              {/* Garment header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{currentGarment.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {CATEGORY_LABELS[currentGarment.category] || currentGarment.category} &middot; Zona: {zone}
                  </p>
                </div>
                <button
                  onClick={() => handleSave(currentGarment.id)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Patron
                </button>
              </div>

              {saveMessage && (
                <div className={`text-sm px-3 py-2 rounded-lg ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {saveMessage}
                </div>
              )}

              {/* ============================== */}
              {/* Section A: Sistema de Tallas */}
              {/* ============================== */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-5 h-5 text-cereus-gold" />
                  <h4 className="text-base font-semibold">A. Sistema de Tallas</h4>
                </div>

                {/* Size system selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                    Sistema de tallas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(SIZE_SYSTEM_LABELS) as SizeSystemKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSizeSystemChange(currentGarment.id, key)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          currentPattern.sizeSystem === key
                            ? 'bg-cereus-gold/10 border-cereus-gold/40 text-foreground font-medium'
                            : 'border-input hover:bg-muted'
                        }`}
                      >
                        {SIZE_SYSTEM_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Measurements grid */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground border-b">Talla</th>
                        {measurementPoints.map((point) => (
                          <th key={point} className="text-center px-2 py-2 font-medium text-muted-foreground border-b whitespace-nowrap">
                            {MEASUREMENT_LABELS[point] || point}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size) => (
                        <tr key={size} className="border-b last:border-b-0 hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-medium text-xs">{size}</td>
                          {measurementPoints.map((point) => (
                            <td key={point} className="px-1 py-1">
                              <input
                                type="number"
                                value={currentPattern.measurements[size]?.[point] ?? 0}
                                onChange={(e) =>
                                  handleMeasurementChange(currentGarment.id, size, point, parseFloat(e.target.value) || 0)
                                }
                                className="w-16 text-center px-1 py-1 border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-cereus-gold/50"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ============================== */}
              {/* Section B: Piezas del Molde */}
              {/* ============================== */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-cereus-gold" />
                    <h4 className="text-base font-semibold">B. Piezas del Molde</h4>
                  </div>
                  <button
                    onClick={() => handleAddPiece(currentGarment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-dashed border-cereus-gold/40 text-cereus-gold rounded-lg hover:bg-cereus-gold/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Pieza
                  </button>
                </div>

                <div className="space-y-2">
                  {currentPattern.pieces.map((piece, idx) => (
                    <div key={piece.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <span className="text-xs text-muted-foreground font-mono mt-2 w-5 text-right flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Name */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Nombre</label>
                          <input
                            type="text"
                            value={piece.name}
                            onChange={(e) => handlePieceChange(currentGarment.id, piece.id, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-cereus-gold/50"
                          />
                        </div>
                        {/* Fabric meters */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Tela (metros)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={piece.fabric_meters}
                            onChange={(e) =>
                              handlePieceChange(currentGarment.id, piece.id, 'fabric_meters', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-cereus-gold/50"
                          />
                        </div>
                        {/* Notes */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Notas</label>
                          <input
                            type="text"
                            value={piece.notes}
                            onChange={(e) => handlePieceChange(currentGarment.id, piece.id, 'notes', e.target.value)}
                            placeholder="Notas..."
                            className="w-full px-2 py-1.5 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-cereus-gold/50"
                          />
                        </div>
                        {/* Status */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Estado</label>
                          <select
                            value={piece.status}
                            onChange={(e) => handlePieceChange(currentGarment.id, piece.id, 'status', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-cereus-gold/50"
                          >
                            {PIECE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePiece(currentGarment.id, piece.id)}
                        className="mt-5 p-1 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                        title="Eliminar pieza"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {currentPattern.pieces.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-4 text-center">
                      No hay piezas. Haz clic en &quot;Agregar Pieza&quot; para comenzar.
                    </p>
                  )}
                </div>
              </section>

              {/* ============================== */}
              {/* Section C: Notas de Construccion */}
              {/* ============================== */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-cereus-gold" />
                  <h4 className="text-base font-semibold">C. Notas de Construccion</h4>
                </div>

                {/* Show design brief construction details as reference */}
                {currentGarment.design_brief?.constructionDetails && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Referencia del Brief de Diseno
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-300 whitespace-pre-wrap">
                      {currentGarment.design_brief.constructionDetails}
                    </p>
                  </div>
                )}

                <textarea
                  value={currentPattern.constructionNotes}
                  onChange={(e) => handleConstructionNotesChange(currentGarment.id, e.target.value)}
                  placeholder="Escribe notas de construccion: tipo de costura, acabados, instrucciones especiales..."
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-y"
                />
              </section>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Selecciona una pieza del panel izquierdo para editar su patron.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-card">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>

        <span className="text-sm text-muted-foreground">
          {piecesWithPattern} de {totalPieces} piezas con patron definido
        </span>

        <button
          onClick={onComplete}
          disabled={!allHavePatterns}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            allHavePatterns
              ? 'bg-cereus-gold text-white hover:bg-cereus-gold/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          Enviar a Taller
        </button>
      </div>
    </div>
  );
}
