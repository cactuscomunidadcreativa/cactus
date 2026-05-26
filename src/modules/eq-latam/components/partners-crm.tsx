'use client';

import { useEffect, useState } from 'react';
import { Plus, Mail, Edit2, TrendingUp, Globe, X } from 'lucide-react';
import {
  PARTNERS,
  PARTNER_TIERS,
  formatPriceUSD,
  getTierConfig,
  suggestTierForYtdPax,
} from '..';
import type { Partner, PartnerTier } from '..';
import { PartnerContactsPanel } from './partner-contacts-panel';
import {
  fetchPartners,
  upsertPartner,
  deactivatePartner as deactivatePartnerDb,
} from '../lib/eq-db';

const COUNTRY_LABELS: Record<string, string> = {
  PE: '🇵🇪 Perú',
  CO: '🇨🇴 Colombia',
  MX: '🇲🇽 México',
  OTHER: '🌎 Otro',
};

/**
 * Partners CRM — Eduardo only. List, create, edit, deactivate partners.
 *
 * Data: tries Supabase via eq-db helpers, falls back to in-memory PARTNERS
 * when Supabase is not configured (dev) or the user has no access.
 */
export function PartnersCrm() {
  const [partners, setPartners] = useState<Partner[]>(PARTNERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial load — fetch from DB (or seeds if no Supabase configured)
  useEffect(() => {
    let cancelled = false;
    fetchPartners().then(rows => {
      if (!cancelled && rows.length > 0) setPartners(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (p: Partner) => {
    setSaving(true);
    const saved = await upsertPartner(p);
    if (saved) {
      setPartners(prev => {
        const exists = prev.find(x => x.id === saved.id);
        if (exists) return prev.map(x => (x.id === saved.id ? saved : x));
        return [...prev, saved];
      });
    }
    setSaving(false);
    setEditingId(null);
    setCreating(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar este partner? La historia se conserva, no aparecerá en nuevos deals.')) return;
    const ok = await deactivatePartnerDb(id);
    if (ok) {
      setPartners(prev => prev.map(p => (p.id === id ? { ...p, active: false } : p)));
    }
  };

  const editing = editingId ? partners.find(p => p.id === editingId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Lista de Partners</h3>
          <p className="text-xs text-muted-foreground">
            {partners.filter(p => p.active).length} activos · {partners.filter(p => !p.active).length} inactivos
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="text-xs font-medium px-3 py-1.5 bg-eq-blue text-white rounded-lg flex items-center gap-1.5 hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" /> Crear partner
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Partner</th>
              <th className="text-left px-4 py-2 font-medium">País</th>
              <th className="text-left px-4 py-2 font-medium">Tier</th>
              <th className="text-right px-4 py-2 font-medium">YTD PAX</th>
              <th className="text-right px-4 py-2 font-medium">YTD Revenue</th>
              <th className="text-right px-4 py-2 font-medium">CAC absorbido</th>
              <th className="text-right px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(p => {
              const tier = getTierConfig(p.tier);
              const suggested = suggestTierForYtdPax(p.ytd_pax);
              const tierMatchesYtd = suggested === p.tier;
              return (
                <tr
                  key={p.id}
                  className={`border-t ${!p.active ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-xs">{COUNTRY_LABELS[p.country]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadgeColor(p.tier)}`}>
                      {tier.label} −{(tier.discount_pct * 100).toFixed(0)}%
                    </span>
                    {!tierMatchesYtd && p.active && (
                      <span
                        className="text-xs text-amber-600 ml-1.5"
                        title={`Su YTD PAX sugiere tier ${suggested}`}
                      >
                        <TrendingUp className="w-3 h-3 inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{p.ytd_pax}</td>
                  <td className="px-4 py-3 text-right">{formatPriceUSD(p.ytd_revenue)}</td>
                  <td className="px-4 py-3 text-right">{formatPriceUSD(p.ytd_cac_absorbed)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(p.id)}
                        className="p-1.5 hover:bg-gray-100 rounded text-muted-foreground hover:text-eq-blue"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled
                        className="p-1.5 hover:bg-gray-100 rounded text-muted-foreground opacity-30 cursor-not-allowed"
                        title="Invitar contacto (próximo: tarea #15)"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      {p.active && (
                        <button
                          onClick={() => handleDeactivate(p.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600"
                          title="Desactivar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {partners.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay partners. Crea uno con "Crear partner".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tier reference */}
      <div className="bg-eq-cream/50 border rounded-xl p-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Globe className="w-4 h-4" /> Tier system
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          {PARTNER_TIERS.map(t => (
            <div key={t.tier} className="bg-white border rounded-lg p-2">
              <div className="font-semibold flex items-center justify-between">
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tierBadgeColor(t.tier)}`}>
                  −{(t.discount_pct * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5">{t.description}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Bonus por evento: +3% si 10-14 PAX · +5% si 15+ PAX. Tope combinado: −35%.
        </p>
      </div>

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <PartnerForm
          partner={
            editing ?? {
              id: '',
              name: '',
              country: 'OTHER',
              tier: 'EXPLORER',
              ytd_pax: 0,
              ytd_revenue: 0,
              ytd_cac_absorbed: 0,
              active_since: new Date().toISOString().slice(0, 10),
              active: true,
            }
          }
          isNew={creating}
          onSave={handleSave}
          onCancel={() => {
            setEditingId(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Partner form (modal)
// ============================================================
function PartnerForm({
  partner,
  isNew,
  onSave,
  onCancel,
}: {
  partner: Partner;
  isNew: boolean;
  onSave: (p: Partner) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partner>(partner);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const finalForm = isNew
      ? { ...form, id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
      : form;
    onSave(finalForm);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            {isNew ? 'Nuevo partner' : `Editar: ${partner.name}`}
          </h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-eq-navy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <FormField label="Nombre">
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full text-sm border rounded-lg px-3 py-2"
              placeholder="Talent Advisors"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="País">
              <select
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value as Partner['country'] })}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
              >
                <option value="PE">🇵🇪 Perú</option>
                <option value="CO">🇨🇴 Colombia</option>
                <option value="MX">🇲🇽 México</option>
                <option value="OTHER">🌎 Otro</option>
              </select>
            </FormField>

            <FormField label="Tier">
              <select
                value={form.tier}
                onChange={e => setForm({ ...form, tier: e.target.value as PartnerTier })}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
              >
                {PARTNER_TIERS.map(t => (
                  <option key={t.tier} value={t.tier}>
                    {t.label} (−{(t.discount_pct * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Activo desde">
            <input
              type="date"
              value={form.active_since.slice(0, 10)}
              onChange={e => setForm({ ...form, active_since: e.target.value })}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
          </FormField>

          {!isNew && (
            <>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <FormField label="YTD PAX">
                  <input
                    type="number"
                    min={0}
                    value={form.ytd_pax}
                    onChange={e => setForm({ ...form, ytd_pax: Number(e.target.value) })}
                    className="w-full text-sm border rounded-lg px-3 py-2"
                  />
                </FormField>
                <FormField label="YTD Revenue $">
                  <input
                    type="number"
                    min={0}
                    value={form.ytd_revenue}
                    onChange={e => setForm({ ...form, ytd_revenue: Number(e.target.value) })}
                    className="w-full text-sm border rounded-lg px-3 py-2"
                  />
                </FormField>
                <FormField label="CAC absorb. $">
                  <input
                    type="number"
                    min={0}
                    value={form.ytd_cac_absorbed}
                    onChange={e => setForm({ ...form, ytd_cac_absorbed: Number(e.target.value) })}
                    className="w-full text-sm border rounded-lg px-3 py-2"
                  />
                </FormField>
              </div>
              <PartnerContactsPanel partner={form} />
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-sm px-4 py-2 bg-eq-blue text-white rounded-lg hover:opacity-90"
            >
              {isNew ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

function tierBadgeColor(tier: PartnerTier): string {
  switch (tier) {
    case 'EXPLORER':  return 'bg-gray-100 text-gray-700';
    case 'GROWTH':    return 'bg-blue-100 text-blue-700';
    case 'STRATEGIC': return 'bg-violet-100 text-violet-700';
    case 'ELITE':     return 'bg-amber-100 text-amber-700';
  }
}
