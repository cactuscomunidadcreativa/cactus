'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Ruler, Heart, Save, Loader2, Plus, X,
  Mail, Phone, MapPin, Calendar, Crown, Clock,
  ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';

interface CereusClient {
  id: string;
  maison_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  date_of_birth: string | null;
  vip_tier: string;
  preferred_language: string;
  preferred_contact: string;
  internal_notes: string | null;
  style_notes: string | null;
  consent_photos: boolean;
  consent_data: boolean;
  consent_marketing: boolean;
  role: string;
  created_at: string;
}

interface Measurement {
  id: string;
  client_id: string;
  measured_by: string | null;
  bust: number | null;
  underbust: number | null;
  waist: number | null;
  high_hip: number | null;
  hip: number | null;
  shoulder_width: number | null;
  arm_length: number | null;
  wrist: number | null;
  neck: number | null;
  torso_length: number | null;
  inseam: number | null;
  outseam: number | null;
  thigh: number | null;
  knee: number | null;
  calf: number | null;
  ankle: number | null;
  height: number | null;
  weight: number | null;
  shoe_size: string | null;
  bra_size: string | null;
  body_shape: string | null;
  posture_notes: string | null;
  notes: string | null;
  fit_preferences: Record<string, any>;
  is_current: boolean;
  created_at: string;
}

const BODY_SHAPES = [
  { value: '', label: 'Not set' },
  { value: 'hourglass', label: 'Hourglass' },
  { value: 'pear', label: 'Pear' },
  { value: 'apple', label: 'Apple' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'inverted_triangle', label: 'Inverted Triangle' },
  { value: 'athletic', label: 'Athletic' },
];

const MEASUREMENT_GROUPS = [
  {
    title: 'Torso',
    icon: '👗',
    fields: [
      { key: 'bust', label: 'Bust', unit: 'cm' },
      { key: 'underbust', label: 'Underbust', unit: 'cm' },
      { key: 'waist', label: 'Waist', unit: 'cm' },
      { key: 'high_hip', label: 'High Hip', unit: 'cm' },
      { key: 'hip', label: 'Hip', unit: 'cm' },
      { key: 'shoulder_width', label: 'Shoulder Width', unit: 'cm' },
      { key: 'neck', label: 'Neck', unit: 'cm' },
      { key: 'torso_length', label: 'Torso Length', unit: 'cm' },
    ],
  },
  {
    title: 'Arms',
    icon: '💪',
    fields: [
      { key: 'arm_length', label: 'Arm Length', unit: 'cm' },
      { key: 'wrist', label: 'Wrist', unit: 'cm' },
    ],
  },
  {
    title: 'Legs',
    icon: '🦵',
    fields: [
      { key: 'inseam', label: 'Inseam', unit: 'cm' },
      { key: 'outseam', label: 'Outseam', unit: 'cm' },
      { key: 'thigh', label: 'Thigh', unit: 'cm' },
      { key: 'knee', label: 'Knee', unit: 'cm' },
      { key: 'calf', label: 'Calf', unit: 'cm' },
      { key: 'ankle', label: 'Ankle', unit: 'cm' },
    ],
  },
  {
    title: 'General',
    icon: '📏',
    fields: [
      { key: 'height', label: 'Height', unit: 'cm' },
      { key: 'weight', label: 'Weight', unit: 'kg' },
    ],
  },
];

function MeasurementInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function ClientDetail({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<CereusClient | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeTab, setActiveTab] = useState<'measurements' | 'profile'>('measurements');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Measurement form state
  const [mForm, setMForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function fetchData() {
    try {
      setLoading(true);

      // Get maison first
      const maisonRes = await fetch('/api/cereus/maison');
      const maisonData = await maisonRes.json();
      if (!maisonData.hasAccess) {
        router.push('/apps/cereus');
        return;
      }

      // Get clients to find this one
      const clientsRes = await fetch(`/api/cereus/clients?maisonId=${maisonData.maison.id}&limit=1000`);
      const clientsData = await clientsRes.json();
      const found = clientsData.clients?.find((c: any) => c.id === clientId);
      if (!found) {
        router.push('/apps/cereus/clients');
        return;
      }
      setClient(found);

      // Get measurements
      const measRes = await fetch(`/api/cereus/measurements?clientId=${clientId}`);
      const measData = await measRes.json();
      setMeasurements(measData.measurements || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startNewMeasurement() {
    // Pre-fill with current measurement values if any
    const current = measurements.find(m => m.is_current);
    const initial: Record<string, string> = {};
    if (current) {
      const fields = MEASUREMENT_GROUPS.flatMap(g => g.fields);
      fields.forEach(f => {
        const val = (current as any)[f.key];
        if (val !== null && val !== undefined) {
          initial[f.key] = String(val);
        }
      });
      if (current.shoe_size) initial.shoe_size = current.shoe_size;
      if (current.bra_size) initial.bra_size = current.bra_size;
      if (current.body_shape) initial.body_shape = current.body_shape;
      if (current.posture_notes) initial.posture_notes = current.posture_notes;
      if (current.notes) initial.notes = current.notes;
    }
    setMForm(initial);
    setShowForm(true);
  }

  async function handleSaveMeasurement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = { clientId };

      // Convert numeric fields
      const numericFields = MEASUREMENT_GROUPS.flatMap(g => g.fields).map(f => f.key);
      numericFields.forEach(key => {
        if (mForm[key] && mForm[key].trim()) {
          payload[key] = parseFloat(mForm[key]);
        }
      });

      // Text fields
      if (mForm.shoe_size) payload.shoe_size = mForm.shoe_size;
      if (mForm.bra_size) payload.bra_size = mForm.bra_size;
      if (mForm.body_shape) payload.body_shape = mForm.body_shape;
      if (mForm.posture_notes) payload.posture_notes = mForm.posture_notes;
      if (mForm.notes) payload.notes = mForm.notes;
      if (mForm.fit_ease || mForm.fit_length || mForm.fit_shoulder) {
        payload.fit_preferences = {
          ease: mForm.fit_ease || undefined,
          length_preference: mForm.fit_length || undefined,
          shoulder_fit: mForm.fit_shoulder || undefined,
        };
      }

      const res = await fetch('/api/cereus/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to save measurements');
        return;
      }

      setShowForm(false);
      setMForm({});
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  if (!client) return null;

  const currentMeasurement = measurements.find(m => m.is_current);
  const pastMeasurements = measurements.filter(m => !m.is_current);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/apps/cereus/clients"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-cereus-gold/10 flex items-center justify-center">
              <span className="text-cereus-gold font-bold text-2xl">
                {client.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{client.full_name}</h1>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  client.vip_tier === 'privat' ? 'bg-cereus-gold/20 text-cereus-gold' :
                  client.vip_tier === 'platinum' ? 'bg-purple-500/20 text-purple-500' :
                  client.vip_tier === 'gold' ? 'bg-yellow-500/20 text-yellow-700' :
                  client.vip_tier === 'silver' ? 'bg-gray-400/20 text-gray-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {client.vip_tier === 'privat' ? '♛ PRIVAT' : client.vip_tier.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {client.phone}
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {client.city}, {client.country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('measurements')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'measurements'
              ? 'border-cereus-gold text-cereus-gold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Measurements
          {currentMeasurement && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-cereus-gold/10 text-cereus-gold">
              ✓
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-cereus-gold text-cereus-gold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4 h-4" />
          Emotional Profile
        </button>
      </div>

      {/* Content */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          {/* Current Measurement Summary */}
          {currentMeasurement && !showForm && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-cereus-gold" />
                  <h3 className="font-semibold">Current Measurements</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(currentMeasurement.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={startNewMeasurement}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cereus-gold text-white rounded-lg hover:bg-cereus-gold/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Update
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {MEASUREMENT_GROUPS.flatMap(g => g.fields).map(f => {
                  const val = (currentMeasurement as any)[f.key];
                  if (val === null || val === undefined) return null;
                  return (
                    <div key={f.key} className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-lg font-display font-bold">{val}</p>
                      <p className="text-[10px] text-muted-foreground">{f.unit}</p>
                    </div>
                  );
                }).filter(Boolean)}

                {currentMeasurement.shoe_size && (
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Shoe Size</p>
                    <p className="text-lg font-display font-bold">{currentMeasurement.shoe_size}</p>
                  </div>
                )}
                {currentMeasurement.bra_size && (
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Bra Size</p>
                    <p className="text-lg font-display font-bold">{currentMeasurement.bra_size}</p>
                  </div>
                )}
                {currentMeasurement.body_shape && (
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Body Shape</p>
                    <p className="text-lg font-display font-bold capitalize">{currentMeasurement.body_shape.replace('_', ' ')}</p>
                  </div>
                )}
              </div>

              {(currentMeasurement.posture_notes || currentMeasurement.notes) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentMeasurement.posture_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Posture Notes</p>
                      <p className="text-sm">{currentMeasurement.posture_notes}</p>
                    </div>
                  )}
                  {currentMeasurement.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{currentMeasurement.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No measurements yet */}
          {!currentMeasurement && !showForm && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Ruler className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No measurements yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Take body measurements for {client.full_name} to enable pattern making and garment fitting.
              </p>
              <button
                onClick={() => { setMForm({}); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90 transition-colors"
              >
                <Ruler className="w-4 h-4" />
                Take Measurements
              </button>
            </div>
          )}

          {/* Measurement Form */}
          {showForm && (
            <form onSubmit={handleSaveMeasurement} className="bg-card border border-cereus-gold/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-cereus-gold" />
                  {currentMeasurement ? 'Update Measurements' : 'New Measurements'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                  {error}
                </div>
              )}

              {/* Measurement Groups */}
              {MEASUREMENT_GROUPS.map(group => (
                <div key={group.title}>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span>{group.icon}</span> {group.title}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.fields.map(f => (
                      <MeasurementInput
                        key={f.key}
                        label={f.label}
                        unit={f.unit}
                        value={mForm[f.key] || ''}
                        onChange={(v) => setMForm({ ...mForm, [f.key]: v })}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Additional fields */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <span>📋</span> Additional
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Shoe Size</label>
                    <input
                      type="text"
                      value={mForm.shoe_size || ''}
                      onChange={(e) => setMForm({ ...mForm, shoe_size: e.target.value })}
                      placeholder="e.g. 38 EU"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Bra Size</label>
                    <input
                      type="text"
                      value={mForm.bra_size || ''}
                      onChange={(e) => setMForm({ ...mForm, bra_size: e.target.value })}
                      placeholder="e.g. 34C"
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Body Shape</label>
                    <select
                      value={mForm.body_shape || ''}
                      onChange={(e) => setMForm({ ...mForm, body_shape: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    >
                      {BODY_SHAPES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fit Preferences */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <span>✂️</span> Fit Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Ease</label>
                    <select
                      value={mForm.fit_ease || ''}
                      onChange={(e) => setMForm({ ...mForm, fit_ease: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    >
                      <option value="">Not set</option>
                      <option value="fitted">Fitted</option>
                      <option value="comfort">Comfort</option>
                      <option value="relaxed">Relaxed</option>
                      <option value="oversized">Oversized</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Length Preference</label>
                    <select
                      value={mForm.fit_length || ''}
                      onChange={(e) => setMForm({ ...mForm, fit_length: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    >
                      <option value="">Not set</option>
                      <option value="short">Short</option>
                      <option value="regular">Regular</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Shoulder Fit</label>
                    <select
                      value={mForm.fit_shoulder || ''}
                      onChange={(e) => setMForm({ ...mForm, fit_shoulder: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                    >
                      <option value="">Not set</option>
                      <option value="natural">Natural</option>
                      <option value="extended">Extended</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Posture Notes</label>
                  <textarea
                    value={mForm.posture_notes || ''}
                    onChange={(e) => setMForm({ ...mForm, posture_notes: e.target.value })}
                    rows={3}
                    placeholder="Posture observations, asymmetries, considerations..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea
                    value={mForm.notes || ''}
                    onChange={(e) => setMForm({ ...mForm, notes: e.target.value })}
                    rows={3}
                    placeholder="General measurement notes, session observations..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Measurements
                </button>
              </div>
            </form>
          )}

          {/* Measurement History */}
          {pastMeasurements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History ({pastMeasurements.length} previous)
              </h3>
              <div className="space-y-2">
                {pastMeasurements.map(m => (
                  <div
                    key={m.id}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedHistory(expandedHistory === m.id ? null : m.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(m.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const count = MEASUREMENT_GROUPS.flatMap(g => g.fields)
                              .filter(f => (m as any)[f.key] !== null).length;
                            return `${count} measurements`;
                          })()}
                        </span>
                      </div>
                      {expandedHistory === m.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {expandedHistory === m.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {MEASUREMENT_GROUPS.flatMap(g => g.fields).map(f => {
                            const val = (m as any)[f.key];
                            if (val === null || val === undefined) return null;
                            const currentVal = currentMeasurement ? (currentMeasurement as any)[f.key] : null;
                            const diff = currentVal && val ? (currentVal - val).toFixed(1) : null;
                            return (
                              <div key={f.key} className="text-center p-2 bg-muted/30 rounded">
                                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                                <p className="text-sm font-semibold">{val}</p>
                                {diff && parseFloat(diff) !== 0 && (
                                  <p className={`text-[10px] font-medium ${
                                    parseFloat(diff) > 0 ? 'text-red-500' : 'text-green-500'
                                  }`}>
                                    {parseFloat(diff) > 0 ? '+' : ''}{diff}
                                  </p>
                                )}
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emotional Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Emotional Profile</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The emotional profile questionnaire captures {client.full_name}&apos;s aesthetic sensibility and emotional connection to fashion.
          </p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
      )}
    </div>
  );
}
