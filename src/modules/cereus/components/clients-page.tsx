'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, ArrowLeft, Save, Loader2, X,
  Users, Phone, Mail, MapPin, Heart, ChevronRight,
  Sparkles, Crown, Ruler,
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
  created_at: string;
  cereus_emotional_profiles: any[];
  cereus_body_measurements: any[];
}

const VIP_TIERS = ['standard', 'silver', 'gold', 'platinum', 'privat'];
const COUNTRIES = ['MX', 'US', 'CO', 'PE', 'AR', 'CL', 'BR', 'ES', 'FR', 'IT'];
const CONTACT_PREFS = ['whatsapp', 'email', 'phone', 'in_person'];

export function CereusClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNew = searchParams.get('new') === 'true';
  const selectedId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [clients, setClients] = useState<CereusClient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(showNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'MX',
    date_of_birth: '',
    vip_tier: 'standard',
    preferred_language: 'es',
    preferred_contact: 'whatsapp',
    internal_notes: '',
    style_notes: '',
    consent_photos: false,
    consent_data: false,
    consent_marketing: false,
  });

  useEffect(() => {
    fetchMaison();
  }, []);

  useEffect(() => {
    if (maisonId) fetchClients();
  }, [maisonId, search]);

  async function fetchMaison() {
    const res = await fetch('/api/cereus/maison');
    if (res.status === 401) { router.push('/login?redirect=/apps/cereus/clients'); return; }
    const data = await res.json();
    if (!data.hasAccess) { router.push('/apps/cereus'); return; }
    setMaisonId(data.maison.id);
  }

  async function fetchClients() {
    setLoading(true);
    const params = new URLSearchParams({ maisonId: maisonId!, limit: '100' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/cereus/clients?${params}`);
    const data = await res.json();
    setClients(data.clients || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!maisonId || !form.full_name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/cereus/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maisonId, ...form }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create client');
        return;
      }

      // Reset form and refresh
      setForm({
        full_name: '', email: '', phone: '', address: '', city: '', country: 'MX',
        date_of_birth: '', vip_tier: 'standard', preferred_language: 'es',
        preferred_contact: 'whatsapp', internal_notes: '', style_notes: '',
        consent_photos: false, consent_data: false, consent_marketing: false,
      });
      setShowForm(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Clients</h1>
            <p className="text-sm text-muted-foreground">{total} total</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
        />
      </div>

      {/* New Client Form */}
      {showForm && (
        <div className="bg-card border border-cereus-gold/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cereus-gold" />
              New Client
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                  placeholder="e.g. María Elena Suárez"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">VIP Tier</label>
                <select
                  value={form.vip_tier}
                  onChange={(e) => setForm({ ...form, vip_tier: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                >
                  {VIP_TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <select
                  value={form.preferred_language}
                  onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Preference</label>
                <select
                  value={form.preferred_contact}
                  onChange={(e) => setForm({ ...form, preferred_contact: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                >
                  {CONTACT_PREFS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Style Notes</label>
                <textarea
                  value={form.style_notes}
                  onChange={(e) => setForm({ ...form, style_notes: e.target.value })}
                  rows={3}
                  placeholder="Preferences, style references, favorite designers..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Internal Notes</label>
                <textarea
                  value={form.internal_notes}
                  onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                  rows={3}
                  placeholder="Internal team notes..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 resize-none"
                />
              </div>
            </div>

            {/* Consent */}
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'consent_data', label: 'Data consent' },
                { key: 'consent_photos', label: 'Photo consent' },
                { key: 'consent_marketing', label: 'Marketing consent' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Submit */}
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
                disabled={saving || !form.full_name.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-cereus-gold" />
        </div>
      ) : clients.length === 0 && !showForm ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No clients yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by creating your first client profile.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium hover:bg-cereus-gold/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Client
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/apps/cereus/clients?id=${client.id}`}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-cereus-gold/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cereus-gold/10 flex items-center justify-center">
                  <span className="text-cereus-gold font-bold text-lg">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium group-hover:text-cereus-gold transition-colors">
                    {client.full_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
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
                        <MapPin className="w-3 h-3" /> {client.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  client.vip_tier === 'privat' ? 'bg-cereus-gold/20 text-cereus-gold' :
                  client.vip_tier === 'platinum' ? 'bg-purple-500/20 text-purple-500' :
                  client.vip_tier === 'gold' ? 'bg-yellow-500/20 text-yellow-700' :
                  client.vip_tier === 'silver' ? 'bg-gray-400/20 text-gray-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {client.vip_tier === 'privat' ? '♛ PRIVAT' : client.vip_tier.toUpperCase()}
                </span>
                {client.cereus_emotional_profiles?.length > 0 && (
                  <Heart className="w-4 h-4 text-pink-500" />
                )}
                {client.cereus_body_measurements?.some((m: any) => m.is_current) && (
                  <Ruler className="w-4 h-4 text-blue-500" />
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
