'use client';

import { useState, useMemo } from 'react';
import {
  Palette, Check, Loader2, Sparkles, DollarSign, ShoppingBag,
  ChevronLeft, Shirt, Scissors, X,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

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

interface VariantConfiguratorProps {
  garment: Garment;
  materials: Material[];
  clientId?: string;
  onClose: () => void;
  onComplete: (variantId: string) => void;
}

const EXTRAS_OPTIONS = [
  { key: 'embroidery', en: 'Custom Embroidery', es: 'Bordado Personalizado', price: 150, icon: '🧵' },
  { key: 'custom_lining', en: 'Custom Lining', es: 'Forro Especial', price: 80, icon: '🎀' },
  { key: 'special_buttons', en: 'Special Buttons', es: 'Botones Especiales', price: 45, icon: '🔘' },
  { key: 'length_adjustment', en: 'Length Adjustment', es: 'Ajuste de Largo', price: 30, icon: '📏' },
  { key: 'hand_finishing', en: 'Hand Finishing', es: 'Acabado a Mano', price: 200, icon: '✋' },
  { key: 'beading', en: 'Beading', es: 'Pedrería', price: 300, icon: '💎' },
  { key: 'monogram', en: 'Monogram', es: 'Monograma', price: 60, icon: '✨' },
];

const COMPLEXITY_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.25, 3: 1.50, 4: 2.0, 5: 3.0,
};

function formatPrice(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================
// Configurator Component
// ============================================================

export function VariantConfigurator({
  garment, materials, clientId, onClose, onComplete,
}: VariantConfiguratorProps) {
  const [step, setStep] = useState<'color' | 'material' | 'extras' | 'review'>('color');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState('#000000');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [extras, setExtras] = useState<Record<string, boolean>>({});
  const [variantName, setVariantName] = useState('');

  // Filter materials by type=fabric for primary material
  const fabricMaterials = materials.filter(m => m.type === 'fabric');

  // Extract unique colors from materials
  const colorOptions = useMemo(() => {
    const colors: { name: string; hex: string }[] = [];
    const seen = new Set<string>();
    for (const m of materials) {
      if (m.color_hex && !seen.has(m.color_hex)) {
        seen.add(m.color_hex);
        colors.push({ name: m.name.split(' ')[0], hex: m.color_hex });
      }
    }
    // Add common fashion colors if no material colors available
    if (colors.length === 0) {
      return [
        { name: 'Black / Negro', hex: '#0A0A0A' },
        { name: 'White / Blanco', hex: '#FAFAFA' },
        { name: 'Navy / Marino', hex: '#1E3A5F' },
        { name: 'Burgundy / Burdeos', hex: '#722F37' },
        { name: 'Emerald / Esmeralda', hex: '#046307' },
        { name: 'Gold / Dorado', hex: '#C9A84C' },
        { name: 'Blush / Rosa', hex: '#DE9E9E' },
        { name: 'Ivory / Marfil', hex: '#FFFFF0' },
        { name: 'Charcoal / Carbón', hex: '#36454F' },
        { name: 'Champagne / Champán', hex: '#F7E7CE' },
      ];
    }
    return colors;
  }, [materials]);

  // Live pricing
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const extrasTotal = Object.entries(extras)
    .filter(([, v]) => v)
    .reduce((sum, [key]) => {
      const opt = EXTRAS_OPTIONS.find(e => e.key === key);
      return sum + (opt?.price || 0);
    }, 0);

  const complexityMult = COMPLEXITY_MULTIPLIERS[garment.complexity_level] || 1;
  const laborCost = garment.base_labor_cost * complexityMult;
  const materialCost = garment.base_cost || 0; // BOM base
  const totalCost = materialCost + laborCost + extrasTotal;
  const overhead = totalCost * 0.12;
  const finalCost = totalCost + overhead;
  const suggestedPrice = finalCost / (1 - (garment.margin_target || 0.50));
  const margin = suggestedPrice > 0 ? ((suggestedPrice - finalCost) / suggestedPrice) * 100 : 0;

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/cereus/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentId: garment.id,
          clientId: clientId || null,
          variantName: variantName || `${selectedColor || 'Custom'} ${garment.name}`,
          color: selectedColor || null,
          colorHex: selectedColorHex || null,
          primaryMaterialId: selectedMaterialId || null,
          materialOverrides: [],
          extras,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onComplete(data.variant.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { id: 'color' as const, label: 'Color', labelEs: 'Color' },
    { id: 'material' as const, label: 'Material', labelEs: 'Tela' },
    { id: 'extras' as const, label: 'Extras', labelEs: 'Extras' },
    { id: 'review' as const, label: 'Review', labelEs: 'Resumen' },
  ];
  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold">
                Customize / Personalizar
              </h2>
              <p className="text-sm text-muted-foreground">{garment.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  if (i <= currentStepIndex) setStep(s.id);
                }}
                className={`flex-1 text-center py-2 text-xs font-medium rounded-lg transition-all ${
                  s.id === step
                    ? 'bg-cereus-gold/10 text-cereus-gold'
                    : i < currentStepIndex
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentStepIndex && <Check className="w-3 h-3 inline mr-1" />}
                {s.labelEs}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Garment preview */}
          <div className="flex gap-6 mb-6">
            {garment.images?.[0]?.url ? (
              <img
                src={garment.images[0].url}
                alt={garment.name}
                className="w-32 h-40 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-32 h-40 rounded-xl bg-muted flex items-center justify-center border border-border">
                <Shirt className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium">{garment.name}</h3>
              {garment.description && (
                <p className="text-sm text-muted-foreground mt-1">{garment.description}</p>
              )}
              <div className="mt-3 bg-cereus-gold/5 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Estimated Price / Precio Estimado</p>
                <p className="text-xl font-display font-bold text-cereus-gold">
                  {formatPrice(suggestedPrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cost: {formatPrice(finalCost)} — Margin: {margin.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Step: Color */}
          {step === 'color' && (
            <div>
              <h4 className="text-sm font-medium mb-3">Select Color / Seleccionar Color</h4>
              <div className="grid grid-cols-5 gap-3">
                {colorOptions.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setSelectedColor(c.name);
                      setSelectedColorHex(c.hex);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedColorHex === c.hex
                        ? 'border-cereus-gold bg-cereus-gold/5'
                        : 'border-border hover:border-cereus-gold/30'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border border-border/50 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] text-muted-foreground text-center">{c.name}</span>
                  </button>
                ))}
              </div>
              {/* Custom color */}
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="color"
                  value={selectedColorHex}
                  onChange={e => {
                    setSelectedColorHex(e.target.value);
                    setSelectedColor('Custom');
                  }}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  placeholder="Color name / Nombre del color"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
            </div>
          )}

          {/* Step: Material */}
          {step === 'material' && (
            <div>
              <h4 className="text-sm font-medium mb-3">Select Fabric / Seleccionar Tela</h4>
              {fabricMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No fabrics available. Materials will use base pricing. / Sin telas disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fabricMaterials.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterialId(m.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selectedMaterialId === m.id
                          ? 'border-cereus-gold bg-cereus-gold/5'
                          : 'border-border hover:border-cereus-gold/30'
                      }`}
                    >
                      {m.swatch_url || m.image_url ? (
                        <img
                          src={m.swatch_url || m.image_url || ''}
                          alt={m.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border/50"
                        />
                      ) : m.color_hex ? (
                        <div
                          className="w-12 h-12 rounded-lg border border-border/50"
                          style={{ backgroundColor: m.color_hex }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Scissors className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        {m.composition && (
                          <p className="text-[10px] text-muted-foreground truncate">{m.composition}</p>
                        )}
                        <p className="text-xs text-cereus-gold font-medium mt-1">
                          {formatPrice(m.unit_cost)}/{m.unit}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Extras */}
          {step === 'extras' && (
            <div>
              <h4 className="text-sm font-medium mb-3">
                Customizations / Personalizaciones
              </h4>
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
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        extras[opt.key] ? 'bg-cereus-gold border-cereus-gold' : 'border-border'
                      }`}>
                        {extras[opt.key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-lg">{opt.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{opt.es}</p>
                        <p className="text-xs text-muted-foreground">{opt.en}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-cereus-gold">+{formatPrice(opt.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium mb-3">
                Review Order / Revisar Pedido
              </h4>

              <div>
                <label className="text-xs text-muted-foreground">Variant Name / Nombre</label>
                <input
                  value={variantName}
                  onChange={e => setVariantName(e.target.value)}
                  placeholder={`${selectedColor || 'Custom'} ${garment.name}`}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                {selectedColor && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedColorHex }} />
                      <span>{selectedColor}</span>
                    </div>
                  </div>
                )}
                {selectedMaterial && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Material / Tela</span>
                    <span>{selectedMaterial.name}</span>
                  </div>
                )}
                {Object.entries(extras).filter(([, v]) => v).map(([key]) => {
                  const opt = EXTRAS_OPTIONS.find(e => e.key === key);
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{opt?.es}</span>
                      <span className="text-cereus-gold">+{formatPrice(opt?.price || 0)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Price breakdown */}
              <div className="bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Material Cost / Materiales</span>
                  <span>{formatPrice(materialCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Labor / Mano de Obra</span>
                  <span>{formatPrice(laborCost)}</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Extras</span>
                    <span>{formatPrice(extrasTotal)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overhead (12%)</span>
                  <span>{formatPrice(overhead)}</span>
                </div>
                <div className="border-t border-cereus-gold/20 pt-2 flex items-center justify-between">
                  <span className="font-medium">Total Price / Precio Final</span>
                  <span className="text-xl font-display font-bold text-cereus-gold">
                    {formatPrice(suggestedPrice)}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={() => setStep(steps[currentStepIndex - 1].id)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back / Atrás
              </button>
            )}
          </div>

          {step !== 'review' ? (
            <button
              onClick={() => setStep(steps[currentStepIndex + 1].id)}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
            >
              Next / Siguiente
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating... / Creando...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Request Quote / Solicitar Cotización
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
