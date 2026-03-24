'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CheckCircle2, Loader2, Circle, Camera, Upload,
  AlertTriangle, AlertCircle, Clock, Calendar,
  PenTool, Scissors, Shirt, Sparkles, Shield,
  Wind, Archive, Truck, ChevronDown, ChevronUp,
  Image as ImageIcon, X,
} from 'lucide-react';

// --------------- Types ---------------

interface ProductionTrackerProps {
  maisonId: string;
  orderId: string;
  compact?: boolean;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  current_stage: string | null;
  stage_started_at: string | null;
  priority: string;
  estimated_delivery: string | null;
  created_at: string;
  internal_notes: string | null;
  client: { id: string; full_name: string; vip_tier: string } | null;
  variant: {
    id: string;
    variant_name: string | null;
    garment: { id: string; name: string; code: string | null } | null;
  } | null;
  workshop: { id: string; name: string } | null;
}

interface ProductionLog {
  id: string;
  order_id: string;
  stage: string | null;
  log_type?: string;
  type?: string;
  title: string | null;
  content: string | null;
  hours: number | null;
  photos: string[];
  created_at: string;
}

interface WorkshopNote {
  id: string;
  order_id: string;
  type: string;
  content: string;
  is_critical: boolean;
  resolved: boolean;
  resolved_at: string | null;
  photos: string[];
  created_at: string;
}

// --------------- Constants ---------------

const PRODUCTION_STAGES = [
  'patron', 'corte', 'costura', 'acabados', 'calidad', 'planchado', 'empaque', 'entregado',
] as const;

type ProductionStage = typeof PRODUCTION_STAGES[number];

const STAGE_CONFIG: Record<ProductionStage, { label: string; icon: React.ElementType }> = {
  patron:    { label: 'Patron',    icon: PenTool },
  corte:     { label: 'Corte',     icon: Scissors },
  costura:   { label: 'Costura',   icon: Shirt },
  acabados:  { label: 'Acabados',  icon: Sparkles },
  calidad:   { label: 'Calidad',   icon: Shield },
  planchado: { label: 'Planchado', icon: Wind },
  empaque:   { label: 'Empaque',   icon: Archive },
  entregado: { label: 'Entregado', icon: Truck },
};

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
  rush:    { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
  alta:    { label: 'Alta',    cls: 'bg-amber-100 text-amber-700' },
  high:    { label: 'Alta',    cls: 'bg-amber-100 text-amber-700' },
  vip:     { label: 'VIP',     cls: 'bg-cereus-gold/20 text-cereus-gold' },
  normal:  { label: 'Normal',  cls: 'bg-blue-100 text-blue-700' },
  baja:    { label: 'Baja',    cls: 'bg-gray-100 text-gray-500' },
};

// --------------- Helpers ---------------

function daysBetween(a: string, b: string | Date = new Date()): number {
  const start = new Date(a).getTime();
  const end = typeof b === 'string' ? new Date(b).getTime() : b.getTime();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function stageIndex(stage: string | null): number {
  if (!stage) return -1;
  return PRODUCTION_STAGES.indexOf(stage as ProductionStage);
}

// --------------- Component ---------------

export default function ProductionTracker({ maisonId, orderId, compact }: ProductionTrackerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [notes, setNotes] = useState<WorkshopNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------- Fetch data ---------------

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, logsRes, notesRes] = await Promise.all([
        fetch(`/api/cereus/orders?maisonId=${maisonId}`),
        fetch(`/api/cereus/production/logs?maisonId=${maisonId}&orderId=${orderId}`),
        fetch(`/api/cereus/production/notes?maisonId=${maisonId}&orderId=${orderId}`),
      ]);
      const [ordersData, logsData, notesData] = await Promise.all([
        ordersRes.json(),
        logsRes.json(),
        notesRes.json(),
      ]);

      const found = (ordersData.orders || []).find((o: Order) => o.id === orderId);
      if (found) setOrder(found);
      setLogs(logsData.logs || []);
      setNotes(notesData.notes || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [maisonId, orderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --------------- Derived state ---------------

  const currentIdx = stageIndex(order?.current_stage ?? null);

  const logsForStage = useMemo(() => {
    const map: Record<string, ProductionLog[]> = {};
    for (const s of PRODUCTION_STAGES) map[s] = [];
    for (const log of logs) {
      if (log.stage && map[log.stage]) map[log.stage].push(log);
    }
    return map;
  }, [logs]);

  const photosForStage = useMemo(() => {
    const map: Record<string, ProductionLog[]> = {};
    for (const s of PRODUCTION_STAGES) map[s] = [];
    for (const log of logs) {
      const logType = log.log_type || log.type;
      if (log.stage && logType === 'photo' && map[log.stage]) {
        map[log.stage].push(log);
      }
    }
    return map;
  }, [logs]);

  // Stage completion timestamps from stage_start logs
  const stageCompletionDates = useMemo(() => {
    const dates: Record<string, string> = {};
    const startLogs = logs
      .filter(l => (l.log_type || l.type) === 'stage_start' && l.stage)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (let i = 0; i < startLogs.length; i++) {
      // The start of stage N means stage N-1 was completed at that time
      const prevStageIdx = stageIndex(startLogs[i].stage!) - 1;
      if (prevStageIdx >= 0) {
        dates[PRODUCTION_STAGES[prevStageIdx]] = startLogs[i].created_at;
      }
    }
    // If order is entregado, mark it completed
    if (order?.current_stage === 'entregado' && order.stage_started_at) {
      dates['entregado'] = order.stage_started_at;
    }
    return dates;
  }, [logs, order]);

  const criticalNotes = useMemo(
    () => notes.filter(n => n.is_critical && !n.resolved),
    [notes],
  );

  const totalDays = order ? daysBetween(order.created_at) : 0;
  const daysRemaining = order?.estimated_delivery
    ? Math.ceil((new Date(order.estimated_delivery).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const completedStages = currentIdx >= 0
    ? (order?.current_stage === 'entregado' ? PRODUCTION_STAGES.length : currentIdx)
    : 0;

  const avgTimePerStage = completedStages > 0 ? Math.round(totalDays / completedStages) : 0;

  // --------------- Handlers ---------------

  function toggleStage(stage: string) {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      formData.append('stage', order.current_stage || '');

      const res = await fetch('/api/cereus/production/stage-photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        // Add the new photo log locally for instant feedback
        const newLog: ProductionLog = {
          id: data.logId,
          order_id: orderId,
          stage: order.current_stage,
          log_type: 'photo',
          title: `Foto de avance: ${order.current_stage}`,
          content: null,
          hours: null,
          photos: [data.url],
          created_at: new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
      }
    } catch {
      // silently fail
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // --------------- Loading / empty states ---------------

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-cereus-gold" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Orden no encontrada</p>
      </div>
    );
  }

  const garmentName = order.variant?.garment?.name || order.variant?.variant_name || 'Prenda';
  const clientName = order.client?.full_name || 'Cliente';
  const workshopName = order.workshop?.name || 'Sin taller';
  const priorityCfg = PRIORITY_BADGE[order.priority] || PRIORITY_BADGE.normal;

  // --------------- Render ---------------

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* ---- Photo preview modal ---- */}
      {photoPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPhotoPreview(null)}>
          <div className="relative max-w-3xl max-h-[80vh]">
            <button onClick={() => setPhotoPreview(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Foto de avance" className="max-h-[75vh] rounded-lg object-contain" />
          </div>
        </div>
      )}

      {/* ---- Order header ---- */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{garmentName}</h3>
            <p className="text-sm text-muted-foreground">{clientName} &middot; {workshopName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">#{order.order_number}</p>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityCfg.cls}`}>
            {priorityCfg.label}
          </span>
        </div>
      </div>

      {/* ---- Alert section ---- */}
      {(criticalNotes.length > 0 || (daysRemaining !== null && daysRemaining < 3)) && (
        <div className="space-y-2">
          {criticalNotes.map(n => (
            <div key={n.id} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-red-700 dark:text-red-400">Alerta critica:</span>{' '}
                <span className="text-red-600 dark:text-red-300">{n.content}</span>
              </div>
            </div>
          ))}
          {daysRemaining !== null && daysRemaining < 3 && daysRemaining >= 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {daysRemaining === 0 ? 'La entrega es hoy' : `Faltan solo ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para la entrega`}
              </p>
            </div>
          )}
          {daysRemaining !== null && daysRemaining < 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Entrega vencida por {Math.abs(daysRemaining)} dia{Math.abs(daysRemaining) > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---- Time tracking summary ---- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Dias totales</span>
          </div>
          <p className="text-lg font-semibold">{totalDays}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Entrega estimada</span>
          </div>
          <p className={`text-sm font-semibold ${daysRemaining !== null && daysRemaining < 0 ? 'text-red-600' : ''}`}>
            {order.estimated_delivery ? formatDate(order.estimated_delivery) : 'Sin fecha'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Dias restantes</span>
          </div>
          <p className={`text-lg font-semibold ${daysRemaining !== null && daysRemaining < 0 ? 'text-red-600' : ''}`}>
            {daysRemaining !== null ? (daysRemaining < 0 ? `${Math.abs(daysRemaining)} vencidos` : daysRemaining) : '-'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Prom. por etapa</span>
          </div>
          <p className="text-lg font-semibold">
            {avgTimePerStage > 0 ? `${avgTimePerStage} dias` : '-'}
          </p>
        </div>
      </div>

      {/* ---- Stage timeline ---- */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-4">Progreso de produccion</h4>

        <div className="relative">
          {PRODUCTION_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx || (order.current_stage === 'entregado' && idx <= currentIdx);
            const isCurrent = idx === currentIdx && order.current_stage !== 'entregado';
            const isUpcoming = !isCompleted && !isCurrent;
            const cfg = STAGE_CONFIG[stage];
            const StageIcon = cfg.icon;
            const photos = photosForStage[stage] || [];
            const stageLogs = logsForStage[stage] || [];
            const stageNotes = notes.filter(n => {
              // Match notes that reference this stage through logs
              return stageLogs.some(l => l.order_id === n.order_id);
            });
            const completionDate = stageCompletionDates[stage];
            const expanded = expandedStages.has(stage);
            const hasContent = photos.length > 0 || stageLogs.length > 0;

            // Calculate days spent in this completed stage
            let daysSpent: number | null = null;
            if (isCompleted && completionDate) {
              // Find when this stage started (previous stage completion or order creation)
              const prevStage = idx > 0 ? PRODUCTION_STAGES[idx - 1] : null;
              const startDate = prevStage && stageCompletionDates[prevStage]
                ? stageCompletionDates[prevStage]
                : order.created_at;
              daysSpent = daysBetween(startDate, completionDate);
            }

            // Days elapsed for current stage
            const daysElapsed = isCurrent && order.stage_started_at
              ? daysBetween(order.stage_started_at)
              : null;

            return (
              <div key={stage} className="relative flex gap-3">
                {/* Vertical line */}
                {idx < PRODUCTION_STAGES.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-[30px] w-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`}
                    style={{ height: 'calc(100% - 14px)' }}
                  />
                )}

                {/* Circle icon */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-[30px] h-[30px] rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-[30px] h-[30px] rounded-full bg-cereus-gold flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-full bg-muted flex items-center justify-center">
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Stage content */}
                <div className={`flex-1 pb-6 min-w-0 ${idx === PRODUCTION_STAGES.length - 1 ? 'pb-0' : ''}`}>
                  <div
                    className={`flex items-center justify-between gap-2 ${hasContent ? 'cursor-pointer' : ''}`}
                    onClick={() => hasContent && toggleStage(stage)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StageIcon className={`w-3.5 h-3.5 shrink-0 ${isCompleted ? 'text-green-600' : isCurrent ? 'text-cereus-gold' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${isUpcoming ? 'text-muted-foreground' : ''}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isCompleted && completionDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(completionDate)}
                          {daysSpent !== null && ` (${daysSpent}d)`}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-cereus-gold font-medium">
                          En progreso{daysElapsed !== null ? ` (${daysElapsed}d)` : ''}
                        </span>
                      )}
                      {photos.length > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <ImageIcon className="w-3 h-3" />{photos.length}
                        </span>
                      )}
                      {hasContent && (
                        expanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expanded && hasContent && (
                    <div className="mt-2 space-y-2">
                      {/* Photos grid */}
                      {photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {photos.flatMap(log => log.photos.map((url, pi) => (
                            <button
                              key={`${log.id}-${pi}`}
                              onClick={(e) => { e.stopPropagation(); setPhotoPreview(url); }}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-cereus-gold/50 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="Avance" className="w-full h-full object-cover" />
                            </button>
                          )))}
                        </div>
                      )}
                      {/* Log entries */}
                      {stageLogs.filter(l => (l.log_type || l.type) !== 'photo').map(log => (
                        <div key={log.id} className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                          {log.title && <p className="font-medium text-foreground">{log.title}</p>}
                          {log.content && <p>{log.content}</p>}
                          <p className="mt-1 opacity-60">{formatDate(log.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button for current stage */}
                  {isCurrent && !compact && (
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:border-cereus-gold/50 hover:bg-cereus-gold/5 transition-colors disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Camera className="w-3 h-3" />
                            Subir foto de avance
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
