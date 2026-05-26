'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit2,
  Save,
  Settings as SettingsIcon,
  Shield,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  BUSINESS_AREAS,
  DEFAULT_LICENSING_MODE,
  LICENSING_MODE_2026,
  LICENSING_MODE_STRESS_TEST,
  formatPriceUSD,
} from '..';
import {
  fetchUsers,
  upsertUser,
  fetchPermissions,
  setPermission as setPermissionDb,
} from '../lib/eq-db';
import type {
  AreaId,
  AreaPermission,
  PermissionLevel,
  User,
  UserRole,
} from '../types/organization';
import type { LicensingMode } from '../types';
import { TeamInvitePanel } from './team-invite-panel';

type AdminTab = 'users' | 'permissions' | 'invites' | 'settings';

/**
 * Centralized admin panel. Visible only to Eduardo (admin role).
 * - Usuarios: CRUD team members (role, salary, active)
 * - Permisos: matrix editor user × area → level dropdown
 * - Invites: TeamInvitePanel (already built)
 * - Configuración: licensing mode toggle + env var status
 */
export function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('users');

  return (
    <div className="space-y-4">
      <div className="bg-eq-cream/40 border rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-eq-blue mt-0.5" />
        <div className="text-sm flex-1">
          <div className="font-semibold">Panel de administración</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestiona usuarios, permisos por área, invitaciones por magic-link y
            configuración del sistema. Solo Eduardo (admin) ve esta sección.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          Usuarios
        </TabButton>
        <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')}>
          Permisos
        </TabButton>
        <TabButton active={tab === 'invites'} onClick={() => setTab('invites')}>
          Invitaciones
        </TabButton>
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
          Configuración
        </TabButton>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'permissions' && <PermissionsMatrix />}
      {tab === 'invites' && <TeamInvitePanel />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ============================================================
// Usuarios
// ============================================================
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUsers().then(rows => {
      if (!cancelled) {
        setUsers(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (u: User) => {
    await upsertUser(u);
    setUsers(prev => prev.map(x => (x.id === u.id ? u : x)));
    setEditing(null);
  };

  const totalSalary = users.filter(u => u.active).reduce((s, u) => s + u.monthly_salary_usd, 0);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Equipo interno</h3>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.active).length} activos · Nómina mensual:{' '}
              <strong>{formatPriceUSD(totalSalary)}</strong>
            </p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Nombre</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Rol</th>
              <th className="text-right px-4 py-2 font-medium">Sueldo mensual</th>
              <th className="text-center px-4 py-2 font-medium">Estado</th>
              <th className="text-right px-4 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Cargando…</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className={`border-t ${!u.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatPriceUSD(u.monthly_salary_usd)}</td>
                  <td className="px-4 py-2 text-center">
                    {u.active ? (
                      <span className="text-xs text-emerald-600 inline-flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setEditing(u)}
                      className="p-1.5 hover:bg-gray-100 rounded text-muted-foreground hover:text-eq-blue"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <UserEditModal user={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function UserEditModal({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (u: User) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<User>(user);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Editar {user.name}</h3>
          <button onClick={onCancel} className="text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-3">
          <Field label="Nombre">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" />
          </Field>
          <Field label="Rol">
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className="w-full text-sm border rounded-lg px-3 py-2 bg-white">
              <option value="admin">admin (ve todo)</option>
              <option value="area_lead">area_lead</option>
              <option value="collaborator">collaborator</option>
            </select>
          </Field>
          <Field label="Sueldo mensual (USD)">
            <input type="number" min={0} value={form.monthly_salary_usd} onChange={e => setForm({ ...form, monthly_salary_usd: Number(e.target.value) })} className="w-full text-sm border rounded-lg px-3 py-2" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Usuario activo
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={onCancel} className="text-sm px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="text-sm px-4 py-2 bg-eq-blue text-white rounded-lg">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Permisos — matrix user × area
// ============================================================
function PermissionsMatrix() {
  const [users, setUsers] = useState<User[]>([]);
  const [perms, setPerms] = useState<AreaPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchUsers(), fetchPermissions()]).then(([u, p]) => {
      if (!cancelled) {
        setUsers(u);
        setPerms(p);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const visibleUsers = users.filter(u => u.active && u.role !== 'admin');
  // Show only areas that are NOT admin_only (admin sees all implicitly)
  const visibleAreas = BUSINESS_AREAS.filter(a => !a.admin_only);

  const getLevel = (userId: string, areaId: AreaId): PermissionLevel | null => {
    const p = perms.find(x => x.user_id === userId && x.area_id === areaId);
    return p ? p.level : null;
  };

  const updatePermission = async (
    userId: string,
    areaId: AreaId,
    level: PermissionLevel | null,
  ) => {
    const key = `${userId}-${areaId}`;
    setSavingCell(key);
    await setPermissionDb(userId, areaId, level);
    setPerms(prev => {
      const filtered = prev.filter(p => !(p.user_id === userId && p.area_id === areaId));
      return level ? [...filtered, { user_id: userId, area_id: areaId, level }] : filtered;
    });
    setSavingCell(null);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border overflow-x-auto">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Matriz de permisos</h3>
          <p className="text-xs text-muted-foreground">
            Para cada usuario × área, asigna el nivel: <strong>lead</strong> (responsable),
            <strong> collaborator</strong> (colabora y edita), <strong>viewer</strong> (solo
            lee), o <strong>—</strong> (sin acceso). Eduardo (admin) ve todo
            implícitamente y no aparece en esta tabla.
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium min-w-[160px]">Usuario</th>
                {visibleAreas.map(a => (
                  <th key={a.id} className="text-center px-2 py-2 font-medium min-w-[110px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{a.emoji}</span>
                      <span>{a.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.role}</div>
                  </td>
                  {visibleAreas.map(a => {
                    const key = `${u.id}-${a.id}`;
                    const lvl = getLevel(u.id, a.id);
                    return (
                      <td key={a.id} className="px-2 py-1 text-center">
                        <select
                          value={lvl ?? ''}
                          disabled={savingCell === key}
                          onChange={e =>
                            updatePermission(
                              u.id,
                              a.id,
                              e.target.value === '' ? null : (e.target.value as PermissionLevel),
                            )
                          }
                          className={`text-xs border rounded px-1.5 py-1 bg-white ${
                            lvl === 'lead' ? 'border-eq-blue text-eq-blue font-medium' :
                            lvl === 'collaborator' ? 'border-blue-300 text-blue-700' :
                            lvl === 'viewer' ? 'border-gray-300 text-gray-700' :
                            'border-gray-200 text-muted-foreground'
                          }`}
                        >
                          <option value="">—</option>
                          <option value="lead">lead</option>
                          <option value="collaborator">collab</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Configuración
// ============================================================
function SettingsTab() {
  const [mode, setMode] = useState<LicensingMode>(DEFAULT_LICENSING_MODE);

  const supabaseConfigured =
    typeof window !== 'undefined' &&
    !!document.cookie.match(/sb-/);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
            <SettingsIcon className="w-4 h-4" /> Modo de licencia a 6S Global
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Controla cómo se calcula el cash que sale a Global por deal.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMode(LICENSING_MODE_2026)}
              className={`text-sm px-4 py-2 rounded-lg border ${
                mode.type === 'annual_flat'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              2026 · Flat $40k anual (sin % por deal)
            </button>
            <button
              onClick={() => setMode(LICENSING_MODE_STRESS_TEST)}
              className={`text-sm px-4 py-2 rounded-lg border ${
                mode.type === 'percentage_of_revenue'
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              Stress test · 30% por deal
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mode.type === 'annual_flat'
              ? `Actualmente: $${(mode.amount_usd / 1000).toFixed(0)}k anual cubierto en burn fijo.`
              : `Actualmente: ${(mode.rate * 100).toFixed(0)}% de cada deal sale a 6S Global.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4" /> Estado de configuración
        </h3>
        <div className="text-sm space-y-2">
          <StatusRow
            label="Supabase auth"
            ok={supabaseConfigured}
            okMsg="Configurado · estás autenticado"
            errMsg="No detectado · login y migrations probablemente pendientes"
          />
          <StatusRow
            label="Variables de entorno"
            ok={true}
            okMsg="Verifica que SUPABASE_SERVICE_ROLE_KEY esté en Vercel"
            errMsg=""
            warn
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm mb-2">Migrations pendientes</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Aplica estas 6 migrations en orden en tu Supabase para persistencia completa:
        </p>
        <ol className="text-xs space-y-1 font-mono bg-gray-50 rounded-lg p-3">
          <li>024_eq_latam_platform.sql — tablas + RLS + seeds</li>
          <li>025_eq_latam_app_subscription.sql — app catalog + sub Eduardo</li>
          <li>026_eq_latam_partner_custom_pricing.sql — JSONB precios</li>
          <li>027_eq_latam_quotes.sql — historial cotizaciones</li>
          <li>028_eq_latam_payroll.sql — liquidación</li>
          <li>029_eq_latam_kpis.sql — KPI values</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================
// Shared helpers
// ============================================================
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-2 border-b-2 -mb-px whitespace-nowrap ${
        active ? 'border-eq-blue text-eq-blue font-medium' : 'border-transparent text-muted-foreground hover:text-eq-navy'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatusRow({ label, ok, okMsg, errMsg, warn }: { label: string; ok: boolean; okMsg: string; errMsg: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm border-b last:border-b-0 py-1.5">
      <span className="font-medium">{label}</span>
      <span className={`text-xs ${warn ? 'text-amber-700' : ok ? 'text-emerald-700' : 'text-red-700'}`}>
        {ok ? okMsg : errMsg}
      </span>
    </div>
  );
}

function roleBadge(role: UserRole): string {
  switch (role) {
    case 'admin': return 'bg-violet-100 text-violet-700';
    case 'area_lead': return 'bg-blue-100 text-blue-700';
    case 'collaborator': return 'bg-gray-100 text-gray-700';
  }
}
