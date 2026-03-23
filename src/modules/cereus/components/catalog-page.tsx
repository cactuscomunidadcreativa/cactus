'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Sparkles, Heart, Palette, Shirt, ChevronRight,
  ChevronLeft, ExternalLink, ShoppingBag, Star, Layers,
  Eye, Search, Filter, Grid, List, Tag, Calendar, MapPin,
} from 'lucide-react';

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
  lookbook_code: string | null;
  color_story: { hex: string; name: string; role?: string }[] | null;
  trend_context: Record<string, unknown> | null;
  target_pieces: number | null;
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
  base_labor_cost: number;
  base_price: number | null;
  margin_target: number;
  complexity_level: number;
  collection_id: string | null;
  status: string;
  tags: string[];
  design_brief: Record<string, unknown> | null;
  sketch_source: string | null;
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

const SEASON_LABELS: Record<string, string> = {
  spring_summer: 'Primavera/Verano',
  fall_winter: 'Otoño/Invierno',
  resort: 'Resort',
  cruise: 'Crucero',
  capsule: 'Cápsula',
  bridal: 'Nupcial',
  custom: 'Especial',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  concept: { label: 'Concepto', color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  design: { label: 'Diseño', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  production: { label: 'Producción', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  launched: { label: 'Lanzada', color: 'text-green-600', bg: 'bg-green-500/10' },
  archived: { label: 'Archivada', color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const CATEGORY_LABELS: Record<string, string> = {
  dress: 'Vestido', gown: 'Vestido de Gala', suit: 'Traje', blazer: 'Blazer',
  coat: 'Abrigo', skirt: 'Falda', pants: 'Pantalón', blouse: 'Blusa',
  shirt: 'Camisa', jumpsuit: 'Jumpsuit', cape: 'Capa', corset: 'Corsé',
  accessory: 'Accesorio', other: 'Otro',
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

  // UI State
  const [view, setView] = useState<'grid' | 'collections'>('collections');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [search, setSearch] = useState('');
  const [filterSeason, setFilterSeason] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const maisonRes = await fetch('/api/cereus/maison');
      const maisonData = await maisonRes.json();
      if (!maisonData.maison) { setLoading(false); return; }
      setMaisonId(maisonData.maison.id);

      const [collectionsRes, garmentsRes] = await Promise.all([
        fetch(`/api/cereus/collections?maisonId=${maisonData.maison.id}`),
        fetch(`/api/cereus/garments?maisonId=${maisonData.maison.id}`),
      ]);

      const [collectionsData, garmentsData] = await Promise.all([
        collectionsRes.json(),
        garmentsRes.json(),
      ]);

      setCollections(collectionsData.collections || []);
      setGarments(garmentsData.garments || []);

      // Fetch variants
      if ((garmentsData.garments || []).length > 0) {
        const varRes = await fetch(`/api/cereus/variants?maisonId=${maisonData.maison.id}&preset=true`);
        const varData = await varRes.json();
        setVariants(varData.variants || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  // Filtered collections
  const filteredCollections = useMemo(() => {
    let filtered = collections;
    if (filterSeason !== 'all') {
      filtered = filtered.filter(c => c.season === filterSeason);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [collections, filterSeason, search]);

  // Garments for selected collection
  const collectionGarments = useMemo(() => {
    if (!selectedCollection) return [];
    return garments.filter(g => g.collection_id === selectedCollection);
  }, [garments, selectedCollection]);

  // All garments for grid view
  const allFilteredGarments = useMemo(() => {
    let filtered = garments;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.description || '').toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [garments, search]);

  // Unique seasons
  const seasons = useMemo(() => {
    const unique = new Set(collections.map(c => c.season));
    return Array.from(unique);
  }, [collections]);

  const selectedColl = collections.find(c => c.id === selectedCollection);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} colecciones · {garments.length} prendas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView('collections'); setSelectedCollection(null); }}
            className={`p-2 rounded-lg transition-colors ${view === 'collections' ? 'bg-cereus-gold/10 text-cereus-gold' : 'hover:bg-muted'}`}
            title="Ver por Colecciones"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setView('grid'); setSelectedCollection(null); }}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-cereus-gold/10 text-cereus-gold' : 'hover:bg-muted'}`}
            title="Ver todas las prendas"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar colecciones o prendas..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
          />
        </div>
        {view === 'collections' && (
          <select
            value={filterSeason}
            onChange={e => setFilterSeason(e.target.value)}
            className="px-3 py-2.5 bg-card border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
          >
            <option value="all">Todas las temporadas</option>
            {seasons.map(s => (
              <option key={s} value={s}>{SEASON_LABELS[s] || s}</option>
            ))}
          </select>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COLLECTIONS VIEW                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {view === 'collections' && !selectedCollection && (
        <div className="space-y-4">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Sin colecciones</h3>
              <p className="text-sm text-muted-foreground">
                Crea tu primera colección desde el Designer Studio.
              </p>
            </div>
          ) : (
            filteredCollections.map(coll => {
              const collGarments = garments.filter(g => g.collection_id === coll.id);
              const statusInfo = STATUS_LABELS[coll.status] || STATUS_LABELS.concept;
              const colorStory = (coll.color_story as { hex: string; name: string }[] | null) || [];
              const moodUrls = coll.mood_board_urls || [];
              const firstImage = collGarments.find(g => g.images?.length > 0)?.images[0]?.url;

              return (
                <div
                  key={coll.id}
                  onClick={() => setSelectedCollection(coll.id)}
                  className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-cereus-gold/40 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Cover Image */}
                    <div className="md:w-64 flex-shrink-0">
                      {coll.cover_image_url || moodUrls[0] || firstImage ? (
                        <img
                          src={coll.cover_image_url || moodUrls[0] || firstImage}
                          alt={coll.name}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 md:h-full bg-gradient-to-br from-cereus-gold/10 to-cereus-gold/5 flex items-center justify-center">
                          <Layers className="w-12 h-12 text-cereus-gold/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-lg font-display font-bold">{coll.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {SEASON_LABELS[coll.season] || coll.season} {coll.year}
                            </span>
                            {coll.code && (
                              <span className="text-xs text-muted-foreground font-mono">{coll.code}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {coll.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {coll.description}
                        </p>
                      )}

                      {/* Color Story */}
                      {colorStory.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                          {colorStory.slice(0, 8).map((c, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border border-border"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shirt className="w-3.5 h-3.5" />
                          {collGarments.length} prendas
                        </span>
                        {coll.target_pieces && (
                          <span>
                            Meta: {coll.target_pieces} piezas
                          </span>
                        )}
                        {coll.lookbook_code && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Lookbook: {coll.lookbook_code}
                          </span>
                        )}
                      </div>

                      {/* Garment thumbnails */}
                      {collGarments.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {collGarments.slice(0, 6).map(g => (
                            <div key={g.id} className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                              {g.images?.[0]?.url ? (
                                <img src={g.images[0].url} alt={g.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Shirt className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                          ))}
                          {collGarments.length > 6 && (
                            <div className="w-12 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xs text-muted-foreground">
                              +{collGarments.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Unassigned garments */}
          {garments.filter(g => !g.collection_id).length > 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-5">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-muted-foreground" />
                Prendas sin colección ({garments.filter(g => !g.collection_id).length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {garments.filter(g => !g.collection_id).slice(0, 12).map(g => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGarment(g)}
                    className="rounded-lg border border-border overflow-hidden cursor-pointer hover:border-cereus-gold/40 transition-colors"
                  >
                    {g.images?.[0]?.url ? (
                      <img src={g.images[0].url} alt={g.name} className="w-full aspect-[3/4] object-cover" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[g.category] || g.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COLLECTION DETAIL VIEW                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {view === 'collections' && selectedCollection && selectedColl && (
        <div className="space-y-6">
          {/* Back */}
          <button
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Volver a colecciones
          </button>

          {/* Collection Header */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Mood board banner */}
            {(selectedColl.mood_board_urls || []).length > 0 && (
              <div className="flex h-32 overflow-hidden">
                {(selectedColl.mood_board_urls || []).slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="Mood" className="flex-1 object-cover" />
                ))}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-display font-bold">{selectedColl.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${(STATUS_LABELS[selectedColl.status] || STATUS_LABELS.concept).bg} ${(STATUS_LABELS[selectedColl.status] || STATUS_LABELS.concept).color}`}>
                      {(STATUS_LABELS[selectedColl.status] || STATUS_LABELS.concept).label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {SEASON_LABELS[selectedColl.season] || selectedColl.season} {selectedColl.year}
                    </span>
                    {selectedColl.code && (
                      <span className="text-sm font-mono text-muted-foreground">{selectedColl.code}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cereus-gold">{collectionGarments.length}</p>
                  <p className="text-xs text-muted-foreground">prendas</p>
                </div>
              </div>

              {selectedColl.description && (
                <p className="text-sm text-muted-foreground mt-4">{selectedColl.description}</p>
              )}

              {/* Color Story */}
              {((selectedColl.color_story as { hex: string; name: string }[] | null) || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Color Story</p>
                  <div className="flex gap-2">
                    {((selectedColl.color_story as { hex: string; name: string }[]) || []).map((c, i) => (
                      <div key={i} className="text-center">
                        <div
                          className="w-10 h-10 rounded-lg border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        <p className="text-[9px] text-muted-foreground mt-1">{c.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Garments Grid */}
          {collectionGarments.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
              <Shirt className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Sin prendas en esta colección</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {collectionGarments.map(garment => {
                const gVariants = variants.filter(v => v.garment_id === garment.id);
                const brief = garment.design_brief as { concept?: string } | null;

                return (
                  <div
                    key={garment.id}
                    onClick={() => setSelectedGarment(garment)}
                    className="bg-card border border-border rounded-xl overflow-hidden group cursor-pointer hover:border-cereus-gold/40 hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="relative">
                      {garment.images?.[0]?.url ? (
                        <img
                          src={garment.images[0].url}
                          alt={garment.name}
                          className="w-full aspect-[3/4] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                          <Shirt className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Sketch badge */}
                      {garment.sketch_source && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px]">
                          {garment.sketch_source === 'dall-e' ? 'IA' : 'SVG'}
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
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">{garment.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {CATEGORY_LABELS[garment.category] || garment.category}
                      </p>

                      {brief?.concept && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
                          {brief.concept}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {garment.base_price ? (
                          <p className="text-sm font-bold text-cereus-gold">{formatPrice(garment.base_price)}</p>
                        ) : gVariants[0] ? (
                          <p className="text-sm font-bold text-cereus-gold">
                            Desde {formatPrice(Math.min(...gVariants.map(v => v.final_price)))}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Precio pendiente</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ALL GARMENTS GRID VIEW                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {view === 'grid' && (
        <div>
          {allFilteredGarments.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Sin prendas</h3>
              <p className="text-sm text-muted-foreground">Crea prendas desde el Designer Studio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allFilteredGarments.map(garment => {
                const gVariants = variants.filter(v => v.garment_id === garment.id);
                const collection = collections.find(c => c.id === garment.collection_id);

                return (
                  <div
                    key={garment.id}
                    onClick={() => setSelectedGarment(garment)}
                    className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-cereus-gold/40 hover:shadow-lg transition-all"
                  >
                    {garment.images?.[0]?.url ? (
                      <img src={garment.images[0].url} alt={garment.name} className="w-full aspect-[3/4] object-cover" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                        <Shirt className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">{garment.name}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {CATEGORY_LABELS[garment.category] || garment.category}
                      </p>
                      {collection && (
                        <p className="text-[10px] text-cereus-gold mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {collection.name}
                        </p>
                      )}
                      <div className="mt-2">
                        {garment.base_price ? (
                          <p className="text-sm font-bold text-cereus-gold">{formatPrice(garment.base_price)}</p>
                        ) : gVariants[0] ? (
                          <p className="text-sm font-bold text-cereus-gold">
                            Desde {formatPrice(Math.min(...gVariants.map(v => v.final_price)))}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Precio pendiente</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* GARMENT DETAIL MODAL                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedGarment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedGarment(null)}>
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Image */}
            {selectedGarment.images?.[0]?.url ? (
              <img src={selectedGarment.images[0].url} alt={selectedGarment.name} className="w-full aspect-[4/3] object-cover rounded-t-2xl" />
            ) : (
              <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center rounded-t-2xl">
                <Shirt className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold">{selectedGarment.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[selectedGarment.category] || selectedGarment.category}
                  {selectedGarment.code && ` · ${selectedGarment.code}`}
                </p>
                {(() => {
                  const coll = collections.find(c => c.id === selectedGarment.collection_id);
                  return coll ? (
                    <p className="text-xs text-cereus-gold mt-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {coll.name} — {SEASON_LABELS[coll.season] || coll.season} {coll.year}
                    </p>
                  ) : null;
                })()}
              </div>

              {selectedGarment.description && (
                <p className="text-sm text-muted-foreground">{selectedGarment.description}</p>
              )}

              {/* Design Brief */}
              {selectedGarment.design_brief && (
                <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-medium text-cereus-gold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Concepto de Diseño
                  </p>
                  {(selectedGarment.design_brief as { concept?: string }).concept && (
                    <p className="text-sm">{(selectedGarment.design_brief as { concept?: string }).concept}</p>
                  )}
                </div>
              )}

              {/* Variants */}
              {variants.filter(v => v.garment_id === selectedGarment.id).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Variantes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.filter(v => v.garment_id === selectedGarment.id).map(v => (
                      <div key={v.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                        {v.color_hex && (
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: v.color_hex }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{v.variant_name || v.color || 'Variante'}</p>
                        </div>
                        <p className="text-xs font-bold text-cereus-gold">{formatPrice(v.final_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between pt-4 border-t">
                {selectedGarment.base_price ? (
                  <p className="text-xl font-bold text-cereus-gold">{formatPrice(selectedGarment.base_price)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Precio pendiente</p>
                )}
                <button
                  onClick={() => setSelectedGarment(null)}
                  className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
