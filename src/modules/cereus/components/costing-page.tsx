'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Save, Loader2, X, Trash2,
  Package, Scissors, Layers, DollarSign, ChevronDown,
  ChevronUp, AlertCircle,
} from 'lucide-react';

// Types
interface Material {
  id: string;
  name: string;
  code: string | null;
  type: string;
  subtype: string | null;
  supplier: string | null;
  unit_cost: number;
  unit: string;
  currency: string;
  composition: string | null;
  color_hex: string | null;
  current_stock: number;
  stock_unit: string | null;
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

const MATERIAL_TYPES = ['fabric', 'lining', 'trim', 'hardware', 'thread', 'interfacing', 'elastic', 'zipper', 'button', 'embellishment', 'other'];
const MATERIAL_UNITS = ['metro', 'yard', 'pieza', 'kg', 'rollo', 'par', 'set'];
const GARMENT_CATEGORIES = ['dress', 'top', 'bottom', 'outerwear', 'suit', 'gown', 'accessory', 'intimates', 'other'];
const SEASONS = ['SS', 'FW', 'resort', 'pre_fall', 'haute_couture', 'capsule'];

type Tab = 'materials' | 'garments';

export function CereusCostingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [error, setError] = useState<string | null>(null);

  // Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');

  // Garments state
  const [garments, setGarments] = useState<Garment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [showBomForm, setShowBomForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);

  // Forms
  const [saving, setSaving] = useState(false);

  const [matForm, setMatForm] = useState({
    name: '', code: '', type: 'fabric', subtype: '', supplier: '',
    unit_cost: '', unit: 'metro', currency: 'USD', composition: '',
    color_hex: '', current_stock: '0',
  });

  const [garForm, setGarForm] = useState({
    name: '', code: '', category: 'dress', description: '',
    collection_id: '', base_labor_hours: '', base_labor_cost: '',
    complexity_level: '1', base_price: '', margin_target: '0.50',
    season: '', year: new Date().getFullYear().toString(),
  });

  const [bomForm, setBomForm] = useState({
    materialId: '', quantity: '', unit: 'metro', waste_factor: '1.10', notes: '',
  });

  const [colForm, setColForm] = useState({
    name: '', code: '', season: 'FW', year: new Date().getFullYear().toString(),
    description: '',
  });

  useEffect(() => { fetchMaison(); }, []);
  useEffect(() => { if (maisonId) { fetchMaterials(); fetchGarments(); fetchCollections(); } }, [maisonId]);

  async function fetchMaison() {
    const res = await fetch('/api/cereus/maison');
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    if (!data.hasAccess) { router.push('/apps/cereus'); return; }
    setMaisonId(data.maison.id);
    setLoading(false);
  }

  async function fetchMaterials() {
    const params = new URLSearchParams({ maisonId: maisonId! });
    if (materialSearch) params.set('search', materialSearch);
    if (materialFilter) params.set('type', materialFilter);
    const res = await fetch(`/api/cereus/materials?${params}`);
    const data = await res.json();
    setMaterials(data.materials || []);
  }

  async function fetchGarments() {
    const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}`);
    const data = await res.json();
    setGarments(data.garments || []);
  }

  async function fetchCollections() {
    const res = await fetch(`/api/cereus/collections?maisonId=${maisonId}`);
    const data = await res.json();
    setCollections(data.collections || []);
  }

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
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowMaterialForm(false);
      setMatForm({ name: '', code: '', type: 'fabric', subtype: '', supplier: '', unit_cost: '', unit: 'metro', currency: 'USD', composition: '', color_hex: '', current_stock: '0' });
      fetchMaterials();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleCreateGarment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: garForm.name,
          code: garForm.code || undefined,
          category: garForm.category,
          description: garForm.description || undefined,
          collection_id: garForm.collection_id || undefined,
          base_labor_hours: garForm.base_labor_hours ? parseFloat(garForm.base_labor_hours) : 0,
          base_labor_cost: garForm.base_labor_cost ? parseFloat(garForm.base_labor_cost) : 0,
          complexity_level: parseInt(garForm.complexity_level),
          base_price: garForm.base_price ? parseFloat(garForm.base_price) : undefined,
          margin_target: parseFloat(garForm.margin_target),
          season: garForm.season || undefined,
          year: garForm.year ? parseInt(garForm.year) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowGarmentForm(false);
      setGarForm({ name: '', code: '', category: 'dress', description: '', collection_id: '', base_labor_hours: '', base_labor_cost: '', complexity_level: '1', base_price: '', margin_target: '0.50', season: '', year: new Date().getFullYear().toString() });
      fetchGarments();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
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

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: colForm.name,
          code: colForm.code || undefined,
          season: colForm.season,
          year: parseInt(colForm.year),
          description: colForm.description || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowCollectionForm(false);
      setColForm({ name: '', code: '', season: 'FW', year: new Date().getFullYear().toString(), description: '' });
      fetchCollections();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  const selectedGarmentData = garments.find(g => g.id === selectedGarment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Costing</h1>
            <p className="text-sm text-muted-foreground">Materials, BOM & pricing</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'materials' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" /> Materials ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('garments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'garments' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scissors className="w-4 h-4" /> Garments ({garments.length})
        </button>
      </div>

      {/* ======================== MATERIALS TAB ======================== */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search materials..."
                value={materialSearch}
                onChange={(e) => { setMaterialSearch(e.target.value); setTimeout(fetchMaterials, 300); }}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            <select
              value={materialFilter}
              onChange={(e) => { setMaterialFilter(e.target.value); setTimeout(fetchMaterials, 100); }}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm"
            >
              <option value="">All types</option>
              {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => setShowMaterialForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>

          {/* Material Form */}
          {showMaterialForm && (
            <form onSubmit={handleCreateMaterial} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-cereus-gold" /> New Material</h3>
                <button type="button" onClick={() => setShowMaterialForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name *</label>
                  <input type="text" required value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} placeholder="Italian Silk Charmeuse" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Code</label>
                  <input type="text" value={matForm.code} onChange={(e) => setMatForm({ ...matForm, code: e.target.value })} placeholder="SLK-001" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Type *</label>
                  <select required value={matForm.type} onChange={(e) => setMatForm({ ...matForm, type: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Subtype</label>
                  <input type="text" value={matForm.subtype} onChange={(e) => setMatForm({ ...matForm, subtype: e.target.value })} placeholder="charmeuse" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Supplier</label>
                  <input type="text" value={matForm.supplier} onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })} placeholder="Tessitura Monti" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Unit Cost *</label>
                  <input type="number" step="0.01" required value={matForm.unit_cost} onChange={(e) => setMatForm({ ...matForm, unit_cost: e.target.value })} placeholder="45.00" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Unit *</label>
                  <select required value={matForm.unit} onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Composition</label>
                  <input type="text" value={matForm.composition} onChange={(e) => setMatForm({ ...matForm, composition: e.target.value })} placeholder="100% Silk" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowMaterialForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </form>
          )}

          {/* Materials List */}
          {materials.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No materials yet</h3>
              <p className="text-muted-foreground mb-6">Add fabrics, trims, and hardware to your material vault.</p>
              <button onClick={() => setShowMaterialForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
                <Plus className="w-4 h-4" /> Add First Material
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">Material</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Supplier</th>
                    <th className="text-right px-4 py-3 font-medium">Cost</th>
                    <th className="text-right px-4 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {m.color_hex && (
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: m.color_hex }} />
                          )}
                          <div>
                            <p className="font-medium">{m.name}</p>
                            {m.code && <p className="text-xs text-muted-foreground">{m.code}</p>}
                            {m.composition && <p className="text-xs text-muted-foreground">{m.composition}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted">{m.type}</span>
                        {m.subtype && <span className="text-xs text-muted-foreground ml-1">{m.subtype}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.supplier || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        ${Number(m.unit_cost).toFixed(2)}/{m.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(m.current_stock) > 0 ? (
                          <span className="text-emerald-600">{m.current_stock} {m.stock_unit || m.unit}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================== GARMENTS TAB ======================== */}
      {activeTab === 'garments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCollectionForm(true)}
              className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Layers className="w-4 h-4" /> New Collection
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowGarmentForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Garment
            </button>
          </div>

          {/* Collection Form */}
          {showCollectionForm && (
            <form onSubmit={handleCreateCollection} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Layers className="w-5 h-5 text-cereus-gold" /> New Collection</h3>
                <button type="button" onClick={() => setShowCollectionForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name *</label>
                  <input type="text" required value={colForm.name} onChange={(e) => setColForm({ ...colForm, name: e.target.value })} placeholder="Noche Eterna" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Code</label>
                  <input type="text" value={colForm.code} onChange={(e) => setColForm({ ...colForm, code: e.target.value })} placeholder="FW26-A" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Season *</label>
                  <select required value={colForm.season} onChange={(e) => setColForm({ ...colForm, season: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Year *</label>
                  <input type="number" required value={colForm.year} onChange={(e) => setColForm({ ...colForm, year: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCollectionForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
                </button>
              </div>
            </form>
          )}

          {/* Garment Form */}
          {showGarmentForm && (
            <form onSubmit={handleCreateGarment} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Scissors className="w-5 h-5 text-cereus-gold" /> New Garment</h3>
                <button type="button" onClick={() => setShowGarmentForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name *</label>
                  <input type="text" required value={garForm.name} onChange={(e) => setGarForm({ ...garForm, name: e.target.value })} placeholder="Column Dress" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Code</label>
                  <input type="text" value={garForm.code} onChange={(e) => setGarForm({ ...garForm, code: e.target.value })} placeholder="PV-D001" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Category *</label>
                  <select required value={garForm.category} onChange={(e) => setGarForm({ ...garForm, category: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    {GARMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Collection</label>
                  <select value={garForm.collection_id} onChange={(e) => setGarForm({ ...garForm, collection_id: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    <option value="">None</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name} ({c.season} {c.year})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Labor Hours</label>
                  <input type="number" step="0.5" value={garForm.base_labor_hours} onChange={(e) => setGarForm({ ...garForm, base_labor_hours: e.target.value })} placeholder="40" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Labor Cost ($)</label>
                  <input type="number" step="0.01" value={garForm.base_labor_cost} onChange={(e) => setGarForm({ ...garForm, base_labor_cost: e.target.value })} placeholder="800.00" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Complexity (1-5)</label>
                  <select value={garForm.complexity_level} onChange={(e) => setGarForm({ ...garForm, complexity_level: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Target Margin (%)</label>
                  <input type="number" step="0.01" value={garForm.margin_target} onChange={(e) => setGarForm({ ...garForm, margin_target: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea value={garForm.description} onChange={(e) => setGarForm({ ...garForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowGarmentForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Garment
                </button>
              </div>
            </form>
          )}

          {/* Garments List */}
          {garments.length === 0 && !showGarmentForm ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No garments yet</h3>
              <p className="text-muted-foreground mb-6">Create your first garment design and build its Bill of Materials.</p>
              <button onClick={() => setShowGarmentForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
                <Plus className="w-4 h-4" /> Create First Garment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {garments.map(g => {
                const isExpanded = selectedGarment === g.id;
                const totalMaterial = Number(g.base_cost) || 0;
                const totalLabor = Number(g.base_labor_cost) || 0;
                const totalCost = totalMaterial + totalLabor;
                const suggestedPrice = g.margin_target > 0 ? totalCost / (1 - g.margin_target) : totalCost;

                return (
                  <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSelectedGarment(isExpanded ? null : g.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cereus-gold/10 flex items-center justify-center">
                          <Scissors className="w-5 h-5 text-cereus-gold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{g.name}</p>
                            {g.code && <span className="text-xs text-muted-foreground font-mono">{g.code}</span>}
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted capitalize">{g.category}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              g.status === 'draft' ? 'bg-gray-200 text-gray-600' :
                              g.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              g.status === 'costing' ? 'bg-cereus-gold/20 text-cereus-gold' :
                              'bg-blue-100 text-blue-700'
                            }`}>{g.status}</span>
                          </div>
                          {g.collection && (
                            <p className="text-xs text-muted-foreground mt-0.5">{g.collection.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold">${totalCost.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">total cost</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-cereus-gold">${suggestedPrice.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{(g.margin_target * 100).toFixed(0)}% margin</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-5 py-4 space-y-4">
                        {/* Cost Summary */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Material</p>
                            <p className="text-lg font-mono font-bold">${totalMaterial.toFixed(2)}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Labor ({g.base_labor_hours}h)</p>
                            <p className="text-lg font-mono font-bold">${totalLabor.toFixed(2)}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Total Cost</p>
                            <p className="text-lg font-mono font-bold">${totalCost.toFixed(2)}</p>
                          </div>
                          <div className="p-3 bg-cereus-gold/10 rounded-lg text-center">
                            <p className="text-xs text-cereus-gold">Suggested Price</p>
                            <p className="text-lg font-mono font-bold text-cereus-gold">${suggestedPrice.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* BOM */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Bill of Materials</h4>
                            <button
                              onClick={() => { setShowBomForm(true); setBomForm({ materialId: '', quantity: '', unit: 'metro', waste_factor: '1.10', notes: '' }); }}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-cereus-gold text-white rounded hover:bg-cereus-gold/90"
                            >
                              <Plus className="w-3 h-3" /> Add Material
                            </button>
                          </div>

                          {showBomForm && (
                            <form onSubmit={handleAddBom} className="bg-muted/50 rounded-lg p-4 mb-3 space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium mb-1">Material *</label>
                                  <select required value={bomForm.materialId} onChange={(e) => setBomForm({ ...bomForm, materialId: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm">
                                    <option value="">Select material...</option>
                                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} (${Number(m.unit_cost).toFixed(2)}/{m.unit})</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Quantity *</label>
                                  <input type="number" step="0.01" required value={bomForm.quantity} onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Unit</label>
                                  <select value={bomForm.unit} onChange={(e) => setBomForm({ ...bomForm, unit: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm">
                                    {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Waste Factor</label>
                                  <input type="number" step="0.01" value={bomForm.waste_factor} onChange={(e) => setBomForm({ ...bomForm, waste_factor: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm" />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowBomForm(false)} className="px-3 py-1.5 text-xs border border-input rounded hover:bg-muted">Cancel</button>
                                <button type="submit" disabled={saving} className="flex items-center gap-1 px-4 py-1.5 text-xs bg-cereus-gold text-white rounded hover:bg-cereus-gold/90 disabled:opacity-50">
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Add
                                </button>
                              </div>
                            </form>
                          )}

                          {g.garment_materials?.length > 0 ? (
                            <div className="space-y-1">
                              {g.garment_materials.map((bom: any) => (
                                <div key={bom.id} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted">{bom.material?.type}</span>
                                    <span className="font-medium">{bom.material?.name}</span>
                                    {bom.notes && <span className="text-xs text-muted-foreground">({bom.notes})</span>}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground">
                                      {bom.quantity} {bom.unit} × ${Number(bom.unit_cost).toFixed(2)} × {bom.waste_factor}
                                    </span>
                                    <span className="font-mono font-medium">${Number(bom.total_cost).toFixed(2)}</span>
                                    <button
                                      onClick={() => handleDeleteBom(bom.id, g.id)}
                                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No materials in BOM yet. Add materials to calculate costs.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
