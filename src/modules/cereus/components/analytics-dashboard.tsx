'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, DollarSign, Users, Package, BarChart3,
  Calendar, Award, AlertTriangle, Shirt, Factory,
  Loader2,
} from 'lucide-react';
import { formatPrice, formatPercent } from '../lib/costing-engine';

// ============================================================
// TYPES
// ============================================================

interface Collection {
  id: string;
  name: string;
  code: string | null;
  season: string;
  year: number;
  status: string;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  category: string;
  status: string;
  base_cost: number;
  base_price: number | null;
  base_labor_cost: number;
  base_labor_hours: number;
  margin_target: number;
  complexity_level: number;
  collection: { id: string; name: string; code: string | null } | null;
}

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  vip_tier: string | null;
  activo: boolean;
  created_at: string;
  cereus_emotional_profiles: { id: string; primary_archetype: string }[] | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  current_stage: string | null;
  total_price: number;
  final_amount: number;
  discount_amount: number;
  created_at: string;
  estimated_delivery: string | null;
  priority: string;
  client: { id: string; full_name: string; vip_tier: string | null } | null;
  variant: {
    id: string;
    variant_name: string;
    garment: { id: string; name: string; code: string | null } | null;
  } | null;
}

interface Material {
  id: string;
  name: string;
  code: string | null;
  type: string;
  unit_cost: number;
  current_stock: number;
  min_order_qty: number | null;
  supplier: string | null;
}

type Tab = 'vision' | 'colecciones' | 'clientes' | 'forecast';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'vision', label: 'Vision General', icon: BarChart3 },
  { key: 'colecciones', label: 'Colecciones', icon: Shirt },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'forecast', label: 'Forecast', icon: TrendingUp },
];

const PRODUCTION_STAGES = [
  'pattern', 'cutting', 'sewing', 'finishing', 'quality', 'pressing', 'packaging', 'delivered',
];

const STAGE_LABELS: Record<string, string> = {
  pattern: 'Patronaje',
  cutting: 'Corte',
  sewing: 'Confeccion',
  finishing: 'Acabados',
  quality: 'Calidad',
  pressing: 'Planchado',
  packaging: 'Empaque',
  delivered: 'Entregado',
};

const STAGE_COLORS: Record<string, string> = {
  pattern: 'bg-violet-500',
  cutting: 'bg-blue-500',
  sewing: 'bg-cyan-500',
  finishing: 'bg-emerald-500',
  quality: 'bg-yellow-500',
  pressing: 'bg-orange-500',
  packaging: 'bg-rose-500',
  delivered: 'bg-green-600',
};

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-gray-200 text-gray-700',
  active: 'bg-emerald-100 text-emerald-800',
  production: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const WORKSHOP_CAPACITY = 12; // max concurrent production orders

// ============================================================
// COMPONENT
// ============================================================

export function CereusAnalyticsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('vision');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maisonId, setMaisonId] = useState<string | null>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // ---- Fetch maison ----
  useEffect(() => { fetchMaison(); }, []);

  useEffect(() => {
    if (maisonId) {
      Promise.all([
        fetchCollections(),
        fetchGarments(),
        fetchOrders(),
        fetchClients(),
        fetchMaterials(),
      ]).finally(() => setLoading(false));
    }
  }, [maisonId]);

  async function fetchMaison() {
    try {
      const res = await fetch('/api/cereus/maison');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (!data.hasAccess) { router.push('/apps/cereus'); return; }
      setMaisonId(data.maison.id);
    } catch { setError('Error al cargar la maison'); setLoading(false); }
  }

  async function fetchCollections() {
    try {
      const res = await fetch(`/api/cereus/collections?maisonId=${maisonId}`);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch { /* silent */ }
  }

  async function fetchGarments() {
    try {
      const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}`);
      const data = await res.json();
      setGarments(data.garments || []);
    } catch { /* silent */ }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* silent */ }
  }

  async function fetchClients() {
    try {
      const res = await fetch(`/api/cereus/clients?maisonId=${maisonId}&limit=500`);
      const data = await res.json();
      setClients(data.clients || []);
    } catch { /* silent */ }
  }

  async function fetchMaterials() {
    try {
      const res = await fetch(`/api/cereus/materials?maisonId=${maisonId}`);
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch { /* silent */ }
  }

  // ============================================================
  // COMPUTED DATA
  // ============================================================

  const activeOrders = useMemo(
    () => orders.filter(o => ['pending', 'confirmed', 'in_production'].includes(o.status)),
    [orders]
  );

  const nonCancelledOrders = useMemo(
    () => orders.filter(o => o.status !== 'cancelled'),
    [orders]
  );

  const totalRevenue = useMemo(
    () => nonCancelledOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0),
    [nonCancelledOrders]
  );

  const inProductionGarments = useMemo(
    () => orders.filter(o => o.status === 'in_production').length,
    [orders]
  );

  const activeClients = useMemo(
    () => clients.filter(c => c.activo).length,
    [clients]
  );

  const avgMargin = useMemo(() => {
    const withBoth = garments.filter(g => g.base_price && g.base_price > 0 && g.base_cost > 0);
    if (withBoth.length === 0) return 0;
    const sum = withBoth.reduce((s, g) => s + (g.base_price! - g.base_cost) / g.base_price!, 0);
    return sum / withBoth.length;
  }, [garments]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`, total: 0 });
    }
    for (const o of nonCancelledOrders) {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find(m => m.key === key);
      if (month) month.total += o.final_amount || 0;
    }
    return months;
  }, [nonCancelledOrders]);

  const maxRevenue = useMemo(
    () => Math.max(...revenueByMonth.map(m => m.total), 1),
    [revenueByMonth]
  );

  // Top 5 garments by revenue
  const topGarments = useMemo(() => {
    const map = new Map<string, { name: string; collection: string; orders: number; revenue: number }>();
    for (const o of nonCancelledOrders) {
      const garmentId = o.variant?.garment?.id;
      if (!garmentId) continue;
      const existing = map.get(garmentId) || {
        name: o.variant?.garment?.name || 'Sin nombre',
        collection: '',
        orders: 0,
        revenue: 0,
      };
      existing.orders += 1;
      existing.revenue += o.final_amount || 0;
      map.set(garmentId, existing);
    }
    // Enrich with collection name
    Array.from(map.entries()).forEach(([gId, entry]) => {
      const g = garments.find(g => g.id === gId);
      if (g?.collection) entry.collection = g.collection.name;
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [nonCancelledOrders, garments]);

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of PRODUCTION_STAGES) counts[s] = 0;
    for (const o of orders) {
      if (o.current_stage && counts[o.current_stage] !== undefined) {
        counts[o.current_stage]++;
      }
    }
    return counts;
  }, [orders]);

  const maxPipelineCount = useMemo(
    () => Math.max(...Object.values(pipelineCounts), 1),
    [pipelineCounts]
  );

  // ---- Collection analytics ----
  const collectionAnalytics = useMemo(() => {
    return collections.map(col => {
      const colGarments = garments.filter(g => g.collection?.id === col.id);
      const garmentIds = new Set(colGarments.map(g => g.id));
      const colOrders = nonCancelledOrders.filter(o => {
        const gId = o.variant?.garment?.id;
        return gId && garmentIds.has(gId);
      });
      const ingreso = colOrders.reduce((s, o) => s + (o.final_amount || 0), 0);
      const withMargin = colGarments.filter(g => g.base_price && g.base_price > 0 && g.base_cost > 0);
      const avgMarg = withMargin.length > 0
        ? withMargin.reduce((s, g) => s + (g.base_price! - g.base_cost) / g.base_price!, 0) / withMargin.length
        : 0;
      const totalCost = colGarments.reduce((s, g) => s + (g.base_cost || 0), 0);

      // Top piece by orders
      const pieceMap = new Map<string, { name: string; count: number }>();
      for (const o of colOrders) {
        const gId = o.variant?.garment?.id;
        const gName = o.variant?.garment?.name || '';
        if (!gId) continue;
        const p = pieceMap.get(gId) || { name: gName, count: 0 };
        p.count++;
        pieceMap.set(gId, p);
      }
      const topPiece = Array.from(pieceMap.values()).sort((a, b) => b.count - a.count)[0] || null;

      return { ...col, piezas: colGarments.length, ordenes: colOrders.length, ingreso, avgMarg, totalCost, topPiece };
    });
  }, [collections, garments, nonCancelledOrders]);

  // ---- Client analytics ----
  const clientAnalytics = useMemo(() => {
    const map = new Map<string, {
      name: string; vipTier: string | null; orders: number;
      totalSpent: number; lastOrder: string | null; archetype: string | null;
    }>();
    // Seed from clients list
    for (const c of clients) {
      const archetype = c.cereus_emotional_profiles?.[0]?.primary_archetype || null;
      map.set(c.id, {
        name: c.full_name,
        vipTier: c.vip_tier,
        orders: 0,
        totalSpent: 0,
        lastOrder: null,
        archetype,
      });
    }
    for (const o of nonCancelledOrders) {
      if (!o.client) continue;
      const entry = map.get(o.client.id);
      if (entry) {
        entry.orders += 1;
        entry.totalSpent += o.final_amount || 0;
        if (!entry.lastOrder || o.created_at > entry.lastOrder) entry.lastOrder = o.created_at;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [clients, nonCancelledOrders]);

  const retentionRate = useMemo(() => {
    const withOrders = clientAnalytics.filter(c => c.orders > 0);
    const repeaters = withOrders.filter(c => c.orders > 1);
    return withOrders.length > 0 ? repeaters.length / withOrders.length : 0;
  }, [clientAnalytics]);

  const avgOrderValue = useMemo(() => {
    return nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;
  }, [totalRevenue, nonCancelledOrders]);

  const archetypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clientAnalytics) {
      if (c.archetype) {
        counts[c.archetype] = (counts[c.archetype] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [clientAnalytics]);

  // ---- Forecast ----
  const pipelineValue = useMemo(() => {
    const inProd = orders.filter(o => o.status === 'in_production');
    return inProd.reduce((s, o) => s + (o.final_amount || 0) * avgMargin, 0);
  }, [orders, avgMargin]);

  const projectedMonthly = useMemo(() => {
    const last3 = revenueByMonth.slice(-3);
    const sum = last3.reduce((s, m) => s + m.total, 0);
    return last3.length > 0 ? sum / last3.length : 0;
  }, [revenueByMonth]);

  const materialsAtRisk = useMemo(
    () => materials.filter(m => m.min_order_qty != null && m.current_stock < m.min_order_qty),
    [materials]
  );

  const capacityUtil = useMemo(() => {
    const inProd = orders.filter(o => o.status === 'in_production').length;
    return inProd / WORKSHOP_CAPACITY;
  }, [orders]);

  // ============================================================
  // LOADING / ERROR
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
        <span className="ml-3 text-gray-500">Cargando analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <AlertTriangle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Panel de inteligencia de negocio CEREUS
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            Actualizado: {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${active
                      ? 'border-cereus-gold text-cereus-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'vision' && (
          <VisionGeneralTab
            totalRevenue={totalRevenue}
            activeOrdersCount={activeOrders.length}
            inProductionCount={inProductionGarments}
            activeClientsCount={activeClients}
            avgMargin={avgMargin}
            collectionsCount={collections.length}
            revenueByMonth={revenueByMonth}
            maxRevenue={maxRevenue}
            topGarments={topGarments}
            pipelineCounts={pipelineCounts}
            maxPipelineCount={maxPipelineCount}
          />
        )}
        {activeTab === 'colecciones' && (
          <ColeccionesTab analytics={collectionAnalytics} />
        )}
        {activeTab === 'clientes' && (
          <ClientesTab
            clientAnalytics={clientAnalytics}
            retentionRate={retentionRate}
            avgOrderValue={avgOrderValue}
            archetypeDistribution={archetypeDistribution}
          />
        )}
        {activeTab === 'forecast' && (
          <ForecastTab
            pipelineValue={pipelineValue}
            projectedMonthly={projectedMonthly}
            materialsAtRisk={materialsAtRisk}
            capacityUtil={capacityUtil}
            avgMargin={avgMargin}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ? 'bg-cereus-gold-lighter text-cereus-gold' : 'bg-gray-100 text-gray-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ============================================================
// TAB: VISION GENERAL
// ============================================================

function VisionGeneralTab({
  totalRevenue, activeOrdersCount, inProductionCount, activeClientsCount,
  avgMargin, collectionsCount, revenueByMonth, maxRevenue, topGarments,
  pipelineCounts, maxPipelineCount,
}: {
  totalRevenue: number;
  activeOrdersCount: number;
  inProductionCount: number;
  activeClientsCount: number;
  avgMargin: number;
  collectionsCount: number;
  revenueByMonth: { key: string; label: string; total: number }[];
  maxRevenue: number;
  topGarments: { name: string; collection: string; orders: number; revenue: number }[];
  pipelineCounts: Record<string, number>;
  maxPipelineCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={DollarSign} label="Ingresos Totales" value={formatPrice(totalRevenue)} accent />
        <KpiCard icon={Package} label="Ordenes Activas" value={String(activeOrdersCount)} />
        <KpiCard icon={Factory} label="En Produccion" value={String(inProductionCount)} sub="piezas" />
        <KpiCard icon={Users} label="Clientes Activos" value={String(activeClientsCount)} />
        <KpiCard icon={TrendingUp} label="Margen Promedio" value={formatPercent(avgMargin)} accent />
        <KpiCard icon={Shirt} label="Colecciones" value={String(collectionsCount)} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cereus-gold" />
          Ingresos Mensuales (Ultimos 6 Meses)
        </h3>
        <div className="flex items-end gap-3 h-48">
          {revenueByMonth.map(m => {
            const height = maxRevenue > 0 ? (m.total / maxRevenue) * 100 : 0;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-gray-600">{formatPrice(m.total)}</span>
                <div className="w-full relative" style={{ height: '160px' }}>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 rounded-t-md bg-gradient-to-t from-cereus-gold to-cereus-gold-light transition-all duration-500"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 text-center leading-tight">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Prendas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-cereus-gold" />
            Top 5 Prendas por Ingreso
          </h3>
          {topGarments.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos de ordenes</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Prenda</th>
                  <th className="text-left py-2 font-medium">Coleccion</th>
                  <th className="text-right py-2 font-medium">Ordenes</th>
                  <th className="text-right py-2 font-medium">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {topGarments.map((g, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-medium text-gray-800">{g.name}</td>
                    <td className="py-2.5 text-gray-500">{g.collection || '—'}</td>
                    <td className="py-2.5 text-right font-mono text-gray-700">{g.orders}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-cereus-gold">{formatPrice(g.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pipeline de Produccion */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4 text-cereus-gold" />
            Pipeline de Produccion
          </h3>
          <div className="space-y-3">
            {PRODUCTION_STAGES.map(stage => {
              const count = pipelineCounts[stage] || 0;
              const pct = maxPipelineCount > 0 ? (count / maxPipelineCount) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24 text-right">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full ${STAGE_COLORS[stage]} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: COLECCIONES
// ============================================================

interface ColAnalytics {
  id: string;
  name: string;
  season: string;
  year: number;
  status: string;
  piezas: number;
  ordenes: number;
  ingreso: number;
  avgMarg: number;
  totalCost: number;
  topPiece: { name: string; count: number } | null;
}

function ColeccionesTab({ analytics }: { analytics: ColAnalytics[] }) {
  if (analytics.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <Shirt className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No hay colecciones registradas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {analytics.map(col => {
        const costVsIncome = col.ingreso > 0 ? Math.min((col.totalCost / col.ingreso) * 100, 100) : 0;
        return (
          <div key={col.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{col.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{col.season} {col.year}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[col.status] || 'bg-gray-100 text-gray-600'}`}>
                {col.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mb-4">
              <div>
                <span className="text-gray-500 text-xs">Piezas</span>
                <p className="font-mono font-semibold text-gray-800">{col.piezas}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Ordenes</span>
                <p className="font-mono font-semibold text-gray-800">{col.ordenes}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Ingreso</span>
                <p className="font-mono font-semibold text-cereus-gold">{formatPrice(col.ingreso)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Margen Promedio</span>
                <p className="font-mono font-semibold text-gray-800">{formatPercent(col.avgMarg)}</p>
              </div>
            </div>

            {/* Cost vs Revenue bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Costo Estimado vs Ingreso</span>
                <span className="font-mono">{costVsIncome.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${costVsIncome > 80 ? 'bg-red-400' : costVsIncome > 50 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                  style={{ width: `${costVsIncome}%` }}
                />
              </div>
            </div>

            {col.topPiece && (
              <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <Award className="w-3.5 h-3.5 text-cereus-gold" />
                <span>Top pieza: <strong className="text-gray-700">{col.topPiece.name}</strong> ({col.topPiece.count} ordenes)</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: CLIENTES
// ============================================================

function ClientesTab({
  clientAnalytics, retentionRate, avgOrderValue, archetypeDistribution,
}: {
  clientAnalytics: { name: string; vipTier: string | null; orders: number; totalSpent: number; lastOrder: string | null; archetype: string | null }[];
  retentionRate: number;
  avgOrderValue: number;
  archetypeDistribution: [string, number][];
}) {
  const totalArchetypes = archetypeDistribution.reduce((s, [, c]) => s + c, 0);

  const VIP_COLORS: Record<string, string> = {
    gold: 'bg-cereus-gold-lighter text-cereus-gold',
    platinum: 'bg-gray-200 text-gray-700',
    diamond: 'bg-violet-100 text-violet-700',
    standard: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <Users className="w-4 h-4" />
            Tasa de Retencion
          </div>
          <p className="text-3xl font-bold font-mono text-gray-900">{formatPercent(retentionRate)}</p>
          <p className="text-xs text-gray-400 mt-1">Clientes con mas de 1 orden</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <DollarSign className="w-4 h-4" />
            Valor Promedio de Orden
          </div>
          <p className="text-3xl font-bold font-mono text-cereus-gold">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <Award className="w-4 h-4" />
            Distribucion de Arquetipos
          </div>
          {archetypeDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 mt-2">Sin datos</p>
          ) : (
            <>
              <div className="flex h-4 rounded-full overflow-hidden mt-3 mb-2">
                {archetypeDistribution.map(([arch, count], i) => (
                  <div
                    key={arch}
                    className={`${ARCHETYPE_COLORS[i % ARCHETYPE_COLORS.length]} transition-all`}
                    style={{ width: `${(count / totalArchetypes) * 100}%` }}
                    title={`${arch}: ${count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {archetypeDistribution.slice(0, 5).map(([arch, count], i) => (
                  <span key={arch} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${ARCHETYPE_COLORS[i % ARCHETYPE_COLORS.length]}`} />
                    {arch} ({count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Clientes por Gasto Total</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">VIP</th>
                <th className="text-right px-4 py-3 font-medium">Ordenes</th>
                <th className="text-right px-4 py-3 font-medium">Total Gastado</th>
                <th className="text-left px-4 py-3 font-medium">Ultima Orden</th>
                <th className="text-left px-6 py-3 font-medium">Arquetipo</th>
              </tr>
            </thead>
            <tbody>
              {clientAnalytics.slice(0, 20).map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.vipTier ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VIP_COLORS[c.vipTier] || VIP_COLORS.standard}`}>
                        {c.vipTier}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-cereus-gold">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.lastOrder
                      ? new Date(c.lastOrder).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-xs">{c.archetype || '—'}</td>
                </tr>
              ))}
              {clientAnalytics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Sin clientes registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: FORECAST
// ============================================================

function ForecastTab({
  pipelineValue, projectedMonthly, materialsAtRisk, capacityUtil, avgMargin,
}: {
  pipelineValue: number;
  projectedMonthly: number;
  materialsAtRisk: Material[];
  capacityUtil: number;
  avgMargin: number;
}) {
  const capacityPct = Math.min(capacityUtil * 100, 100);

  return (
    <div className="space-y-6">
      {/* Forecast KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <DollarSign className="w-4 h-4 text-cereus-gold" />
            Valor del Pipeline
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900">{formatPrice(pipelineValue)}</p>
          <p className="text-xs text-gray-400 mt-1">Ordenes en produccion x margen estimado ({formatPercent(avgMargin)})</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <TrendingUp className="w-4 h-4 text-cereus-gold" />
            Ingreso Mensual Proyectado
          </div>
          <p className="text-2xl font-bold font-mono text-cereus-gold">{formatPrice(projectedMonthly)}</p>
          <p className="text-xs text-gray-400 mt-1">Promedio ultimos 3 meses</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <AlertTriangle className={`w-4 h-4 ${materialsAtRisk.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            Materiales en Riesgo
          </div>
          <p className={`text-2xl font-bold font-mono ${materialsAtRisk.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {materialsAtRisk.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Stock bajo nivel minimo</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <Factory className="w-4 h-4 text-cereus-gold" />
            Uso de Capacidad
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900">{capacityPct.toFixed(0)}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${capacityPct > 90 ? 'bg-red-500' : capacityPct > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Capacidad taller: {WORKSHOP_CAPACITY} ordenes</p>
        </div>
      </div>

      {/* Materials at risk detail */}
      {materialsAtRisk.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Materiales con Stock Critico
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Material</th>
                  <th className="text-left py-2 font-medium">Codigo</th>
                  <th className="text-left py-2 font-medium">Proveedor</th>
                  <th className="text-right py-2 font-medium">Stock Actual</th>
                  <th className="text-right py-2 font-medium">Min. Requerido</th>
                  <th className="text-right py-2 font-medium">Deficit</th>
                </tr>
              </thead>
              <tbody>
                {materialsAtRisk.map(m => {
                  const deficit = (m.min_order_qty || 0) - m.current_stock;
                  return (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 font-medium text-gray-800">{m.name}</td>
                      <td className="py-2.5 text-gray-500 font-mono text-xs">{m.code || '—'}</td>
                      <td className="py-2.5 text-gray-500">{m.supplier || '—'}</td>
                      <td className="py-2.5 text-right font-mono text-red-600">{m.current_stock}</td>
                      <td className="py-2.5 text-right font-mono text-gray-600">{m.min_order_qty}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-red-600">-{deficit.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projection note */}
      <div className="bg-cereus-gold-lighter rounded-xl border border-cereus-gold/20 p-5 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-cereus-gold mt-0.5 flex-shrink-0" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-1">Proyeccion Trimestral</p>
          <p>
            Basado en la tendencia de los ultimos 3 meses, el ingreso proyectado para el proximo trimestre es de{' '}
            <strong className="font-mono text-cereus-gold">{formatPrice(projectedMonthly * 3)}</strong>.
            {materialsAtRisk.length > 0 && (
              <span className="text-red-600">
                {' '}Atencion: hay {materialsAtRisk.length} material{materialsAtRisk.length > 1 ? 'es' : ''} con stock critico que podrian afectar la produccion.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const ARCHETYPE_COLORS = [
  'bg-cereus-gold', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-pink-500',
];
