'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Save, Loader2, X, Factory,
  Package, Clock, CheckCircle2, AlertTriangle,
  MapPin, Phone, Wrench, FileText, ChevronDown,
  ChevronUp, Filter, MessageSquare, AlertCircle,
  Scissors, Shirt, Sparkles, Shield, Wind, Archive,
  Truck, PenTool, Eye, EyeOff, Search,
} from 'lucide-react';

// --------------- Types ---------------

interface Workshop {
  id: string;
  name: string;
  code: string | null;
  location: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  specialties: string[];
  capacity_monthly: number | null;
  labor_rate_hourly: number | null;
  currency: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  current_stage: string | null;
  stage_started_at: string | null;
  priority: string;
  total_price: number;
  final_amount: number;
  payment_status: string;
  estimated_delivery: string | null;
  pattern_data: Record<string, unknown> | null;
  internal_notes: string | null;
  client: { id: string; full_name: string; vip_tier: string } | null;
  variant: { id: string; variant_name: string | null; garment: { id: string; name: string; code: string | null } | null } | null;
  workshop: { id: string; name: string } | null;
  collection_id: string | null;
  created_at: string;
}

interface WorkshopNote {
  id: string;
  order_id: string;
  workshop_id: string | null;
  type: string;
  content: string;
  is_critical: boolean;
  resolved: boolean;
  resolved_at: string | null;
  resolution_text: string | null;
  photos: string[];
  created_at: string;
  order: { id: string; order_number: string; variant: { id: string; variant_name: string | null; garment: { id: string; name: string } | null } | null } | null;
  workshop: { id: string; name: string } | null;
}

interface ProductionLog {
  id: string;
  order_id: string;
  stage: string | null;
  type: string;
  title: string | null;
  content: string | null;
  hours: number | null;
  photos: string[];
  created_at: string;
}

// --------------- Constants ---------------

const PRODUCTION_STAGES = [
  'patron', 'corte', 'costura', 'acabados', 'calidad', 'planchado', 'empaque', 'entregado',
] as const;

type ProductionStage = typeof PRODUCTION_STAGES[number];

const STAGE_CONFIG: Record<ProductionStage, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  patron:    { label: 'Patron',    color: 'text-blue-500',    bg: 'bg-blue-500',    icon: PenTool },
  corte:     { label: 'Corte',     color: 'text-amber-500',   bg: 'bg-amber-500',   icon: Scissors },
  costura:   { label: 'Costura',   color: 'text-purple-500',  bg: 'bg-purple-500',  icon: Shirt },
  acabados:  { label: 'Acabados',  color: 'text-pink-500',    bg: 'bg-pink-500',    icon: Sparkles },
  calidad:   { label: 'Calidad',   color: 'text-emerald-500', bg: 'bg-emerald-500', icon: Shield },
  planchado: { label: 'Planchado', color: 'text-sky-500',     bg: 'bg-sky-500',     icon: Wind },
  empaque:   { label: 'Empaque',   color: 'text-indigo-500',  bg: 'bg-indigo-500',  icon: Archive },
  entregado: { label: 'Entregado', color: 'text-green-600',   bg: 'bg-green-600',   icon: Truck },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
  alta:    { label: 'Alta',    color: 'text-amber-600', bg: 'bg-amber-100' },
  normal:  { label: 'Normal',  color: 'text-blue-600', bg: 'bg-blue-100' },
  baja:    { label: 'Baja',    color: 'text-gray-500', bg: 'bg-gray-100' },
  // Map existing English values
  rush:    { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
  high:    { label: 'Alta',    color: 'text-amber-600', bg: 'bg-amber-100' },
  vip:     { label: 'VIP',     color: 'text-cereus-gold', bg: 'bg-cereus-gold/20' },
};

const NOTE_TYPES = [
  { value: 'observacion', label: 'Observacion', color: 'bg-blue-100 text-blue-700' },
  { value: 'retraso', label: 'Retraso', color: 'bg-amber-100 text-amber-700' },
  { value: 'problema', label: 'Problema', color: 'bg-red-100 text-red-700' },
  { value: 'calidad', label: 'Calidad', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'retrabajo', label: 'Retrabajo', color: 'bg-orange-100 text-orange-700' },
  { value: 'material', label: 'Material', color: 'bg-purple-100 text-purple-700' },
  { value: 'medida', label: 'Medida', color: 'bg-pink-100 text-pink-700' },
];

const SPECIALTIES = ['tailoring', 'embroidery', 'leather', 'couture_finish', 'beading', 'draping', 'quilting'];

// --------------- Helpers ---------------

function daysInStage(stageStartedAt: string | null): number {
  if (!stageStartedAt) return 0;
  const diff = Date.now() - new Date(stageStartedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getNoteTypeConfig(type: string) {
  return NOTE_TYPES.find(t => t.value === type) || { value: type, label: type, color: 'bg-gray-100 text-gray-700' };
}

function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
}

// --------------- Main Component ---------------

export function CereusProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'notas' | 'talleres'>('pipeline');
  const [error, setError] = useState<string | null>(null);

  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [notes, setNotes] = useState<WorkshopNote[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);

  // UI state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pipeline filters
  const [pipelineCollectionFilter, setPipelineCollectionFilter] = useState<string>('');
  const [pipelineWorkshopFilter, setPipelineWorkshopFilter] = useState<string>('');
  const [pipelinePriorityFilter, setPipelinePriorityFilter] = useState<string>('');

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    orderId: '', workshopId: '', type: 'observacion', content: '', is_critical: false,
  });
  const [noteFilterOrder, setNoteFilterOrder] = useState('');
  const [noteFilterWorkshop, setNoteFilterWorkshop] = useState('');
  const [noteFilterType, setNoteFilterType] = useState('');
  const [noteFilterUnresolved, setNoteFilterUnresolved] = useState(false);
  const [resolvingNoteId, setResolvingNoteId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Workshop state
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [wsForm, setWsForm] = useState({
    name: '', code: '', location: '', city: '', country: 'MX',
    contact_name: '', contact_phone: '', contact_email: '',
    specialties: [] as string[], capacity_monthly: '', labor_rate_hourly: '', currency: 'USD',
  });

  // --------------- Data Fetching ---------------

  useEffect(() => { fetchMaison(); }, []);
  useEffect(() => {
    if (maisonId) {
      fetchOrders();
      fetchWorkshops();
      fetchNotes();
    }
  }, [maisonId]);

  async function fetchMaison() {
    try {
      const res = await fetch('/api/cereus/maison');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (!data.hasAccess) { router.push('/apps/cereus'); return; }
      setMaisonId(data.maison.id);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ }
  }

  async function fetchWorkshops() {
    try {
      const res = await fetch(`/api/cereus/workshops?maisonId=${maisonId}`);
      const data = await res.json();
      setWorkshops(data.workshops || []);
    } catch { /* ignore */ }
  }

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/cereus/production/notes?maisonId=${maisonId}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch { /* ignore */ }
  }

  async function fetchLogsForOrder(orderId: string) {
    try {
      const res = await fetch(`/api/cereus/production/logs?maisonId=${maisonId}&orderId=${orderId}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch { /* ignore */ }
  }

  // --------------- Actions ---------------

  const handleMoveStage = useCallback(async (orderId: string, newStage: string) => {
    setSaving(true);
    try {
      await fetch('/api/cereus/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          current_stage: newStage,
          stage_started_at: new Date().toISOString(),
          status: newStage === 'entregado' ? 'delivered' : 'confirmed',
        }),
      });
      // Log the stage change
      await fetch('/api/cereus/production/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          orderId,
          stage: newStage,
          type: 'stage_change',
          title: `Movido a ${STAGE_CONFIG[newStage as ProductionStage]?.label || newStage}`,
        }),
      });
      await fetchOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al mover etapa');
    } finally {
      setSaving(false);
    }
  }, [maisonId]);

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/production/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          orderId: noteForm.orderId,
          workshopId: noteForm.workshopId || undefined,
          type: noteForm.type,
          content: noteForm.content,
          is_critical: noteForm.is_critical,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowNoteForm(false);
      setNoteForm({ orderId: '', workshopId: '', type: 'observacion', content: '', is_critical: false });
      fetchNotes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleResolveNote(noteId: string) {
    setSaving(true);
    try {
      await fetch('/api/cereus/production/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          resolved: true,
          resolution_text: resolutionText,
        }),
      });
      setResolvingNoteId(null);
      setResolutionText('');
      fetchNotes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateWorkshop(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/cereus/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: wsForm.name,
          code: wsForm.code || undefined,
          location: wsForm.location || undefined,
          city: wsForm.city || undefined,
          country: wsForm.country,
          contact_name: wsForm.contact_name || undefined,
          contact_phone: wsForm.contact_phone || undefined,
          contact_email: wsForm.contact_email || undefined,
          specialties: wsForm.specialties,
          capacity_monthly: wsForm.capacity_monthly ? parseInt(wsForm.capacity_monthly) : undefined,
          labor_rate_hourly: wsForm.labor_rate_hourly ? parseFloat(wsForm.labor_rate_hourly) : undefined,
          currency: wsForm.currency,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      setShowWorkshopForm(false);
      setWsForm({ name: '', code: '', location: '', city: '', country: 'MX', contact_name: '', contact_phone: '', contact_email: '', specialties: [], capacity_monthly: '', labor_rate_hourly: '', currency: 'USD' });
      fetchWorkshops();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  // --------------- Filtered Data ---------------

  const pipelineOrders = useMemo(() => {
    return orders.filter(o => {
      if (['cancelled'].includes(o.status)) return false;
      if (pipelineCollectionFilter && o.collection_id !== pipelineCollectionFilter) return false;
      if (pipelineWorkshopFilter && o.workshop?.id !== pipelineWorkshopFilter) return false;
      if (pipelinePriorityFilter && o.priority !== pipelinePriorityFilter) return false;
      return true;
    });
  }, [orders, pipelineCollectionFilter, pipelineWorkshopFilter, pipelinePriorityFilter]);

  const ordersByStage = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const stage of PRODUCTION_STAGES) {
      map[stage] = [];
    }
    for (const order of pipelineOrders) {
      const stage = order.current_stage as ProductionStage;
      if (stage && map[stage]) {
        map[stage].push(order);
      } else {
        // Orders without a stage or with unknown stage go to patron
        map['patron'].push(order);
      }
    }
    return map;
  }, [pipelineOrders]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (noteFilterOrder && n.order_id !== noteFilterOrder) return false;
      if (noteFilterWorkshop && n.workshop_id !== noteFilterWorkshop) return false;
      if (noteFilterType && n.type !== noteFilterType) return false;
      if (noteFilterUnresolved && n.resolved) return false;
      return true;
    });
  }, [notes, noteFilterOrder, noteFilterWorkshop, noteFilterType, noteFilterUnresolved]);

  const workshopOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      if (o.workshop?.id && !['delivered', 'cancelled'].includes(o.status)) {
        counts[o.workshop.id] = (counts[o.workshop.id] || 0) + 1;
      }
    }
    return counts;
  }, [orders]);

  // --------------- Loading State ---------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  // --------------- Render ---------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">Produccion</h1>
          <p className="text-sm text-muted-foreground">Pipeline, notas del taller y seguimiento</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pipeline' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" /> Pipeline de Produccion
        </button>
        <button
          onClick={() => setActiveTab('notas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'notas' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Notas del Taller ({notes.filter(n => !n.resolved).length})
        </button>
        <button
          onClick={() => setActiveTab('talleres')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'talleres' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Factory className="w-4 h-4" /> Talleres ({workshops.length})
        </button>
      </div>

      {/* ============================================ */}
      {/* TAB 1: PIPELINE DE PRODUCCION               */}
      {/* ============================================ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={pipelineWorkshopFilter}
              onChange={(e) => setPipelineWorkshopFilter(e.target.value)}
              className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
            >
              <option value="">Todos los talleres</option>
              {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select
              value={pipelinePriorityFilter}
              onChange={(e) => setPipelinePriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
            >
              <option value="">Toda prioridad</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baja">Baja</option>
              <option value="rush">Rush</option>
              <option value="vip">VIP</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">
              {pipelineOrders.length} ordenes activas
            </span>
          </div>

          {/* Kanban Board */}
          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin ordenes aun</h3>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                Las ordenes se crean desde variantes de prendas en el modulo de Costeo.
              </p>
              <Link href="/apps/cereus/costing" className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90 mt-4">
                Ir a Costeo
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-3 min-w-[1200px]">
                {PRODUCTION_STAGES.map(stage => {
                  const config = STAGE_CONFIG[stage];
                  const stageOrders = ordersByStage[stage] || [];
                  const StageIcon = config.icon;
                  return (
                    <div key={stage} className="flex-1 min-w-[180px]">
                      {/* Column Header */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-2 border-border bg-card`}
                        style={{ borderBottomColor: `var(--tw-${config.bg.replace('bg-', '')})` }}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}/15`}>
                          <StageIcon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
                        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${config.bg}/20 ${config.color}`}>
                          {stageOrders.length}
                        </span>
                      </div>

                      {/* Column Body */}
                      <div className="space-y-2 p-2 bg-muted/30 rounded-b-lg border border-t-0 border-border min-h-[200px]">
                        {stageOrders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            stage={stage}
                            expanded={expandedOrderId === order.id}
                            onToggleExpand={() => {
                              if (expandedOrderId === order.id) {
                                setExpandedOrderId(null);
                              } else {
                                setExpandedOrderId(order.id);
                                fetchLogsForOrder(order.id);
                              }
                            }}
                            onMoveStage={handleMoveStage}
                            logs={expandedOrderId === order.id ? logs : []}
                            notes={notes.filter(n => n.order_id === order.id && !n.resolved)}
                            saving={saving}
                          />
                        ))}
                        {stageOrders.length === 0 && (
                          <div className="text-center py-8 text-xs text-muted-foreground">
                            Sin ordenes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB 2: NOTAS DEL TALLER                     */}
      {/* ============================================ */}
      {activeTab === 'notas' && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={noteFilterOrder}
                onChange={(e) => setNoteFilterOrder(e.target.value)}
                className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
              >
                <option value="">Todas las ordenes</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} - {o.variant?.garment?.name || o.variant?.variant_name || 'Prenda'}
                  </option>
                ))}
              </select>
              <select
                value={noteFilterWorkshop}
                onChange={(e) => setNoteFilterWorkshop(e.target.value)}
                className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
              >
                <option value="">Todos los talleres</option>
                {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select
                value={noteFilterType}
                onChange={(e) => setNoteFilterType(e.target.value)}
                className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
              >
                <option value="">Todos los tipos</option>
                {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button
                onClick={() => setNoteFilterUnresolved(!noteFilterUnresolved)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  noteFilterUnresolved
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-background border-input text-muted-foreground hover:text-foreground'
                }`}
              >
                {noteFilterUnresolved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                Solo pendientes
              </button>
            </div>
            <button
              onClick={() => setShowNoteForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90"
            >
              <Plus className="w-4 h-4" /> Nueva Nota
            </button>
          </div>

          {/* Note Form */}
          {showNoteForm && (
            <form onSubmit={handleCreateNote} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cereus-gold" /> Nueva Nota del Taller
                </h3>
                <button type="button" onClick={() => setShowNoteForm(false)} className="p-1 hover:bg-muted rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Orden *</label>
                  <select
                    required
                    value={noteForm.orderId}
                    onChange={(e) => setNoteForm({ ...noteForm, orderId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                  >
                    <option value="">Seleccionar orden...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} - {o.variant?.garment?.name || 'Prenda'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Taller</label>
                  <select
                    value={noteForm.workshopId}
                    onChange={(e) => setNoteForm({ ...noteForm, workshopId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                  >
                    <option value="">Sin taller</option>
                    {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tipo *</label>
                  <select
                    required
                    value={noteForm.type}
                    onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                  >
                    {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Contenido *</label>
                <textarea
                  required
                  rows={3}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Describe la observacion, problema o nota..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noteForm.is_critical}
                    onChange={(e) => setNoteForm({ ...noteForm, is_critical: e.target.checked })}
                    className="w-4 h-4 rounded border-input text-red-600 accent-red-600"
                  />
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Marcar como critica
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowNoteForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin notas</h3>
              <p className="text-muted-foreground">
                {notes.length === 0
                  ? 'Agrega notas del taller para dar seguimiento a observaciones y problemas.'
                  : 'No hay notas que coincidan con los filtros actuales.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => {
                const typeConf = getNoteTypeConfig(note.type);
                return (
                  <div
                    key={note.id}
                    className={`bg-card border rounded-xl p-4 space-y-2 ${
                      note.is_critical && !note.resolved ? 'border-red-300 bg-red-50/50' : 'border-border'
                    } ${note.resolved ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                        {note.is_critical && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Critica
                          </span>
                        )}
                        {note.resolved && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resuelta
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {note.order?.order_number}
                        </span>
                        {note.order?.variant?.garment?.name && (
                          <span className="text-xs text-muted-foreground">
                            — {note.order.variant.garment.name}
                          </span>
                        )}
                        {note.workshop && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Factory className="w-3 h-3" /> {note.workshop.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(note.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>

                    {note.resolved && note.resolution_text && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-800">
                        <span className="font-medium">Resolucion:</span> {note.resolution_text}
                      </div>
                    )}

                    {!note.resolved && (
                      <>
                        {resolvingNoteId === note.id ? (
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium mb-1">Texto de resolucion</label>
                              <input
                                type="text"
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                placeholder="Describe como se resolvio..."
                                className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-sm"
                              />
                            </div>
                            <button
                              onClick={() => handleResolveNote(note.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolver'}
                            </button>
                            <button
                              onClick={() => { setResolvingNoteId(null); setResolutionText(''); }}
                              className="px-3 py-1.5 border border-input rounded-lg text-sm hover:bg-muted"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingNoteId(note.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como resuelta
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB 3: TALLERES                              */}
      {/* ============================================ */}
      {activeTab === 'talleres' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowWorkshopForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90"
            >
              <Plus className="w-4 h-4" /> Agregar Taller
            </button>
          </div>

          {/* Workshop Form */}
          {showWorkshopForm && (
            <form onSubmit={handleCreateWorkshop} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Factory className="w-5 h-5 text-cereus-gold" /> Nuevo Taller
                </h3>
                <button type="button" onClick={() => setShowWorkshopForm(false)} className="p-1 hover:bg-muted rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre *</label>
                  <input type="text" required value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} placeholder="Taller Polanco" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Codigo</label>
                  <input type="text" value={wsForm.code} onChange={(e) => setWsForm({ ...wsForm, code: e.target.value })} placeholder="WS-CDMX-01" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ciudad</label>
                  <input type="text" value={wsForm.city} onChange={(e) => setWsForm({ ...wsForm, city: e.target.value })} placeholder="CDMX" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Contacto</label>
                  <input type="text" value={wsForm.contact_name} onChange={(e) => setWsForm({ ...wsForm, contact_name: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Telefono</label>
                  <input type="tel" value={wsForm.contact_phone} onChange={(e) => setWsForm({ ...wsForm, contact_phone: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tarifa (USD/hr)</label>
                  <input type="number" step="0.01" value={wsForm.labor_rate_hourly} onChange={(e) => setWsForm({ ...wsForm, labor_rate_hourly: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Capacidad (piezas/mes)</label>
                  <input type="number" value={wsForm.capacity_monthly} onChange={(e) => setWsForm({ ...wsForm, capacity_monthly: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Especialidades</label>
                  <div className="flex flex-wrap gap-1">
                    {SPECIALTIES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const specs = wsForm.specialties.includes(s)
                            ? wsForm.specialties.filter(x => x !== s)
                            : [...wsForm.specialties, s];
                          setWsForm({ ...wsForm, specialties: specs });
                        }}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          wsForm.specialties.includes(s)
                            ? 'bg-cereus-gold text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowWorkshopForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                </button>
              </div>
            </form>
          )}

          {/* Workshop List */}
          {workshops.length === 0 && !showWorkshopForm ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Factory className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin talleres aun</h3>
              <p className="text-muted-foreground mb-6">Agrega tus talleres de produccion y ateliers.</p>
              <button onClick={() => setShowWorkshopForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
                <Plus className="w-4 h-4" /> Agregar Primer Taller
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workshops.map(ws => {
                const activeCount = workshopOrderCounts[ws.id] || 0;
                const capacity = ws.capacity_monthly || 0;
                const utilization = capacity > 0 ? Math.min(100, Math.round((activeCount / capacity) * 100)) : 0;
                return (
                  <div key={ws.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{ws.name}</h3>
                          {ws.code && <span className="text-xs text-muted-foreground font-mono">{ws.code}</span>}
                        </div>
                        {ws.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {ws.city}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-display font-bold">{activeCount}</div>
                        <div className="text-xs text-muted-foreground">ordenes activas</div>
                      </div>
                    </div>

                    {ws.contact_name && (
                      <p className="text-sm flex items-center gap-2">
                        {ws.contact_name}
                        {ws.contact_phone && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {ws.contact_phone}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Capacity Utilization Bar */}
                    {capacity > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Utilizacion de capacidad</span>
                          <span className={`font-medium ${
                            utilization >= 90 ? 'text-red-600' :
                            utilization >= 70 ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>{utilization}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilization >= 90 ? 'bg-red-500' :
                              utilization >= 70 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activeCount} / {capacity} piezas al mes
                        </p>
                      </div>
                    )}

                    {/* Specialties */}
                    {ws.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ws.specialties.map(s => (
                          <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-cereus-gold/10 text-cereus-gold border border-cereus-gold/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                      {ws.labor_rate_hourly && <span>${Number(ws.labor_rate_hourly).toFixed(2)}/hr USD</span>}
                      {capacity > 0 && <span>{capacity} piezas/mes</span>}
                    </div>
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

// --------------- OrderCard Sub-component ---------------

interface OrderCardProps {
  order: Order;
  stage: ProductionStage;
  expanded: boolean;
  onToggleExpand: () => void;
  onMoveStage: (orderId: string, newStage: string) => void;
  logs: ProductionLog[];
  notes: WorkshopNote[];
  saving: boolean;
}

function OrderCard({ order, stage, expanded, onToggleExpand, onMoveStage, logs, notes, saving }: OrderCardProps) {
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const priorityConf = getPriorityConfig(order.priority);
  const days = daysInStage(order.stage_started_at);
  const garmentName = order.variant?.garment?.name || order.variant?.variant_name || 'Prenda';
  const clientName = order.client?.full_name || 'Cliente';

  return (
    <div className={`bg-card border rounded-lg shadow-sm transition-shadow hover:shadow-md ${
      order.priority === 'urgente' || order.priority === 'rush' ? 'border-red-200' :
      order.priority === 'vip' ? 'border-cereus-gold/40' : 'border-border'
    }`}>
      {/* Card Header */}
      <div className="p-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
          {order.priority !== 'normal' && (
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold uppercase ${priorityConf.bg} ${priorityConf.color}`}>
              {priorityConf.label}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-tight truncate">{garmentName}</p>
        <p className="text-xs text-muted-foreground truncate">{clientName}</p>
        <div className="flex items-center justify-between mt-2">
          {days > 0 ? (
            <span className={`text-[10px] flex items-center gap-1 ${
              days >= 7 ? 'text-red-500 font-semibold' :
              days >= 3 ? 'text-amber-500' :
              'text-muted-foreground'
            }`}>
              <Clock className="w-3 h-3" /> {days}d en etapa
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hoy
            </span>
          )}
          {notes.length > 0 && (
            <span className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {notes.length}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 text-xs">
          {/* Move to Stage */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMoveMenuOpen(!moveMenuOpen); }}
              disabled={saving}
              className="w-full flex items-center justify-between px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 text-sm"
            >
              <span>Mover a etapa...</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {moveMenuOpen && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {PRODUCTION_STAGES.filter(s => s !== stage).map(s => {
                  const cfg = STAGE_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveStage(order.id, s);
                        setMoveMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm"
                    >
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Garment Info */}
          <div className="space-y-1">
            <p><span className="text-muted-foreground">Prenda:</span> {garmentName}</p>
            <p><span className="text-muted-foreground">Cliente:</span> {clientName}</p>
            {order.workshop && (
              <p><span className="text-muted-foreground">Taller:</span> {order.workshop.name}</p>
            )}
            <p><span className="text-muted-foreground">Monto:</span> ${Number(order.final_amount).toFixed(2)} USD</p>
            {order.estimated_delivery && (
              <p><span className="text-muted-foreground">Entrega est.:</span> {new Date(order.estimated_delivery).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>

          {/* Pattern Data / Pieces */}
          {order.pattern_data && Object.keys(order.pattern_data).length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Piezas del Patron</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(order.pattern_data).map(([key, val]) => (
                  <span key={key} className="px-2 py-0.5 rounded bg-muted text-[10px]">
                    {key}: {String(val)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workshop Notes */}
          {notes.length > 0 && (
            <div>
              <p className="font-medium text-amber-600 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Notas Pendientes ({notes.length})
              </p>
              {notes.map(note => {
                const tc = getNoteTypeConfig(note.type);
                return (
                  <div key={note.id} className={`p-2 rounded border mb-1 ${note.is_critical ? 'border-red-200 bg-red-50/50' : 'border-border'}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${tc.color}`}>{tc.label}</span>
                      {note.is_critical && <AlertCircle className="w-3 h-3 text-red-500" />}
                    </div>
                    <p className="text-[11px]">{note.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Production Logs */}
          {logs.length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Historial de Produccion</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {logs.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-16 shrink-0">
                      {new Date(log.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                    {log.stage && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        STAGE_CONFIG[log.stage as ProductionStage]?.bg || 'bg-gray-200'
                      } text-white`}>
                        {STAGE_CONFIG[log.stage as ProductionStage]?.label || log.stage}
                      </span>
                    )}
                    <span className="text-foreground">{log.title || log.content || log.type}</span>
                    {log.hours && <span className="ml-auto">{log.hours}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {order.internal_notes && (
            <div className="bg-muted/50 rounded p-2">
              <p className="text-muted-foreground font-medium mb-0.5">Notas Internas</p>
              <p className="text-[11px]">{order.internal_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
