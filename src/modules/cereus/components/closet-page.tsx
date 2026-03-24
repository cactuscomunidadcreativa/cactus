'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Shirt, Users, Layers, Search,
  Loader2, Package, Calendar, Tag, User,
  LayoutGrid, List,
} from 'lucide-react';

// --------------- Types ---------------

interface Client {
  id: string;
  full_name: string;
  vip_tier: string;
  email: string | null;
  phone: string | null;
}

interface GarmentImage {
  url: string;
  type: string;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  category?: string;
  images?: GarmentImage[];
  collection_id?: string | null;
}

interface Variant {
  id: string;
  variant_name: string | null;
  color: string | null;
  color_hex: string | null;
  garment: Garment | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  current_stage: string | null;
  delivered_at: string | null;
  actual_delivery: string | null;
  created_at: string;
  pattern_data: Record<string, unknown> | null;
  client: { id: string; full_name: string; vip_tier: string } | null;
  variant: Variant | null;
}

interface Collection {
  id: string;
  name: string;
  code: string | null;
}

// --------------- Helpers ---------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getDeliveryDate(order: Order): string {
  return order.delivered_at || order.actual_delivery || order.created_at;
}

function getGarmentThumb(garment: Garment | null | undefined): string | null {
  if (!garment?.images || !Array.isArray(garment.images) || garment.images.length === 0) return null;
  const front = garment.images.find((img) => img.type === 'front');
  return front?.url || garment.images[0]?.url || null;
}

function getSizeLabels(patternData: Record<string, unknown> | null): string[] {
  if (!patternData) return [];
  const grid = patternData.measurement_grids || patternData.measurementGrids || patternData.sizes;
  if (!grid) return [];
  if (Array.isArray(grid)) {
    return grid.map((g: { size?: string; label?: string }) => g.size || g.label || '').filter(Boolean);
  }
  if (typeof grid === 'object') {
    return Object.keys(grid as Record<string, unknown>);
  }
  return [];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  dress: { label: 'Vestido', color: 'bg-pink-100 text-pink-700' },
  top: { label: 'Top', color: 'bg-blue-100 text-blue-700' },
  bottom: { label: 'Falda/Pantalon', color: 'bg-indigo-100 text-indigo-700' },
  jacket: { label: 'Chaqueta', color: 'bg-amber-100 text-amber-700' },
  coat: { label: 'Abrigo', color: 'bg-emerald-100 text-emerald-700' },
  suit: { label: 'Traje', color: 'bg-purple-100 text-purple-700' },
  blouse: { label: 'Blusa', color: 'bg-rose-100 text-rose-700' },
  skirt: { label: 'Falda', color: 'bg-violet-100 text-violet-700' },
  pants: { label: 'Pantalon', color: 'bg-cyan-100 text-cyan-700' },
  jumpsuit: { label: 'Jumpsuit', color: 'bg-teal-100 text-teal-700' },
  cape: { label: 'Capa', color: 'bg-orange-100 text-orange-700' },
  accessory: { label: 'Accesorio', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Otro', color: 'bg-gray-100 text-gray-600' },
};

function getCategoryConfig(cat: string | undefined) {
  if (!cat) return CATEGORY_LABELS.other;
  return CATEGORY_LABELS[cat] || { label: cat, color: 'bg-gray-100 text-gray-600' };
}

// --------------- Sub-components ---------------

function PieceCard({
  order,
  showClient,
}: {
  order: Order;
  showClient?: boolean;
}) {
  const garment = order.variant?.garment;
  const thumb = getGarmentThumb(garment);
  const category = getCategoryConfig(garment?.category);
  const sizes = getSizeLabels(order.pattern_data);
  const colorHex = order.variant?.color_hex;
  const colorName = order.variant?.color || order.variant?.variant_name;

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-cereus-gold/30 transition-all">
      {/* Thumbnail */}
      <div className="aspect-[4/5] bg-muted/30 relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={garment?.name || 'Pieza'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        {/* Category badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${category.color}`}>
          {category.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h4 className="text-sm font-semibold truncate">{garment?.name || 'Pieza sin nombre'}</h4>

        {showClient && order.client && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{order.client.full_name}</span>
          </div>
        )}

        {/* Color swatch + name */}
        {(colorHex || colorName) && (
          <div className="flex items-center gap-1.5">
            {colorHex && (
              <span
                className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                style={{ backgroundColor: colorHex }}
              />
            )}
            {colorName && <span className="text-xs text-muted-foreground truncate">{colorName}</span>}
          </div>
        )}

        {/* Delivery date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(getDeliveryDate(order))}</span>
        </div>

        {/* Size tags */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground mr-0.5">Tallas:</span>
            {sizes.map((s) => (
              <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- Main Component ---------------

export function ClosetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);

  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // UI
  const [view, setView] = useState<'por_cliente' | 'todas'>('por_cliente');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --------------- Data Fetching ---------------

  useEffect(() => {
    fetchMaison();
  }, []);

  useEffect(() => {
    if (maisonId) {
      fetchOrders();
      fetchClients();
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
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ }
  }

  async function fetchClients() {
    try {
      const res = await fetch(`/api/cereus/clients?maisonId=${maisonId}`);
      const data = await res.json();
      setClients(data.clients || []);
    } catch { /* ignore */ }
  }

  async function fetchCollections() {
    try {
      const res = await fetch(`/api/cereus/collections?maisonId=${maisonId}`);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch { /* ignore */ }
  }

  // --------------- Derived Data ---------------

  const deliveredOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'delivered' || o.current_stage === 'entregado'
    );
  }, [orders]);

  // Clients who have delivered orders
  const clientsWithCloset = useMemo(() => {
    const clientIds = new Set(deliveredOrders.map((o) => o.client?.id).filter(Boolean));
    return clients.filter((c) => clientIds.has(c.id));
  }, [clients, deliveredOrders]);

  // Collection lookup
  const collectionMap = useMemo(() => {
    const map: Record<string, Collection> = {};
    for (const col of collections) map[col.id] = col;
    return map;
  }, [collections]);

  // Unique collections represented
  const uniqueCollectionCount = useMemo(() => {
    const colIds = new Set<string>();
    for (const o of deliveredOrders) {
      const colId = o.variant?.garment?.collection_id;
      if (colId) colIds.add(colId);
    }
    return colIds.size;
  }, [deliveredOrders]);

  // Auto-select first client
  useEffect(() => {
    if (view === 'por_cliente' && !selectedClientId && clientsWithCloset.length > 0) {
      setSelectedClientId(clientsWithCloset[0].id);
    }
  }, [clientsWithCloset, view, selectedClientId]);

  // Orders for the selected client
  const selectedClientOrders = useMemo(() => {
    if (!selectedClientId) return [];
    return deliveredOrders.filter((o) => o.client?.id === selectedClientId);
  }, [deliveredOrders, selectedClientId]);

  // "Todas las Piezas" view: filtered and grouped by collection
  const allPiecesFiltered = useMemo(() => {
    if (!searchQuery.trim()) return deliveredOrders;
    const q = searchQuery.toLowerCase();
    return deliveredOrders.filter((o) => {
      const garmentName = o.variant?.garment?.name?.toLowerCase() || '';
      const clientName = o.client?.full_name?.toLowerCase() || '';
      const variantName = o.variant?.variant_name?.toLowerCase() || '';
      return garmentName.includes(q) || clientName.includes(q) || variantName.includes(q);
    });
  }, [deliveredOrders, searchQuery]);

  const groupedByCollection = useMemo(() => {
    const groups: { collection: Collection | null; orders: Order[] }[] = [];
    const collectionGroups: Record<string, Order[]> = {};
    const noCollection: Order[] = [];

    for (const o of allPiecesFiltered) {
      const colId = o.variant?.garment?.collection_id;
      if (colId) {
        if (!collectionGroups[colId]) collectionGroups[colId] = [];
        collectionGroups[colId].push(o);
      } else {
        noCollection.push(o);
      }
    }

    for (const [colId, colOrders] of Object.entries(collectionGroups)) {
      groups.push({ collection: collectionMap[colId] || { id: colId, name: 'Coleccion desconocida', code: null }, orders: colOrders });
    }

    if (noCollection.length > 0) {
      groups.push({ collection: null, orders: noCollection });
    }

    return groups;
  }, [allPiecesFiltered, collectionMap]);

  // --------------- Loading ---------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  // --------------- Empty state ---------------

  if (deliveredOrders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <Header />
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Shirt className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">El armario digital esta vacio</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Las piezas apareceran aqui cuando las ordenes sean entregadas desde Produccion.
          </p>
          <Link
            href="/apps/cereus/production"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
          >
            <Package className="w-4 h-4" />
            Ir a Produccion
          </Link>
        </div>
      </div>
    );
  }

  // --------------- Main Render ---------------

  return (
    <div className="max-w-7xl mx-auto">
      <Header />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Package} label="Piezas entregadas" value={deliveredOrders.length} />
        <StatCard icon={Users} label="Clientes con armario" value={clientsWithCloset.length} />
        <StatCard icon={Layers} label="Colecciones representadas" value={uniqueCollectionCount} />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('por_cliente')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'por_cliente'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-4 h-4" />
          Por Cliente
        </button>
        <button
          onClick={() => setView('todas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'todas'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Todas las Piezas
        </button>
      </div>

      {/* Views */}
      {view === 'por_cliente' ? (
        <ByClientView
          clientsWithCloset={clientsWithCloset}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          selectedClientOrders={selectedClientOrders}
          deliveredOrders={deliveredOrders}
        />
      ) : (
        <AllPiecesView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          groupedByCollection={groupedByCollection}
          allPiecesFiltered={allPiecesFiltered}
        />
      )}
    </div>
  );
}

// --------------- Header ---------------

function Header() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-display font-bold">Armario Digital</h1>
        <p className="text-sm text-muted-foreground">Piezas entregadas por cliente</p>
      </div>
    </div>
  );
}

// --------------- Stat Card ---------------

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-cereus-gold/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-cereus-gold" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// --------------- View: Por Cliente ---------------

function ByClientView({
  clientsWithCloset,
  selectedClientId,
  setSelectedClientId,
  selectedClientOrders,
  deliveredOrders,
}: {
  clientsWithCloset: Client[];
  selectedClientId: string | null;
  setSelectedClientId: (id: string) => void;
  selectedClientOrders: Order[];
  deliveredOrders: Order[];
}) {
  const selectedClient = clientsWithCloset.find((c) => c.id === selectedClientId);

  // Count per client
  const countMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of deliveredOrders) {
      const cid = o.client?.id;
      if (cid) m[cid] = (m[cid] || 0) + 1;
    }
    return m;
  }, [deliveredOrders]);

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clientes</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {clientsWithCloset.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                  selectedClientId === client.id
                    ? 'bg-cereus-gold/10 border-l-2 border-l-cereus-gold'
                    : 'hover:bg-muted/50'
                }`}
              >
                <p className="text-sm font-medium truncate">{client.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {countMap[client.id] || 0} {(countMap[client.id] || 0) === 1 ? 'pieza' : 'piezas'}
                </p>
                {client.vip_tier && client.vip_tier !== 'standard' && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-cereus-gold/20 text-cereus-gold font-medium uppercase">
                    {client.vip_tier}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {selectedClient ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold">{selectedClient.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedClientOrders.length} {selectedClientOrders.length === 1 ? 'pieza' : 'piezas'} en armario
                </p>
              </div>
            </div>

            {selectedClientOrders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Shirt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Armario vacio</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedClientOrders.map((order) => (
                  <PieceCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Selecciona un cliente para ver su armario</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- View: Todas las Piezas ---------------

function AllPiecesView({
  searchQuery,
  setSearchQuery,
  groupedByCollection,
  allPiecesFiltered,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  groupedByCollection: { collection: Collection | null; orders: Order[] }[];
  allPiecesFiltered: Order[];
}) {
  return (
    <div>
      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre de pieza o cliente..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/30 focus:border-cereus-gold/50 transition-all"
        />
      </div>

      {allPiecesFiltered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Search className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No se encontraron piezas con ese criterio</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCollection.map((group, idx) => (
            <div key={group.collection?.id || `no-col-${idx}`}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-cereus-gold" />
                <h3 className="text-sm font-semibold">
                  {group.collection
                    ? `${group.collection.name}${group.collection.code ? ` (${group.collection.code})` : ''}`
                    : 'Sin coleccion'}
                </h3>
                <span className="text-xs text-muted-foreground ml-1">
                  {group.orders.length} {group.orders.length === 1 ? 'pieza' : 'piezas'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {group.orders.map((order) => (
                  <PieceCard key={order.id} order={order} showClient />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
