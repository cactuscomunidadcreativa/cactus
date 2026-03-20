'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Library,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  X,
  ImageIcon,
  Palette,
  Plus,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────

interface ColorEntry {
  hex: string;
  name: string;
  role?: string;
}

interface FabricStudioProps {
  maisonId: string;
  collectionConcept: string;
  colorStory: ColorEntry[];
  season: string;
  onComplete: (selectedMaterialIds: string[]) => void;
  onBack: () => void;
}

interface Material {
  id: string;
  maison_id: string;
  name: string;
  type: string;
  subtype?: string;
  composition?: string;
  color_hex?: string;
  image_url?: string;
  swatch_url?: string;
  supplier?: string;
  code?: string;
  ai_generated?: boolean;
  generation_prompt?: string;
  tags?: string[];
}

interface GenerateResult {
  imageUrl: string;
  suggestedName: string;
  suggestedComposition: string;
  source: 'dall-e' | 'fallback';
}

type TabKey = 'ai' | 'upload' | 'library';

const TABS: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: 'ai', label: 'Crear con IA', icon: Sparkles },
  { key: 'upload', label: 'Subir Textura', icon: Upload },
  { key: 'library', label: 'Biblioteca', icon: Library },
];

const MATERIAL_TYPES = [
  { value: 'fabric', label: 'Tela' },
  { value: 'lining', label: 'Forro' },
  { value: 'trim', label: 'Avios / Trim' },
];

// ─── COMPONENT ──────────────────────────────────────────────

export default function FabricStudio({
  maisonId,
  collectionConcept,
  colorStory,
  season,
  onComplete,
  onBack,
}: FabricStudioProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('ai');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // AI tab state
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<GenerateResult | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiName, setAiName] = useState('');
  const [aiType, setAiType] = useState('fabric');
  const [aiComposition, setAiComposition] = useState('');
  const [aiColorHex, setAiColorHex] = useState(colorStory[0]?.hex || '#888888');
  const [savingAi, setSavingAi] = useState(false);

  // Upload tab state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('fabric');
  const [uploadComposition, setUploadComposition] = useState('');
  const [uploadColorHex, setUploadColorHex] = useState(colorStory[0]?.hex || '#888888');
  const [savingUpload, setSavingUpload] = useState(false);

  // Library tab state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch library ─────────────────────────────────────────

  const fetchMaterials = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const params = new URLSearchParams({ maisonId });
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/cereus/materials?${params}`);
      if (!res.ok) throw new Error('Error al cargar materiales');
      const json = await res.json();
      setMaterials(json.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoadingLibrary(false);
    }
  }, [maisonId, searchQuery]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // ── Selection toggle ──────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // ── AI generation ─────────────────────────────────────────

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setGenerating(true);
    setAiError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/cereus/ai/generate-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          collectionConcept,
          colorStory,
          fabricKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          season,
          lang: 'es',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error de generacion' }));
        throw new Error(err.error || 'Error de generacion');
      }

      const data: GenerateResult = await res.json();
      setAiResult(data);
      setAiName(data.suggestedName);
      setAiComposition(data.suggestedComposition);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Error al generar tela');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAi = async () => {
    if (!aiResult || !aiName.trim()) return;
    setSavingAi(true);

    try {
      const res = await fetch('/api/cereus/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: aiName,
          type: aiType,
          composition: aiComposition,
          color_hex: aiColorHex,
          image_url: aiResult.imageUrl,
          swatch_url: aiResult.imageUrl,
          ai_generated: true,
          generation_prompt: keywords,
          unit_cost: 0,
          unit: 'metro',
        }),
      });

      if (!res.ok) throw new Error('Error al guardar');
      const json = await res.json();
      if (json.material?.id) {
        setSelectedIds((prev) => [...prev, json.material.id]);
        setMaterials((prev) => [json.material, ...prev]);
      }
      // Reset AI form
      setAiResult(null);
      setKeywords('');
      setAiName('');
      setAiComposition('');
    } catch {
      // silently fail
    } finally {
      setSavingAi(false);
    }
  };

  // ── File upload ───────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = async () => {
    if (!uploadPreview || !uploadName.trim()) return;
    setSavingUpload(true);

    try {
      const res = await fetch('/api/cereus/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: uploadName,
          type: uploadType,
          composition: uploadComposition,
          color_hex: uploadColorHex,
          image_url: uploadPreview,
          swatch_url: uploadPreview,
          unit_cost: 0,
          unit: 'metro',
        }),
      });

      if (!res.ok) throw new Error('Error al guardar');
      const json = await res.json();
      if (json.material?.id) {
        setSelectedIds((prev) => [...prev, json.material.id]);
        setMaterials((prev) => [json.material, ...prev]);
      }
      // Reset upload form
      setUploadPreview(null);
      setUploadName('');
      setUploadComposition('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // silently fail
    } finally {
      setSavingUpload(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────

  const selectedMaterials = materials.filter((m) => selectedIds.includes(m.id));

  const renderSwatchImage = (mat: Material, size = 'h-32 w-full') => {
    const src = mat.swatch_url || mat.image_url;
    if (src) {
      return (
        <img
          src={src}
          alt={mat.name}
          className={`${size} object-cover rounded-t-lg`}
        />
      );
    }
    return (
      <div
        className={`${size} rounded-t-lg flex items-center justify-center`}
        style={{ backgroundColor: mat.color_hex || '#e5e7eb' }}
      >
        <Palette className="w-8 h-8 text-white/50" />
      </div>
    );
  };

  // ── Tab: Crear con IA ─────────────────────────────────────

  const renderAiTab = () => (
    <div className="space-y-6">
      {/* Context bar */}
      <div className="bg-cereus-cream/30 border border-cereus-gold/20 rounded-xl p-4">
        <p className="text-sm text-cereus-charcoal/60 mb-2 font-medium">
          Contexto de la coleccion
        </p>
        <p className="text-sm text-cereus-charcoal mb-3">{collectionConcept}</p>
        <div className="flex flex-wrap gap-2">
          {colorStory.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full border border-cereus-charcoal/20"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-xs text-cereus-charcoal/70">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords input */}
      <div>
        <label className="block text-sm font-medium text-cereus-charcoal mb-1.5">
          Palabras clave de la tela
        </label>
        <p className="text-xs text-cereus-charcoal/50 mb-2">
          Describe la textura, material, patron. Separa con comas.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="ej: floral, seda, transparente, bordado"
            className="flex-1 px-3 py-2.5 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-cereus-gold/40 focus:border-cereus-gold"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !keywords.trim()}
            className="px-5 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium
                       hover:bg-cereus-gold/90 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generar Tela
          </button>
        </div>
      </div>

      {/* Error */}
      {aiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {aiError}
        </div>
      )}

      {/* AI Result */}
      {aiResult && (
        <div className="border border-cereus-gold/30 rounded-xl overflow-hidden bg-white">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image preview */}
            <div className="bg-cereus-cream/20 p-4 flex items-center justify-center min-h-[280px]">
              <img
                src={aiResult.imageUrl}
                alt="Tela generada"
                className="max-w-full max-h-72 rounded-lg shadow-sm object-contain"
              />
            </div>

            {/* Edit fields */}
            <div className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-cereus-charcoal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cereus-gold" />
                Resultado generado
              </h4>

              <div>
                <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
                  Tipo
                </label>
                <select
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
                >
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
                  Composicion
                </label>
                <input
                  type="text"
                  value={aiComposition}
                  onChange={(e) => setAiComposition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
                  Color principal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={aiColorHex}
                    onChange={(e) => setAiColorHex(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-cereus-charcoal/20 cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-cereus-charcoal/60 font-mono">{aiColorHex}</span>
                </div>
              </div>

              <button
                onClick={handleSaveAi}
                disabled={savingAi || !aiName.trim()}
                className="w-full py-2.5 bg-cereus-charcoal text-white rounded-lg text-sm font-medium
                           hover:bg-cereus-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-colors"
              >
                {savingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar a Biblioteca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab: Subir Textura ────────────────────────────────────

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* Drop zone */}
      {!uploadPreview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-cereus-charcoal/20 rounded-xl p-12
                     hover:border-cereus-gold/50 hover:bg-cereus-cream/20 transition-colors
                     flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <Upload className="w-10 h-10 text-cereus-charcoal/30" />
          <span className="text-sm text-cereus-charcoal/60 font-medium">
            Haz clic o arrastra una imagen aqui
          </span>
          <span className="text-xs text-cereus-charcoal/40">
            JPG, PNG o WebP
          </span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={uploadPreview}
            alt="Vista previa"
            className="w-full max-h-72 object-contain rounded-xl border border-cereus-charcoal/10"
          />
          <button
            onClick={() => {
              setUploadPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition"
          >
            <X className="w-4 h-4 text-cereus-charcoal" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
            Nombre del material
          </label>
          <input
            type="text"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="ej: Seda estampada floral"
            className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
            Tipo
          </label>
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
            Composicion
          </label>
          <input
            type="text"
            value={uploadComposition}
            onChange={(e) => setUploadComposition(e.target.value)}
            placeholder="ej: 100% Seda"
            className="w-full px-3 py-2 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-cereus-charcoal/70 mb-1">
            Color principal
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={uploadColorHex}
              onChange={(e) => setUploadColorHex(e.target.value)}
              className="w-10 h-10 rounded-lg border border-cereus-charcoal/20 cursor-pointer p-0.5"
            />
            <span className="text-xs text-cereus-charcoal/60 font-mono">{uploadColorHex}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveUpload}
        disabled={savingUpload || !uploadPreview || !uploadName.trim()}
        className="w-full py-2.5 bg-cereus-charcoal text-white rounded-lg text-sm font-medium
                   hover:bg-cereus-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 transition-colors"
      >
        {savingUpload ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Guardar
      </button>
    </div>
  );

  // ── Tab: Biblioteca ───────────────────────────────────────

  const renderLibraryTab = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cereus-charcoal/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, codigo o proveedor..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-cereus-charcoal/20 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-cereus-gold/40"
        />
      </div>

      {/* Grid */}
      {loadingLibrary ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-cereus-gold" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-10 h-10 text-cereus-charcoal/20 mx-auto mb-3" />
          <p className="text-sm text-cereus-charcoal/50">
            No hay materiales en la biblioteca.
          </p>
          <p className="text-xs text-cereus-charcoal/40 mt-1">
            Genera o sube telas para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {materials.map((mat) => {
            const isSelected = selectedIds.includes(mat.id);
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => toggleSelect(mat.id)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-cereus-gold ring-2 ring-cereus-gold/30 shadow-md'
                      : 'border-cereus-charcoal/10 hover:border-cereus-charcoal/25'
                  }`}
              >
                {renderSwatchImage(mat)}
                <div className="p-2.5">
                  <p className="text-xs font-medium text-cereus-charcoal truncate">
                    {mat.name}
                  </p>
                  <p className="text-[10px] text-cereus-charcoal/50 capitalize mt-0.5">
                    {MATERIAL_TYPES.find((t) => t.value === mat.type)?.label || mat.type}
                    {mat.composition ? ` \u00B7 ${mat.composition}` : ''}
                  </p>
                </div>

                {/* Check badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-cereus-gold rounded-full flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Main render ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-cereus-charcoal">
          Estudio de Telas
        </h2>
        <p className="text-sm text-cereus-charcoal/60 mt-1">
          Crea, sube o selecciona materiales para tu coleccion.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cereus-charcoal/10 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${
                  isActive
                    ? 'border-cereus-gold text-cereus-charcoal'
                    : 'border-transparent text-cereus-charcoal/50 hover:text-cereus-charcoal/70'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {activeTab === 'ai' && renderAiTab()}
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'library' && renderLibraryTab()}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cereus-charcoal/10 px-6 py-4 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Left: back + selection chips */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-cereus-charcoal/60 hover:text-cereus-charcoal transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Atras
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-cereus-charcoal/50">
                  {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
                </span>
                {selectedMaterials.slice(0, 4).map((mat) => (
                  <span
                    key={mat.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium
                               bg-cereus-gold/10 text-cereus-charcoal rounded-full border border-cereus-gold/30"
                  >
                    {mat.color_hex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: mat.color_hex }}
                      />
                    )}
                    {mat.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(mat.id);
                      }}
                      className="hover:text-red-500 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedIds.length > 4 && (
                  <span className="text-[10px] text-cereus-charcoal/40">
                    +{selectedIds.length - 4} mas
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: continue */}
          <button
            type="button"
            onClick={() => onComplete(selectedIds)}
            disabled={selectedIds.length === 0}
            className="px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium
                       hover:bg-cereus-gold/90 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            Continuar a Piezas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
