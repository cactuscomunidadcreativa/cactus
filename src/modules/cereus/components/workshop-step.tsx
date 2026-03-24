'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  Send,
  Check,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  ChevronLeft,
  Loader2,
  Package,
  Truck,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface WorkshopStepProps {
  maisonId: string;
  collectionId: string;
  collectionName: string;
  onComplete: () => void;
  onBack: () => void;
}

interface Workshop {
  id: string;
  name: string;
  location: string | null;
  specialties: string[];
  capacity_monthly: number | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  category: string;
  base_price: number | null;
  images: string[] | null;
  pattern_data?: unknown;
  pattern_url?: string | null;
  collection_id: string | null;
}

interface PieceOrder {
  garmentId: string;
  included: boolean;
  cantidad: number;
  prioridad: 'normal' | 'alta' | 'urgente';
  fechaEstimada: string;
  artesano: string;
  notas: string;
  alreadySent: boolean;
}

interface NewWorkshopForm {
  name: string;
  location: string;
  specialties: string;
  contact_phone: string;
  contact_email: string;
  capacity_monthly: string;
}

// ============================================================
// Component
// ============================================================

export default function WorkshopStep({
  maisonId,
  collectionId,
  collectionName,
  onComplete,
  onBack,
}: WorkshopStepProps) {
  // Data
  const [garments, setGarments] = useState<Garment[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [existingOrderVariantIds, setExistingOrderVariantIds] = useState<Set<string>>(new Set());
  const [existingOrderGarmentIds, setExistingOrderGarmentIds] = useState<Set<string>>(new Set());

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [pieceOrders, setPieceOrders] = useState<Record<string, PieceOrder>>({});
  const [showNewWorkshopForm, setShowNewWorkshopForm] = useState(false);
  const [savingWorkshop, setSavingWorkshop] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationTotal, setCreationTotal] = useState(0);
  const [success, setSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [newWorkshop, setNewWorkshop] = useState<NewWorkshopForm>({
    name: '',
    location: '',
    specialties: '',
    contact_phone: '',
    contact_email: '',
    capacity_monthly: '',
  });

  // Default delivery date: 4 weeks from now
  const defaultDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // ============================================================
  // Fetch data on mount
  // ============================================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [garmentsRes, workshopsRes, ordersRes] = await Promise.all([
        fetch(`/api/cereus/garments?maisonId=${maisonId}&collectionId=${collectionId}`),
        fetch(`/api/cereus/workshops?maisonId=${maisonId}`),
        fetch(`/api/cereus/orders?maisonId=${maisonId}`),
      ]);

      const garmentsData = await garmentsRes.json();
      const workshopsData = await workshopsRes.json();
      const ordersData = await ordersRes.json();

      const collectionGarments: Garment[] = (garmentsData.garments || []).filter(
        (g: Garment) => g.collection_id === collectionId
      );
      setGarments(collectionGarments);
      setWorkshops(workshopsData.workshops || []);

      // Find garment IDs that already have orders
      const sentGarmentIds = new Set<string>();
      const sentVariantIds = new Set<string>();
      for (const order of ordersData.orders || []) {
        if (order.variant?.garment?.id) {
          sentGarmentIds.add(order.variant.garment.id);
        }
        if (order.variant_id) {
          sentVariantIds.add(order.variant_id);
        }
      }
      setExistingOrderGarmentIds(sentGarmentIds);
      setExistingOrderVariantIds(sentVariantIds);

      // Initialize piece orders
      const initial: Record<string, PieceOrder> = {};
      for (const g of collectionGarments) {
        const alreadySent = sentGarmentIds.has(g.id);
        initial[g.id] = {
          garmentId: g.id,
          included: !alreadySent,
          cantidad: 1,
          prioridad: 'normal',
          fechaEstimada: defaultDate,
          artesano: '',
          notas: '',
          alreadySent,
        };
      }
      setPieceOrders(initial);

      // Auto-select first workshop
      if (workshopsData.workshops?.length > 0) {
        setSelectedWorkshopId(workshopsData.workshops[0].id);
      }
    } catch (err) {
      setError('Error al cargar datos. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [maisonId, collectionId, defaultDate]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maisonId, collectionId]);

  // ============================================================
  // Handlers
  // ============================================================

  const updatePieceOrder = (garmentId: string, updates: Partial<PieceOrder>) => {
    setPieceOrders((prev) => ({
      ...prev,
      [garmentId]: { ...prev[garmentId], ...updates },
    }));
  };

  const handleSaveWorkshop = async () => {
    if (!newWorkshop.name.trim()) return;
    setSavingWorkshop(true);
    setError(null);
    try {
      const res = await fetch('/api/cereus/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          name: newWorkshop.name.trim(),
          location: newWorkshop.location.trim() || null,
          specialties: newWorkshop.specialties
            ? newWorkshop.specialties.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          contact_phone: newWorkshop.contact_phone.trim() || null,
          contact_email: newWorkshop.contact_email.trim() || null,
          capacity_monthly: newWorkshop.capacity_monthly
            ? parseInt(newWorkshop.capacity_monthly)
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear taller');
      setWorkshops((prev) => [...prev, data.workshop]);
      setSelectedWorkshopId(data.workshop.id);
      setShowNewWorkshopForm(false);
      setNewWorkshop({
        name: '',
        location: '',
        specialties: '',
        contact_phone: '',
        contact_email: '',
        capacity_monthly: '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear taller');
    } finally {
      setSavingWorkshop(false);
    }
  };

  // Find or create "Produccion Interna" client
  const getProductionClientId = async (): Promise<string> => {
    // Search for existing internal production client
    const searchRes = await fetch(
      `/api/cereus/clients?maisonId=${maisonId}&search=Produccion Interna&limit=1`
    );
    const searchData = await searchRes.json();
    if (searchData.clients?.length > 0) {
      return searchData.clients[0].id;
    }
    // Create one
    const createRes = await fetch('/api/cereus/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maisonId,
        full_name: 'Produccion Interna',
        email: 'produccion@interno.local',
        phone: '',
        client_type: 'internal',
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || 'Error al crear cliente interno');
    return createData.client.id;
  };

  const handleCreateOrders = async () => {
    if (!selectedWorkshopId) {
      setError('Selecciona un taller primero');
      return;
    }

    const selected = Object.values(pieceOrders).filter((p) => p.included && !p.alreadySent);
    if (selected.length === 0) {
      setError('No hay piezas seleccionadas');
      return;
    }

    setCreating(true);
    setError(null);
    setCreationProgress(0);
    setCreationTotal(selected.length);

    try {
      // Get or create internal production client
      const productionClientId = await getProductionClientId();

      let created = 0;

      for (const piece of selected) {
        const garment = garments.find((g) => g.id === piece.garmentId);
        if (!garment) continue;

        // Step A: Find or create a preset variant for this garment
        let variantId: string | null = null;

        const varRes = await fetch(
          `/api/cereus/variants?garmentId=${garment.id}&preset=true`
        );
        const varData = await varRes.json();
        if (varData.variants?.length > 0) {
          variantId = varData.variants[0].id;
        } else {
          // Create a basic preset variant
          const createVarRes = await fetch('/api/cereus/variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              garmentId: garment.id,
              variantName: garment.name,
            }),
          });
          const createVarData = await createVarRes.json();
          if (!createVarRes.ok) {
            throw new Error(
              createVarData.error || `Error al crear variante para ${garment.name}`
            );
          }
          variantId = createVarData.variant.id;
        }

        if (!variantId) throw new Error(`No se pudo obtener variante para ${garment.name}`);

        // Step B: Create the order (one per unit for tracking)
        const internalNotes = [
          piece.notas,
          `Coleccion: ${collectionName}`,
          piece.cantidad > 1 ? `Cantidad: ${piece.cantidad}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        const orderRes = await fetch('/api/cereus/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maisonId,
            client_id: productionClientId,
            variant_id: variantId,
            workshop_id: selectedWorkshopId,
            total_price: garment.base_price || 0,
            priority: piece.prioridad,
            estimated_delivery: piece.fechaEstimada || null,
            assigned_artisan: piece.artesano || null,
            internal_notes: internalNotes,
            production_notes: `Orden de produccion de coleccion | Cantidad: ${piece.cantidad}`,
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || `Error al crear orden para ${garment.name}`);
        }

        created++;
        setCreationProgress(created);
      }

      setCreatedCount(created);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear ordenes');
    } finally {
      setCreating(false);
    }
  };

  // ============================================================
  // Derived state
  // ============================================================

  const selectedPieces = Object.values(pieceOrders).filter(
    (p) => p.included && !p.alreadySent
  );
  const totalUnits = selectedPieces.reduce((sum, p) => sum + p.cantidad, 0);
  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId);

  // ============================================================
  // Render: Loading
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
        <span className="ml-3 text-muted-foreground">Cargando datos del taller...</span>
      </div>
    );
  }

  // ============================================================
  // Render: Success
  // ============================================================

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Ordenes creadas exitosamente
        </h2>
        <p className="text-muted-foreground">
          Se crearon <span className="font-bold text-foreground">{createdCount}</span> ordenes de
          produccion para la coleccion{' '}
          <span className="font-semibold text-cereus-gold">{collectionName}</span>
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onComplete}
            className="w-full py-3 px-6 bg-cereus-gold text-white font-semibold rounded-lg hover:bg-cereus-gold/90 transition-colors flex items-center justify-center gap-2"
          >
            <Truck className="w-5 h-5" />
            Ver Pipeline de Produccion
          </button>
          <button
            onClick={() => {
              window.location.href = '/apps/cereus';
            }}
            className="w-full py-3 px-6 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Main
  // ============================================================

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Factory className="w-6 h-6 text-cereus-gold" />
            Enviar a Taller
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Coleccion:{' '}
            <span className="font-semibold text-foreground">{collectionName}</span>
            {' · '}
            {garments.length} {garments.length === 1 ? 'pieza' : 'piezas'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* Workshop Selection */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Taller</h3>
          {workshops.length > 0 && !showNewWorkshopForm && (
            <button
              onClick={() => setShowNewWorkshopForm(true)}
              className="text-sm text-cereus-gold hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Nuevo taller
            </button>
          )}
        </div>

        {workshops.length > 0 && !showNewWorkshopForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workshops.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWorkshopId(w.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  selectedWorkshopId === w.id
                    ? 'border-cereus-gold bg-cereus-gold/10 shadow-sm'
                    : 'border-border hover:border-cereus-gold/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Factory className="w-4 h-4 text-cereus-gold" />
                  <span className="font-semibold text-foreground">{w.name}</span>
                </div>
                {w.location && (
                  <p className="text-xs text-muted-foreground">{w.location}</p>
                )}
                {w.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {w.capacity_monthly && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacidad: {w.capacity_monthly}/mes
                  </p>
                )}
                {selectedWorkshopId === w.id && (
                  <Check className="w-4 h-4 text-cereus-gold mt-2" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* New workshop form */}
        {(workshops.length === 0 || showNewWorkshopForm) && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-cereus-gold" />
              Crear Taller
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newWorkshop.name}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Taller de Alta Costura"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Ubicacion
                </label>
                <input
                  type="text"
                  value={newWorkshop.location}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Ciudad de Mexico"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Especialidades (separadas por coma)
                </label>
                <input
                  type="text"
                  value={newWorkshop.specialties}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({ ...prev, specialties: e.target.value }))
                  }
                  placeholder="Sastreria, Bordado, Piel"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Telefono
                </label>
                <input
                  type="text"
                  value={newWorkshop.contact_phone}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({
                      ...prev,
                      contact_phone: e.target.value,
                    }))
                  }
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  type="text"
                  value={newWorkshop.contact_email}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({
                      ...prev,
                      contact_email: e.target.value,
                    }))
                  }
                  placeholder="taller@email.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Capacidad mensual
                </label>
                <input
                  type="number"
                  value={newWorkshop.capacity_monthly}
                  onChange={(e) =>
                    setNewWorkshop((prev) => ({
                      ...prev,
                      capacity_monthly: e.target.value,
                    }))
                  }
                  placeholder="50"
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveWorkshop}
                disabled={!newWorkshop.name.trim() || savingWorkshop}
                className="px-4 py-2 bg-cereus-gold text-white text-sm font-semibold rounded-lg hover:bg-cereus-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingWorkshop ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Guardar Taller
              </button>
              {workshops.length > 0 && (
                <button
                  onClick={() => setShowNewWorkshopForm(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Pieces grid */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Piezas a enviar
        </h3>

        {garments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No hay piezas en esta coleccion</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {garments.map((garment) => {
              const po = pieceOrders[garment.id];
              if (!po) return null;
              const hasPattern = !!(garment.pattern_data || garment.pattern_url);
              const thumbnail =
                garment.images && garment.images.length > 0
                  ? garment.images[0]
                  : null;

              return (
                <div
                  key={garment.id}
                  className={`border rounded-lg p-4 transition-all ${
                    po.alreadySent
                      ? 'border-border bg-muted/30 opacity-70'
                      : po.included
                      ? 'border-cereus-gold/50 bg-cereus-gold/5'
                      : 'border-border'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Thumbnail */}
                    {thumbnail ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnail}
                          alt={garment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {garment.name}
                        </h4>
                        {po.alreadySent && (
                          <span className="shrink-0 text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                            Ya enviado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {garment.category}
                        {garment.code ? ` · ${garment.code}` : ''}
                      </p>
                      <div className="mt-1">
                        {hasPattern ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                            <Check className="w-3 h-3" />
                            Patron listo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Sin patron
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Include checkbox */}
                    {!po.alreadySent && (
                      <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={po.included}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              included: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-border accent-cereus-gold"
                        />
                        <span className="text-xs text-muted-foreground">Incluir</span>
                      </label>
                    )}
                  </div>

                  {/* Inputs (only if included and not already sent) */}
                  {po.included && !po.alreadySent && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={po.cantidad}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              cantidad: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cereus-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">
                          Prioridad
                        </label>
                        <select
                          value={po.prioridad}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              prioridad: e.target.value as PieceOrder['prioridad'],
                            })
                          }
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cereus-gold"
                        >
                          <option value="normal">Normal</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                          <Calendar className="w-3 h-3" />
                          Fecha estimada
                        </label>
                        <input
                          type="date"
                          value={po.fechaEstimada}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              fechaEstimada: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cereus-gold"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                          <User className="w-3 h-3" />
                          Artesano asignado
                        </label>
                        <input
                          type="text"
                          value={po.artesano}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              artesano: e.target.value,
                            })
                          }
                          placeholder="Nombre"
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-muted-foreground mb-0.5">
                          Notas internas
                        </label>
                        <input
                          type="text"
                          value={po.notas}
                          onChange={(e) =>
                            updatePieceOrder(garment.id, {
                              notas: e.target.value,
                            })
                          }
                          placeholder="Instrucciones especiales..."
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cereus-gold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Summary bar (fixed at bottom) */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Summary info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedPieces.length}</span>{' '}
                {selectedPieces.length === 1 ? 'pieza seleccionada' : 'piezas seleccionadas'}
              </span>
              <span className="text-muted-foreground">
                Total unidades:{' '}
                <span className="font-semibold text-foreground">{totalUnits}</span>
              </span>
            </div>
            <div className="text-muted-foreground">
              Taller:{' '}
              <span className="font-semibold text-cereus-gold">
                {selectedWorkshop?.name || 'Sin seleccionar'}
              </span>
            </div>
          </div>

          {/* Progress bar (shown during creation) */}
          {creating && creationTotal > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-cereus-gold rounded-full transition-all duration-300"
                  style={{
                    width: `${(creationProgress / creationTotal) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Creando orden {creationProgress} de {creationTotal}...
              </p>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleCreateOrders}
            disabled={
              creating ||
              selectedPieces.length === 0 ||
              !selectedWorkshopId
            }
            className="w-full py-3 px-6 bg-cereus-gold text-white font-semibold rounded-lg hover:bg-cereus-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando Ordenes...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Crear Ordenes de Produccion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
