'use client';

import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Upload,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Bell,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import { TunaAvatar, TunaLoading, TunaEmpty } from './tuna-avatar';
import { KPICard, CampaignProgress } from './kpi-card';
import { ComparisonChart, DonutChart } from './chart-card';
import { DataTable, VarianceCell, CurrencyCell, StatusCell } from './data-table';
import { UploadZone } from './upload-zone';
import { useCampaigns } from '../hooks/use-campaigns';
import { useCampaignData } from '../hooks/use-campaign-data';
import {
  ReportImpacto,
  ReportLotes,
  ReportRubro,
  ReportGastoMensual,
  ReportRatios,
} from './reports';
import { CategoryMapper } from './category-mapper';
import type { CampaignKPIs, ProductionOrder, CampaignSeason, Alert } from '../types';

type Tab = 'dashboard' | 'upload' | 'reports' | 'orders' | 'settings';

export function TunaDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showCategoryMapper, setShowCategoryMapper] = useState(false);

  // Get campaigns and active campaign
  const { campaigns, activeCampaign, setActiveCampaign, createCampaign, isLoading: campaignsLoading } = useCampaigns();

  // Get campaign data
  const {
    kpis,
    orders,
    processData,
    distributionData,
    alerts,
    isLoading: dataLoading,
    hasData,
    refresh,
  } = useCampaignData(activeCampaign?.id);

  const isLoading = campaignsLoading || dataLoading;

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as Tab, label: 'Cargar Datos', icon: Upload },
    { id: 'orders' as Tab, label: 'Órdenes de Producción', icon: FileSpreadsheet },
    { id: 'reports' as Tab, label: 'Reportes', icon: BarChart3 },
    { id: 'settings' as Tab, label: 'Configuración', icon: Settings },
  ];

  const handleUploadComplete = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TunaAvatar state={isLoading ? 'processing' : 'idle'} size="md" interactive />
              <div>
                <h1 className="text-xl font-bold font-display bg-tuna-gradient bg-clip-text text-transparent">
                  TUNA
                </h1>
                <p className="text-xs text-muted-foreground">El Cierre de Campaña. Consolidado.</p>
              </div>
            </div>

            {/* Campaign selector */}
            <div className="flex items-center gap-4">
              {campaigns.length > 0 ? (
                <select
                  value={activeCampaign?.id || ''}
                  onChange={(e) => {
                    const campaign = campaigns.find((c) => c.id === e.target.value);
                    if (campaign) setActiveCampaign(campaign);
                  }}
                  className="px-3 py-2 bg-muted rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-tuna-magenta/20"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-muted-foreground">Sin campañas</span>
              )}

              {/* New Campaign Button */}
              <button
                onClick={() => setShowNewCampaignModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-tuna-magenta text-white rounded-lg text-sm font-medium hover:bg-tuna-magenta-light transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Campaña
              </button>

              {/* Refresh */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-tuna-magenta rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-tuna-magenta text-tuna-magenta'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            kpis={kpis}
            processData={processData}
            distributionData={distributionData}
            alerts={alerts}
            isLoading={isLoading}
            hasData={hasData}
            onGoToUpload={() => setActiveTab('upload')}
          />
        )}
        {activeTab === 'upload' && (
          <UploadTab
            campaignId={activeCampaign?.id}
            onUploadComplete={handleUploadComplete}
            onOpenMapper={() => setShowCategoryMapper(true)}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} isLoading={isLoading} onGoToUpload={() => setActiveTab('upload')} />
        )}
        {activeTab === 'reports' && <ReportsTab hasData={hasData} campaignId={activeCampaign?.id} />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <NewCampaignModal
          onClose={() => setShowNewCampaignModal(false)}
          onCreate={async (data) => {
            await createCampaign(data);
            setShowNewCampaignModal(false);
            setActiveTab('upload');
          }}
        />
      )}

      {/* Category Mapper Modal */}
      {showCategoryMapper && activeCampaign?.id && (
        <CategoryMapper
          campaignId={activeCampaign.id}
          onClose={() => setShowCategoryMapper(false)}
          onComplete={() => {
            setShowCategoryMapper(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// New Campaign Modal
function NewCampaignModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name?: string; season: 'invierno' | 'verano'; year: number; exchangeRate?: number }) => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [formData, setFormData] = useState({
    name: '',
    season: currentMonth >= 6 ? 'invierno' : 'verano' as 'invierno' | 'verano',
    year: currentYear,
    exchangeRate: 3.7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await onCreate({
        name: formData.name || undefined,
        season: formData.season,
        year: formData.year,
        exchangeRate: formData.exchangeRate,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TunaAvatar state="idle" size="sm" />
            <h2 className="text-xl font-bold">Nueva Campaña</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`${formData.season === 'invierno' ? 'Invierno' : 'Verano'} ${formData.year}`}
              className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20"
            />
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium mb-1">Temporada</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, season: 'invierno' })}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  formData.season === 'invierno'
                    ? 'bg-tuna-magenta text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                🥶 Invierno (Jul-Dic)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, season: 'verano' })}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  formData.season === 'verano'
                    ? 'bg-tuna-magenta text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                ☀️ Verano (Ene-Jun)
              </button>
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium mb-1">Año</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cambio (S/ por USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.exchangeRate}
              onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 3.7 })}
              className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full px-4 py-3 bg-tuna-gradient text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear Campaña
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({
  kpis,
  processData,
  distributionData,
  alerts,
  isLoading,
  hasData,
  onGoToUpload,
}: {
  kpis: CampaignKPIs | null;
  processData: { label: string; budget: number; actual: number }[];
  distributionData: { label: string; value: number; color: string }[];
  alerts: Alert[];
  isLoading: boolean;
  hasData: boolean;
  onGoToUpload: () => void;
}) {
  if (isLoading) {
    return <TunaLoading text="Cargando datos de campaña..." />;
  }

  if (!hasData || !kpis) {
    return (
      <TunaEmpty
        title="No hay datos de campaña"
        description="Sube tus archivos Excel para comenzar el análisis de cierre de campaña"
        action={
          <button
            onClick={onGoToUpload}
            className="px-4 py-2 bg-tuna-magenta text-white rounded-lg text-sm hover:bg-tuna-magenta-light transition-colors"
          >
            Cargar Datos
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top row - Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Presupuesto Total"
          value={kpis.presupuestoTotal}
          format="currency"
          icon={<span>💰</span>}
          size="md"
        />
        <KPICard
          title="Gasto Real"
          value={kpis.gastoReal}
          previousValue={kpis.presupuestoTotal}
          format="currency"
          trendLabel="vs presupuesto"
          icon={<span>📊</span>}
          variant={kpis.gastoReal <= kpis.presupuestoTotal ? 'success' : 'warning'}
        />
        <KPICard
          title="Varianza"
          value={Math.abs(kpis.varianzaTotal)}
          format="currency"
          trend={kpis.varianzaTotal < 0 ? 'down' : 'up'}
          trendLabel={`${kpis.varianzaPercent.toFixed(1)}%`}
          icon={<span>📈</span>}
          variant={kpis.varianzaTotal <= 0 ? 'success' : 'error'}
        />
        <KPICard
          title="OPs Procesadas"
          value={kpis.opsCerradas + kpis.opsAbiertas}
          format="number"
          trendLabel={`${kpis.opsCerradas} cerradas`}
          icon={<span>📋</span>}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <CampaignProgress
          opsTotal={kpis.opsAbiertas + kpis.opsCerradas}
          opsClosed={kpis.opsCerradas}
          dataUploaded={hasData}
          validationComplete={kpis.opsAbiertas === 0 && kpis.opsCerradas > 0}
        />

        {/* Comparison Chart */}
        <div className="lg:col-span-2">
          {processData.length > 0 ? (
            <ComparisonChart data={processData} title="Presupuesto vs Real por Proceso" />
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Sube el archivo de presupuesto para ver este gráfico</p>
            </div>
          )}
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution */}
        {distributionData.length > 0 ? (
          <DonutChart
            data={distributionData}
            title="Distribución de Gastos"
            centerLabel="Total"
            centerValue={`$${(kpis.gastoReal / 1000000).toFixed(1)}M`}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Sube el archivo de presupuesto para ver la distribución</p>
          </div>
        )}

        {/* Alerts */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-tuna-magenta" />
            Alertas Recientes
          </h3>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <AlertItem
                  key={alert.id}
                  type={alert.severity === 'critical' ? 'warning' : alert.severity === 'warning' ? 'warning' : 'info'}
                  message={alert.message}
                  time={formatTimeAgo(alert.createdAt)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay alertas recientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-tuna-magenta">{kpis.opsCerradas}</p>
          <p className="text-sm text-muted-foreground">OPs Cerradas</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-yellow-500">{kpis.opsAbiertas}</p>
          <p className="text-sm text-muted-foreground">OPs Abiertas</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-tuna-green">
            {kpis.produccionTotal > 0 ? kpis.produccionTotal.toLocaleString() : '-'}
          </p>
          <p className="text-sm text-muted-foreground">Producción Total</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-2xl font-bold">
            {kpis.costoUnitarioPromedio > 0 ? `$${kpis.costoUnitarioPromedio.toFixed(3)}` : '-'}
          </p>
          <p className="text-sm text-muted-foreground">Costo Unitario</p>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return 'Hace un momento';
}

function AlertItem({ type, message, time }: { type: 'warning' | 'success' | 'info'; message: string; time: string }) {
  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    success: <CheckCircle className="w-5 h-5 text-tuna-green" />,
    info: <Bell className="w-5 h-5 text-tuna-magenta" />,
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

// Upload Tab
function UploadTab({
  campaignId,
  onUploadComplete,
  onOpenMapper,
}: {
  campaignId?: string;
  onUploadComplete: () => void;
  onOpenMapper: () => void;
}) {
  const [hasPresupuesto, setHasPresupuesto] = useState(false);
  const [hasGastosOP, setHasGastosOP] = useState(false);

  const handleUpload = async (file: File, dataType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    if (campaignId) {
      formData.append('campaignId', campaignId);
    }

    const response = await fetch('/api/tuna/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al subir archivo');
    }

    // Track which files have been uploaded
    if (dataType === 'presupuesto') setHasPresupuesto(true);
    if (dataType === 'gastos_op') setHasGastosOP(true);

    onUploadComplete();
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <TunaAvatar state="waiting" size="xl" showDataNodes />
        <h2 className="text-2xl font-bold mt-4">Cargar Datos de Campaña</h2>
        <p className="text-muted-foreground mt-2">
          Sube tus archivos y TUNA los procesará automáticamente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <UploadZone dataType="presupuesto" onUpload={(file) => handleUpload(file, 'presupuesto')} />
        </div>
        <div className="p-6 rounded-xl border border-border bg-card">
          <UploadZone dataType="gastos_op" onUpload={(file) => handleUpload(file, 'gastos_op')} />
        </div>
        <div className="p-6 rounded-xl border border-border bg-card">
          <UploadZone dataType="produccion" onUpload={(file) => handleUpload(file, 'produccion')} />
        </div>
        <div className="p-6 rounded-xl border border-border bg-card">
          <UploadZone dataType="ventas" onUpload={(file) => handleUpload(file, 'ventas')} />
        </div>
      </div>

      {/* AI Mapping Button - appears when both budget and EEFF are uploaded */}
      {(hasPresupuesto || hasGastosOP) && (
        <div className="text-center pt-6 border-t border-border">
          <button
            onClick={onOpenMapper}
            className="px-6 py-3 bg-tuna-gradient text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            <span className="text-xl">🤖</span>
            Mapear Categorías con IA
          </button>
          <p className="text-sm text-muted-foreground mt-2">
            {hasPresupuesto && hasGastosOP
              ? 'Mapea automáticamente las categorías de presupuesto con los conceptos de gasto'
              : hasPresupuesto
              ? 'Sube el archivo EEFF para habilitar el mapeo automático'
              : 'Sube el archivo de Presupuesto para habilitar el mapeo automático'}
          </p>
        </div>
      )}
    </div>
  );
}

// Orders Tab
function OrdersTab({
  orders,
  isLoading,
  onGoToUpload,
}: {
  orders: ProductionOrder[];
  isLoading: boolean;
  onGoToUpload: () => void;
}) {
  if (isLoading) {
    return <TunaLoading text="Cargando órdenes de producción..." />;
  }

  if (orders.length === 0) {
    return (
      <TunaEmpty
        title="No hay órdenes de producción"
        description="Sube el archivo de Gastos por OP para ver las órdenes"
        action={
          <button
            onClick={onGoToUpload}
            className="px-4 py-2 bg-tuna-magenta text-white rounded-lg text-sm hover:bg-tuna-magenta-light transition-colors"
          >
            Cargar Datos
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        title="Órdenes de Producción"
        data={orders}
        rowKey="id"
        searchable
        searchKeys={['numero', 'descripcion']}
        exportable
        onExport={() => console.log('Export')}
        variant="striped"
        highlightRow={(row) =>
          row.estado === 'cerrado'
            ? 'success'
            : row.cantidadEstimada > 0 && Math.abs(row.diferenciaCantidad) > row.cantidadEstimada * 0.1
            ? 'warning'
            : null
        }
        columns={[
          { key: 'numero', header: 'OP', sortable: true, width: '100px' },
          { key: 'descripcion', header: 'Descripción', sortable: true },
          {
            key: 'estado',
            header: 'Estado',
            format: (val) => <StatusCell status={val as string} />,
          },
          {
            key: 'cantidadEstimada',
            header: 'Estimado',
            align: 'right',
            format: (val) => (val as number).toLocaleString('es-PE'),
          },
          {
            key: 'cantidadProducida',
            header: 'Producido',
            align: 'right',
            format: (val) => (val as number).toLocaleString('es-PE'),
          },
          {
            key: 'diferenciaCantidad',
            header: 'Diferencia',
            align: 'right',
            format: (val, row) => {
              const estimated = row.cantidadEstimada as number;
              if (estimated === 0) return '-';
              return (
                <VarianceCell value={((val as number) / estimated) * 100} threshold={5} />
              );
            },
          },
          {
            key: 'costoTotal',
            header: 'Costo Total',
            align: 'right',
            format: (val) => <CurrencyCell value={val as number} />,
          },
        ]}
      />
    </div>
  );
}

// Reports Tab
function ReportsTab({ hasData, campaignId }: { hasData: boolean; campaignId?: string }) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports = [
    { id: 'impacto', name: 'Impacto y Rendimiento vs Presupuesto', icon: '📊', status: hasData ? 'ready' : 'pending' },
    { id: 'lotes', name: 'Resultado por Lote', icon: '📦', status: hasData ? 'ready' : 'pending' },
    { id: 'rubro', name: 'Comparativo por Rubro', icon: '📋', status: hasData ? 'ready' : 'pending' },
    { id: 'mensual', name: 'Gasto Real vs Presupuesto', icon: '💰', status: hasData ? 'ready' : 'pending' },
    { id: 'ratios', name: 'Ratios de Campaña', icon: '📈', status: hasData ? 'ready' : 'pending' },
  ];

  const handleExport = async (reportType: string) => {
    if (!campaignId) return;

    const url = `/api/tuna/reports?campaignId=${campaignId}&type=${reportType}&format=excel`;
    window.open(url, '_blank');
  };

  // If a report is selected, show the report component
  if (selectedReport && campaignId) {
    const ReportComponent = getReportComponent(selectedReport);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedReport(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Volver a reportes
        </button>
        <ReportComponent campaignId={campaignId} onExport={() => handleExport(selectedReport)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => report.status === 'ready' && setSelectedReport(report.id)}
            className={`p-4 rounded-xl border border-border bg-card transition-colors ${
              report.status === 'ready' ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{report.icon}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === 'ready'
                    ? 'bg-tuna-green/10 text-tuna-green'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {report.status === 'ready' ? 'Listo' : 'Pendiente'}
              </span>
            </div>
            <h3 className="font-semibold mt-3">{report.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {report.status === 'ready' ? 'Click para ver reporte' : 'Carga datos primero'}
            </p>
          </div>
        ))}
      </div>

      {/* Generate Report Button */}
      <div className="text-center pt-6">
        <button
          disabled={!hasData}
          className="px-6 py-3 bg-tuna-gradient text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TunaAvatar state="idle" size="xs" />
          Cerrar Campaña con TUNA
        </button>
        <p className="text-sm text-muted-foreground mt-2">
          {hasData ? 'Consolida todos los datos y genera el reporte final' : 'Carga datos para habilitar'}
        </p>
      </div>
    </div>
  );
}

// Helper function to get report component
function getReportComponent(reportId: string) {
  switch (reportId) {
    case 'impacto':
      return ReportImpacto;
    case 'lotes':
      return ReportLotes;
    case 'rubro':
      return ReportRubro;
    case 'mensual':
      return ReportGastoMensual;
    case 'ratios':
      return ReportRatios;
    default:
      return () => <div>Reporte no encontrado</div>;
  }
}

// Settings Tab
function SettingsTab() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Configuración de Campaña</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Tipo de Cambio (S/ por USD)</label>
            <input
              type="number"
              defaultValue={3.8}
              step={0.01}
              className="mt-1 w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Umbral de Alerta (%)</label>
            <input
              type="number"
              defaultValue={10}
              className="mt-1 w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Reglas de Negocio</h3>
        <div className="space-y-3">
          {[
            { name: 'Campaña Invierno', desc: 'Julio - Diciembre', active: true },
            { name: 'Campaña Verano', desc: 'Enero - Junio', active: true },
            { name: 'Validación de cierre', desc: 'Todas las OPs deben estar cerradas', active: true },
            { name: 'Alertas automáticas', desc: 'Notificar varianzas > umbral', active: true },
          ].map((rule, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <input type="checkbox" defaultChecked={rule.active} className="w-5 h-5 accent-tuna-magenta" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
