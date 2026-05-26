'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  ChevronRight,
  GraduationCap,
  HandshakeIcon,
  Megaphone,
  Settings,
  Sparkles,
  Users as UsersIcon,
} from 'lucide-react';
import {
  ANNUAL_BUDGET,
  AREA_PERMISSIONS,
  BUSINESS_AREAS,
  DEFAULT_LICENSING_MODE,
  LICENSING_MODE_2026,
  LICENSING_MODE_STRESS_TEST,
  USERS,
  buildVisibilityContext,
  canUserSeeArea,
  formatPriceUSD,
} from '..';
import type {
  AreaId,
  BusinessArea,
  LicensingMode,
  User,
} from '..';

// ============================================================
// Icon mapping per area
// ============================================================
const AREA_ICON: Record<AreaId, React.ReactNode> = {
  education:   <GraduationCap className="w-4 h-4" />,
  assessments: <Sparkles className="w-4 h-4" />,
  eq_biz:      <Briefcase className="w-4 h-4" />,
  marketing:   <Megaphone className="w-4 h-4" />,
  membership:  <UsersIcon className="w-4 h-4" />,
  impact:      <Building2 className="w-4 h-4" />,
  operations:  <Settings className="w-4 h-4" />,
  partners:    <HandshakeIcon className="w-4 h-4" />,
};

// ============================================================
// Main component
// ============================================================
export function AreaDashboard() {
  // "Logged-in" user simulator (Phase 0 — real auth comes later)
  const [activeUserId, setActiveUserId] = useState<string>('eduardo');
  const [licensingMode, setLicensingMode] = useState<LicensingMode>(
    DEFAULT_LICENSING_MODE,
  );
  const [drilledInto, setDrilledInto] = useState<AreaId | null>(null);

  const ctx = useMemo(() => buildVisibilityContext(activeUserId), [activeUserId]);
  if (!ctx) return null;

  const visibleAreas = BUSINESS_AREAS.filter(area => canUserSeeArea(ctx, area));

  const burnAnnual = ANNUAL_BUDGET.totalAnnualCosts;
  const burnMonthly = burnAnnual / 12;
  const isAdmin = ctx.current_user.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <Header
        currentUser={ctx.current_user}
        onUserChange={setActiveUserId}
        licensingMode={licensingMode}
        onLicensingModeChange={setLicensingMode}
        isAdmin={isAdmin}
      />

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {drilledInto ? (
          <AreaDetail
            areaId={drilledInto}
            onBack={() => setDrilledInto(null)}
            isAdmin={isAdmin}
            licensingMode={licensingMode}
          />
        ) : (
          <>
            {/* Annual P&L summary — admin only */}
            {isAdmin && (
              <PnlSummary
                burnAnnual={burnAnnual}
                burnMonthly={burnMonthly}
                licensingMode={licensingMode}
              />
            )}

            {/* Area cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleAreas.map(area => (
                <AreaCard
                  key={area.id}
                  area={area}
                  onClick={() => setDrilledInto(area.id)}
                />
              ))}
            </div>

            {/* Empty state if user has no visible areas */}
            {visibleAreas.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                No tienes áreas asignadas. Habla con Eduardo.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Header
// ============================================================
function Header({
  currentUser,
  onUserChange,
  licensingMode,
  onLicensingModeChange,
  isAdmin,
}: {
  currentUser: User;
  onUserChange: (userId: string) => void;
  licensingMode: LicensingMode;
  onLicensingModeChange: (m: LicensingMode) => void;
  isAdmin: boolean;
}) {
  const licensingLabel =
    licensingMode.type === 'annual_flat'
      ? `2026: Flat $${(licensingMode.amount_usd / 1000).toFixed(0)}k anual`
      : `Stress test: ${(licensingMode.rate * 100).toFixed(0)}% por deal`;

  const licensingColor =
    licensingMode.type === 'annual_flat'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className="flex-shrink-0 border-b bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-eq-gradient flex items-center justify-center text-white text-sm font-bold">
            EQ
          </div>
          <div>
            <h1 className="font-display font-bold text-eq-navy text-sm">
              EQ LATAM OPERATING PLATFORM
            </h1>
            <p className="text-xs text-muted-foreground">
              Áreas · Deals · P&L · KPIs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Licensing mode badge — admin can toggle */}
          <button
            onClick={() =>
              isAdmin &&
              onLicensingModeChange(
                licensingMode.type === 'annual_flat'
                  ? LICENSING_MODE_STRESS_TEST
                  : LICENSING_MODE_2026,
              )
            }
            disabled={!isAdmin}
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${licensingColor} ${
              isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
            }`}
            title={
              isAdmin
                ? 'Click para alternar a stress-test'
                : 'Solo admin puede cambiar'
            }
          >
            {licensingLabel}
          </button>

          {/* User selector (Phase 0 mock auth) */}
          <select
            value={currentUser.id}
            onChange={e => onUserChange(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1 bg-white"
          >
            {USERS.filter(u => u.active).map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Annual P&L summary (admin only)
// ============================================================
function PnlSummary({
  burnAnnual,
  burnMonthly,
  licensingMode,
}: {
  burnAnnual: number;
  burnMonthly: number;
  licensingMode: LicensingMode;
}) {
  const totalRevenueTarget = BUSINESS_AREAS.reduce(
    (sum, a) => sum + a.revenue_target_annual,
    0,
  );
  const projectedMargin = totalRevenueTarget - burnAnnual;

  return (
    <div className="mb-6 bg-white rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-sm">P&L 2026 proyectado</h2>
        <span className="text-xs text-muted-foreground">
          Modo licencia activo: {licensingMode.type === 'annual_flat' ? 'Flat anual' : '% por deal'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Revenue target" value={formatPriceUSD(totalRevenueTarget)} />
        <Metric
          label="Burn fijo anual"
          value={formatPriceUSD(burnAnnual)}
          sublabel={`${formatPriceUSD(burnMonthly)}/mes`}
        />
        <Metric
          label="Margen proyectado"
          value={formatPriceUSD(projectedMargin)}
          good={projectedMargin > 0}
        />
        <Metric
          label="Cubrimiento de burn"
          value={`${((totalRevenueTarget / burnAnnual) * 100).toFixed(0)}%`}
          good={totalRevenueTarget >= burnAnnual}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sublabel,
  good,
}: {
  label: string;
  value: string;
  sublabel?: string;
  good?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-semibold ${
          good == null
            ? 'text-eq-navy'
            : good
            ? 'text-emerald-600'
            : 'text-red-600'
        }`}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      )}
    </div>
  );
}

// ============================================================
// Area card
// ============================================================
function AreaCard({
  area,
  onClick,
}: {
  area: BusinessArea;
  onClick: () => void;
}) {
  const progressPct = 0; // placeholder — wire to actual deals when DB exists
  const showRevenue = area.is_revenue_generating;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border hover:border-eq-blue hover:shadow-md transition-all p-4 text-left group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{area.emoji}</span>
          <h3 className="font-semibold text-eq-navy">{area.name}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-eq-blue transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {area.description}
      </p>

      {showRevenue ? (
        <>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">YTD</span>
            <span className="font-medium">
              {formatPriceUSD(0)} / {formatPriceUSD(area.revenue_target_annual)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-eq-blue h-full rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          Área de soporte · no genera revenue directo
        </div>
      )}
    </button>
  );
}

// ============================================================
// Area detail view (drill-in)
// ============================================================
function AreaDetail({
  areaId,
  onBack,
  isAdmin,
  licensingMode,
}: {
  areaId: AreaId;
  onBack: () => void;
  isAdmin: boolean;
  licensingMode: LicensingMode;
}) {
  const area = BUSINESS_AREAS.find(a => a.id === areaId);
  if (!area) return null;

  // Who has access to this area?
  const leadsAndCollaborators = AREA_PERMISSIONS.filter(
    p => p.area_id === areaId,
  ).map(p => {
    const user = USERS.find(u => u.id === p.user_id);
    return { user, level: p.level };
  });

  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-eq-blue mb-3"
      >
        ← Volver
      </button>

      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{area.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-eq-navy">{area.name}</h2>
            <p className="text-sm text-muted-foreground">{area.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <Metric
            label="Revenue target 2026"
            value={formatPriceUSD(area.revenue_target_annual)}
          />
          <Metric
            label="Cost allocation"
            value={formatPriceUSD(area.cost_allocation_annual)}
          />
          <Metric label="Tipo" value={area.is_revenue_generating ? 'Revenue' : 'Soporte'} />
          <Metric label="Acceso" value={area.admin_only ? 'Solo admin' : 'Compartida'} />
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-sm mb-3">Equipo</h3>
        {leadsAndCollaborators.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {area.admin_only
              ? 'Solo Eduardo (admin)'
              : 'Sin asignaciones'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {leadsAndCollaborators.map(({ user, level }) =>
              user ? (
                <span
                  key={user.id}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    level === 'lead'
                      ? 'bg-eq-blue text-white'
                      : level === 'collaborator'
                      ? 'bg-eq-cream text-eq-navy'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.name} · {level}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* Deals — placeholder */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm mb-3">Deals & Productos</h3>
        <p className="text-xs text-muted-foreground italic">
          Aquí va el listado de deals del área cuando esté wireada la persistencia.
          {isAdmin && (
            <>
              {' '}Modo licencia activo:{' '}
              {licensingMode.type === 'annual_flat'
                ? 'Flat anual (sin 30% por deal)'
                : `${(licensingMode.rate * 100).toFixed(0)}% por deal`}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
