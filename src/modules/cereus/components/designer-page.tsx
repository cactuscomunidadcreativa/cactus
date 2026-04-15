'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layers, Shirt, Palette, Plus, ChevronRight, ChevronLeft, Loader2,
  Search, Sparkles, Edit3, Trash2, ExternalLink, Eye, Check, X,
  Upload, Image as ImageIcon, DollarSign, ArrowRight, Package,
  Target, Link2, Lock, Rocket, Share2, Copy, CheckCircle2, MessageSquare,
  FolderInput, CopyPlus, MoreVertical, Archive,
} from 'lucide-react';
import { ImageUploader } from './image-uploader';
import { DesignStudio } from './design-studio';
import PieceCreator from './piece-creator';
import { DesignerWorkflow } from './designer-workflow';
import DesignFeedbackThread from './design-feedback';
import { ImageViewer } from './image-viewer';

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
  design_brief: Record<string, unknown> | null;
  sketch_source: string | null;
  pattern_data: Record<string, unknown> | null;
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
  const [mode, setMode] = useState<'workflow' | 'manage' | 'new-piece'>('workflow');
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
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setMode('workflow')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'workflow' ? 'bg-cereus-gold text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Flujo Creativo
          </button>
          <button
            onClick={() => setMode('new-piece')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
              mode === 'new-piece' ? 'bg-cereus-gold text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Nueva Pieza
          </button>
          <button
            onClick={() => setMode('manage')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'manage' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gestion
          </button>
        </div>
      </div>

      {/* Workflow Mode */}
      {mode === 'workflow' && maisonId && (
        <DesignerWorkflow maisonId={maisonId} />
      )}

      {/* New Independent Piece Mode */}
      {mode === 'new-piece' && maisonId && (
        <div className="space-y-4">
          <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cereus-gold" />
              Crear Pieza Independiente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Diseña una prenda sin necesidad de asociarla a una coleccion. Puedes asignarla a una coleccion despues.
            </p>
          </div>
          <PieceCreator
            maisonId={maisonId}
            collectionId=""
            collectionName="Pieza Independiente"
            season="spring_summer"
            selectedMaterialIds={[]}
            onComplete={() => {
              if (maisonId) fetchGarments(maisonId);
              setMode('manage');
              setTab('garments');
            }}
            onBack={() => setMode('manage')}
          />
        </div>
      )}

      {/* Management Mode (existing tabs) */}
      {mode === 'manage' && (<>

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
          onRefreshGarments={refresh}
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

      </>)}
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
  onNavigateToGarments, onRefreshGarments,
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
  onRefreshGarments: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);

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

  async function handleDuplicateCollection(c: Collection) {
    if (!confirm(`¿Duplicar colección "${c.name}"?`)) return;
    setSaving(true);
    try {
      await fetch('/api/cereus/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: `${c.name} (copia)`,
          code: c.code ? `${c.code}-copy` : '',
          season: c.season,
          year: c.year,
          description: c.description,
          target_pieces: c.target_pieces,
          cover_image_url: c.cover_image_url,
          mood_board_urls: c.mood_board_urls,
          inspiration_notes: c.inspiration_notes,
        }),
      });
      onRefresh();
    } catch { /* silent */ }
    setSaving(false);
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
                <button
                  onClick={() => {
                    populateForm(selectedCollection);
                    onEditCollection(selectedCollection);
                    onShowForm(true);
                    onSelectCollection(null);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar Colección"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicateCollection(selectedCollection)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Duplicar Colección"
                >
                  <CopyPlus className="w-4 h-4" />
                </button>
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
                    onClick={() => setShowDesignStudio(true)}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-cereus-gold text-white rounded-lg hover:bg-cereus-gold/90 transition-colors font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    Crear Pieza / Design Piece
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
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
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

        {/* Design Studio — opens inline when creating a new piece */}
        {showDesignStudio && (
          <div className="bg-card border border-cereus-gold/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cereus-gold" />
                Crear Pieza — {selectedCollection.name}
              </h3>
              <button
                onClick={() => setShowDesignStudio(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DesignStudio
              maisonId={maisonId}
              onSaveDesign={async (data) => {
                // Create garment linked to this collection
                const category = data.template === 'dress' ? 'dress'
                  : data.template === 'blouse' ? 'blouse'
                  : data.template === 'skirt' ? 'skirt'
                  : data.template === 'pants' ? 'pants'
                  : data.template === 'jacket' ? 'blazer'
                  : data.template === 'top' ? 'shirt'
                  : 'other';

                await fetch('/api/cereus/garments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    maisonId,
                    name: data.name,
                    category,
                    collection_id: selectedCollection.id,
                    description: `Fabric: ${data.fabric || 'N/A'}. Colors: ${data.colors.join(', ')}`,
                    body_zone: ['skirt', 'pants'].includes(data.template) ? 'lower'
                      : ['blouse', 'top'].includes(data.template) ? 'upper' : 'full',
                    complexity_level: 1,
                    base_labor_hours: 0,
                    base_labor_cost: 0,
                    images: data.canvasData ? [{ url: data.canvasData, type: 'sketch' }] : [],
                  }),
                });

                setShowDesignStudio(false);
                onRefresh();
                onRefreshGarments();
              }}
            />
          </div>
        )}

        {/* Garments in Collection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Garments / Prendas ({collectionGarments.length}{targetPieces ? ` / ${targetPieces}` : ''})
            </h3>
            <button
              onClick={() => setShowDesignStudio(true)}
              className="flex items-center gap-1.5 text-xs text-cereus-gold hover:text-cereus-gold/80 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              + Nueva Pieza con IA
            </button>
          </div>
          {collectionGarments.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 border border-dashed border-border rounded-xl">
              <Shirt className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No garments in this collection yet. / No hay prendas en esta colección aún.
              </p>
              <button
                onClick={() => setShowDesignStudio(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Crear Primera Pieza con IA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {collectionGarments.map(g => (
                <div
                  key={g.id}
                  onClick={() => onNavigateToGarments(selectedCollection.id)}
                  className="bg-card border border-border rounded-xl overflow-hidden group hover:border-cereus-gold/30 transition-all cursor-pointer"
                >
                  {g.images?.[0]?.url ? (
                    <img
                      src={g.images[0].url}
                      alt={g.name}
                      className="w-full aspect-[3/4] object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.querySelector('.fallback')?.classList.remove('hidden'); }}
                    />
                  ) : null}
                  <div className={`w-full aspect-[3/4] bg-muted flex items-center justify-center ${g.images?.[0]?.url ? 'hidden fallback' : ''}`}>
                    <Shirt className="w-8 h-8 text-muted-foreground" />
                  </div>
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
                    <p className="text-[10px] text-cereus-gold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click para editar →
                    </p>
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
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    populateForm(c);
                    onEditCollection(c);
                    onShowForm(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDuplicateCollection(c); }}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Duplicar"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`¿Eliminar colección "${c.name}" y todas sus prendas?`)) return;
                    await fetch(`/api/cereus/collections?id=${c.id}`, { method: 'DELETE' });
                    onRefresh();
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
// Garment Detail — Editable
// ============================================================

function GarmentDetailEditable({
  garment, collections, onBack, onRefresh, onUpdateImages,
}: {
  garment: Garment;
  collections: Collection[];
  onBack: () => void;
  onRefresh: () => void;
  onUpdateImages: (g: Garment, imgs: { url: string; type: string }[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(garment.name);
  const [code, setCode] = useState(garment.code || '');
  const [description, setDescription] = useState(garment.description || '');
  const [category, setCategory] = useState(garment.category);
  const [collectionId, setCollectionId] = useState(garment.collection_id || '');
  const [complexity, setComplexity] = useState(garment.complexity_level);
  const [laborHours, setLaborHours] = useState(garment.base_labor_hours);
  const [laborCost, setLaborCost] = useState(garment.base_labor_cost);
  const [basePrice, setBasePrice] = useState(garment.base_price || 0);
  const [marginTarget, setMarginTarget] = useState(garment.margin_target);
  const [status, setStatus] = useState(garment.status);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [aiImageMsg, setAiImageMsg] = useState<string | null>(null);

  const hasExpiredImages = garment.images?.some(img =>
    img.url.includes('oaidalleapiprodscus') || img.url.includes('blob.core.windows')
  );

  async function handleRegenerateImage() {
    setRegenerating(true);
    setAiImageMsg(null);
    try {
      const res = await fetch('/api/cereus/ai/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentId: garment.id, action: 'regenerate' }),
      });
      const data = await res.json();
      if (data.success) {
        setAiImageMsg('Imagen regenerada exitosamente');
        onRefresh();
      } else {
        setAiImageMsg(`Error: ${data.error}`);
      }
    } catch {
      setAiImageMsg('Error al regenerar');
    }
    setRegenerating(false);
  }

  async function handleEditImage() {
    if (!editPrompt.trim()) return;
    setRegenerating(true);
    setAiImageMsg(null);
    try {
      const res = await fetch('/api/cereus/ai/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentId: garment.id, action: 'edit', editPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setAiImageMsg('Correccion aplicada exitosamente');
        setEditingImage(false);
        setEditPrompt('');
        onRefresh();
      } else {
        setAiImageMsg(`Error: ${data.error}`);
      }
    } catch {
      setAiImageMsg('Error al corregir');
    }
    setRegenerating(false);
  }

  const brief = garment.design_brief as { concept?: string; silhouetteNotes?: string; fabricNotes?: string; constructionDetails?: string[]; designerTips?: string } | null;
  const collection = collections.find(c => c.id === garment.collection_id);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/cereus/garments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: garment.id,
          name, code: code || null, description: description || null,
          category, collection_id: collectionId || null,
          complexity_level: complexity,
          base_labor_hours: laborHours,
          base_labor_cost: laborCost,
          base_price: basePrice || null,
          margin_target: marginTarget,
          status,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefresh();
    } catch { /* */ }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600">✓ Guardado</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Main info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Código</label>
            <input value={code} onChange={e => setCode(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.es}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Colección</label>
            <select value={collectionId} onChange={e => setCollectionId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
              <option value="">Sin colección</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Estado</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
              <option value="draft">Borrador</option>
              <option value="approved">Aprobado</option>
              <option value="in_production">En Producción</option>
              <option value="completed">Completado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
        </div>
      </div>

      {/* Design Brief (read-only, from AI) */}
      {brief?.concept && (
        <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-medium text-cereus-gold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Brief de Diseño
          </h3>
          {brief.concept && <p className="text-sm font-medium">{brief.concept}</p>}
          {brief.silhouetteNotes && <p className="text-xs text-muted-foreground"><strong>Silueta:</strong> {brief.silhouetteNotes}</p>}
          {brief.fabricNotes && <p className="text-xs text-muted-foreground"><strong>Tela:</strong> {brief.fabricNotes}</p>}
          {brief.constructionDetails && brief.constructionDetails.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Detalles de construcción:</p>
              {brief.constructionDetails.map((d, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {d}</p>
              ))}
            </div>
          )}
          {brief.designerTips && <p className="text-xs italic text-cereus-gold/80">Tip: {brief.designerTips}</p>}
        </div>
      )}

      {/* Costeo + Precios */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Costeo y Precios</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Complejidad (1-5)</label>
            <input type="number" min={1} max={5} value={complexity} onChange={e => setComplexity(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Horas de Mano de Obra</label>
            <input type="number" step="0.5" value={laborHours} onChange={e => setLaborHours(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Costo Mano de Obra ($)</label>
            <input type="number" step="0.01" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Precio Base ($)</label>
            <input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Margen Objetivo (%)</label>
            <input type="number" step="0.01" min={0} max={1} value={marginTarget} onChange={e => setMarginTarget(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
          </div>
          {basePrice > 0 && laborCost > 0 && (
            <div className="flex items-end">
              <div>
                <p className="text-xs text-muted-foreground">Margen Actual</p>
                <p className={`text-lg font-mono font-bold ${((basePrice - laborCost) / basePrice) >= marginTarget ? 'text-green-600' : 'text-red-500'}`}>
                  {(((basePrice - laborCost) / basePrice) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">Galería</h3>
        {garment.images?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {garment.images.map((img, i) => (
              <div key={i} className="relative aspect-[3/4] group cursor-pointer rounded-xl overflow-hidden border border-border hover:border-cereus-gold/50 transition-all"
                onClick={() => setPreviewImg(img.url)}>
                <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-black/60 text-white rounded">{img.type}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newImages = garment.images.filter((_, j) => j !== i);
                    onUpdateImages(garment, newImages);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">Sin imágenes</p>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          <ImageUploader
            bucket="cereus-garment-images"
            folder={`garments/${garment.id}`}
            onUpload={(url) => {
              const newImages = [...(garment.images || []), { url, type: 'sketch' }];
              onUpdateImages(garment, newImages);
            }}
            multiple compact
            label="Agregar Imagen"
            labelEs="Agregar Imagen"
          />
        </div>

        {/* AI Image Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          {hasExpiredImages && (
            <button
              onClick={handleRegenerateImage}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cereus-gold text-white rounded-lg text-xs font-medium hover:bg-cereus-gold/90 disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Regenerar Imagen Rota
            </button>
          )}
          {!hasExpiredImages && (
            <button
              onClick={handleRegenerateImage}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-lg text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Regenerar con IA
            </button>
          )}
          <button
            onClick={() => setEditingImage(!editingImage)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-lg text-xs font-medium hover:bg-muted"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Corregir con IA
          </button>
          {aiImageMsg && (
            <span className={`text-xs ${aiImageMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {aiImageMsg}
            </span>
          )}
        </div>

        {/* AI Edit prompt */}
        {editingImage && (
          <div className="mt-3 p-3 bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl space-y-2">
            <p className="text-xs font-medium text-cereus-gold">Describe la correccion que quieres:</p>
            <textarea
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="Ej: Hazla mas larga, agrega mangas abullonadas, cambia el cuello a V, agrega bordado en el dobladillo..."
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditImage}
                disabled={regenerating || !editPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-cereus-gold text-white rounded-lg text-xs font-medium hover:bg-cereus-gold/90 disabled:opacity-50"
              >
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Aplicar Correccion
              </button>
              <button
                onClick={() => { setEditingImage(false); setEditPrompt(''); }}
                className="px-3 py-2 border border-input rounded-lg text-xs hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collection context */}
      {collection && (
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            Colección: <span className="font-medium text-foreground">{collection.name}</span> — {SEASONS.find(s => s.value === collection.season)?.es || collection.season} {collection.year}
          </p>
        </div>
      )}

      {/* Image Viewer with Zoom */}
      {previewImg && (
        <ImageViewer src={previewImg} alt="Preview" onClose={() => setPreviewImg(null)} />
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
  const [showArchived, setShowArchived] = useState(false);

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

  async function quickUpdateStatus(garmentId: string, newStatus: string) {
    await fetch('/api/cereus/garments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: garmentId, status: newStatus }),
    });
    onRefresh();
  }

  async function handleDeleteGarment(garmentId: string) {
    await fetch('/api/cereus/garments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: garmentId, status: 'archived' }),
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

  // Detail view — EDITABLE
  if (selectedGarment) {
    return (
      <GarmentDetailEditable
        garment={selectedGarment}
        collections={collections}
        onBack={() => onSelectGarment(null)}
        onRefresh={onRefresh}
        onUpdateImages={handleUpdateImages}
      />
    );
  }

  // Form — uses PieceCreator with full AI flow
  if (showForm) {
    const targetCollectionId = formCollectionId || collectionFilter || null;
    const targetCollection = targetCollectionId
      ? collections.find(c => c.id === targetCollectionId)
      : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { onShowForm(false); resetForm(); }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          {targetCollection && (
            <span className="text-xs text-muted-foreground">
              Coleccion: <span className="text-cereus-gold font-medium">{targetCollection.name}</span>
            </span>
          )}
        </div>

        <PieceCreator
          maisonId={maisonId}
          collectionId={targetCollectionId || ''}
          collectionName={targetCollection?.name || 'Sin coleccion'}
          season={targetCollection?.season || 'spring_summer'}
          selectedMaterialIds={[]}
          onComplete={() => {
            onShowForm(false);
            resetForm();
            onRefresh();
          }}
          onBack={() => {
            onShowForm(false);
            resetForm();
          }}
        />
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
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Prenda con IA</span>
        </button>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${showArchived ? 'bg-orange-500/10 text-orange-600 border border-orange-200' : 'border border-border text-muted-foreground hover:bg-muted'}`}
          title={showArchived ? 'Ocultar archivados' : 'Mostrar archivados'}
        >
          <Archive className="w-4 h-4" />
          <span className="hidden sm:inline">{showArchived ? 'Archivados' : 'Ver archivados'}</span>
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
          {filtered.filter(g => showArchived || g.status !== 'archived').map(g => (
            <div
              key={g.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-cereus-gold/30 transition-all group relative"
            >
              {/* Image — click to edit */}
              <div className="cursor-pointer" onClick={() => onSelectGarment(g)}>
                {g.images?.[0]?.url ? (
                  <img
                    src={g.images[0].url}
                    alt={g.name}
                    className="w-full aspect-[3/4] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                    <Shirt className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => onSelectGarment(g)}>
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

                {/* Quick actions */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                  {g.status !== 'approved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); quickUpdateStatus(g.id, 'approved'); }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-green-500/10 text-green-600 rounded-md hover:bg-green-500/20 transition-colors"
                      title="Aprobar"
                    >
                      <Check className="w-3 h-3" /> Aprobar
                    </button>
                  )}
                  {g.status === 'approved' && (
                    <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Aprobado
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectGarment(g); }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground rounded-md hover:bg-muted transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`¿Duplicar "${g.name}"?`)) return;
                      await fetch('/api/cereus/garments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          maisonId, name: `${g.name} (copia)`, code: g.code ? `${g.code}-copy` : '',
                          category: g.category, description: g.description, collection_id: g.collection_id,
                          complexity_level: g.complexity_level, base_labor_hours: g.base_labor_hours,
                          base_labor_cost: g.base_labor_cost, base_price: g.base_price, margin_target: g.margin_target,
                          images: g.images, tags: g.tags,
                        }),
                      });
                      onRefresh();
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground rounded-md hover:bg-muted transition-colors"
                    title="Duplicar"
                  >
                    <CopyPlus className="w-3 h-3" />
                  </button>
                  <select
                    onClick={(e) => e.stopPropagation()}
                    value={g.collection_id || ''}
                    onChange={async (e) => {
                      e.stopPropagation();
                      await fetch('/api/cereus/garments', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: g.id, collection_id: e.target.value || null }),
                      });
                      onRefresh();
                    }}
                    className="px-1.5 py-1 text-[10px] rounded-md border border-border bg-background text-muted-foreground hover:border-cereus-gold/50 transition-colors cursor-pointer max-w-[80px]"
                    title="Mover a colección"
                  >
                    <option value="">Sin colección</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Archivar esta prenda?')) handleDeleteGarment(g.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-orange-500 rounded-md hover:bg-orange-500/10 transition-colors ml-auto"
                    title="Archivar"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`¿ELIMINAR "${g.name}" permanentemente? Esto NO se puede deshacer.`)) return;
                      await fetch(`/api/cereus/garments?id=${g.id}`, { method: 'DELETE' });
                      onRefresh();
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

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
              onClick={() => setSelectedVariantId(selectedVariantId === v.id ? null : v.id)}
              className={`bg-card border rounded-xl overflow-hidden cursor-pointer transition-all ${selectedVariantId === v.id ? 'border-cereus-gold ring-2 ring-cereus-gold/30' : 'border-border hover:border-cereus-gold/50'}`}
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

      {/* Design Feedback Panel */}
      {selectedVariantId && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cereus-gold" />
            Feedback del Diseño
          </h3>
          <DesignFeedbackThread
            entityType="variant"
            entityId={selectedVariantId}
            maisonId={maisonId}
            currentUserId=""
            currentUserName="Diseñador"
            currentUserRole="designer"
            onStatusChange={() => onRefresh()}
          />
        </div>
      )}
    </div>
  );
}
