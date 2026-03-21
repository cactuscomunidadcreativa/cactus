'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  Save,
  Shirt,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import { sanitizeSVG } from '../lib/svg-utils';

// ─── Category Mapping ───────────────────────────────────────
// Maps template IDs to valid cereus_garment_category enum values
// DB enum: dress, gown, suit, blazer, coat, skirt, pants, blouse, shirt, jumpsuit, cape, corset, accessory, other
const CATEGORY_MAP: Record<string, string> = {
  dress: 'dress',
  gown: 'gown',
  blouse: 'blouse',
  shirt: 'shirt',
  top: 'shirt',
  skirt: 'skirt',
  pants: 'pants',
  jacket: 'blazer',
  coat: 'coat',
  suit: 'suit',
  jumpsuit: 'jumpsuit',
  cape: 'cape',
  corset: 'corset',
  shoes: 'accessory',
  bag: 'accessory',
  belt: 'accessory',
  hat: 'accessory',
  scarf: 'accessory',
  jewelry: 'accessory',
  glasses: 'accessory',
};

// ─── Types ──────────────────────────────────────────────────

interface PieceCreatorProps {
  maisonId: string;
  collectionId: string;
  collectionName: string;
  season: string;
  selectedMaterialIds: string[];
  onComplete: () => void;
  onBack: () => void;
}

interface DesignBrief {
  concept: string;
  silhouetteNotes: string;
  fabricNotes: string;
  colorNotes: string;
  constructionDetails: string[];
  trendAlignment: string;
  designerTips: string;
  dallePrompt: string;
}

interface SketchResponse {
  imageUrl?: string;
  svgData?: string;
  source: string;
  designBrief: DesignBrief | null;
}

interface MaterialInfo {
  id: string;
  name: string;
  type: string;
  unit_cost: number;
  unit: string;
}

interface SavedPiece {
  id: string;
  name: string;
  category: string;
  template: string;
  thumbnail: string | null; // imageUrl or svg data uri
  materialIds: string[];
}

// ─── Constants ──────────────────────────────────────────────

const GARMENT_TEMPLATES = [
  // Prendas principales
  { id: 'dress', name: 'Vestido', icon: '\uD83D\uDC57', bodyZone: 'full' },
  { id: 'gown', name: 'Vestido de Gala', icon: '\uD83D\uDC57', bodyZone: 'full' },
  { id: 'blouse', name: 'Blusa', icon: '\uD83D\uDC5A', bodyZone: 'upper' },
  { id: 'shirt', name: 'Camisa', icon: '\uD83D\uDC54', bodyZone: 'upper' },
  { id: 'top', name: 'Top', icon: '\uD83D\uDC55', bodyZone: 'upper' },
  { id: 'skirt', name: 'Falda', icon: '\uD83E\uDE73', bodyZone: 'lower' },
  { id: 'pants', name: 'Pantalon', icon: '\uD83D\uDC56', bodyZone: 'lower' },
  { id: 'jacket', name: 'Chaqueta/Blazer', icon: '\uD83E\uDDE5', bodyZone: 'upper' },
  { id: 'coat', name: 'Abrigo', icon: '\uD83E\uDDE5', bodyZone: 'full' },
  { id: 'suit', name: 'Traje', icon: '\uD83D\uDC54', bodyZone: 'full' },
  { id: 'jumpsuit', name: 'Jumpsuit', icon: '\uD83E\uDE73', bodyZone: 'full' },
  { id: 'cape', name: 'Capa', icon: '\uD83E\uDDE3', bodyZone: 'upper' },
  { id: 'corset', name: 'Corse', icon: '\uD83D\uDC59', bodyZone: 'upper' },
  // Accesorios
  { id: 'shoes', name: 'Zapatos', icon: '\uD83D\uDC60', bodyZone: 'accessory' },
  { id: 'bag', name: 'Bolso/Cartera', icon: '\uD83D\uDC5C', bodyZone: 'accessory' },
  { id: 'belt', name: 'Correa/Cinturon', icon: '\uD83E\uDE75', bodyZone: 'accessory' },
  { id: 'hat', name: 'Sombrero', icon: '\uD83E\uDDE2', bodyZone: 'accessory' },
  { id: 'scarf', name: 'Panuelo/Bufanda', icon: '\uD83E\uDDE3', bodyZone: 'accessory' },
  { id: 'jewelry', name: 'Joyeria', icon: '\uD83D\uDC8D', bodyZone: 'accessory' },
  { id: 'glasses', name: 'Lentes', icon: '\uD83D\uDC53', bodyZone: 'accessory' },
] as const;

type TemplateId = (typeof GARMENT_TEMPLATES)[number]['id'];

// ─── Component ──────────────────────────────────────────────

export default function PieceCreator({
  maisonId,
  collectionId,
  collectionName,
  season,
  selectedMaterialIds,
  onComplete,
  onBack,
}: PieceCreatorProps) {
  // ── Piece list ──
  const [pieces, setPieces] = useState<SavedPiece[]>([]);

  // ── Form state ──
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [brief, setBrief] = useState<DesignBrief | null>(null);
  const [sketchResponse, setSketchResponse] = useState<SketchResponse | null>(null);
  const [pieceName, setPieceName] = useState('');
  const [assignedMaterials, setAssignedMaterials] = useState<string[]>([]);

  // ── Materials info ──
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [materialsLoaded, setMaterialsLoaded] = useState(false);

  // ── Loading states ──
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [regeneratingVisual, setRegeneratingVisual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch materials info ──
  useEffect(() => {
    if (materialsLoaded || selectedMaterialIds.length === 0) return;
    (async () => {
      try {
        const res = await fetch(`/api/cereus/materials?maisonId=${maisonId}`);
        const data = await res.json();
        if (data.materials) {
          const filtered = (data.materials as MaterialInfo[]).filter((m) =>
            selectedMaterialIds.includes(m.id),
          );
          setMaterials(filtered);
        }
      } catch {
        // Non-critical, we can still show IDs
      } finally {
        setMaterialsLoaded(true);
      }
    })();
  }, [maisonId, selectedMaterialIds, materialsLoaded]);

  // ── Generate brief after template selection ──
  const generateBrief = useCallback(
    async (template: TemplateId) => {
      setGeneratingBrief(true);
      setError(null);
      try {
        const res = await fetch('/api/cereus/ai/generate-sketch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template,
            fabrics: ['Seda'],
            colors: ['#0A0A0A'],
            collectionName,
            season,
            lang: 'es',
          }),
        });
        const data: SketchResponse = await res.json();
        setSketchResponse(data);

        if (data.designBrief) {
          setBrief({ ...data.designBrief });
          // Pre-fill piece name from concept (first 3 words)
          const words = data.designBrief.concept.split(/\s+/).slice(0, 3).join(' ');
          setPieceName(words);
        } else {
          // Create a default brief if AI didn't return one
          setBrief({
            concept: '',
            silhouetteNotes: '',
            fabricNotes: '',
            colorNotes: '',
            constructionDetails: [''],
            trendAlignment: '',
            designerTips: '',
            dallePrompt: '',
          });
          setPieceName('');
        }
        setSubStep(2);
      } catch {
        setError('Error generando el brief. Intenta de nuevo.');
      } finally {
        setGeneratingBrief(false);
      }
    },
    [collectionName, season],
  );

  // ── Regenerate visual ──
  const regenerateVisual = useCallback(async () => {
    if (!selectedTemplate) return;
    setRegeneratingVisual(true);
    setError(null);
    try {
      const res = await fetch('/api/cereus/ai/generate-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          fabrics: ['Seda'],
          colors: ['#0A0A0A'],
          collectionName,
          season,
          lang: 'es',
        }),
      });
      const data: SketchResponse = await res.json();
      setSketchResponse(data);
    } catch {
      setError('Error regenerando el visual.');
    } finally {
      setRegeneratingVisual(false);
    }
  }, [selectedTemplate, collectionName, season]);

  // ── Save piece ──
  const savePiece = useCallback(async () => {
    if (!selectedTemplate || !brief || !pieceName.trim()) return;
    setSaving(true);
    setError(null);

    const tmpl = GARMENT_TEMPLATES.find((t) => t.id === selectedTemplate)!;
    const description = [
      brief.concept,
      brief.silhouetteNotes,
      brief.fabricNotes,
      ...brief.constructionDetails.filter(Boolean),
    ]
      .filter(Boolean)
      .join('. ');

    try {
      const res = await fetch('/api/cereus/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: pieceName.trim(),
          category: CATEGORY_MAP[tmpl.id] || tmpl.id,
          collection_id: collectionId,
          description,
          body_zone: tmpl.bodyZone,
          season,
          tags: assignedMaterials,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Build thumbnail
      let thumbnail: string | null = null;
      if (sketchResponse?.imageUrl) {
        thumbnail = sketchResponse.imageUrl;
      } else if (sketchResponse?.svgData) {
        const sanitized = sanitizeSVG(sketchResponse.svgData);
        thumbnail = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(sanitized)))}`;
      }

      const newPiece: SavedPiece = {
        id: data.garment?.id || crypto.randomUUID(),
        name: pieceName.trim(),
        category: tmpl.id,
        template: selectedTemplate,
        thumbnail,
        materialIds: assignedMaterials,
      };
      setPieces((prev) => [...prev, newPiece]);

      // Reset form for next piece
      resetForm();
    } catch {
      setError('Error guardando la pieza.');
    } finally {
      setSaving(false);
    }
  }, [
    selectedTemplate,
    brief,
    pieceName,
    maisonId,
    collectionId,
    season,
    assignedMaterials,
    sketchResponse,
  ]);

  const resetForm = () => {
    setSubStep(1);
    setSelectedTemplate(null);
    setBrief(null);
    setSketchResponse(null);
    setPieceName('');
    setAssignedMaterials([]);
    setError(null);
  };

  // ── Brief field updaters ──
  const updateBriefField = (field: keyof DesignBrief, value: string | string[]) => {
    if (!brief) return;
    setBrief({ ...brief, [field]: value });
  };

  const updateConstructionDetail = (index: number, value: string) => {
    if (!brief) return;
    const updated = [...brief.constructionDetails];
    updated[index] = value;
    setBrief({ ...brief, constructionDetails: updated });
  };

  const addConstructionDetail = () => {
    if (!brief) return;
    setBrief({ ...brief, constructionDetails: [...brief.constructionDetails, ''] });
  };

  const removeConstructionDetail = (index: number) => {
    if (!brief) return;
    const updated = brief.constructionDetails.filter((_, i) => i !== index);
    setBrief({ ...brief, constructionDetails: updated.length > 0 ? updated : [''] });
  };

  const toggleMaterial = (materialId: string) => {
    setAssignedMaterials((prev) =>
      prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId],
    );
  };

  // ── Sub-step labels ──
  const subStepLabels = [
    { num: 1, label: 'Silueta' },
    { num: 2, label: 'Brief' },
    { num: 3, label: 'Visual' },
    { num: 4, label: 'Guardar' },
  ];

  // ── Render ──
  return (
    <div className="flex flex-col h-full">
      {/* Sub-step indicator */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {subStepLabels.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${
                  subStep === s.num
                    ? 'bg-cereus-gold text-white'
                    : subStep > s.num
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-400'
                }
              `}
            >
              {subStep > s.num ? <Check className="w-3 h-3" /> : null}
              {s.label}
            </div>
            {idx < subStepLabels.length - 1 && (
              <ChevronRight className="w-4 h-4 text-stone-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Main content: left list + right form */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* ── Left: Pieces list ── */}
        <div className="w-64 shrink-0 flex flex-col border border-stone-200 rounded-xl bg-white overflow-hidden">
          <div className="p-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-700">Piezas creadas</h3>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-xs text-cereus-gold hover:text-cereus-gold/80 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {pieces.length === 0 && (
              <div className="text-center py-8 text-stone-400">
                <Shirt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Aun no hay piezas</p>
              </div>
            )}
            {pieces.map((piece) => {
              const tmpl = GARMENT_TEMPLATES.find((t) => t.id === piece.template);
              return (
                <div
                  key={piece.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                >
                  {piece.thumbnail ? (
                    <img
                      src={piece.thumbnail}
                      alt={piece.name}
                      className="w-10 h-10 rounded-md object-cover bg-white border border-stone-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-stone-200 flex items-center justify-center text-lg">
                      {tmpl?.icon || '\uD83D\uDC57'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-stone-700 truncate">{piece.name}</p>
                    <p className="text-[10px] text-stone-400">{tmpl?.name || piece.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Form area ── */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Sub-step 1: Elegir Silueta */}
          {subStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">Elegir Silueta</h2>
              <p className="text-sm text-stone-500 mb-6">
                Selecciona el tipo de prenda para esta pieza
              </p>
              <div className="grid grid-cols-3 gap-4">
                {GARMENT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      generateBrief(tmpl.id);
                    }}
                    disabled={generatingBrief}
                    className={`
                      p-6 rounded-xl border-2 transition-all text-center hover:border-cereus-gold/50
                      hover:shadow-md disabled:opacity-50
                      ${
                        selectedTemplate === tmpl.id
                          ? 'border-cereus-gold bg-cereus-gold/5 shadow-md'
                          : 'border-stone-200 bg-white'
                      }
                    `}
                  >
                    <span className="text-4xl block mb-2">{tmpl.icon}</span>
                    <p className="text-sm font-medium text-stone-700">{tmpl.name}</p>
                  </button>
                ))}
              </div>
              {generatingBrief && (
                <div className="flex items-center justify-center gap-3 mt-8 py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-cereus-gold" />
                  <span className="text-sm text-stone-500">Generando brief con IA...</span>
                </div>
              )}
            </div>
          )}

          {/* Sub-step 2: Brief de Pieza */}
          {subStep === 2 && brief && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">Brief de Pieza</h2>
              <p className="text-sm text-stone-500 mb-6">
                Revisa y edita el brief generado por IA
              </p>

              <div className="space-y-4">
                {/* Concepto */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Concepto</label>
                  <textarea
                    value={brief.concept}
                    onChange={(e) => updateBriefField('concept', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none resize-none"
                  />
                </div>

                {/* Notas de silueta */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Notas de silueta
                  </label>
                  <textarea
                    value={brief.silhouetteNotes}
                    onChange={(e) => updateBriefField('silhouetteNotes', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none resize-none"
                  />
                </div>

                {/* Notas de tela */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Notas de tela
                  </label>
                  <textarea
                    value={brief.fabricNotes}
                    onChange={(e) => updateBriefField('fabricNotes', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none resize-none"
                  />
                </div>

                {/* Detalles de construccion */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Detalles de construccion
                  </label>
                  <div className="space-y-2">
                    {brief.constructionDetails.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) => updateConstructionDetail(i, e.target.value)}
                          placeholder={`Detalle ${i + 1}`}
                          className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none"
                        />
                        <button
                          onClick={() => removeConstructionDetail(i)}
                          className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addConstructionDetail}
                      className="flex items-center gap-1 text-xs text-cereus-gold hover:text-cereus-gold/80 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar detalle
                    </button>
                  </div>
                </div>

                {/* Tips del disenador */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Tips del disenador
                  </label>
                  <textarea
                    value={brief.designerTips}
                    onChange={(e) => updateBriefField('designerTips', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Aprobar Brief */}
              <div className="mt-6">
                <button
                  onClick={() => setSubStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> Aprobar Brief
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 3: Generar Visual */}
          {subStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">Generar Visual</h2>
              <p className="text-sm text-stone-500 mb-6">
                Visualiza el boceto generado para esta pieza
              </p>

              {/* Visual preview */}
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm max-w-md w-full">
                  {sketchResponse?.imageUrl ? (
                    <img
                      src={sketchResponse.imageUrl}
                      alt="Boceto generado"
                      className="w-full rounded-lg"
                    />
                  ) : sketchResponse?.svgData ? (
                    <div
                      className="w-full rounded-lg bg-white overflow-hidden"
                      style={{ maxHeight: '500px' }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSVG(sketchResponse.svgData),
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-stone-400">
                      <p className="text-sm">No se genero visual</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Regenerate + piece name */}
              <div className="space-y-4 max-w-md mx-auto">
                <button
                  onClick={regenerateVisual}
                  disabled={regeneratingVisual}
                  className="flex items-center gap-2 text-sm text-cereus-gold hover:text-cereus-gold/80 font-medium disabled:opacity-50"
                >
                  {regeneratingVisual ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerar Visual
                </button>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Nombre de la pieza
                  </label>
                  <input
                    type="text"
                    value={pieceName}
                    onChange={(e) => setPieceName(e.target.value)}
                    placeholder="Nombre de la pieza..."
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-cereus-gold focus:ring-1 focus:ring-cereus-gold/30 outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    setAssignedMaterials([...selectedMaterialIds]);
                    setSubStep(4);
                  }}
                  disabled={!pieceName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" /> Asignar Telas
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 4: Asignar Telas y Guardar */}
          {subStep === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">Asignar Telas y Guardar</h2>
              <p className="text-sm text-stone-500 mb-6">
                Selecciona los materiales para esta pieza
              </p>

              {materials.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {materials.map((mat) => (
                    <label
                      key={mat.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${
                          assignedMaterials.includes(mat.id)
                            ? 'border-cereus-gold bg-cereus-gold/5'
                            : 'border-stone-200 hover:border-stone-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={assignedMaterials.includes(mat.id)}
                        onChange={() => toggleMaterial(mat.id)}
                        className="w-4 h-4 rounded border-stone-300 text-cereus-gold focus:ring-cereus-gold/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700">{mat.name}</p>
                        <p className="text-[10px] text-stone-400">
                          {mat.type} &middot; ${mat.unit_cost}/{mat.unit}
                        </p>
                      </div>
                      {assignedMaterials.includes(mat.id) && (
                        <Check className="w-4 h-4 text-cereus-gold shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              ) : selectedMaterialIds.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {selectedMaterialIds.map((id) => (
                    <label
                      key={id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${
                          assignedMaterials.includes(id)
                            ? 'border-cereus-gold bg-cereus-gold/5'
                            : 'border-stone-200 hover:border-stone-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={assignedMaterials.includes(id)}
                        onChange={() => toggleMaterial(id)}
                        className="w-4 h-4 rounded border-stone-300 text-cereus-gold focus:ring-cereus-gold/30"
                      />
                      <span className="text-sm text-stone-600 truncate">{id}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400 mb-6">
                  No hay materiales seleccionados en pasos anteriores.
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
                  <X className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={savePiece}
                disabled={saving || !pieceName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar Pieza
                  </>
                )}
              </button>
            </div>
          )}

          {/* General error (sub-steps 1-3) */}
          {error && subStep !== 4 && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-4 bg-red-50 px-3 py-2 rounded-lg">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500">
            {pieces.length} {pieces.length === 1 ? 'pieza creada' : 'piezas creadas'}
          </span>
          <button
            onClick={onComplete}
            disabled={pieces.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ir a Costeo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
