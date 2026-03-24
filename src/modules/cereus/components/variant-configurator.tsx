'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Palette, Check, Loader2, Sparkles, DollarSign, Plus, Trash2,
  Shirt, Scissors, X, SwatchBook, Tag, CircleDollarSign,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface VariantConfiguratorProps {
  maisonId: string;
  garment: {
    id: string;
    name: string;
    category: string;
    images: { url: string; type: string }[];
    base_price: number | null;
    base_cost: number;
    collection_id: string | null;
  };
  variant?: any; // existing variant to edit, or null for new
  onSave: () => void;
  onCancel: () => void;
}

interface Material {
  id: string;
  name: string;
  code: string | null;
  type: string;
  subtype: string | null;
  unit_cost: number;
  unit: string;
  color_hex: string | null;
  swatch_url: string | null;
  image_url: string | null;
  composition: string | null;
  supplier: string | null;
  weight_gsm: number | null;
}

interface CustomExtra {
  id: string;
  name: string;
  price: number;
}

// ============================================================
// Constants
// ============================================================

const EXTRAS_OPTIONS = [
  { key: 'embroidery', label: 'Bordado Personalizado', price: 150, icon: '🧵' },
  { key: 'custom_lining', label: 'Forro Especial', price: 80, icon: '🎀' },
  { key: 'special_buttons', label: 'Botones Especiales', price: 45, icon: '🔘' },
  { key: 'length_adjustment', label: 'Ajuste de Largo', price: 30, icon: '📏' },
  { key: 'hand_finishing', label: 'Acabado a Mano', price: 200, icon: '✋' },
  { key: 'beading', label: 'Pedreria', price: 300, icon: '💎' },
  { key: 'monogram', label: 'Monograma', price: 60, icon: '✨' },
];

const PRESET_COLORS = [
  { name: 'Negro', hex: '#0A0A0A' },
  { name: 'Blanco', hex: '#FAFAFA' },
  { name: 'Marino', hex: '#1E3A5F' },
  { name: 'Burdeos', hex: '#722F37' },
  { name: 'Esmeralda', hex: '#046307' },
  { name: 'Dorado', hex: '#C9A84C' },
  { name: 'Rosa Palo', hex: '#DE9E9E' },
  { name: 'Marfil', hex: '#FFFFF0' },
  { name: 'Carbon', hex: '#36454F' },
  { name: 'Champan', hex: '#F7E7CE' },
  { name: 'Terracota', hex: '#CC5533' },
  { name: 'Lavanda', hex: '#B4A7D6' },
  { name: 'Oliva', hex: '#556B2F' },
  { name: 'Celeste', hex: '#87CEEB' },
  { name: 'Coral', hex: '#FF6F61' },
  { name: 'Gris Perla', hex: '#C0C0C0' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'proposed', label: 'Propuesto' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'ordered', label: 'Ordenado' },
];

type TabId = 'color' | 'material' | 'detalles' | 'precio';

const TABS: { id: TabId; label: string; icon: typeof Palette }[] = [
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'material', label: 'Tela / Material', icon: SwatchBook },
  { id: 'detalles', label: 'Detalles', icon: Sparkles },
  { id: 'precio', label: 'Precio', icon: CircleDollarSign },
];

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================
// Component
// ============================================================

export function VariantConfigurator({
  maisonId,
  garment,
  variant,
  onSave,
  onCancel,
}: VariantConfiguratorProps) {
  // Active tab
  const [activeTab, setActiveTab] = useState<TabId>('color');

  // Materials fetched from API
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // Form state
  const [variantName, setVariantName] = useState(variant?.variant_name || '');
  const [status, setStatus] = useState(variant?.status || 'draft');
  const [colorName, setColorName] = useState(variant?.color || '');
  const [colorHex, setColorHex] = useState(variant?.color_hex || '#0A0A0A');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    variant?.primary_material_id || null
  );
  const [extras, setExtras] = useState<Record<string, boolean>>(() => {
    if (variant?.extras && typeof variant.extras === 'object') {
      const init: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(variant.extras)) {
        if (typeof v === 'boolean') init[k] = v;
      }
      return init;
    }
    return {};
  });
  const [customExtras, setCustomExtras] = useState<CustomExtra[]>(() => {
    if (variant?.extras?._custom && Array.isArray(variant.extras._custom)) {
      return variant.extras._custom;
    }
    return [];
  });
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState<number>(variant?.final_price || garment.base_price || 0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch materials
  useEffect(() => {
    async function load() {
      setMaterialsLoading(true);
      try {
        const res = await fetch(`/api/cereus/materials?maisonId=${maisonId}`);
        const data = await res.json();
        if (res.ok) setMaterials(data.materials || []);
      } catch {
        // silent
      } finally {
        setMaterialsLoading(false);
      }
    }
    load();
  }, [maisonId]);

  // Derived
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId) || null;

  const extrasTotal = useMemo(() => {
    let sum = 0;
    for (const [key, active] of Object.entries(extras)) {
      if (!active) continue;
      const opt = EXTRAS_OPTIONS.find(e => e.key === key);
      if (opt) sum += opt.price;
    }
    for (const ce of customExtras) {
      sum += ce.price;
    }
    return sum;
  }, [extras, customExtras]);

  const materialCost = selectedMaterial ? selectedMaterial.unit_cost : (garment.base_cost * 0.4);
  const laborCost = garment.base_cost * 0.5;
  const totalCost = materialCost + laborCost + extrasTotal;
  const marginActual = finalPrice > 0 ? (finalPrice - totalCost) / finalPrice : 0;
  const marginPct = marginActual * 100;

  // Sketch image
  const sketchImage = garment.images?.find(img => img.type === 'sketch');
  const fallbackImage = garment.images?.[0];

  // Add custom extra
  const addCustomExtra = useCallback(() => {
    const name = newExtraName.trim();
    const price = parseFloat(newExtraPrice);
    if (!name || isNaN(price) || price <= 0) return;
    setCustomExtras(prev => [
      ...prev,
      { id: `custom_${Date.now()}`, name, price },
    ]);
    setNewExtraName('');
    setNewExtraPrice('');
  }, [newExtraName, newExtraPrice]);

  const removeCustomExtra = useCallback((id: string) => {
    setCustomExtras(prev => prev.filter(e => e.id !== id));
  }, []);

  // Save handler
  async function handleSave() {
    if (!variantName.trim()) {
      setError('El nombre de la variante es requerido.');
      return;
    }
    setSaving(true);
    setError(null);

    const allExtras: Record<string, any> = { ...extras };
    if (customExtras.length > 0) {
      allExtras._custom = customExtras;
    }

    const payload: Record<string, any> = {
      maisonId,
      garmentId: garment.id,
      variantName: variantName.trim(),
      color: colorName || null,
      colorHex: colorHex || null,
      primaryMaterialId: selectedMaterialId || null,
      materialOverrides: [],
      extras: allExtras,
      materialCost,
      laborCost,
      extrasCost: extrasTotal,
      totalCost,
      finalPrice,
      marginActual,
      status,
      isPreset: false,
    };

    try {
      const isEdit = !!variant?.id;
      const method = isEdit ? 'PUT' : 'POST';
      if (isEdit) payload.id = variant.id;

      const res = await fetch('/api/cereus/variants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la variante');
    } finally {
      setSaving(false);
    }
  }

  // Margin bar color
  function marginColor(pct: number) {
    if (pct < 30) return 'bg-red-500';
    if (pct < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold">
              {variant ? 'Editar Variante' : 'Nueva Variante'}
            </h2>
            <p className="text-sm text-muted-foreground">{garment.name} &middot; {garment.category}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left preview + Right tabs */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Preview */}
          <div className="w-64 border-r border-border p-5 flex flex-col items-center gap-4 bg-muted/30 shrink-0">
            {/* Sketch image */}
            {(sketchImage || fallbackImage) ? (
              <img
                src={(sketchImage || fallbackImage)!.url}
                alt={garment.name}
                className="w-48 h-56 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-48 h-56 rounded-xl bg-muted flex items-center justify-center border border-border">
                <Shirt className="w-10 h-10 text-muted-foreground" />
              </div>
            )}

            {/* Color swatch */}
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1.5">Color seleccionado</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-border shadow-sm shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{colorName || 'Sin seleccionar'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{colorHex}</p>
                </div>
              </div>
            </div>

            {/* Selected material */}
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1.5">Tela seleccionada</p>
              {selectedMaterial ? (
                <div className="flex items-center gap-2">
                  {selectedMaterial.swatch_url || selectedMaterial.image_url ? (
                    <img
                      src={(selectedMaterial.swatch_url || selectedMaterial.image_url)!}
                      alt={selectedMaterial.name}
                      className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
                    />
                  ) : selectedMaterial.color_hex ? (
                    <div
                      className="w-8 h-8 rounded-lg border border-border shrink-0"
                      style={{ backgroundColor: selectedMaterial.color_hex }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Scissors className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedMaterial.name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(selectedMaterial.unit_cost)}/{selectedMaterial.unit}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin seleccionar</p>
              )}
            </div>

            {/* Quick price summary */}
            <div className="w-full mt-auto pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Precio final</p>
              <p className="text-xl font-display font-bold text-cereus-gold">{fmt(finalPrice)}</p>
              <p className="text-[10px] text-muted-foreground">
                Costo: {fmt(totalCost)} &middot; Margen: {marginPct.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-border px-2 pt-2 gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-background border border-border border-b-background text-cereus-gold -mb-px'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* ====== TAB: Color ====== */}
              {activeTab === 'color' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Selector de color</h4>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={e => {
                          setColorHex(e.target.value);
                          if (!colorName || PRESET_COLORS.some(c => c.name === colorName)) {
                            setColorName('Personalizado');
                          }
                        }}
                        className="w-14 h-14 rounded-xl border border-border cursor-pointer bg-transparent"
                      />
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Nombre del color</label>
                          <input
                            value={colorName}
                            onChange={e => setColorName(e.target.value)}
                            placeholder="Ej: Rojo Cereza"
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Hex</label>
                          <input
                            value={colorHex}
                            onChange={e => setColorHex(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Colores predefinidos</h4>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.hex}
                          onClick={() => {
                            setColorName(c.name);
                            setColorHex(c.hex);
                          }}
                          title={c.name}
                          className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                            colorHex === c.hex && colorName === c.name
                              ? 'border-cereus-gold bg-cereus-gold/5'
                              : 'border-transparent hover:border-cereus-gold/30'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full border border-border/50 shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[9px] text-muted-foreground text-center leading-tight">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ====== TAB: Material ====== */}
              {activeTab === 'material' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Seleccionar tela o material</h4>

                  {materialsLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Cargando materiales...</span>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="py-12 text-center">
                      <Scissors className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay materiales registrados para esta maison.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {materials.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMaterialId(m.id === selectedMaterialId ? null : m.id)}
                            className={`relative flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              selectedMaterialId === m.id
                                ? 'border-cereus-gold bg-cereus-gold/5'
                                : 'border-border hover:border-cereus-gold/30'
                            }`}
                          >
                            {selectedMaterialId === m.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-cereus-gold rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {m.swatch_url || m.image_url ? (
                              <img
                                src={(m.swatch_url || m.image_url)!}
                                alt={m.name}
                                className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
                              />
                            ) : m.color_hex ? (
                              <div
                                className="w-14 h-14 rounded-lg border border-border/50 shrink-0"
                                style={{ backgroundColor: m.color_hex }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Scissors className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{m.type}{m.subtype ? ` / ${m.subtype}` : ''}</p>
                              {m.composition && (
                                <p className="text-[10px] text-muted-foreground truncate">{m.composition}</p>
                              )}
                              <p className="text-xs text-cereus-gold font-medium mt-1">
                                {fmt(m.unit_cost)}/{m.unit}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedMaterial && (
                        <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4">
                          <p className="text-sm font-medium mb-1">Material seleccionado: {selectedMaterial.name}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Tipo: {selectedMaterial.type}</span>
                            <span>Costo: {fmt(selectedMaterial.unit_cost)}/{selectedMaterial.unit}</span>
                            {selectedMaterial.composition && <span>Composicion: {selectedMaterial.composition}</span>}
                            {selectedMaterial.supplier && <span>Proveedor: {selectedMaterial.supplier}</span>}
                            {selectedMaterial.weight_gsm && <span>Peso: {selectedMaterial.weight_gsm} g/m2</span>}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ====== TAB: Detalles ====== */}
              {activeTab === 'detalles' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Extras y personalizaciones</h4>
                    <div className="grid gap-2">
                      {EXTRAS_OPTIONS.map(opt => (
                        <label
                          key={opt.key}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            extras[opt.key]
                              ? 'border-cereus-gold bg-cereus-gold/5'
                              : 'border-border hover:border-cereus-gold/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={!!extras[opt.key]}
                              onChange={e => setExtras(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              extras[opt.key] ? 'bg-cereus-gold border-cereus-gold' : 'border-border'
                            }`}>
                              {extras[opt.key] && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-lg">{opt.icon}</span>
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          <span className="text-sm font-medium text-cereus-gold">+{fmt(opt.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom extras */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Extras personalizados</h4>

                    {customExtras.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {customExtras.map(ce => (
                          <div
                            key={ce.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-cereus-gold/30 bg-cereus-gold/5"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-cereus-gold" />
                              <span className="text-sm font-medium">{ce.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-cereus-gold font-medium">+{fmt(ce.price)}</span>
                              <button
                                onClick={() => removeCustomExtra(ce.id)}
                                className="p-1 hover:bg-red-500/10 rounded text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={newExtraName}
                        onChange={e => setNewExtraName(e.target.value)}
                        placeholder="Nombre del extra"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                      />
                      <input
                        type="number"
                        value={newExtraPrice}
                        onChange={e => setNewExtraPrice(e.target.value)}
                        placeholder="Precio"
                        min="0"
                        step="0.01"
                        className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                      />
                      <button
                        onClick={addCustomExtra}
                        disabled={!newExtraName.trim() || !newExtraPrice}
                        className="flex items-center gap-1 px-3 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== TAB: Precio ====== */}
              {activeTab === 'precio' && (
                <div className="space-y-5">
                  <h4 className="text-sm font-medium">Desglose de costos</h4>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Costo material</span>
                      <span className="font-medium">{fmt(materialCost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Costo mano de obra</span>
                      <span className="font-medium">{fmt(laborCost)}</span>
                    </div>
                    {extrasTotal > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Extras</span>
                        <span className="font-medium">{fmt(extrasTotal)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Total costo</span>
                      <span className="text-base font-display font-bold">{fmt(totalCost)}</span>
                    </div>
                  </div>

                  {/* Price input */}
                  <div>
                    <label className="text-sm font-medium">Precio final</label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={finalPrice || ''}
                        onChange={e => setFinalPrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full pl-9 pr-4 py-3 rounded-lg border border-border bg-background text-lg font-display font-bold focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                      />
                    </div>
                  </div>

                  {/* Margin */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Margen</span>
                      <span className={`text-sm font-bold ${
                        marginPct < 30 ? 'text-red-500' : marginPct < 50 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {marginPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${marginColor(marginPct)}`}
                        style={{ width: `${Math.max(0, Math.min(100, marginPct))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>0%</span>
                      <span className="text-red-400">30%</span>
                      <span className="text-yellow-400">50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Utilidad */}
                  <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Utilidad estimada</span>
                      <span className={`text-lg font-display font-bold ${
                        finalPrice - totalCost > 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {fmt(finalPrice - totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save section */}
            <div className="border-t border-border p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Nombre de variante *</label>
                  <input
                    value={variantName}
                    onChange={e => setVariantName(e.target.value)}
                    placeholder={`${colorName || ''} ${garment.name}`.trim()}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Estado</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-60 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar Variante
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
