'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Sparkles, Heart, Palette, Shirt, ChevronRight,
  ChevronLeft, ExternalLink, ShoppingBag, Star,
} from 'lucide-react';
import { VariantConfigurator } from './variant-configurator';

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
  lookbook_code: string | null;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string;
  images: { url: string; type: string; alt?: string }[];
  base_cost: number;
  base_labor_cost: number;
  base_price: number | null;
  margin_target: number;
  complexity_level: number;
  collection_id: string | null;
  status: string;
  tags: string[];
}

interface Variant {
  id: string;
  garment_id: string;
  variant_name: string | null;
  color: string | null;
  color_hex: string | null;
  preview_image_url: string | null;
  final_price: number;
  status: string;
}

interface EmotionalProfile {
  primary_archetype: string;
  style_archetypes: string[];
  emotional_season: string;
  mood_tags: string[];
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
  composition: string | null;
}

const SEASON_LABELS: Record<string, string> = {
  spring_summer: 'Primavera/Verano',
  fall_winter: 'Otoño/Invierno',
  resort: 'Resort',
  cruise: 'Crucero',
  capsule: 'Cápsula',
  bridal: 'Nupcial',
  custom: 'Especial',
};

const ARCHETYPE_LABELS: Record<string, string> = {
  classic_elegance: 'Elegancia Clásica',
  modern_minimalist: 'Minimalista Moderna',
  romantic_dreamer: 'Romántica Soñadora',
  bold_avant_garde: 'Audaz Vanguardista',
  bohemian_free: 'Bohemia Libre',
  power_executive: 'Ejecutiva Poderosa',
  ethereal_goddess: 'Diosa Etérea',
  structured_architectural: 'Arquitectónica',
};

// Map archetypes to categories that match well
const ARCHETYPE_CATEGORY_AFFINITY: Record<string, string[]> = {
  classic_elegance: ['suit', 'blazer', 'dress', 'coat'],
  modern_minimalist: ['dress', 'pants', 'blouse', 'shirt'],
  romantic_dreamer: ['dress', 'gown', 'blouse', 'skirt'],
  bold_avant_garde: ['jumpsuit', 'cape', 'corset', 'gown'],
  bohemian_free: ['dress', 'skirt', 'blouse', 'cape'],
  power_executive: ['suit', 'blazer', 'pants', 'shirt'],
  ethereal_goddess: ['gown', 'dress', 'cape', 'skirt'],
  structured_architectural: ['blazer', 'coat', 'suit', 'jumpsuit'],
};

function formatPrice(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ============================================================
// Catalog Page
// ============================================================

export function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profile, setProfile] = useState<EmotionalProfile | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // UI
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Get maison
      const maisonRes = await fetch('/api/cereus/maison');
      const maisonData = await maisonRes.json();
      if (!maisonData.maison) { setLoading(false); return; }
      setMaisonId(maisonData.maison.id);

      // Parallel fetches
      const [collectionsRes, garmentsRes, materialsRes] = await Promise.all([
        fetch(`/api/cereus/collections?maisonId=${maisonData.maison.id}`),
        fetch(`/api/cereus/garments?maisonId=${maisonData.maison.id}`),
        fetch(`/api/cereus/materials?maisonId=${maisonData.maison.id}`),
      ]);

      const [collectionsData, garmentsData, materialsData] = await Promise.all([
        collectionsRes.json(),
        garmentsRes.json(),
        materialsRes.json(),
      ]);

      // Filter to launched collections (+ their garments for internal catalog)
      const launchedCollections = (collectionsData.collections || []).filter(
        (c: Collection) => c.status === 'launched' || c.status === 'production' || c.status === 'design'
      );
      setCollections(launchedCollections);
      setGarments(garmentsData.garments || []);
      setMaterials(materialsData.materials || []);

      // Fetch variants for all garments
      const garmentIds = (garmentsData.garments || []).map((g: Garment) => g.id);
      if (garmentIds.length > 0) {
        const varRes = await fetch(`/api/cereus/variants?maisonId=${maisonData.maison.id}&preset=true`);
        const varData = await varRes.json();
        setVariants(varData.variants || []);
      }

      // Try to get emotional profile for personalization
      try {
        const profileRes = await fetch('/api/cereus/clients?maisonId=' + maisonData.maison.id + '&limit=1&self=true');
        const profileData = await profileRes.json();
        if (profileData.clients?.[0]) {
          setClientId(profileData.clients[0].id);
          const epRes = await fetch(`/api/cereus/emotional-profiles?clientId=${profileData.clients[0].id}`);
          const epData = await epRes.json();
          if (epData.profile) setProfile(epData.profile);
        }
      } catch {
        // Profile is optional
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  // Filter garments by selected collection
  const filteredGarments = selectedCollection === 'all'
    ? garments
    : garments.filter(g => g.collection_id === selectedCollection);

  // Sort: recommended first if profile exists
  const sortedGarments = [...filteredGarments].sort((a, b) => {
    if (!profile) return 0;
    const affinityCategories = ARCHETYPE_CATEGORY_AFFINITY[profile.primary_archetype] || [];
    const aMatch = affinityCategories.includes(a.category) ? 1 : 0;
    const bMatch = affinityCategories.includes(b.category) ? 1 : 0;
    return bMatch - aMatch;
  });

  const recommendedCategories = profile
    ? ARCHETYPE_CATEGORY_AFFINITY[profile.primary_archetype] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Catalog / Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          {profile
            ? `Personalized for you / Personalizado para ti — ${ARCHETYPE_LABELS[profile.primary_archetype] || profile.primary_archetype}`
            : 'Browse our collections / Explora nuestras colecciones'}
        </p>
      </div>

      {/* Personalization banner */}
      {profile && (
        <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cereus-gold" />
          <div>
            <p className="text-sm font-medium">
              Recommended for you / Recomendado para ti
            </p>
            <p className="text-xs text-muted-foreground">
              Based on your {ARCHETYPE_LABELS[profile.primary_archetype]} profile —
              Garments matching your style are highlighted.
            </p>
          </div>
        </div>
      )}

      {/* Collection filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCollection('all')}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCollection === 'all'
              ? 'bg-cereus-gold text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All / Todas
        </button>
        {collections.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCollection(c.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCollection === c.id
                ? 'bg-cereus-gold text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Garments Grid */}
      {sortedGarments.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No items available / Sin piezas disponibles</h3>
          <p className="text-sm text-muted-foreground">Check back soon for new collections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedGarments.map(garment => {
            const gVariants = variants.filter(v => v.garment_id === garment.id);
            const isRecommended = profile && recommendedCategories.includes(garment.category);
            const currentIdx = imageIndex[garment.id] || 0;
            const images = garment.images || [];
            const hasMultipleImages = images.length > 1;

            return (
              <div
                key={garment.id}
                className={`bg-card border rounded-xl overflow-hidden group transition-all hover:shadow-lg ${
                  isRecommended ? 'border-cereus-gold/30' : 'border-border'
                }`}
              >
                {/* Image */}
                <div className="relative">
                  {images.length > 0 ? (
                    <img
                      src={images[currentIdx]?.url}
                      alt={garment.name}
                      className="w-full aspect-[3/4] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                      <Shirt className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Carousel controls */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageIndex(prev => ({
                            ...prev,
                            [garment.id]: (currentIdx - 1 + images.length) % images.length,
                          }));
                        }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageIndex(prev => ({
                            ...prev,
                            [garment.id]: (currentIdx + 1) % images.length,
                          }));
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-3 h-3 text-white" />
                      </button>
                    </>
                  )}

                  {/* Recommended badge */}
                  {isRecommended && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-cereus-gold/90 text-white rounded-full text-[10px] font-medium">
                      <Star className="w-3 h-3" />
                      {profile?.primary_archetype === garment.category ? 'Perfect Match' : 'Recommended'}
                    </div>
                  )}

                  {/* Variant colors */}
                  {gVariants.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {gVariants.slice(0, 5).map(v => (
                        v.color_hex && (
                          <div
                            key={v.id}
                            className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                            style={{ backgroundColor: v.color_hex }}
                            title={v.variant_name || v.color || ''}
                          />
                        )
                      ))}
                      {gVariants.length > 5 && (
                        <div className="w-4 h-4 rounded-full bg-black/50 text-white text-[8px] flex items-center justify-center">
                          +{gVariants.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate">{garment.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {garment.category.replace('_', ' ')}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {garment.base_price ? (
                      <p className="text-sm font-bold text-cereus-gold">{formatPrice(garment.base_price)}</p>
                    ) : gVariants[0] ? (
                      <p className="text-sm font-bold text-cereus-gold">
                        {lang === 'es' ? 'Desde ' : 'From '}
                        {formatPrice(Math.min(...gVariants.map(v => v.final_price)))}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Price on request</p>
                    )}

                    <button
                      onClick={() => {
                        setSelectedGarment(garment);
                        setShowConfigurator(true);
                      }}
                      className="flex items-center gap-1 text-xs text-cereus-gold hover:text-cereus-gold/80 transition-colors"
                    >
                      <Palette className="w-3 h-3" />
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variant Configurator Modal */}
      {showConfigurator && selectedGarment && (
        <VariantConfigurator
          garment={selectedGarment}
          materials={materials}
          clientId={clientId || undefined}
          onClose={() => {
            setShowConfigurator(false);
            setSelectedGarment(null);
          }}
          onComplete={() => {
            setShowConfigurator(false);
            setSelectedGarment(null);
            // Could show success toast or redirect
          }}
        />
      )}
    </div>
  );
}

// Needed for template literal in JSX
const lang = 'es';
