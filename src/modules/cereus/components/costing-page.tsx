'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Save, Loader2, X, Trash2,
  Package, Scissors, Layers, DollarSign, ChevronDown,
  ChevronUp, AlertCircle, BarChart3, TrendingUp,
  FileDown, Eye, Filter, Tag, Palette,
} from 'lucide-react';
import {
  calculatePrice,
  calculateMargin,
  classifyMargin,
  formatPrice,
  formatPercent,
  CEREUS_MARGIN_RANGES,
  COMPLEXITY_MULTIPLIERS,
  DEFAULT_OVERHEAD_PERCENT,
} from '../lib/costing-engine';

// ============================================================
// TYPES
// ============================================================

interface Material {
  id: string;
  name: string;
  code: string | null;
  type: string;
  subtype: string | null;
  supplier: string | null;
  supplier_code: string | null;
  origin_country: string | null;
  unit_cost: number;
  unit: string;
  currency: string;
  composition: string | null;
  color_hex: string | null;
  current_stock: number;
  stock_unit: string | null;
  description: string | null;
  lead_time_days: number | null;
  width_cm: number | null;
  weight_gsm: number | null;
  min_order_qty: number | null;
  tags: string[];
}

interface BomItem {
  id: string;
  material: Material;
  quantity: number;
  unit: string;
  waste_factor: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  category: string;
  status: string;
  base_cost: number;
  base_labor_hours: number;
  base_labor_cost: number;
  base_price: number | null;
  margin_target: number;
  complexity_level: number;
  collection: { id: string; name: string; code: string | null } | null;
  garment_materials: BomItem[];
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
  code: string | null;
  season: string;
  year: number;
  status: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const MATERIAL_TYPES = [
  'fabric', 'lining', 'trim', 'hardware', 'thread',
  'interfacing', 'elastic', 'zipper', 'button', 'embellishment', 'other',
];
const MATERIAL_UNITS = ['metro', 'yard', 'pieza', 'kg', 'rollo', 'par', 'set'];
const CURRENCIES = ['USD', 'PEN', 'EUR'];

type Tab = 'prendas' | 'materiales' | 'analisis';

// ============================================================
// HELPERS
// ============================================================

function computeGarmentCost(g: Garment) {
  const materialTotal = Number(g.base_cost) || 0;
  const complexityMult = COMPLEXITY_MULTIPLIERS[g.complexity_level] || 1;
  const laborCost = (Number(g.base_labor_cost) || 0) * complexityMult;
  const subtotal = materialTotal + laborCost;
  const overhead = Math.round(subtotal * DEFAULT_OVERHEAD_PERCENT * 100) / 100;
  const totalCost = Math.round((subtotal + overhead) * 100) / 100;
  return { materialTotal, laborCost, overhead, totalCost };
}

// ============================================================
// COMPONENT
// ============================================================

export function CereusCostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('prendas');
  const [error, setError] = useState<string | null>(null);

  // Data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Materials tab state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [materialCurrency, setMaterialCurrency] = useState('USD');
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Prendas tab state
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [showBomForm, setShowBomForm] = useState(false);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  // Forms
  const [saving, setSaving] = useState(false);

  const [matForm, setMatForm] = useState({
    name: '', code: '', type: 'fabric', subtype: '', supplier: '',
    unit_cost: '', unit: 'metro', currency: 'USD', composition: '',
    color_hex: '#000000', current_stock: '0', description: '',
    origin_country: '', lead_time_days: '', min_order_qty: '',
    width_cm: '', weight_gsm: '',
  });

  const [bomForm, setBomForm] = useState({
    materialId: '', quantity: '', unit: 'metro', waste_factor: '1.10', notes: '',
  });

  // ============================================================
  // DATA FETCHING
  // ============================================================

  useEffect(() => { fetchMaison(); }, []);
  useEffect(() => {
    if (maisonId) {
      fetchMaterials();
      fetchGarments();
      fetchCollections();
    }
  }, [maisonId]);

  async function fetchMaison() {
    try {
      const res = await fetch('/api/cereus/maison');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (!data.hasAccess) { router.push('/apps/cereus'); return; }
      setMaisonId(data.maison.id);
    } catch { setError('Error al cargar la maison'); }
    finally { setLoading(false); }
  }

  const fetchMaterials = useCallback(async () => {
    if (!maisonId) return;
    const params = new URLSearchParams({ maisonId });
    if (materialSearch) params.set('search', materialSearch);
    if (materialFilter) params.set('type', materialFilter);
    const res = await fetch(`/api/cereus/materials?${params}`);
    const data = await res.json();
    setMaterials(data.materials || []);
  }, [maisonId, materialSearch, materialFilter]);

  useEffect(() => {
    if (maisonId) fetchMaterials();
  }, [fetchMaterials, maisonId]);

  async function fetchGarments() {
    if (!maisonId) return;
    const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}`);
    const data = await res.json();
    setGarments(data.garments || []);
  }

  async function fetchCollections() {
    if (!maisonId) return;
    const res = await fetch(`/api/cereus/collections?maisonId=${maisonId}`);
    const data = await res.json();
    setCollections(data.collections || []);
  }

  // ============================================================
  // HANDLERS
  // ============================================================

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: matForm.name,
          code: matForm.code || undefined,
          type: matForm.type,
          subtype: matForm.subtype || undefined,
          supplier: matForm.supplier || undefined,
          unit_cost: parseFloat(matForm.unit_cost),
          unit: matForm.unit,
          currency: matForm.currency,
          composition: matForm.composition || undefined,
          color_hex: matForm.color_hex || undefined,
          current_stock: parseFloat(matForm.current_stock || '0'),
          description: matForm.description || undefined,
          origin_country: matForm.origin_country || undefined,
          lead_time_days: matForm.lead_time_days ? parseInt(matForm.lead_time_days) : undefined,
          min_order_qty: matForm.min_order_qty ? parseFloat(matForm.min_order_qty) : undefined,
          width_cm: matForm.width_cm ? parseFloat(matForm.width_cm) : undefined,
          weight_gsm: matForm.weight_gsm ? parseFloat(matForm.weight_gsm) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowMaterialForm(false);
      resetMatForm();
      fetchMaterials();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  function resetMatForm() {
    setMatForm({
      name: '', code: '', type: 'fabric', subtype: '', supplier: '',
      unit_cost: '', unit: 'metro', currency: 'USD', composition: '',
      color_hex: '#000000', current_stock: '0', description: '',
      origin_country: '', lead_time_days: '', min_order_qty: '',
      width_cm: '', weight_gsm: '',
    });
  }

  async function handleAddBom(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGarment) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/garments/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentId: selectedGarment,
          materialId: bomForm.materialId,
          quantity: parseFloat(bomForm.quantity),
          unit: bomForm.unit,
          waste_factor: parseFloat(bomForm.waste_factor),
          notes: bomForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowBomForm(false);
      setBomForm({ materialId: '', quantity: '', unit: 'metro', waste_factor: '1.10', notes: '' });
      fetchGarments();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteBom(bomId: string, garmentId: string) {
    const res = await fetch(`/api/cereus/garments/bom?id=${bomId}&garmentId=${garmentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchGarments();
  }

  async function handleSavePrice(garmentId: string, price: number) {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/garments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: garmentId, base_price: price }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      fetchGarments();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const garmentsByCollection = useMemo(() => {
    const groups: Record<string, { collection: Garment['collection']; garments: Garment[] }> = {};
    const noCollection: Garment[] = [];

    for (const g of garments) {
      if (g.collection) {
        const key = g.collection.id;
        if (!groups[key]) groups[key] = { collection: g.collection, garments: [] };
        groups[key].garments.push(g);
      } else {
        noCollection.push(g);
      }
    }

    const result: { key: string; label: string; garments: Garment[] }[] = [];
    for (const [key, val] of Object.entries(groups)) {
      result.push({ key, label: val.collection?.name || 'Sin nombre', garments: val.garments });
    }
    if (noCollection.length > 0) {
      result.push({ key: 'none', label: 'Sin Coleccion', garments: noCollection });
    }
    return result;
  }, [garments]);

  // Analysis data
  const analysisData = useMemo(() => {
    let totalMargin = 0;
    let costedCount = 0;
    let noPriceCount = 0;
    let estimatedRevenue = 0;

    const rows = garments.map(g => {
      const { totalCost } = computeGarmentCost(g);
      const price = Number(g.base_price) || 0;
      const margin = price > 0 ? calculateMargin(price, totalCost) : 0;
      const classification = price > 0 ? classifyMargin(margin) : null;

      if (price > 0) {
        totalMargin += margin;
        costedCount++;
        estimatedRevenue += price;
      } else {
        noPriceCount++;
      }

      return {
        garment: g,
        totalCost,
        price,
        margin,
        classification,
      };
    });

    const avgMargin = costedCount > 0 ? totalMargin / costedCount : 0;

    return { rows, avgMargin, costedCount, noPriceCount, estimatedRevenue };
  }, [garments]);

  // Materials that use a specific material
  const garmentsUsingMaterial = useCallback((materialId: string) => {
    return garments.filter(g =>
      g.garment_materials?.some(bom => bom.material?.id === materialId)
    );
  }, [garments]);

  // ============================================================
  // RENDER
  // ============================================================

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
        <div className="flex items-center gap-3">
          <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Costeo</h1>
            <p className="text-sm text-muted-foreground">Prendas, materiales y analisis de margenes</p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          { key: 'prendas' as Tab, icon: Scissors, label: 'Prendas y BOM' },
          { key: 'materiales' as Tab, icon: Package, label: 'Materiales' },
          { key: 'analisis' as Tab, icon: BarChart3, label: 'Analisis de Margenes' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-cereus-gold text-cereus-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: PRENDAS Y BOM                                            */}
      {/* ================================================================ */}
      {activeTab === 'prendas' && (
        <div className="space-y-6">
          {garmentsByCollection.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin prendas todavia</h3>
              <p className="text-muted-foreground mb-6">Crea prendas desde el panel principal para comenzar a costear.</p>
            </div>
          ) : (
            garmentsByCollection.map(group => (
              <div key={group.key} className="space-y-3">
                {/* Collection header */}
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cereus-gold" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">({group.garments.length} prendas)</span>
                </div>

                {/* Garments in this collection */}
                {group.garments.map(g => {
                  const isExpanded = selectedGarment === g.id;
                  const { materialTotal, laborCost, overhead, totalCost } = computeGarmentCost(g);
                  const minPrice = calculatePrice(totalCost, 0.35);
                  const targetPrice = calculatePrice(totalCost, 0.50);
                  const premiumPrice = calculatePrice(totalCost, 0.65);
                  const currentPrice = Number(g.base_price) || 0;
                  const currentMargin = currentPrice > 0 ? calculateMargin(currentPrice, totalCost) : 0;
                  const marginClass = currentPrice > 0 ? classifyMargin(currentMargin) : null;

                  return (
                    <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      {/* Garment row header */}
                      <button
                        onClick={() => {
                          setSelectedGarment(isExpanded ? null : g.id);
                          setShowBomForm(false);
                        }}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-cereus-gold/10 flex items-center justify-center shrink-0">
                            <Scissors className="w-5 h-5 text-cereus-gold" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{g.name}</p>
                              {g.code && <span className="text-xs text-muted-foreground font-mono">{g.code}</span>}
                              <span className="px-2 py-0.5 text-xs rounded-full bg-muted capitalize">{g.category}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                Complejidad: {g.complexity_level} | BOM: {g.garment_materials?.length || 0} items
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-mono font-semibold">{formatPrice(totalCost)}</p>
                            <p className="text-[10px] text-muted-foreground">costo</p>
                          </div>
                          {currentPrice > 0 && (
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-mono font-semibold text-cereus-gold">{formatPrice(currentPrice)}</p>
                              <p className="text-[10px]" style={{ color: marginClass?.color }}>
                                {formatPercent(currentMargin)} - {marginClass?.categoryEs}
                              </p>
                            </div>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-border px-5 py-5 space-y-5">
                          {/* BOM Table */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4 text-cereus-gold" />
                                Bill de Materiales
                              </h4>
                              <button
                                onClick={() => {
                                  setShowBomForm(true);
                                  setBomForm({ materialId: '', quantity: '', unit: 'metro', waste_factor: '1.10', notes: '' });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cereus-gold text-white rounded-lg hover:bg-cereus-gold/90 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Material
                              </button>
                            </div>

                            {/* Add BOM form */}
                            {showBomForm && (
                              <form onSubmit={handleAddBom} className="bg-muted/50 rounded-lg p-4 mb-3 space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-medium mb-1">Material *</label>
                                    <select
                                      required
                                      value={bomForm.materialId}
                                      onChange={(e) => setBomForm({ ...bomForm, materialId: e.target.value })}
                                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                                    >
                                      <option value="">Seleccionar material...</option>
                                      {materials.map(m => (
                                        <option key={m.id} value={m.id}>
                                          {m.name} ({formatPrice(Number(m.unit_cost))}/{m.unit})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">Cantidad *</label>
                                    <input
                                      type="number" step="0.01" required
                                      value={bomForm.quantity}
                                      onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })}
                                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">Unidad</label>
                                    <select
                                      value={bomForm.unit}
                                      onChange={(e) => setBomForm({ ...bomForm, unit: e.target.value })}
                                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                                    >
                                      {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">Factor Merma</label>
                                    <input
                                      type="number" step="0.01"
                                      value={bomForm.waste_factor}
                                      onChange={(e) => setBomForm({ ...bomForm, waste_factor: e.target.value })}
                                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Notas</label>
                                  <input
                                    type="text"
                                    value={bomForm.notes}
                                    onChange={(e) => setBomForm({ ...bomForm, notes: e.target.value })}
                                    placeholder="Notas opcionales..."
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => setShowBomForm(false)} className="px-3 py-1.5 text-xs border border-input rounded-lg hover:bg-muted">
                                    Cancelar
                                  </button>
                                  <button type="submit" disabled={saving} className="flex items-center gap-1 px-4 py-1.5 text-xs bg-cereus-gold text-white rounded-lg hover:bg-cereus-gold/90 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Agregar
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* BOM table */}
                            {g.garment_materials?.length > 0 ? (
                              <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                      <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Material</th>
                                      <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Cantidad</th>
                                      <th className="text-center px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Unidad</th>
                                      <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Costo Unit</th>
                                      <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">F. Merma</th>
                                      <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Total</th>
                                      <th className="w-8"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {g.garment_materials.map((bom: BomItem) => (
                                      <tr key={bom.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                        <td className="px-4 py-2.5">
                                          <div className="flex items-center gap-2">
                                            {bom.material?.color_hex && (
                                              <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: bom.material.color_hex }} />
                                            )}
                                            <span className="font-medium">{bom.material?.name || 'Desconocido'}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{bom.material?.type}</span>
                                          </div>
                                          {bom.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{bom.notes}</p>}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono">{bom.quantity}</td>
                                        <td className="px-4 py-2.5 text-center text-muted-foreground">{bom.unit}</td>
                                        <td className="px-4 py-2.5 text-right font-mono">{formatPrice(Number(bom.unit_cost))}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{bom.waste_factor}x</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatPrice(Number(bom.total_cost))}</td>
                                        <td className="px-2 py-2.5">
                                          <button
                                            onClick={() => handleDeleteBom(bom.id, g.id)}
                                            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-muted/20 rounded-lg">
                                <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Sin materiales en el BOM. Agrega materiales para calcular costos.</p>
                              </div>
                            )}
                          </div>

                          {/* Cost Breakdown */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-cereus-gold" />
                              Desglose de Costos
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Materiales</p>
                                <p className="text-lg font-mono font-bold">{formatPrice(materialTotal)}</p>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">
                                  Mano de Obra
                                  <span className="ml-1 text-[10px]">
                                    ({g.base_labor_hours}h x{COMPLEXITY_MULTIPLIERS[g.complexity_level] || 1})
                                  </span>
                                </p>
                                <p className="text-lg font-mono font-bold">{formatPrice(laborCost)}</p>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Overhead (12%)</p>
                                <p className="text-lg font-mono font-bold">{formatPrice(overhead)}</p>
                              </div>
                              <div className="p-3 bg-cereus-gold/10 border border-cereus-gold/20 rounded-lg">
                                <p className="text-xs text-cereus-gold font-medium mb-1">Costo Total</p>
                                <p className="text-lg font-mono font-bold text-cereus-gold">{formatPrice(totalCost)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Section */}
                          {totalCost > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-cereus-gold" />
                                Precio Sugerido
                              </h4>
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-3 rounded-lg border border-border bg-amber-50/50 dark:bg-amber-950/20">
                                  <p className="text-xs text-muted-foreground mb-1">Precio Minimo (35%)</p>
                                  <p className="text-lg font-mono font-bold">{formatPrice(minPrice)}</p>
                                </div>
                                <div className="p-3 rounded-lg border-2 border-cereus-gold/30 bg-cereus-gold/5">
                                  <p className="text-xs text-cereus-gold font-medium mb-1">Precio Objetivo (50%)</p>
                                  <p className="text-lg font-mono font-bold">{formatPrice(targetPrice)}</p>
                                </div>
                                <div className="p-3 rounded-lg border border-border bg-violet-50/50 dark:bg-violet-950/20">
                                  <p className="text-xs text-muted-foreground mb-1">Precio Premium (65%)</p>
                                  <p className="text-lg font-mono font-bold">{formatPrice(premiumPrice)}</p>
                                </div>
                              </div>

                              {/* Editable price + save */}
                              <div className="flex items-end gap-3 p-4 bg-muted/30 rounded-lg">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium mb-1.5">Precio Final</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={priceInputs[g.id] ?? (currentPrice > 0 ? currentPrice.toString() : '')}
                                      onChange={(e) => setPriceInputs(prev => ({ ...prev, [g.id]: e.target.value }))}
                                      placeholder={targetPrice.toFixed(2)}
                                      className="w-full pl-7 pr-4 py-2 bg-background border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                                    />
                                  </div>
                                </div>
                                {/* Live margin badge */}
                                {(() => {
                                  const inputVal = parseFloat(priceInputs[g.id] ?? '');
                                  const displayPrice = !isNaN(inputVal) ? inputVal : currentPrice;
                                  if (displayPrice > 0 && totalCost > 0) {
                                    const m = calculateMargin(displayPrice, totalCost);
                                    const cls = classifyMargin(m);
                                    return (
                                      <div className="shrink-0 text-center pb-0.5">
                                        <span
                                          className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white"
                                          style={{ backgroundColor: cls.color }}
                                        >
                                          {formatPercent(m)}
                                        </span>
                                        <p className="text-[10px] mt-1" style={{ color: cls.color }}>{cls.categoryEs}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <button
                                  onClick={() => {
                                    const val = parseFloat(priceInputs[g.id] ?? '');
                                    if (!isNaN(val) && val > 0) handleSavePrice(g.id, val);
                                  }}
                                  disabled={saving}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50 shrink-0"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  Guardar Precio
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: MATERIALES                                               */}
      {/* ================================================================ */}
      {activeTab === 'materiales' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar materiales..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
              >
                <option value="">Todos los tipos</option>
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={materialCurrency}
                onChange={(e) => setMaterialCurrency(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => { setShowMaterialForm(true); resetMatForm(); }}
                className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Nuevo Material
              </button>
            </div>
          </div>

          {/* Material Form Modal */}
          {showMaterialForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                onSubmit={handleCreateMaterial}
                className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-cereus-gold" /> Nuevo Material
                  </h3>
                  <button type="button" onClick={() => setShowMaterialForm(false)} className="p-1 hover:bg-muted rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">Nombre *</label>
                    <input type="text" required value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                      placeholder="Seda Italiana Charmeuse"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Codigo</label>
                    <input type="text" value={matForm.code} onChange={(e) => setMatForm({ ...matForm, code: e.target.value })}
                      placeholder="SLK-001"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tipo *</label>
                    <select required value={matForm.type} onChange={(e) => setMatForm({ ...matForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                      {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Subtipo</label>
                    <input type="text" value={matForm.subtype} onChange={(e) => setMatForm({ ...matForm, subtype: e.target.value })}
                      placeholder="charmeuse"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Proveedor</label>
                    <input type="text" value={matForm.supplier} onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })}
                      placeholder="Tessitura Monti"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Costo Unitario *</label>
                    <input type="number" step="0.01" required value={matForm.unit_cost} onChange={(e) => setMatForm({ ...matForm, unit_cost: e.target.value })}
                      placeholder="45.00"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Unidad *</label>
                    <select required value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                      {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Moneda</label>
                    <select value={matForm.currency} onChange={(e) => setMatForm({ ...matForm, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Composicion</label>
                    <input type="text" value={matForm.composition} onChange={(e) => setMatForm({ ...matForm, composition: e.target.value })}
                      placeholder="100% Seda"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={matForm.color_hex} onChange={(e) => setMatForm({ ...matForm, color_hex: e.target.value })}
                        className="w-10 h-10 rounded border border-input cursor-pointer" />
                      <input type="text" value={matForm.color_hex} onChange={(e) => setMatForm({ ...matForm, color_hex: e.target.value })}
                        className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Stock Actual</label>
                    <input type="number" step="0.01" value={matForm.current_stock} onChange={(e) => setMatForm({ ...matForm, current_stock: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Pais de Origen</label>
                    <input type="text" value={matForm.origin_country} onChange={(e) => setMatForm({ ...matForm, origin_country: e.target.value })}
                      placeholder="Italia"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Lead Time (dias)</label>
                    <input type="number" value={matForm.lead_time_days} onChange={(e) => setMatForm({ ...matForm, lead_time_days: e.target.value })}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Min. Orden</label>
                    <input type="number" step="0.01" value={matForm.min_order_qty} onChange={(e) => setMatForm({ ...matForm, min_order_qty: e.target.value })}
                      placeholder="10"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Descripcion</label>
                  <textarea value={matForm.description} onChange={(e) => setMatForm({ ...matForm, description: e.target.value })}
                    rows={2} placeholder="Descripcion del material..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowMaterialForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar Material
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Materials Grid */}
          {materials.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin materiales todavia</h3>
              <p className="text-muted-foreground mb-6">Agrega telas, avios y herrajes a tu inventario de materiales.</p>
              <button onClick={() => { setShowMaterialForm(true); resetMatForm(); }} className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
                <Plus className="w-4 h-4" /> Agregar Primer Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(m => {
                const isSelected = selectedMaterial === m.id;
                const usedBy = garmentsUsingMaterial(m.id);
                const displayCost = formatPrice(Number(m.unit_cost), materialCurrency === m.currency ? m.currency : m.currency);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMaterial(isSelected ? null : m.id)}
                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-cereus-gold ring-1 ring-cereus-gold/30' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color swatch */}
                      <div
                        className="w-10 h-10 rounded-lg border border-border shrink-0"
                        style={{ backgroundColor: m.color_hex || '#E5E7EB' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted capitalize">{m.type}</span>
                          {m.code && <span className="text-[10px] text-muted-foreground font-mono">{m.code}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-semibold text-sm">{displayCost}</p>
                        <p className="text-[10px] text-muted-foreground">/{m.unit}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.supplier || 'Sin proveedor'}</span>
                      {Number(m.current_stock) > 0 ? (
                        <span className="text-emerald-600">{m.current_stock} {m.stock_unit || m.unit}</span>
                      ) : (
                        <span className="text-amber-500">Sin stock</span>
                      )}
                    </div>

                    {m.composition && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">{m.composition}</p>
                    )}

                    {/* Expanded detail: garments using this material */}
                    {isSelected && usedBy.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                          <Scissors className="w-3 h-3" /> Usado en {usedBy.length} prenda{usedBy.length !== 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-1">
                          {usedBy.map(gar => (
                            <div key={gar.id} className="text-xs flex items-center justify-between">
                              <span className="truncate">{gar.name}</span>
                              <span className="text-muted-foreground ml-2">{gar.collection?.name || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {isSelected && usedBy.length === 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">No se usa en ninguna prenda actualmente.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: ANALISIS DE MARGENES                                     */}
      {/* ================================================================ */}
      {activeTab === 'analisis' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Margen Promedio</p>
              {analysisData.costedCount > 0 ? (
                <>
                  <p className="text-2xl font-mono font-bold" style={{ color: classifyMargin(analysisData.avgMargin).color }}>
                    {formatPercent(analysisData.avgMargin)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: classifyMargin(analysisData.avgMargin).color }}>
                    {classifyMargin(analysisData.avgMargin).categoryEs}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-mono font-bold text-muted-foreground">--</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Prendas Costeadas</p>
              <p className="text-2xl font-mono font-bold">{analysisData.costedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">de {garments.length} total</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Prendas Sin Precio</p>
              <p className="text-2xl font-mono font-bold text-amber-500">{analysisData.noPriceCount}</p>
              {analysisData.noPriceCount > 0 && (
                <p className="text-xs text-amber-500 mt-0.5">Requieren precio</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Ingreso Estimado</p>
              <p className="text-2xl font-mono font-bold text-cereus-gold">{formatPrice(analysisData.estimatedRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">todas las prendas con precio</p>
            </div>
          </div>

          {/* Margin Distribution Bar Chart */}
          {analysisData.rows.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cereus-gold" />
                  Distribucion de Margenes
                </h4>
                <div className="flex items-center gap-3 text-[10px] flex-wrap">
                  {CEREUS_MARGIN_RANGES.slice(0, 6).map(r => (
                    <div key={r.name} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                      <span className="text-muted-foreground">{r.nameEs}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {analysisData.rows
                  .filter(r => r.price > 0)
                  .sort((a, b) => b.margin - a.margin)
                  .map(row => {
                    const barWidth = Math.max(Math.min(row.margin * 100, 100), 2);
                    return (
                      <div key={row.garment.id} className="flex items-center gap-3">
                        <div className="w-36 truncate text-xs font-medium shrink-0" title={row.garment.name}>
                          {row.garment.name}
                        </div>
                        <div className="flex-1 bg-muted/50 rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: row.classification?.color || '#6B7280',
                            }}
                          >
                            <span className="text-[10px] font-mono font-bold text-white drop-shadow-sm">
                              {formatPercent(row.margin)}
                            </span>
                          </div>
                        </div>
                        <div className="w-20 text-right text-xs font-mono shrink-0">
                          {formatPrice(row.price)}
                        </div>
                      </div>
                    );
                  })}
                {analysisData.rows.filter(r => r.price <= 0).length > 0 && (
                  <div className="pt-2 border-t border-border mt-2">
                    <p className="text-xs text-muted-foreground">
                      {analysisData.rows.filter(r => r.price <= 0).length} prenda(s) sin precio asignado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detail Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h4 className="text-sm font-semibold">Detalle por Prenda</h4>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-input rounded-lg hover:bg-muted transition-colors"
                onClick={() => {/* placeholder export */}}
              >
                <FileDown className="w-3.5 h-3.5" /> Exportar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Prenda</th>
                    <th className="text-left px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Coleccion</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Costo</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Precio</th>
                    <th className="text-right px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Margen</th>
                    <th className="text-center px-4 py-2.5 font-medium text-xs uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        Sin prendas para analizar. Crea prendas y asigna precios.
                      </td>
                    </tr>
                  ) : (
                    analysisData.rows.map(row => (
                      <tr key={row.garment.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{row.garment.name}</span>
                            {row.garment.code && <span className="text-xs text-muted-foreground font-mono">{row.garment.code}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.garment.collection?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatPrice(row.totalCost)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {row.price > 0 ? formatPrice(row.price) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {row.price > 0 ? (
                            <span style={{ color: row.classification?.color }}>{formatPercent(row.margin)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.price > 0 && row.classification ? (
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                              style={{ backgroundColor: row.classification.color }}
                            >
                              {row.classification.categoryEs}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                              Sin precio
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin Legend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3">Referencia de Margenes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CEREUS_MARGIN_RANGES.map(r => (
                <div key={r.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <div>
                    <p className="text-xs font-medium">{r.nameEs}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatPercent(r.min)} - {formatPercent(r.max)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
