'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layers, Shirt, Palette, Plus, ChevronRight, ChevronLeft, Loader2,
  Search, Sparkles, Edit3, Trash2, ExternalLink, Eye, Check, X,
  Upload, Image as ImageIcon, DollarSign, ArrowRight, Package,
  Target, Link2, Lock, Rocket, Share2, Copy, CheckCircle2,
} from 'lucide-react';
import { ImageUploader } from './image-uploader';

// ============================================================
// Types
// ============================================================

interface Collection {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  season: string;
  year: number;
  status: string;
  cover_image_url: string | null;
  mood_board_urls: string[] | null;
  inspiration_notes: string | null;
  target_pieces: number | null;
  target_revenue: number | null;
  avg_price_point: number | null;
  lookbook_code: string | null;
  created_at: string;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string;
  body_zone: string;
  images: { url: string; type: string; alt?: string }[];
  base_cost: number;
  base_labor_hours: number;
  base_labor_cost: number;
  complexity_level: number;
  base_price: number | null;
  margin_target: number;
  status: string;
  tags: string[];
  collection_id: string | null;
  tech_sheet_url: string | null;
  pattern_url: string | null;
  created_at: string;
  collection?: { id: string; name: string; code: string | null } | null;
}

interface Variant {
  id: string;
  garment_id: string;
  client_id: string | null;
  variant_name: string | null;
  color: string | null;
  color_hex: string | null;
  primary_material_id: string | null;
  material_overrides: any[];
  extras: Record<string, unknown>;
  preview_image_url: string | null;
  material_cost: number;
  labor_cost: number;
  extras_cost: number;
  total_cost: number;
  final_price: number;
  margin_actual: number | null;
  status: string;
  created_at: string;
  garment?: { id: string; name: string; code: string | null; category: string; images: any[]; base_cost: number; base_price: number | null } | null;
}

interface Material {
  id: string;
  name: string;
  type: string;
  unit_cost: number;
  unit: string;
  color_hex: string | null;
  swatch_url: string | null;
  image_url: string | null;
}

// ============================================================
// Constants
// ============================================================

const SEASONS = [
  { value: 'spring_summer', en: 'Spring/Summer', es: 'Primavera/Verano' },
  { value: 'fall_winter', en: 'Fall/Winter', es: 'Otoño/Invierno' },
  { value: 'resort', en: 'Resort', es: 'Resort' },
  { value: 'cruise', en: 'Cruise', es: 'Crucero' },
  { value: 'capsule', en: 'Capsule', es: 'Cápsula' },
  { value: 'bridal', en: 'Bridal', es: 'Nupcial' },
  { value: 'custom', en: 'Custom', es: 'Especial' },
];

const CATEGORIES = [
  { value: 'dress', en: 'Dress', es: 'Vestido' },
  { value: 'gown', en: 'Gown', es: 'Vestido de Gala' },
  { value: 'suit', en: 'Suit', es: 'Traje' },
  { value: 'blazer', en: 'Blazer', es: 'Blazer' },
  { value: 'coat', en: 'Coat', es: 'Abrigo' },
  { value: 'skirt', en: 'Skirt', es: 'Falda' },
  { value: 'pants', en: 'Pants', es: 'Pantalón' },
  { value: 'blouse', en: 'Blouse', es: 'Blusa' },
  { value: 'shirt', en: 'Shirt', es: 'Camisa' },
  { value: 'jumpsuit', en: 'Jumpsuit', es: 'Jumpsuit' },
  { value: 'cape', en: 'Cape', es: 'Capa' },
  { value: 'corset', en: 'Corset', es: 'Corsé' },
  { value: 'accessory', en: 'Accessory', es: 'Accesorio' },
  { value: 'other', en: 'Other', es: 'Otro' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  concept: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  design: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  production: { bg: 'bg-purple-500/10', text: 'text-purple-600' },
  launched: { bg: 'bg-green-500/10', text: 'text-green-600' },
  archived: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  draft: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-600' },
  proposed: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  ordered: { bg: 'bg-purple-500/10', text: 'text-purple-600' },
};

const EXTRAS_OPTIONS = [
  { key: 'embroidery', en: 'Embroidery', es: 'Bordado', price: 150 },
  { key: 'custom_lining', en: 'Custom Lining', es: 'Forro Especial', price: 80 },
  { key: 'special_buttons', en: 'Special Buttons', es: 'Botones Especiales', price: 45 },
  { key: 'length_adjustment', en: 'Length Adjustment', es: 'Ajuste de Largo', price: 30 },
  { key: 'hand_finishing', en: 'Hand Finishing', es: 'Acabado a Mano', price: 200 },
  { key: 'beading', en: 'Beading', es: 'Pedrería', price: 300 },
  { key: 'monogram', en: 'Monogram', es: 'Monograma', price: 60 },
];

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors.bg} ${colors.text}`}>
      {status}
    </span>
  );
}

function formatPrice(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================
// Main Designer Page
// ============================================================

export function DesignerPage() {
  const [tab, setTab] = useState<'collections' | 'garments' | 'variants'>('collections');
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);

  // Data
  const [collections, setCollections] = useState<Collection[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Selection
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // Forms
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // Cross-tab navigation
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<string | null>(null);
  const [openGarmentFormForCollection, setOpenGarmentFormForCollection] = useState<string | null>(null);

  useEffect(() => {
    fetchMaison();
  }, []);

  async function fetchMaison() {
    try {
      const res = await fetch('/api/cereus/maison');
      const data = await res.json();
      if (data.maison) {
        setMaisonId(data.maison.id);
        await Promise.all([
          fetchCollections(data.maison.id),
          fetchGarments(data.maison.id),
          fetchMaterials(data.maison.id),
        ]);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function fetchCollections(mid: string) {
    const res = await fetch(`/api/cereus/collections?maisonId=${mid}`);
    const data = await res.json();
    setCollections(data.collections || []);
  }

  async function fetchGarments(mid: string) {
    const res = await fetch(`/api/cereus/garments?maisonId=${mid}`);
    const data = await res.json();
    setGarments(data.garments || []);
  }

  async function fetchVariants(garmentId?: string) {
    if (!maisonId) return;
    const url = garmentId
      ? `/api/cereus/variants?garmentId=${garmentId}&preset=true`
      : `/api/cereus/variants?maisonId=${maisonId}&preset=true`;
    const res = await fetch(url);
    const data = await res.json();
    setVariants(data.variants || []);
  }

  async function fetchMaterials(mid: string) {
    const res = await fetch(`/api/cereus/materials?maisonId=${mid}`);
    const data = await res.json();
    setMaterials(data.materials || []);
  }

  const refresh = useCallback(async () => {
    if (!maisonId) return;
    await Promise.all([
      fetchCollections(maisonId),
      fetchGarments(maisonId),
    ]);
    if (selectedGarment) await fetchVariants(selectedGarment.id);
  }, [maisonId, selectedGarment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  const tabs = [
    { id: 'collections' as const, icon: Layers, en: 'Collections', es: 'Colecciones', count: collections.length },
    { id: 'garments' as const, icon: Shirt, en: 'Garments', es: 'Prendas', count: garments.length },
    { id: 'variants' as const, icon: Palette, en: 'Variants', es: 'Variantes', count: variants.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Designer Studio</h1>
          <p className="text-sm text-muted-foreground">Estudio del Diseñador</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'variants' && selectedGarment) fetchVariants(selectedGarment.id);
                else if (t.id === 'variants') fetchVariants();
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.es}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-cereus-gold/10 text-cereus-gold' : 'bg-muted'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'collections' && (
        <CollectionsTab
          maisonId={maisonId!}
          collections={collections}
          search={search}
          onSearch={setSearch}
          onRefresh={refresh}
          selectedCollection={selectedCollection}
          onSelectCollection={(c) => {
            setSelectedCollection(c);
            setEditingCollection(c);
          }}
          onUpdateSelectedCollection={setSelectedCollection}
          showForm={showCollectionForm}
          onShowForm={setShowCollectionForm}
          editingCollection={editingCollection}
          onEditCollection={setEditingCollection}
          garments={garments}
          onNavigateToGarments={(collectionId, openForm) => {
            setActiveCollectionFilter(collectionId);
            if (openForm) setOpenGarmentFormForCollection(collectionId);
            setTab('garments');
          }}
        />
      )}

      {tab === 'garments' && (
        <GarmentsTab
          maisonId={maisonId!}
          garments={garments}
          collections={collections}
          search={search}
          onSearch={setSearch}
          onRefresh={refresh}
          selectedGarment={selectedGarment}
          onSelectGarment={(g) => {
            setSelectedGarment(g);
            if (g) fetchVariants(g.id);
          }}
          showForm={showGarmentForm}
          onShowForm={setShowGarmentForm}
          collectionFilter={activeCollectionFilter}
          onClearCollectionFilter={() => setActiveCollectionFilter(null)}
          openFormForCollection={openGarmentFormForCollection}
          onClearOpenFormForCollection={() => setOpenGarmentFormForCollection(null)}
        />
      )}

      {tab === 'variants' && (
        <VariantsTab
          maisonId={maisonId!}
          variants={variants}
          garments={garments}
          materials={materials}
          selectedGarment={selectedGarment}
          onSelectGarment={(g) => {
            setSelectedGarment(g);
            if (g) fetchVariants(g.id);
          }}
          onRefresh={() => fetchVariants(selectedGarment?.id)}
          showForm={showVariantForm}
          onShowForm={setShowVariantForm}
        />
      )}
    </div>
  );
}

// ============================================================
// Collections Tab
// ============================================================

function CollectionsTab({
  maisonId, collections, search, onSearch, onRefresh,
  selectedCollection, onSelectCollection, onUpdateSelectedCollection,
  showForm, onShowForm,
  editingCollection, onEditCollection, garments,
  onNavigateToGarments,
}: {
  maisonId: string;
  collections: Collection[];
  search: string;
  onSearch: (s: string) => void;
  onRefresh: () => void;
  selectedCollection: Collection | null;
  onSelectCollection: (c: Collection | null) => void;
  onUpdateSelectedCollection: (c: Collection | null) => void;
  showForm: boolean;
  onShowForm: (b: boolean) => void;
  editingCollection: Collection | null;
  onEditCollection: (c: Collection | null) => void;
  garments: Garment[];
  onNavigateToGarments: (collectionId: string, openForm?: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formSeason, setFormSeason] = useState('spring_summer');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDescription, setFormDescription] = useState('');
  const [formTargetPieces, setFormTargetPieces] = useState(12);
  const [formCover, setFormCover] = useState('');
  const [formMoodBoard, setFormMoodBoard] = useState<string[]>([]);
  const [formInspirationNotes, setFormInspirationNotes] = useState('');

  function resetForm() {
    setFormName('');
    setFormCode('');
    setFormSeason('spring_summer');
    setFormYear(new Date().getFullYear());
    setFormDescription('');
    setFormTargetPieces(12);
    setFormCover('');
    setFormMoodBoard([]);
    setFormInspirationNotes('');
  }

  function populateForm(c: Collection) {
    setFormName(c.name);
    setFormCode(c.code || '');
    setFormSeason(c.season);
    setFormYear(c.year);
    setFormDescription(c.description || '');
    setFormTargetPieces(c.target_pieces || 12);
    setFormCover(c.cover_image_url || '');
    setFormMoodBoard(c.mood_board_urls || []);
    setFormInspirationNotes(c.inspiration_notes || '');
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingCollection) {
        // Update
        await fetch('/api/cereus/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCollection.id,
            name: formName,
            code: formCode || null,
            description: formDescription || null,
            season: formSeason,
            year: formYear,
            target_pieces: formTargetPieces,
            cover_image_url: formCover || null,
            mood_board_urls: formMoodBoard.length > 0 ? formMoodBoard : null,
            inspiration_notes: formInspirationNotes || null,
          }),
        });
      } else {
        // Create
        await fetch('/api/cereus/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maisonId,
            name: formName,
            code: formCode || null,
            description: formDescription || null,
            season: formSeason,
            year: formYear,
            target_pieces: formTargetPieces,
          }),
        });
      }
      onShowForm(false);
      onEditCollection(null);
      resetForm();
      onRefresh();
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(collection: Collection, newStatus: string) {
    setChangingStatus(true);
    try {
      const res = await fetch('/api/cereus/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: collection.id, status: newStatus }),
      });
      const data = await res.json();
      // Update local selectedCollection with new status (and lookbook_code if launched)
      const updated = { ...collection, status: newStatus, ...(data.collection || {}) };
      onUpdateSelectedCollection(updated);
      onRefresh();
    } catch {
      // Silent
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleGenerateBrief(collection: Collection) {
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/cereus/ai/collection-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          season: collection.season,
          year: collection.year,
          targetPieces: collection.target_pieces || 12,
          language: 'es',
          generateMoodImages: true,
        }),
      });
      const data = await res.json();
      if (data.brief) {
        // Merge AI-generated mood board images with existing ones
        const existingMoodBoard = collection.mood_board_urls || [];
        const newMoodBoard = data.moodBoardUrls || [];
        const mergedMoodBoard = [...existingMoodBoard, ...newMoodBoard];

        // Update collection with AI-generated description + notes + mood board
        const updatePayload: Record<string, unknown> = {
          id: collection.id,
          description: data.brief.description || collection.description,
          inspiration_notes: data.brief.inspiration_notes || collection.inspiration_notes,
        };
        if (mergedMoodBoard.length > 0) {
          updatePayload.mood_board_urls = mergedMoodBoard;
        }

        await fetch('/api/cereus/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        // Update local state so UI reflects changes immediately
        onUpdateSelectedCollection({
          ...collection,
          description: data.brief.description || collection.description,
          inspiration_notes: data.brief.inspiration_notes || collection.inspiration_notes,
          mood_board_urls: mergedMoodBoard.length > 0 ? mergedMoodBoard : collection.mood_board_urls,
        });
        onRefresh();
      }
    } catch {
      // Silent
    } finally {
      setGeneratingBrief(false);
    }
  }

  const filtered = collections.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  // Detail view
  if (selectedCollection) {
    const collectionGarments = garments.filter(g => g.collection_id === selectedCollection.id);
    const targetPieces = selectedCollection.target_pieces || 0;
    const progressPct = targetPieces > 0 ? Math.min((collectionGarments.length / targetPieces) * 100, 100) : 0;
    const isDesign = selectedCollection.status === 'design';
    const isProduction = selectedCollection.status === 'production';
    const isLaunched = selectedCollection.status === 'launched';
    const isConcept = selectedCollection.status === 'concept';
    const lookbookUrl = selectedCollection.lookbook_code
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/lookbook/${selectedCollection.lookbook_code}`
      : null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => onSelectCollection(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Collections / Volver
        </button>

        {/* Collection Header */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Cover Image — always show section in design mode */}
          {selectedCollection.cover_image_url ? (
            <div className="h-48 bg-muted relative">
              <img
                src={selectedCollection.cover_image_url}
                alt={selectedCollection.name}
                className="w-full h-full object-cover"
              />
              {isDesign && (
                <div className="absolute bottom-2 right-2">
                  <ImageUploader
                    bucket="cereus-garment-images"
                    folder="collections/covers"
                    onUpload={async (url) => {
                      await fetch('/api/cereus/collections', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedCollection.id, cover_image_url: url }),
                      });
                      onUpdateSelectedCollection({ ...selectedCollection, cover_image_url: url });
                      onRefresh();
                    }}
                    compact
                    label="Change"
                    labelEs="Cambiar"
                  />
                </div>
              )}
            </div>
          ) : isDesign ? (
            <div className="h-48 bg-muted/50 border-b border-dashed border-border flex flex-col items-center justify-center gap-3">
              <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Upload Cover Image / Subir Portada</p>
              <ImageUploader
                bucket="cereus-garment-images"
                folder="collections/covers"
                onUpload={async (url) => {
                  await fetch('/api/cereus/collections', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedCollection.id, cover_image_url: url }),
                  });
                  onUpdateSelectedCollection({ ...selectedCollection, cover_image_url: url });
                  onRefresh();
                }}
                compact
                label="Upload Cover"
                labelEs="Subir Portada"
              />
            </div>
          ) : null}

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-display font-bold">{selectedCollection.name}</h2>
                  <StatusBadge status={selectedCollection.status} />
                </div>
                {selectedCollection.code && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedCollection.code}</p>
                )}
                {selectedCollection.description && (
                  <p className="text-sm text-foreground/80 mt-2">{selectedCollection.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!isLaunched && (
                  <button
                    onClick={() => {
                      populateForm(selectedCollection);
                      onEditCollection(selectedCollection);
                      onShowForm(true);
                      onSelectCollection(null);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit Collection"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleGenerateBrief(selectedCollection)}
                  disabled={generatingBrief}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                    isDesign
                      ? 'bg-cereus-gold text-white hover:bg-cereus-gold/90'
                      : 'bg-cereus-gold/10 text-cereus-gold hover:bg-cereus-gold/20'
                  }`}
                >
                  {generatingBrief ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  AI Brief
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <span>{SEASONS.find(s => s.value === selectedCollection.season)?.es} {selectedCollection.year}</span>
              <span>{targetPieces} piezas objetivo</span>
              {lookbookUrl && (
                <a
                  href={lookbookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cereus-gold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lookbook
                </a>
              )}
            </div>

            {/* Progress bar — visible in design & production */}
            {(isDesign || isProduction) && targetPieces > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Progreso: {collectionGarments.length} / {targetPieces} prendas
                  </span>
                  <span>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPct >= 100 ? 'bg-green-500' : progressPct >= 50 ? 'bg-cereus-gold' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status-specific action bar */}
            <div className="flex flex-wrap gap-2 mt-4">
              {isConcept && (
                <button
                  onClick={() => handleStatusChange(selectedCollection, 'design')}
                  disabled={changingStatus}
                  className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Start Design / Iniciar Diseño
                </button>
              )}
              {isDesign && (
                <>
                  <button
                    onClick={() => onNavigateToGarments(selectedCollection.id, true)}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-cereus-gold text-white rounded-lg hover:bg-cereus-gold/90 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Garment / Agregar Prenda
                  </button>
                  <button
                    onClick={() => onNavigateToGarments(selectedCollection.id)}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Shirt className="w-4 h-4" />
                    View Garments / Ver Prendas
                  </button>
                  {collectionGarments.length > 0 && (
                    <button
                      onClick={() => handleStatusChange(selectedCollection, 'production')}
                      disabled={changingStatus}
                      className="flex items-center gap-2 text-sm px-4 py-2 bg-purple-500/10 text-purple-600 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                    >
                      {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                      Send to Production / Enviar a Producción
                    </button>
                  )}
                </>
              )}
              {isProduction && (
                <button
                  onClick={() => handleStatusChange(selectedCollection, 'launched')}
                  disabled={changingStatus}
                  className="flex items-center gap-2 text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Publish Lookbook / Publicar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========== STATUS-CONDITIONAL WORKSPACE ========== */}

        {/* DESIGN MODE: Upload areas always visible */}
        {isDesign && (
          <>
            {/* Mood Board — always show, even empty */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Mood Board</h3>
              {selectedCollection.mood_board_urls && selectedCollection.mood_board_urls.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                  {selectedCollection.mood_board_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover border border-border" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  Add images to your mood board to define the visual direction.
                  / Agrega imágenes para definir la dirección visual.
                </p>
              )}
              <ImageUploader
                bucket="cereus-garment-images"
                folder="collections/moodboard"
                onUpload={async (url) => {
                  const updated = [...(selectedCollection.mood_board_urls || []), url];
                  await fetch('/api/cereus/collections', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedCollection.id, mood_board_urls: updated }),
                  });
                  onUpdateSelectedCollection({ ...selectedCollection, mood_board_urls: updated });
                  onRefresh();
                }}
                multiple
                compact
                label="Add to Mood Board"
                labelEs="Agregar al Mood Board"
              />
            </div>

            {/* Inspiration Notes — always show in design */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Inspiration Notes / Notas de Inspiración</h3>
              {selectedCollection.inspiration_notes ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedCollection.inspiration_notes}</p>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <Sparkles className="w-5 h-5 text-cereus-gold/50" />
                  <p className="text-xs text-muted-foreground">
                    Use AI Brief to auto-generate inspiration notes, or edit the collection to add your own.
                    / Usa AI Brief para generar notas o edita la colección para agregar las tuyas.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CONCEPT / PRODUCTION / ARCHIVED: Show mood board + notes only if they exist */}
        {!isDesign && !isLaunched && (
          <>
            {selectedCollection.mood_board_urls && selectedCollection.mood_board_urls.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Mood Board</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {selectedCollection.mood_board_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}
            {selectedCollection.inspiration_notes && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Inspiration Notes / Notas de Inspiración</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedCollection.inspiration_notes}</p>
              </div>
            )}
          </>
        )}

        {/* PRODUCTION MODE: Readiness summary */}
        {isProduction && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-purple-600 mb-3">
              <Lock className="w-4 h-4" />
              Production / Producción
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Garments / Prendas</p>
                <p className="font-bold text-lg">{collectionGarments.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target / Objetivo</p>
                <p className="font-bold text-lg">{targetPieces}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Images / Con Fotos</p>
                <p className="font-bold text-lg">{collectionGarments.filter(g => g.images?.length > 0).length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Price / Con Precio</p>
                <p className="font-bold text-lg">{collectionGarments.filter(g => g.base_price).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* LAUNCHED MODE: Lookbook link + share */}
        {isLaunched && lookbookUrl && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-green-600 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              Published / Publicada
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={lookbookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Lookbook / Ver Lookbook
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lookbookUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied! / ¡Copiado!' : 'Copy Link / Copiar Enlace'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono break-all">{lookbookUrl}</p>
          </div>
        )}

        {/* Garments in Collection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Garments / Prendas ({collectionGarments.length}{targetPieces ? ` / ${targetPieces}` : ''})
            </h3>
            {isDesign && (
              <button
                onClick={() => onNavigateToGarments(selectedCollection.id, true)}
                className="flex items-center gap-1.5 text-xs text-cereus-gold hover:text-cereus-gold/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Garment / Agregar
              </button>
            )}
          </div>
          {collectionGarments.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 border border-dashed border-border rounded-xl">
              <Shirt className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No garments in this collection yet. / No hay prendas en esta colección aún.
              </p>
              {isDesign && (
                <button
                  onClick={() => onNavigateToGarments(selectedCollection.id, true)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Garment / Crear Primera Prenda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {collectionGarments.map(g => (
                <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-cereus-gold/30 transition-all">
                  {g.images?.[0]?.url ? (
                    <img src={g.images[0].url} alt={g.name} className="w-full aspect-[3/4] object-cover" />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                      <Shirt className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate group-hover:text-cereus-gold transition-colors">{g.name}</p>
                      <StatusBadge status={g.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORIES.find(c => c.value === g.category)?.es || g.category}
                    </p>
                    {g.base_price && (
                      <p className="text-xs font-medium text-cereus-gold mt-1">{formatPrice(g.base_price)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Collection Form
  if (showForm) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => { onShowForm(false); onEditCollection(null); resetForm(); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel / Cancelar
        </button>

        <h2 className="text-xl font-display font-bold">
          {editingCollection ? 'Edit Collection / Editar Colección' : 'New Collection / Nueva Colección'}
        </h2>

        <div className="grid gap-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Name / Nombre *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                placeholder="Primavera Eterna"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Code / Código</label>
              <input
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                placeholder="PE25"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Season / Temporada *</label>
              <select
                value={formSeason}
                onChange={e => setFormSeason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              >
                {SEASONS.map(s => (
                  <option key={s.value} value={s.value}>{s.es} — {s.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Year / Año *</label>
              <input
                type="number"
                value={formYear}
                onChange={e => setFormYear(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target Pieces / Piezas</label>
              <input
                type="number"
                value={formTargetPieces}
                onChange={e => setFormTargetPieces(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description / Descripción</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              placeholder="Collection concept and vision..."
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Cover Image / Imagen de Portada</label>
            <ImageUploader
              bucket="cereus-garment-images"
              folder="collections/covers"
              onUpload={(url) => setFormCover(url)}
              existingImages={formCover ? [formCover] : []}
              onRemove={() => setFormCover('')}
              compact
            />
          </div>

          {/* Mood Board */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Mood Board</label>
            <ImageUploader
              bucket="cereus-garment-images"
              folder="collections/moodboard"
              onUpload={(url) => setFormMoodBoard(prev => [...prev, url])}
              multiple
              existingImages={formMoodBoard}
              onRemove={(url) => setFormMoodBoard(prev => prev.filter(u => u !== url))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Inspiration Notes / Notas</label>
            <textarea
              value={formInspirationNotes}
              onChange={e => setFormInspirationNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              placeholder="Inspiration, references, mood..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formName || !formSeason}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingCollection ? 'Update / Actualizar' : 'Create / Crear'}
            </button>
            <button
              onClick={() => { onShowForm(false); onEditCollection(null); resetForm(); }}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel / Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search collections... / Buscar..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
          />
        </div>
        <button
          onClick={() => { resetForm(); onShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Collection / Nueva</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No collections yet / Sin colecciones</h3>
          <p className="text-sm text-muted-foreground">Create your first collection to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCollection(c)}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-cereus-gold/30 transition-all text-left w-full group"
            >
              {c.cover_image_url ? (
                <img src={c.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Layers className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium group-hover:text-cereus-gold transition-colors truncate">{c.name}</h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {SEASONS.find(s => s.value === c.season)?.es} {c.year}
                  {c.target_pieces && ` — ${c.target_pieces} piezas`}
                </p>
                {c.description && (
                  <p className="text-xs text-foreground/60 mt-1 truncate">{c.description}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Garments Tab
// ============================================================

function GarmentsTab({
  maisonId, garments, collections, search, onSearch, onRefresh,
  selectedGarment, onSelectGarment, showForm, onShowForm,
  collectionFilter, onClearCollectionFilter,
  openFormForCollection, onClearOpenFormForCollection,
}: {
  maisonId: string;
  garments: Garment[];
  collections: Collection[];
  search: string;
  onSearch: (s: string) => void;
  onRefresh: () => void;
  selectedGarment: Garment | null;
  onSelectGarment: (g: Garment | null) => void;
  showForm: boolean;
  onShowForm: (b: boolean) => void;
  collectionFilter?: string | null;
  onClearCollectionFilter?: () => void;
  openFormForCollection?: string | null;
  onClearOpenFormForCollection?: () => void;
}) {
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('dress');
  const [formDescription, setFormDescription] = useState('');
  const [formCollectionId, setFormCollectionId] = useState('');
  const [formBodyZone, setFormBodyZone] = useState('full');
  const [formComplexity, setFormComplexity] = useState(1);
  const [formLaborHours, setFormLaborHours] = useState(0);
  const [formLaborCost, setFormLaborCost] = useState(0);
  const [formBasePrice, setFormBasePrice] = useState(0);
  const [formMarginTarget, setFormMarginTarget] = useState(0.50);
  const [formImages, setFormImages] = useState<{ url: string; type: string }[]>([]);
  const [formTechSheet, setFormTechSheet] = useState('');

  // Auto-open form when navigated from collections tab
  useEffect(() => {
    if (openFormForCollection) {
      setFormCollectionId(openFormForCollection);
      onShowForm(true);
      onClearOpenFormForCollection?.();
    }
  }, [openFormForCollection]);

  function resetForm() {
    setFormName(''); setFormCode(''); setFormCategory('dress');
    setFormDescription(''); setFormCollectionId(collectionFilter || ''); setFormBodyZone('full');
    setFormComplexity(1); setFormLaborHours(0); setFormLaborCost(0);
    setFormBasePrice(0); setFormMarginTarget(0.50);
    setFormImages([]); setFormTechSheet('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/cereus/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: formName,
          code: formCode || null,
          description: formDescription || null,
          category: formCategory,
          body_zone: formBodyZone,
          collection_id: formCollectionId || null,
          complexity_level: formComplexity,
          base_labor_hours: formLaborHours,
          base_labor_cost: formLaborCost,
          base_price: formBasePrice || null,
          margin_target: formMarginTarget,
        }),
      });

      // If images, update garment with images
      // (garment images are stored as JSONB on the garment row)
      // We'd need the garment id first, but for now POST returns it
      onShowForm(false);
      resetForm();
      onRefresh();
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateImages(garment: Garment, images: { url: string; type: string }[]) {
    await fetch('/api/cereus/garments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: garment.id, images }),
    });
    onRefresh();
  }

  // Apply collection filter first, then search
  const collectionFiltered = collectionFilter
    ? garments.filter(g => g.collection_id === collectionFilter)
    : garments;

  const filtered = collectionFiltered.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.code?.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  const filterCollection = collectionFilter
    ? collections.find(c => c.id === collectionFilter)
    : null;

  // Detail view
  if (selectedGarment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onSelectGarment(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back / Volver
        </button>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-display font-bold">{selectedGarment.name}</h2>
                <StatusBadge status={selectedGarment.status} />
              </div>
              {selectedGarment.code && (
                <p className="text-sm text-muted-foreground mt-1">{selectedGarment.code}</p>
              )}
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{CATEGORIES.find(c => c.value === selectedGarment.category)?.es || selectedGarment.category}</span>
                <span>Complexity / Complejidad: {selectedGarment.complexity_level}/5</span>
                {selectedGarment.base_price && (
                  <span className="text-cereus-gold font-medium">{formatPrice(selectedGarment.base_price)}</span>
                )}
              </div>
            </div>
          </div>

          {selectedGarment.description && (
            <p className="text-sm text-foreground/80 mt-4">{selectedGarment.description}</p>
          )}
        </div>

        {/* Image Gallery */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Gallery / Galería</h3>
          {selectedGarment.images?.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
              {selectedGarment.images.map((img, i) => (
                <div key={i} className="relative aspect-[3/4]">
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full rounded-lg object-cover border border-border" />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-black/60 text-white rounded">
                    {img.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No images yet / Sin imágenes</p>
          )}
          <ImageUploader
            bucket="cereus-garment-images"
            folder={`garments/${selectedGarment.id}`}
            onUpload={(url) => {
              const newImages = [...(selectedGarment.images || []), { url, type: 'front' }];
              handleUpdateImages(selectedGarment, newImages);
            }}
            multiple
            compact
            label="Add Image"
            labelEs="Agregar Imagen"
          />
        </div>

        {/* Costing Summary */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Costing / Costeo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Labor Hours / Horas</p>
              <p className="font-medium">{selectedGarment.base_labor_hours}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Labor Cost / Costo Mano de Obra</p>
              <p className="font-medium">{formatPrice(selectedGarment.base_labor_cost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Complexity / Complejidad</p>
              <p className="font-medium">{selectedGarment.complexity_level}/5</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margin Target / Margen</p>
              <p className="font-medium">{(selectedGarment.margin_target * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form
  if (showForm) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => { onShowForm(false); resetForm(); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel / Cancelar
        </button>

        <h2 className="text-xl font-display font-bold">New Garment / Nueva Prenda</h2>

        <div className="grid gap-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Name / Nombre *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                placeholder="Evening Gown Silhouette A"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Code / Código</label>
              <input
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                placeholder="EG-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Category / Categoría *</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.es} — {c.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Body Zone / Zona</label>
              <select
                value={formBodyZone}
                onChange={e => setFormBodyZone(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              >
                <option value="upper">Upper / Superior</option>
                <option value="lower">Lower / Inferior</option>
                <option value="full">Full / Completo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Collection / Colección</label>
              <select
                value={formCollectionId}
                onChange={e => setFormCollectionId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              >
                <option value="">— None / Ninguna —</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description / Descripción</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Complexity / Complejidad</label>
              <select
                value={formComplexity}
                onChange={e => setFormComplexity(parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              >
                <option value={1}>1 — Simple</option>
                <option value={2}>2 — Moderate / Moderado</option>
                <option value={3}>3 — Complex / Complejo</option>
                <option value={4}>4 — Very Complex / Muy Complejo</option>
                <option value={5}>5 — Extreme / Extremo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Labor Hours / Horas</label>
              <input
                type="number"
                step="0.5"
                value={formLaborHours}
                onChange={e => setFormLaborHours(parseFloat(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Labor Cost / Costo MO</label>
              <input
                type="number"
                step="0.01"
                value={formLaborCost}
                onChange={e => setFormLaborCost(parseFloat(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Base Price / Precio Base</label>
              <input
                type="number"
                step="0.01"
                value={formBasePrice}
                onChange={e => setFormBasePrice(parseFloat(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formName || !formCategory}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create / Crear
            </button>
            <button
              onClick={() => { onShowForm(false); resetForm(); }}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel / Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search garments... / Buscar prendas..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
          />
        </div>
        <button
          onClick={() => {
            resetForm();
            if (collectionFilter) setFormCollectionId(collectionFilter);
            onShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Garment / Nueva</span>
        </button>
      </div>

      {/* Collection filter banner */}
      {filterCollection && (
        <div className="flex items-center justify-between bg-cereus-gold/5 border border-cereus-gold/20 rounded-lg px-4 py-2.5">
          <p className="text-sm">
            <span className="text-muted-foreground">Filtered by / Filtrado por:</span>{' '}
            <span className="font-medium">{filterCollection.name}</span>
          </p>
          <button
            onClick={onClearCollectionFilter}
            className="flex items-center gap-1 text-xs text-cereus-gold hover:text-cereus-gold/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear / Limpiar
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No garments yet / Sin prendas</h3>
          <p className="text-sm text-muted-foreground">
            {filterCollection
              ? `No garments in "${filterCollection.name}" yet. Create one! / Sin prendas en esta colección. ¡Crea una!`
              : 'Create your first garment to start designing.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectGarment(g)}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-cereus-gold/30 transition-all text-left group"
            >
              {g.images?.[0]?.url ? (
                <img src={g.images[0].url} alt={g.name} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                  <Shirt className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate group-hover:text-cereus-gold transition-colors">{g.name}</p>
                  <StatusBadge status={g.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CATEGORIES.find(c => c.value === g.category)?.es || g.category}
                  {g.collection?.name && ` — ${g.collection.name}`}
                </p>
                {g.base_price && (
                  <p className="text-xs font-medium text-cereus-gold mt-1">{formatPrice(g.base_price)}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Variants Tab
// ============================================================

function VariantsTab({
  maisonId, variants, garments, materials, selectedGarment,
  onSelectGarment, onRefresh, showForm, onShowForm,
}: {
  maisonId: string;
  variants: Variant[];
  garments: Garment[];
  materials: Material[];
  selectedGarment: Garment | null;
  onSelectGarment: (g: Garment | null) => void;
  onRefresh: () => void;
  showForm: boolean;
  onShowForm: (b: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  // Form
  const [formGarmentId, setFormGarmentId] = useState(selectedGarment?.id || '');
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formColorHex, setFormColorHex] = useState('#000000');
  const [formExtras, setFormExtras] = useState<Record<string, boolean>>({});
  const [formPreview, setFormPreview] = useState('');

  function resetForm() {
    setFormGarmentId(selectedGarment?.id || '');
    setFormName(''); setFormColor(''); setFormColorHex('#000000');
    setFormExtras({}); setFormPreview('');
  }

  // Live price calculation
  const selectedGarmentForForm = garments.find(g => g.id === formGarmentId);
  const extrasTotal = Object.entries(formExtras)
    .filter(([, v]) => v)
    .reduce((sum, [key]) => {
      const opt = EXTRAS_OPTIONS.find(e => e.key === key);
      return sum + (opt?.price || 0);
    }, 0);

  const estimatedCost = selectedGarmentForForm
    ? (selectedGarmentForForm.base_cost || 0) + extrasTotal
    : 0;
  const estimatedPrice = estimatedCost > 0
    ? estimatedCost / (1 - (selectedGarmentForForm?.margin_target || 0.50))
    : 0;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/cereus/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentId: formGarmentId,
          variantName: formName || null,
          color: formColor || null,
          colorHex: formColorHex || null,
          extras: formExtras,
          previewImageUrl: formPreview || null,
        }),
      });
      onShowForm(false);
      resetForm();
      onRefresh();
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(variantId: string, status: string) {
    await fetch('/api/cereus/variants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, status }),
    });
    onRefresh();
  }

  // Form view
  if (showForm) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => { onShowForm(false); resetForm(); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel / Cancelar
        </button>

        <h2 className="text-xl font-display font-bold">New Variant / Nueva Variante</h2>

        <div className="grid gap-4 max-w-2xl">
          {/* Garment selection */}
          <div>
            <label className="text-xs text-muted-foreground">Garment / Prenda *</label>
            <select
              value={formGarmentId}
              onChange={e => setFormGarmentId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
            >
              <option value="">— Select / Seleccionar —</option>
              {garments.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.category})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Variant Name / Nombre</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                placeholder="Midnight Blue"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                  placeholder="Midnight Blue"
                />
                <input
                  type="color"
                  value={formColorHex}
                  onChange={e => setFormColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Extras</label>
            <div className="grid grid-cols-2 gap-2">
              {EXTRAS_OPTIONS.map(opt => (
                <label
                  key={opt.key}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formExtras[opt.key]
                      ? 'border-cereus-gold bg-cereus-gold/5'
                      : 'border-border hover:border-cereus-gold/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!formExtras[opt.key]}
                      onChange={e => setFormExtras(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      formExtras[opt.key] ? 'bg-cereus-gold border-cereus-gold' : 'border-border'
                    }`}>
                      {formExtras[opt.key] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{opt.es}</span>
                  </div>
                  <span className="text-xs text-cereus-gold font-medium">+{formatPrice(opt.price)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Image */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Preview Image / Imagen</label>
            <ImageUploader
              bucket="cereus-garment-images"
              folder="variants/previews"
              onUpload={(url) => setFormPreview(url)}
              existingImages={formPreview ? [formPreview] : []}
              onRemove={() => setFormPreview('')}
              compact
            />
          </div>

          {/* Live Pricing */}
          {formGarmentId && (
            <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-cereus-gold" />
                Estimated Pricing / Precio Estimado
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Extras</p>
                  <p className="font-medium">{formatPrice(extrasTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Cost / Costo</p>
                  <p className="font-medium">{formatPrice(estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Suggested Price / Precio</p>
                  <p className="font-bold text-cereus-gold">{formatPrice(estimatedPrice)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formGarmentId}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create / Crear
            </button>
            <button
              onClick={() => { onShowForm(false); resetForm(); }}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel / Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Garment filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={selectedGarment?.id || ''}
            onChange={e => {
              const g = garments.find(g => g.id === e.target.value) || null;
              onSelectGarment(g);
            }}
            className="flex-1 max-w-sm px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
          >
            <option value="">All Garments / Todas las Prendas</option>
            {garments.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.category})</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { resetForm(); onShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Variant / Nueva</span>
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No variants yet / Sin variantes</h3>
          <p className="text-sm text-muted-foreground">
            {selectedGarment
              ? 'Create a variant for this garment.'
              : 'Select a garment or create a new variant.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {variants.map(v => (
            <div
              key={v.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {v.preview_image_url ? (
                <img src={v.preview_image_url} alt="" className="w-full aspect-square object-cover" />
              ) : v.color_hex ? (
                <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: v.color_hex + '20' }}>
                  <div className="w-16 h-16 rounded-full" style={{ backgroundColor: v.color_hex }} />
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <Palette className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{v.variant_name || v.color || 'Unnamed'}</p>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {v.garment?.name || 'Unknown garment'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-cereus-gold">{formatPrice(v.final_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    Cost: {formatPrice(v.total_cost)}
                  </p>
                </div>
                {/* Status actions */}
                <div className="flex gap-1 mt-2">
                  {v.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(v.id, 'proposed')}
                      className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full hover:bg-blue-500/20"
                    >
                      Propose
                    </button>
                  )}
                  {v.status === 'proposed' && (
                    <button
                      onClick={() => handleStatusChange(v.id, 'approved')}
                      className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full hover:bg-green-500/20"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
