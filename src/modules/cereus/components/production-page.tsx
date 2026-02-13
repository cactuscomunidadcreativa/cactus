'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Save, Loader2, X, Factory,
  Package, Clock, CheckCircle2, AlertTriangle,
  MapPin, Phone, Wrench,
} from 'lucide-react';

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
  priority: string;
  total_price: number;
  final_amount: number;
  payment_status: string;
  estimated_delivery: string | null;
  client: { id: string; full_name: string; vip_tier: string } | null;
  variant: { id: string; variant_name: string | null; garment: { id: string; name: string; code: string | null } | null } | null;
  workshop: { id: string; name: string } | null;
  created_at: string;
}

const PRODUCTION_STAGES = ['pattern', 'cutting', 'sewing', 'embroidery', 'finishing', 'pressing', 'quality_check', 'packaging'];
const ORDER_STATUSES = ['pending', 'confirmed', 'cutting', 'sewing', 'finishing', 'quality_check', 'ready', 'delivered', 'cancelled'];
const PRIORITIES = ['normal', 'high', 'rush', 'vip'];
const SPECIALTIES = ['tailoring', 'embroidery', 'leather', 'couture_finish', 'beading', 'draping', 'quilting'];

export function CereusProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'workshops'>('orders');
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [wsForm, setWsForm] = useState({
    name: '', code: '', location: '', city: '', country: 'MX',
    contact_name: '', contact_phone: '', contact_email: '',
    specialties: [] as string[], capacity_monthly: '', labor_rate_hourly: '', currency: 'MXN',
  });

  useEffect(() => { fetchMaison(); }, []);
  useEffect(() => { if (maisonId) { fetchOrders(); fetchWorkshops(); } }, [maisonId]);

  async function fetchMaison() {
    const res = await fetch('/api/cereus/maison');
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    if (!data.hasAccess) { router.push('/apps/cereus'); return; }
    setMaisonId(data.maison.id);
    setLoading(false);
  }

  async function fetchOrders() {
    const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
    const data = await res.json();
    setOrders(data.orders || []);
  }

  async function fetchWorkshops() {
    const res = await fetch(`/api/cereus/workshops?maisonId=${maisonId}`);
    const data = await res.json();
    setWorkshops(data.workshops || []);
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
      setWsForm({ name: '', code: '', location: '', city: '', country: 'MX', contact_name: '', contact_phone: '', contact_email: '', specialties: [], capacity_monthly: '', labor_rate_hourly: '', currency: 'MXN' });
      fetchWorkshops();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleUpdateOrderStatus(orderId: string, status: string) {
    await fetch('/api/cereus/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    });
    fetchOrders();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-cereus-gold" /></div>;
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">Production</h1>
          <p className="text-sm text-muted-foreground">Orders, workshops & tracking</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" /> Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('workshops')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'workshops' ? 'border-cereus-gold text-cereus-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Factory className="w-4 h-4" /> Workshops ({workshops.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Pipeline */}
          {activeOrders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['pending', 'confirmed', 'sewing', 'ready'].map(status => {
                const count = orders.filter(o => o.status === status).length;
                return (
                  <div key={status} className="p-3 bg-card border border-border rounded-lg text-center">
                    <p className="text-2xl font-display font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                );
              })}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                Orders are created from garment variants in the Costing module.
                First create a garment, add materials to its BOM, then create a variant to order.
              </p>
              <Link href="/apps/cereus/costing" className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90 mt-4">
                Go to Costing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        order.priority === 'vip' ? 'bg-cereus-gold/20' :
                        order.priority === 'rush' ? 'bg-red-500/10' :
                        order.priority === 'high' ? 'bg-orange-500/10' :
                        'bg-muted'
                      }`}>
                        <Package className={`w-5 h-5 ${
                          order.priority === 'vip' ? 'text-cereus-gold' :
                          order.priority === 'rush' ? 'text-red-500' :
                          order.priority === 'high' ? 'text-orange-500' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium font-mono">{order.order_number}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                            order.status === 'pending' ? 'bg-gray-200 text-gray-600' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-cereus-gold/20 text-cereus-gold'
                          }`}>{order.status}</span>
                          {order.priority !== 'normal' && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 uppercase">{order.priority}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {order.client?.full_name} — {order.variant?.garment?.name || order.variant?.variant_name || 'Garment'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono font-semibold">${Number(order.final_amount).toFixed(2)}</p>
                        <p className={`text-xs ${
                          order.payment_status === 'paid' ? 'text-emerald-600' :
                          order.payment_status === 'partial' ? 'text-orange-500' :
                          'text-muted-foreground'
                        }`}>{order.payment_status}</p>
                      </div>
                      {order.estimated_delivery && (
                        <div className="text-right text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(order.estimated_delivery).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="px-2 py-1 text-xs bg-background border border-input rounded text-sm"
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Production stages */}
                  {!['pending', 'delivered', 'cancelled'].includes(order.status) && (
                    <div className="mt-3 flex items-center gap-1">
                      {PRODUCTION_STAGES.map((stage, i) => {
                        const currentIdx = order.current_stage ? PRODUCTION_STAGES.indexOf(order.current_stage) : -1;
                        const isCompleted = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div
                            key={stage}
                            className={`flex-1 h-2 rounded-full ${
                              isCompleted ? 'bg-emerald-500' :
                              isCurrent ? 'bg-cereus-gold' :
                              'bg-muted'
                            }`}
                            title={stage.replace('_', ' ')}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKSHOPS TAB */}
      {activeTab === 'workshops' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowWorkshopForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90"
            >
              <Plus className="w-4 h-4" /> Add Workshop
            </button>
          </div>

          {showWorkshopForm && (
            <form onSubmit={handleCreateWorkshop} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Factory className="w-5 h-5 text-cereus-gold" /> New Workshop</h3>
                <button type="button" onClick={() => setShowWorkshopForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name *</label>
                  <input type="text" required value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} placeholder="Taller Polanco" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Code</label>
                  <input type="text" value={wsForm.code} onChange={(e) => setWsForm({ ...wsForm, code: e.target.value })} placeholder="WS-CDMX-01" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input type="text" value={wsForm.city} onChange={(e) => setWsForm({ ...wsForm, city: e.target.value })} placeholder="CDMX" className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Contact Name</label>
                  <input type="text" value={wsForm.contact_name} onChange={(e) => setWsForm({ ...wsForm, contact_name: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Contact Phone</label>
                  <input type="tel" value={wsForm.contact_phone} onChange={(e) => setWsForm({ ...wsForm, contact_phone: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Labor Rate ($/hr)</label>
                  <input type="number" step="0.01" value={wsForm.labor_rate_hourly} onChange={(e) => setWsForm({ ...wsForm, labor_rate_hourly: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Capacity (pieces/month)</label>
                  <input type="number" value={wsForm.capacity_monthly} onChange={(e) => setWsForm({ ...wsForm, capacity_monthly: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Specialties</label>
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
                <button type="button" onClick={() => setShowWorkshopForm(false)} className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </form>
          )}

          {workshops.length === 0 && !showWorkshopForm ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Factory className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No workshops yet</h3>
              <p className="text-muted-foreground mb-6">Add your production workshops and ateliers.</p>
              <button onClick={() => setShowWorkshopForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90">
                <Plus className="w-4 h-4" /> Add First Workshop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workshops.map(ws => (
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
                    <Factory className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  {ws.contact_name && (
                    <p className="text-sm">{ws.contact_name} {ws.contact_phone && <span className="text-muted-foreground">· {ws.contact_phone}</span>}</p>
                  )}
                  {ws.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ws.specialties.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-muted">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {ws.labor_rate_hourly && <span>${Number(ws.labor_rate_hourly).toFixed(0)}/hr ({ws.currency})</span>}
                    {ws.capacity_monthly && <span>{ws.capacity_monthly} pieces/mo</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
