'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, Scissors, Ruler,
  FileText, Table2, Puzzle, ClipboardList, CheckCircle2,
  ChevronDown, Download, Send, X, Shirt, Info,
} from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

interface GarmentRow {
  id: string;
  name: string;
  code: string | null;
  category: string;
  body_zone: string;
  complexity_level: number;
  status: string;
  collection: { id: string; name: string; code: string | null } | null;
  garment_materials: Array<{
    id: string;
    material: { id: string; name: string; type: string } | null;
    quantity: number;
    unit: string;
  }>;
  pattern_data?: PatternData | null;
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
  international: 'Internacional (XS-XXXL)',
  numeric_us: 'Numérico US (0-16)',
  numeric_eu: 'Numérico EU (32-48)',
  bespoke: 'A Medida (Custom)',
};

const MEASUREMENT_POINTS: Record<BodyZoneKey, string[]> = {
  upper: ['busto', 'cintura', 'cadera', 'hombro', 'largo_manga', 'largo_torso', 'contorno_cuello'],
  lower: ['cintura', 'cadera', 'largo_pierna', 'entrepierna', 'muslo', 'tobillo'],
  full: ['busto', 'cintura', 'cadera', 'hombro', 'largo_manga', 'largo_torso', 'largo_total', 'contorno_cuello'],
};

const MEASUREMENT_LABELS: Record<string, string> = {
  busto: 'Busto',
  cintura: 'Cintura',
  cadera: 'Cadera',
  hombro: 'Hombro',
  largo_manga: 'Largo Manga',
  largo_torso: 'Largo Torso',
  largo_total: 'Largo Total',
  contorno_cuello: 'Cont. Cuello',
  largo_pierna: 'Largo Pierna',
  entrepierna: 'Entrepierna',
  muslo: 'Muslo',
  tobillo: 'Tobillo',
};

const DEFAULT_PIECES: Record<string, string[]> = {
  dress: ['Panel Frontal', 'Panel Trasero', 'Manga Izq', 'Manga Der', 'Cuello', 'Forro Frontal', 'Forro Trasero'],
  blouse: ['Frente', 'Espalda', 'Manga Izq', 'Manga Der', 'Cuello', 'Puño Izq', 'Puño Der'],
  shirt: ['Frente', 'Espalda', 'Manga Izq', 'Manga Der', 'Cuello', 'Puño Izq', 'Puño Der'],
  pants: ['Panel Frontal Izq', 'Panel Frontal Der', 'Panel Trasero Izq', 'Panel Trasero Der', 'Pretina', 'Bolsillo'],
  skirt: ['Panel Frontal', 'Panel Trasero', 'Pretina', 'Forro'],
  jacket: ['Frente Izq', 'Frente Der', 'Espalda', 'Manga Izq', 'Manga Der', 'Solapa Izq', 'Solapa Der', 'Cuello', 'Forro'],
  blazer: ['Frente Izq', 'Frente Der', 'Espalda', 'Manga Izq', 'Manga Der', 'Solapa Izq', 'Solapa Der', 'Cuello', 'Forro'],
  coat: ['Frente Izq', 'Frente Der', 'Espalda', 'Manga Izq', 'Manga Der', 'Cuello', 'Forro Completo', 'Cinturón'],
  gown: ['Panel Frontal', 'Panel Trasero', 'Falda Frontal', 'Falda Trasera', 'Corpiño', 'Manga Izq', 'Manga Der', 'Forro'],
  suit: ['Saco Frente Izq', 'Saco Frente Der', 'Saco Espalda', 'Pantalón Frontal Izq', 'Pantalón Frontal Der', 'Pantalón Trasero Izq', 'Pantalón Trasero Der', 'Pretina'],
  jumpsuit: ['Corpiño Frente', 'Corpiño Espalda', 'Pantalón Frontal Izq', 'Pantalón Frontal Der', 'Pantalón Trasero Izq', 'Pantalón Trasero Der', 'Manga Izq', 'Manga Der'],
  corset: ['Panel Frontal', 'Panel Lateral Izq', 'Panel Lateral Der', 'Panel Trasero', 'Varillas', 'Forro'],
  cape: ['Panel Principal', 'Cuello', 'Forro'],
  accessory: ['Pieza Principal', 'Forro'],
  other: ['Pieza Principal'],
};

// Standard measurement defaults (cm) for international sizes
const DEFAULT_MEASUREMENTS: Record<string, Record<string, number>> = {
  XXS: { busto: 76, cintura: 58, cadera: 82, hombro: 36, largo_manga: 58, largo_torso: 38, largo_total: 135, contorno_cuello: 33, largo_pierna: 100, entrepierna: 74, muslo: 48, tobillo: 20 },
  XS:  { busto: 80, cintura: 62, cadera: 86, hombro: 37, largo_manga: 59, largo_torso: 39, largo_total: 137, contorno_cuello: 34, largo_pierna: 101, entrepierna: 75, muslo: 50, tobillo: 21 },
  S:   { busto: 84, cintura: 66, cadera: 90, hombro: 38, largo_manga: 60, largo_torso: 40, largo_total: 140, contorno_cuello: 35, largo_pierna: 102, entrepierna: 76, muslo: 52, tobillo: 22 },
  M:   { busto: 88, cintura: 70, cadera: 94, hombro: 39, largo_manga: 61, largo_torso: 41, largo_total: 142, contorno_cuello: 36, largo_pierna: 103, entrepierna: 77, muslo: 54, tobillo: 23 },
  L:   { busto: 94, cintura: 76, cadera: 100, hombro: 41, largo_manga: 62, largo_torso: 42, largo_total: 144, contorno_cuello: 38, largo_pierna: 104, entrepierna: 78, muslo: 57, tobillo: 24 },
  XL:  { busto: 100, cintura: 82, cadera: 106, hombro: 43, largo_manga: 63, largo_torso: 43, largo_total: 146, contorno_cuello: 40, largo_pierna: 105, entrepierna: 79, muslo: 60, tobillo: 25 },
  XXL: { busto: 108, cintura: 90, cadera: 114, hombro: 45, largo_manga: 64, largo_torso: 44, largo_total: 148, contorno_cuello: 42, largo_pierna: 106, entrepierna: 80, muslo: 64, tobillo: 26 },
  XXXL:{ busto: 116, cintura: 98, cadera: 122, hombro: 47, largo_manga: 65, largo_torso: 45, largo_total: 150, contorno_cuello: 44, largo_pierna: 107, entrepierna: 81, muslo: 68, tobillo: 27 },
  // US numeric
  '0':  { busto: 78, cintura: 60, cadera: 84, hombro: 36, largo_manga: 58, largo_torso: 38, largo_total: 136, contorno_cuello: 33, largo_pierna: 100, entrepierna: 74, muslo: 48, tobillo: 20 },
  '2':  { busto: 80, cintura: 62, cadera: 86, hombro: 37, largo_manga: 59, largo_torso: 39, largo_total: 137, contorno_cuello: 34, largo_pierna: 101, entrepierna: 75, muslo: 50, tobillo: 21 },
  '4':  { busto: 84, cintura: 66, cadera: 90, hombro: 38, largo_manga: 60, largo_torso: 40, largo_total: 140, contorno_cuello: 35, largo_pierna: 102, entrepierna: 76, muslo: 52, tobillo: 22 },
  '6':  { busto: 88, cintura: 70, cadera: 94, hombro: 39, largo_manga: 61, largo_torso: 41, largo_total: 142, contorno_cuello: 36, largo_pierna: 103, entrepierna: 77, muslo: 54, tobillo: 23 },
  '8':  { busto: 92, cintura: 74, cadera: 98, hombro: 40, largo_manga: 61, largo_torso: 41, largo_total: 143, contorno_cuello: 37, largo_pierna: 104, entrepierna: 78, muslo: 56, tobillo: 23 },
  '10': { busto: 96, cintura: 78, cadera: 102, hombro: 41, largo_manga: 62, largo_torso: 42, largo_total: 144, contorno_cuello: 38, largo_pierna: 104, entrepierna: 78, muslo: 58, tobillo: 24 },
  '12': { busto: 100, cintura: 82, cadera: 106, hombro: 43, largo_manga: 63, largo_torso: 43, largo_total: 146, contorno_cuello: 40, largo_pierna: 105, entrepierna: 79, muslo: 60, tobillo: 25 },
  '14': { busto: 106, cintura: 88, cadera: 112, hombro: 44, largo_manga: 64, largo_torso: 44, largo_total: 147, contorno_cuello: 41, largo_pierna: 106, entrepierna: 80, muslo: 63, tobillo: 26 },
  '16': { busto: 112, cintura: 94, cadera: 118, hombro: 46, largo_manga: 65, largo_torso: 45, largo_total: 149, contorno_cuello: 43, largo_pierna: 107, entrepierna: 81, muslo: 66, tobillo: 27 },
  // EU numeric
  '32': { busto: 76, cintura: 58, cadera: 82, hombro: 36, largo_manga: 58, largo_torso: 38, largo_total: 135, contorno_cuello: 33, largo_pierna: 100, entrepierna: 74, muslo: 48, tobillo: 20 },
  '34': { busto: 80, cintura: 62, cadera: 86, hombro: 37, largo_manga: 59, largo_torso: 39, largo_total: 137, contorno_cuello: 34, largo_pierna: 101, entrepierna: 75, muslo: 50, tobillo: 21 },
  '36': { busto: 84, cintura: 66, cadera: 90, hombro: 38, largo_manga: 60, largo_torso: 40, largo_total: 140, contorno_cuello: 35, largo_pierna: 102, entrepierna: 76, muslo: 52, tobillo: 22 },
  '38': { busto: 88, cintura: 70, cadera: 94, hombro: 39, largo_manga: 61, largo_torso: 41, largo_total: 142, contorno_cuello: 36, largo_pierna: 103, entrepierna: 77, muslo: 54, tobillo: 23 },
  '40': { busto: 92, cintura: 74, cadera: 98, hombro: 40, largo_manga: 61, largo_torso: 41, largo_total: 143, contorno_cuello: 37, largo_pierna: 104, entrepierna: 78, muslo: 56, tobillo: 23 },
  '42': { busto: 96, cintura: 78, cadera: 102, hombro: 41, largo_manga: 62, largo_torso: 42, largo_total: 144, contorno_cuello: 38, largo_pierna: 104, entrepierna: 78, muslo: 58, tobillo: 24 },
  '44': { busto: 100, cintura: 82, cadera: 106, hombro: 43, largo_manga: 63, largo_torso: 43, largo_total: 146, contorno_cuello: 40, largo_pierna: 105, entrepierna: 79, muslo: 60, tobillo: 25 },
  '46': { busto: 106, cintura: 88, cadera: 112, hombro: 44, largo_manga: 64, largo_torso: 44, largo_total: 147, contorno_cuello: 41, largo_pierna: 106, entrepierna: 80, muslo: 63, tobillo: 26 },
  '48': { busto: 112, cintura: 94, cadera: 118, hombro: 46, largo_manga: 65, largo_torso: 45, largo_total: 149, contorno_cuello: 43, largo_pierna: 107, entrepierna: 81, muslo: 66, tobillo: 27 },
  'Custom / A medida': { busto: 0, cintura: 0, cadera: 0, hombro: 0, largo_manga: 0, largo_torso: 0, largo_total: 0, contorno_cuello: 0, largo_pierna: 0, entrepierna: 0, muslo: 0, tobillo: 0 },
};

const PIECE_STATUS_CONFIG: Record<PieceStatus, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-gray-600', bg: 'bg-gray-100' },
  cortado: { label: 'Cortado', color: 'text-amber-700', bg: 'bg-amber-50' },
  cosido: { label: 'Cosido', color: 'text-blue-700', bg: 'bg-blue-50' },
  terminado: { label: 'Terminado', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const CATEGORY_LABELS: Record<string, string> = {
  dress: 'Vestido', gown: 'Vestido de Gala', suit: 'Traje', blazer: 'Blazer',
  coat: 'Abrigo', skirt: 'Falda', pants: 'Pantalón', blouse: 'Blusa',
  shirt: 'Camisa', jumpsuit: 'Jumpsuit', cape: 'Capa', corset: 'Corsé',
  accessory: 'Accesorio', other: 'Otro',
};

const COMPLEXITY_LABELS = ['', 'Básico', 'Simple', 'Medio', 'Complejo', 'Alta Costura'];

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

// ============================================================
// Component
// ============================================================

type SubTab = 'medidas' | 'piezas' | 'ficha';

export default function PatternsPage() {
  const router = useRouter();

  // Auth / maison
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Garments
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);

  // Pattern state
  const [subTab, setSubTab] = useState<SubTab>('medidas');
  const [sizeSystem, setSizeSystem] = useState<SizeSystemKey>('international');
  const [measurements, setMeasurements] = useState<Record<string, Record<string, number>>>({});
  const [pieces, setPieces] = useState<PatternPiece[]>([]);
  const [constructionNotes, setConstructionNotes] = useState('');

  // New piece form
  const [showNewPiece, setShowNewPiece] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');

  const selectedGarment = garments.find((g) => g.id === selectedGarmentId) || null;
  const bodyZone: BodyZoneKey = (selectedGarment?.body_zone as BodyZoneKey) || 'full';
  const measurementPoints = MEASUREMENT_POINTS[bodyZone];
  const sizes = SIZE_SYSTEMS[sizeSystem];

  // --------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------

  useEffect(() => {
    fetchMaison();
  }, []);

  useEffect(() => {
    if (maisonId) fetchGarments();
  }, [maisonId]);

  async function fetchMaison() {
    try {
      const res = await fetch('/api/cereus/maison');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (!data.hasAccess) {
        const path = window.location.pathname;
        router.push(path.startsWith('/cereus') ? '/cereus' : '/apps/cereus');
        return;
      }
      setMaisonId(data.maison.id);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  async function fetchGarments() {
    try {
      const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}`);
      const data = await res.json();
      setGarments(data.garments || []);
    } catch {
      setError('Error al cargar prendas');
    }
  }

  // --------------------------------------------------------
  // Garment selection
  // --------------------------------------------------------

  const handleSelectGarment = useCallback((garmentId: string) => {
    setSelectedGarmentId(garmentId);
    const garment = garments.find((g) => g.id === garmentId);
    if (!garment) return;

    // Load existing pattern_data or build defaults
    if (garment.pattern_data) {
      const pd = garment.pattern_data;
      setSizeSystem(pd.sizeSystem || 'international');
      setMeasurements(pd.measurements || {});
      setPieces(pd.pieces || []);
      setConstructionNotes(pd.constructionNotes || '');
    } else {
      const zone = (garment.body_zone as BodyZoneKey) || 'full';
      setSizeSystem('international');
      setMeasurements(buildDefaultMeasurements('international', zone));
      setPieces(buildDefaultPieces(garment.category));
      setConstructionNotes('');
    }
    setSubTab('medidas');
    setSaveMsg(null);
  }, [garments]);

  // --------------------------------------------------------
  // Size system change
  // --------------------------------------------------------

  function handleSizeSystemChange(newSystem: SizeSystemKey) {
    setSizeSystem(newSystem);
    setMeasurements(buildDefaultMeasurements(newSystem, bodyZone));
  }

  // --------------------------------------------------------
  // Measurement editing
  // --------------------------------------------------------

  function updateMeasurement(size: string, point: string, value: number) {
    setMeasurements((prev) => ({
      ...prev,
      [size]: { ...prev[size], [point]: value },
    }));
  }

  // --------------------------------------------------------
  // Pieces
  // --------------------------------------------------------

  function addPiece() {
    if (!newPieceName.trim()) return;
    setPieces((prev) => [
      ...prev,
      { id: generateId(), name: newPieceName.trim(), fabric_meters: 0, notes: '', status: 'pendiente' },
    ]);
    setNewPieceName('');
    setShowNewPiece(false);
  }

  function removePiece(id: string) {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePiece(id: string, field: keyof PatternPiece, value: string | number) {
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  // --------------------------------------------------------
  // Save
  // --------------------------------------------------------

  async function savePatternData() {
    if (!selectedGarmentId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const patternData: PatternData = {
        sizeSystem,
        measurements,
        pieces,
        constructionNotes,
      };
      const res = await fetch('/api/cereus/garments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedGarmentId, pattern_data: patternData }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSaveMsg('Datos de patronaje guardados correctamente');
      // Update local garment data
      setGarments((prev) =>
        prev.map((g) => (g.id === selectedGarmentId ? { ...g, pattern_data: patternData } : g))
      );
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setError('Error al guardar los datos de patronaje');
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------
  // Computed
  // --------------------------------------------------------

  const totalFabricPerSize = sizes.map((size) => {
    const base = pieces.reduce((sum, p) => sum + (p.fabric_meters || 0), 0);
    // Slightly more fabric for larger sizes
    const idx = sizes.indexOf(size);
    const factor = 1 + idx * 0.03;
    return { size, meters: Math.round(base * factor * 100) / 100 };
  });

  const piecesProgress = pieces.length > 0
    ? Math.round((pieces.filter((p) => p.status === 'terminado').length / pieces.length) * 100)
    : 0;

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-cereus-primary" />
                  Patronaje y Moldes
                </h1>
                <p className="text-sm text-stone-500">Sistema de tallas, piezas y fichas técnicas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Save success */}
        {saveMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {saveMsg}
          </div>
        )}

        {/* Garment selector */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Seleccionar Prenda {loading && '(cargando...)'}
          </label>
          {!loading && garments.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-3">
              No hay prendas creadas. Ve al <a href="/cereus/designer" className="underline font-medium">Designer</a> para crear prendas primero.
            </div>
          )}
          <div className="relative">
            <select
              value={selectedGarmentId || ''}
              onChange={(e) => handleSelectGarment(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none appearance-none"
            >
              <option value="">-- Selecciona una prenda ({garments.length} disponibles) --</option>
              {garments.filter(g => g.status !== 'archived').map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.code ? `(${g.code})` : ''} — {CATEGORY_LABELS[g.category] || g.category}
                  {g.collection ? ` | ${g.collection.name}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Garment info */}
          {selectedGarment && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard icon={<Shirt className="w-4 h-4" />} label="Categoría" value={CATEGORY_LABELS[selectedGarment.category] || selectedGarment.category} />
              <InfoCard icon={<Ruler className="w-4 h-4" />} label="Zona Corporal" value={bodyZone === 'upper' ? 'Superior' : bodyZone === 'lower' ? 'Inferior' : 'Completo'} />
              <InfoCard icon={<Info className="w-4 h-4" />} label="Complejidad" value={COMPLEXITY_LABELS[selectedGarment.complexity_level] || String(selectedGarment.complexity_level)} />
              <InfoCard icon={<FileText className="w-4 h-4" />} label="Colección" value={selectedGarment.collection?.name || 'Sin colección'} />
            </div>
          )}
        </div>

        {/* Main content — requires garment selection */}
        {selectedGarment ? (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-xl border border-stone-200 p-1">
              <TabButton active={subTab === 'medidas'} onClick={() => setSubTab('medidas')} icon={<Table2 className="w-4 h-4" />} label="Tabla de Medidas" />
              <TabButton active={subTab === 'piezas'} onClick={() => setSubTab('piezas')} icon={<Puzzle className="w-4 h-4" />} label="Piezas del Molde" />
              <TabButton active={subTab === 'ficha'} onClick={() => setSubTab('ficha')} icon={<ClipboardList className="w-4 h-4" />} label="Ficha Técnica" />
            </div>

            {/* Sub-tab content */}
            {subTab === 'medidas' && (
              <SizeChartTab
                sizeSystem={sizeSystem}
                onSizeSystemChange={handleSizeSystemChange}
                sizes={sizes}
                measurementPoints={measurementPoints}
                measurements={measurements}
                onUpdateMeasurement={updateMeasurement}
                onSave={savePatternData}
                saving={saving}
              />
            )}

            {subTab === 'piezas' && (
              <PiecesTab
                pieces={pieces}
                onUpdatePiece={updatePiece}
                onRemovePiece={removePiece}
                showNewPiece={showNewPiece}
                onToggleNewPiece={() => setShowNewPiece(!showNewPiece)}
                newPieceName={newPieceName}
                onNewPieceNameChange={setNewPieceName}
                onAddPiece={addPiece}
                piecesProgress={piecesProgress}
              />
            )}

            {subTab === 'ficha' && (
              <TechPackTab
                garment={selectedGarment}
                sizeSystem={sizeSystem}
                sizes={sizes}
                measurementPoints={measurementPoints}
                measurements={measurements}
                pieces={pieces}
                totalFabricPerSize={totalFabricPerSize}
                constructionNotes={constructionNotes}
                onNotesChange={setConstructionNotes}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <Scissors className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">Selecciona una prenda para comenzar con el patronaje</p>
            <p className="text-stone-400 text-sm mt-1">Podrás definir tablas de medidas, piezas del molde y generar fichas técnicas</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {selectedGarment && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Volver
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={savePatternData}
                disabled={saving}
                className="px-5 py-2 bg-cereus-primary text-white text-sm font-medium rounded-lg hover:bg-cereus-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Todo
              </button>
              <button
                className="px-5 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors flex items-center gap-2"
                onClick={() => alert('Función de envío a taller próximamente disponible')}
              >
                <Send className="w-4 h-4" />
                Enviar a Taller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for fixed bar */}
      {selectedGarment && <div className="h-16" />}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-stone-800 truncate">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-cereus-primary text-white shadow-sm'
          : 'text-stone-600 hover:bg-stone-50'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ============================================================
// Tab 1: Tabla de Medidas
// ============================================================

function SizeChartTab({
  sizeSystem,
  onSizeSystemChange,
  sizes,
  measurementPoints,
  measurements,
  onUpdateMeasurement,
  onSave,
  saving,
}: {
  sizeSystem: SizeSystemKey;
  onSizeSystemChange: (s: SizeSystemKey) => void;
  sizes: string[];
  measurementPoints: string[];
  measurements: Record<string, Record<string, number>>;
  onUpdateMeasurement: (size: string, point: string, value: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-cereus-primary" />
          Tabla de Medidas
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-stone-600">Sistema de tallas:</label>
          <select
            value={sizeSystem}
            onChange={(e) => onSizeSystemChange(e.target.value as SizeSystemKey)}
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none"
          >
            {Object.entries(SIZE_SYSTEM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-stone-400 mb-3">Todas las medidas en centímetros (cm). Edita los valores según tus estándares.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50">
              <th className="text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200 sticky left-0 bg-stone-50 z-10 min-w-[100px]">
                Talla
              </th>
              {measurementPoints.map((point) => (
                <th key={point} className="text-center px-2 py-2 font-medium text-stone-600 border-b border-stone-200 min-w-[90px] whitespace-nowrap">
                  {MEASUREMENT_LABELS[point] || point}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-3 py-1.5 font-medium text-stone-800 border-b border-stone-100 sticky left-0 bg-white z-10">
                  {size}
                </td>
                {measurementPoints.map((point) => (
                  <td key={point} className="px-1 py-1 border-b border-stone-100 text-center">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={measurements[size]?.[point] ?? 0}
                      onChange={(e) => onUpdateMeasurement(size, point, parseFloat(e.target.value) || 0)}
                      className="w-full text-center border border-stone-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 bg-cereus-primary text-white text-sm font-medium rounded-lg hover:bg-cereus-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Tabla
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Piezas del Molde
// ============================================================

function PiecesTab({
  pieces,
  onUpdatePiece,
  onRemovePiece,
  showNewPiece,
  onToggleNewPiece,
  newPieceName,
  onNewPieceNameChange,
  onAddPiece,
  piecesProgress,
}: {
  pieces: PatternPiece[];
  onUpdatePiece: (id: string, field: keyof PatternPiece, value: string | number) => void;
  onRemovePiece: (id: string) => void;
  showNewPiece: boolean;
  onToggleNewPiece: () => void;
  newPieceName: string;
  onNewPieceNameChange: (v: string) => void;
  onAddPiece: () => void;
  piecesProgress: number;
}) {
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Progreso del taller</span>
          <span className="text-sm text-stone-500">{piecesProgress}% completado</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-2">
          <div
            className="bg-cereus-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${piecesProgress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> Pendiente</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Cortado</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Cosido</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Terminado</span>
        </div>
      </div>

      {/* Add piece */}
      <div className="flex justify-end">
        <button
          onClick={onToggleNewPiece}
          className="px-4 py-2 text-sm font-medium text-cereus-primary border border-cereus-primary/30 rounded-lg hover:bg-cereus-primary/5 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Pieza
        </button>
      </div>

      {showNewPiece && (
        <div className="bg-white rounded-xl border border-cereus-primary/20 p-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre de la pieza (ej: Bolsillo Lateral)"
            value={newPieceName}
            onChange={(e) => onNewPieceNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddPiece()}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none"
            autoFocus
          />
          <button
            onClick={onAddPiece}
            disabled={!newPieceName.trim()}
            className="px-4 py-2 bg-cereus-primary text-white text-sm font-medium rounded-lg hover:bg-cereus-primary/90 disabled:opacity-40 transition-colors"
          >
            Agregar
          </button>
          <button
            onClick={onToggleNewPiece}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      )}

      {/* Pieces grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pieces.map((piece) => {
          const statusConf = PIECE_STATUS_CONFIG[piece.status];
          return (
            <div key={piece.id} className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4 text-stone-400" />
                  <h3 className="font-medium text-stone-800 text-sm">{piece.name}</h3>
                </div>
                <button
                  onClick={() => onRemovePiece(piece.id)}
                  className="p-1 hover:bg-red-50 rounded text-stone-400 hover:text-red-500 transition-colors"
                  title="Eliminar pieza"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Tela requerida (m)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={piece.fabric_meters}
                    onChange={(e) => onUpdatePiece(piece.id, 'fabric_meters', parseFloat(e.target.value) || 0)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Estado</label>
                  <select
                    value={piece.status}
                    onChange={(e) => onUpdatePiece(piece.id, 'status', e.target.value)}
                    className={`w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none ${statusConf.color}`}
                  >
                    {Object.entries(PIECE_STATUS_CONFIG).map(([key, conf]) => (
                      <option key={key} value={key}>{conf.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-500 mb-1 block">Notas</label>
                <input
                  type="text"
                  placeholder="Notas opcionales..."
                  value={piece.notes}
                  onChange={(e) => onUpdatePiece(piece.id, 'notes', e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none"
                />
              </div>

              <div className="mt-2 flex justify-end">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color} font-medium`}>
                  {statusConf.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {pieces.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <Puzzle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No hay piezas definidas. Agrega piezas del molde para esta prenda.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 3: Ficha Técnica
// ============================================================

function TechPackTab({
  garment,
  sizeSystem,
  sizes,
  measurementPoints,
  measurements,
  pieces,
  totalFabricPerSize,
  constructionNotes,
  onNotesChange,
}: {
  garment: GarmentRow;
  sizeSystem: SizeSystemKey;
  sizes: string[];
  measurementPoints: string[];
  measurements: Record<string, Record<string, number>>;
  pieces: PatternPiece[];
  totalFabricPerSize: Array<{ size: string; meters: number }>;
  constructionNotes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-cereus-primary" />
          <h2 className="text-lg font-semibold text-stone-900">Ficha Técnica</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-500">Nombre</p>
            <p className="text-sm font-medium text-stone-800">{garment.name}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Código</p>
            <p className="text-sm font-medium text-stone-800">{garment.code || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Categoría</p>
            <p className="text-sm font-medium text-stone-800">{CATEGORY_LABELS[garment.category] || garment.category}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Colección</p>
            <p className="text-sm font-medium text-stone-800">{garment.collection?.name || '—'}</p>
          </div>
        </div>
      </div>

      {/* Materials from BOM */}
      {garment.garment_materials && garment.garment_materials.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-800 mb-3">Materiales (BOM)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Material</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Tipo</th>
                  <th className="text-center px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Cantidad</th>
                  <th className="text-center px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {garment.garment_materials.map((gm) => (
                  <tr key={gm.id} className="hover:bg-stone-50/50">
                    <td className="px-3 py-2 border-b border-stone-100">{gm.material?.name || '—'}</td>
                    <td className="px-3 py-2 border-b border-stone-100 capitalize">{gm.material?.type || '—'}</td>
                    <td className="px-3 py-2 border-b border-stone-100 text-center">{gm.quantity}</td>
                    <td className="px-3 py-2 border-b border-stone-100 text-center">{gm.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Size chart (read-only) */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-1">Tabla de Medidas</h3>
        <p className="text-xs text-stone-400 mb-3">Sistema: {SIZE_SYSTEM_LABELS[sizeSystem]} | Medidas en cm</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-2 py-1.5 font-medium text-stone-600 border-b border-stone-200">Talla</th>
                {measurementPoints.map((p) => (
                  <th key={p} className="text-center px-2 py-1.5 font-medium text-stone-600 border-b border-stone-200 whitespace-nowrap">
                    {MEASUREMENT_LABELS[p] || p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size} className="hover:bg-stone-50/50">
                  <td className="px-2 py-1.5 font-medium text-stone-700 border-b border-stone-100">{size}</td>
                  {measurementPoints.map((point) => (
                    <td key={point} className="px-2 py-1.5 text-center text-stone-600 border-b border-stone-100">
                      {measurements[size]?.[point] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern pieces */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Piezas del Molde</h3>
        {pieces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Pieza</th>
                  <th className="text-center px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Tela (m)</th>
                  <th className="text-center px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Estado</th>
                  <th className="text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200">Notas</th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((p) => {
                  const sc = PIECE_STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="px-3 py-2 border-b border-stone-100 font-medium text-stone-800">{p.name}</td>
                      <td className="px-3 py-2 border-b border-stone-100 text-center">{p.fabric_meters || '—'}</td>
                      <td className="px-3 py-2 border-b border-stone-100 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} font-medium`}>{sc.label}</span>
                      </td>
                      <td className="px-3 py-2 border-b border-stone-100 text-stone-500">{p.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-stone-400">No hay piezas definidas.</p>
        )}
      </div>

      {/* Total fabric per size */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Requerimiento Total de Tela por Talla</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
          {totalFabricPerSize.map(({ size, meters }) => (
            <div key={size} className="bg-stone-50 rounded-lg p-2 text-center border border-stone-100">
              <p className="text-xs text-stone-500">{size}</p>
              <p className="text-sm font-semibold text-stone-800">{meters > 0 ? `${meters} m` : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Construction notes */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-2">Notas de Construcción</h3>
        <textarea
          value={constructionNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Instrucciones de construcción, detalles de acabado, observaciones especiales..."
          rows={5}
          className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-cereus-primary/30 focus:border-cereus-primary outline-none resize-y"
        />
      </div>

      {/* Download placeholder */}
      <div className="flex justify-end">
        <button
          onClick={() => alert('Descarga de ficha técnica próximamente disponible')}
          className="px-5 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar Ficha
        </button>
      </div>
    </div>
  );
}
