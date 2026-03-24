'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MaisonConfig } from '@/modules/cereus/types';
import {
  Shirt, Sparkles, Eye, Ruler, User, Camera, Heart,
  ChevronRight, Star, ShoppingBag, Upload, Loader2, AlertCircle,
  Save, Clock,
} from 'lucide-react';

// ─── SIZE RECOMMENDATION ENGINE ─────────────────────────────

const WOMEN_SIZES = [
  { size: 'XS', espalda: 36, busto: 88, cintura: 68, cadera: 92 },
  { size: 'S', espalda: 37, busto: 92, cintura: 72, cadera: 96 },
  { size: 'M', espalda: 38, busto: 98, cintura: 76, cadera: 102 },
  { size: 'L', espalda: 39, busto: 102, cintura: 80, cadera: 108 },
  { size: 'XL', espalda: 40, busto: 106, cintura: 88, cadera: 112 },
  { size: 'XXL', espalda: 41, busto: 110, cintura: 98, cadera: 120 },
];

const MEN_SIZES = [
  { size: 'S', pecho: 92, cintura: 78, cadera: 94 },
  { size: 'M', pecho: 98, cintura: 84, cadera: 100 },
  { size: 'L', pecho: 104, cintura: 90, cadera: 106 },
  { size: 'XL', pecho: 110, cintura: 96, cadera: 112 },
  { size: 'XXL', pecho: 116, cintura: 102, cadera: 118 },
];

function recommendSize(gender: 'mujer' | 'hombre', measurements: { busto?: number; cintura?: number; cadera?: number }) {
  if (gender === 'mujer') {
    const { busto, cintura, cadera } = measurements;
    for (const s of WOMEN_SIZES) {
      if ((!busto || busto <= s.busto) && (!cintura || cintura <= s.cintura) && (!cadera || cadera <= s.cadera)) {
        return s.size;
      }
    }
    return 'XXL';
  } else {
    const { busto: pecho, cintura, cadera } = measurements;
    for (const s of MEN_SIZES) {
      if ((!pecho || pecho <= s.pecho) && (!cintura || cintura <= s.cintura) && (!cadera || cadera <= s.cadera)) {
        return s.size;
      }
    }
    return 'XXL';
  }
}

// ─── LOADING SPINNER ────────────────────────────────────────

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      {label && <p className="text-sm text-gray-400 mt-2">{label}</p>}
    </div>
  );
}

// ─── ERROR MESSAGE ──────────────────────────────────────────

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── PORTAL TABS ────────────────────────────────────────────

const PORTAL_TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'measurements', label: 'Medidas', icon: Ruler },
  { id: 'closet', label: 'Armario', icon: Shirt },
  { id: 'advisor', label: 'Asesor', icon: Sparkles },
  { id: 'catalog', label: 'Catalogo', icon: Eye },
];

// ─── PROFILE TAB ────────────────────────────────────────────

function ProfileTab({ accentColor, clientId, maisonId }: { accentColor: string; clientId: string; maisonId: string }) {
  const [client, setClient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [palette, setPalette] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [clientRes, profileRes] = await Promise.all([
          fetch(`/api/cereus/clients?maisonId=${maisonId}&search=&limit=1&offset=0`),
          fetch(`/api/cereus/emotional-profiles?clientId=${clientId}`),
        ]);

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          // Find the specific client by id
          const found = (clientData.clients || []).find((c: any) => c.id === clientId);
          setClient(found || null);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile || null);
          setPalette(profileData.palette || null);
        }
      } catch (err) {
        setError('Error cargando tu perfil.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientId, maisonId]);

  if (loading) return <LoadingSpinner label="Cargando tu perfil..." />;
  if (error) return <ErrorMessage message={error} />;

  const clientName = client?.full_name || 'Cliente';
  const vipTier = client?.vip_tier || 'standard';
  const clientEmail = client?.email;
  const clientPhone = client?.phone;
  const createdAt = client?.created_at ? new Date(client.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : null;

  const primaryArchetype = profile?.primary_archetype || null;
  const styleTags = profile?.style_archetypes || [];
  const moodTags = profile?.mood_tags || [];
  const paletteColors = palette?.colors || [];

  const vipLabel = vipTier === 'vip' ? 'VIP' : vipTier === 'premium' ? 'VIP Premium' : vipTier === 'gold' ? 'VIP Gold' : 'Estandar';

  return (
    <div className="space-y-6">
      {/* Photo + Basic Info */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <User className="w-12 h-12 text-gray-300" />
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-display font-bold">{clientName}</h2>
            {clientEmail && <p className="text-sm text-gray-500">{clientEmail}</p>}
            {clientPhone && <p className="text-sm text-gray-500">{clientPhone}</p>}
            {createdAt && <p className="text-xs text-gray-400 mt-1">Cliente desde {createdAt}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                {vipLabel}
              </span>
              {primaryArchetype && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {primaryArchetype}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Archetype */}
      {profile ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-display font-bold text-lg mb-1">Tu Arquetipo de Estilo</h3>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {styleTags.map((tag: string, i: number) => (
              <span key={tag} className="text-sm font-medium" style={{ color: i === 0 ? accentColor : '#6B7280' }}>
                {tag}
                {i < styleTags.length - 1 && <span className="text-xs text-gray-400 ml-2">+</span>}
              </span>
            ))}
          </div>

          {profile.emotional_season && (
            <p className="text-sm text-gray-600 mb-4">
              Tu estacion emocional: <strong>{profile.emotional_season}</strong>
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {moodTags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Rasgos</p>
                <div className="flex flex-wrap gap-1">
                  {moodTags.map((t: string) => (
                    <span key={t} className="px-2 py-1 text-xs bg-gray-100 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {paletteColors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Paleta de Colores</p>
                <div className="flex flex-wrap gap-1">
                  {paletteColors.map((c: any) => (
                    <span key={c.hex} className="px-2 py-1 text-xs bg-gray-100 rounded-full flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full inline-block border" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-700">Aun no tienes un perfil emocional</p>
          <p className="text-sm text-gray-500 mt-1">Completa el cuestionario de estilo para recibir recomendaciones personalizadas.</p>
        </div>
      )}

      {/* Upload Photo for AI */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold">Actualiza tu Perfil con IA</h3>
            <p className="text-sm text-white/60 mt-1">
              Sube una foto y nuestra IA analizara tu estilo para darte recomendaciones mas precisas.
            </p>
            <button
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-black"
              style={{ backgroundColor: accentColor }}
            >
              <Upload className="w-4 h-4 inline mr-1" /> Subir Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEASUREMENTS TAB ───────────────────────────────────────

function MeasurementsTab({ accentColor, clientId }: { accentColor: string; clientId: string }) {
  const [gender] = useState<'mujer' | 'hombre'>('mujer');
  const [measurements, setMeasurements] = useState({
    busto: 0, cintura: 0, cadera: 0, espalda: 0, talleDel: 0, talleEsp: 0,
  });
  const [allVersions, setAllVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchMeasurements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cereus/measurements?clientId=${clientId}`);
      if (!res.ok) throw new Error('Error cargando medidas');
      const data = await res.json();
      const list = data.measurements || [];
      setAllVersions(list);

      // Use the most recent (first) measurement set
      const current = list.find((m: any) => m.is_current) || list[0];
      if (current) {
        setMeasurements({
          busto: current.bust || 0,
          cintura: current.waist || 0,
          cadera: current.hip || 0,
          espalda: current.shoulder_width || 0,
          talleDel: current.torso_length || 0,
          talleEsp: current.inseam || 0,
        });
      }
    } catch (err) {
      setError('Error cargando tus medidas.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchMeasurements(); }, [fetchMeasurements]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch('/api/cereus/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          bust: measurements.busto || null,
          waist: measurements.cintura || null,
          hip: measurements.cadera || null,
          shoulder_width: measurements.espalda || null,
          torso_length: measurements.talleDel || null,
          inseam: measurements.talleEsp || null,
        }),
      });
      if (!res.ok) throw new Error('Error guardando medidas');
      setSaveSuccess(true);
      // Refresh versions
      await fetchMeasurements();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Error guardando tus medidas.');
    } finally {
      setSaving(false);
    }
  };

  const suggestedSize = recommendSize(gender, measurements);

  if (loading) return <LoadingSpinner label="Cargando tus medidas..." />;

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Mis Medidas</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
              <Star className="w-4 h-4" />
              Tu talla recomendada: <strong>{suggestedSize}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'busto', label: 'Busto' },
            { key: 'cintura', label: 'Cintura' },
            { key: 'cadera', label: 'Cadera' },
            { key: 'espalda', label: 'Espalda' },
            { key: 'talleDel', label: 'Talle Delantero' },
            { key: 'talleEsp', label: 'Talle Espalda' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label} (cm)</label>
              <input
                type="number"
                value={(measurements as any)[key] || ''}
                onChange={e => setMeasurements({ ...measurements, [key]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Al modificar tus medidas, tu talla recomendada se actualiza automaticamente.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Medidas'}
          </button>
        </div>

        {saveSuccess && (
          <p className="text-xs text-green-600 mt-2">Medidas guardadas correctamente.</p>
        )}
      </div>

      {/* Measurement History */}
      {allVersions.length > 1 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Historial de Medidas
          </h3>
          <div className="space-y-2">
            {allVersions.map((v: any, i: number) => (
              <div key={v.id} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${v.is_current ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div>
                  <span className="font-medium">
                    {v.is_current ? 'Actuales' : `Version anterior`}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  B:{v.bust || '-'} C:{v.waist || '-'} Ca:{v.hip || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size chart reference */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-medium mb-3">Referencia de Tallas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left">Talla</th>
                <th className="px-3 py-2 text-center">Espalda</th>
                <th className="px-3 py-2 text-center">Busto</th>
                <th className="px-3 py-2 text-center">Cintura</th>
                <th className="px-3 py-2 text-center">Cadera</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {WOMEN_SIZES.map(s => (
                <tr key={s.size} className={s.size === suggestedSize ? 'bg-yellow-50 font-medium' : ''}>
                  <td className="px-3 py-2 font-bold">{s.size} {s.size === suggestedSize && '  ← Tu talla'}</td>
                  <td className="px-3 py-2 text-center">{s.espalda}</td>
                  <td className="px-3 py-2 text-center">{s.busto}</td>
                  <td className="px-3 py-2 text-center">{s.cintura}</td>
                  <td className="px-3 py-2 text-center">{s.cadera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CLOSET TAB ─────────────────────────────────────────────

function ClosetTab({ accentColor, clientId, maisonId }: { accentColor: string; clientId: string; maisonId: string }) {
  const [closetItems, setClosetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCloset() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
        if (!res.ok) throw new Error('Error cargando armario');
        const data = await res.json();
        const orders = data.orders || [];
        // Filter to delivered orders for this client
        const delivered = orders.filter(
          (o: any) => o.client_id === clientId && o.status === 'delivered'
        );
        setClosetItems(delivered);
      } catch (err) {
        setError('Error cargando tu armario.');
      } finally {
        setLoading(false);
      }
    }
    fetchCloset();
  }, [clientId, maisonId]);

  if (loading) return <LoadingSpinner label="Cargando tu armario..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg">Mi Armario</h3>
          <p className="text-sm text-gray-500">{closetItems.length} {closetItems.length === 1 ? 'prenda' : 'prendas'}</p>
        </div>
      </div>

      {closetItems.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Shirt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Tu armario esta vacio aun</p>
          <p className="text-sm text-gray-500 mt-1">Las prendas se agregan cuando tus pedidos son entregados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {closetItems.map((order: any) => {
            const garmentName = order.variant?.garment?.name || order.variant?.variant_name || 'Prenda';
            const variantName = order.variant?.variant_name || '';
            const garmentCode = order.variant?.garment?.code || '';
            const category = order.variant?.garment?.category || '';

            return (
              <div key={order.id} className="bg-white rounded-xl border overflow-hidden group">
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden flex items-center justify-center">
                  <Shirt className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">{garmentName}</p>
                  {variantName && variantName !== garmentName && (
                    <p className="text-xs text-gray-500">{variantName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {category && <span className="text-xs text-gray-500 capitalize">{category}</span>}
                    {garmentCode && <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{garmentCode}</span>}
                  </div>
                  {order.delivered_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Entregado: {new Date(order.delivered_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADVISOR TAB (STYLE RECOMMENDATIONS) ────────────────────

function AdvisorTab({ accentColor, clientId, maisonId }: { accentColor: string; clientId: string; maisonId: string }) {
  const [closetItems, setClosetItems] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cereus/orders?maisonId=${maisonId}`);
        if (!res.ok) throw new Error('Error cargando datos');
        const data = await res.json();
        const orders = data.orders || [];
        const delivered = orders.filter(
          (o: any) => o.client_id === clientId && o.status === 'delivered'
        );
        setClosetItems(delivered);
      } catch (err) {
        setError('Error cargando datos del asesor.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientId, maisonId]);

  const handleGetRecommendations = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cereus/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          maisonId,
          occasion: 'everyday',
          season: 'all',
          language: 'es',
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error generando recomendaciones');
      }
      const data = await res.json();
      setRecommendations(data.parsed || null);
    } catch (err: any) {
      setError(err.message || 'Error generando recomendaciones.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Cargando asesor de estilo..." />;

  return (
    <div className="space-y-8">
      {error && <ErrorMessage message={error} />}

      {/* Recommendations from Closet */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shirt className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="font-display font-bold text-lg">Basado en tu Estilo</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Combinaciones recomendadas con las prendas que ya tienes.</p>

        {closetItems.length > 0 ? (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start gap-4">
              <div className="flex -space-x-3">
                {closetItems.slice(0, 2).map((order: any, i: number) => (
                  <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white bg-gray-100 flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-gray-300" />
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {closetItems.length} {closetItems.length === 1 ? 'prenda' : 'prendas'} en tu armario
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {closetItems.map((o: any) => o.variant?.garment?.name || o.variant?.variant_name || 'Prenda').join(', ')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">Agrega prendas a tu armario para recibir recomendaciones.</p>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="font-display font-bold text-lg">Del Catalogo</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Prendas del catalogo que complementan tu estilo y armario actual.</p>

        {!recommendations && !aiLoading && (
          <div className="bg-white rounded-xl border p-6 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-600 mb-3">Genera recomendaciones personalizadas con inteligencia artificial.</p>
            <button
              onClick={handleGetRecommendations}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Obtener Recomendaciones
            </button>
          </div>
        )}

        {aiLoading && (
          <div className="bg-white rounded-xl border p-8">
            <LoadingSpinner label="Generando recomendaciones con IA..." />
          </div>
        )}

        {recommendations && (
          <div className="space-y-4">
            {recommendations.reasoning && (
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-700">{recommendations.reasoning}</p>
              </div>
            )}

            {recommendations.recommended_garments?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.recommended_garments.map((item: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border overflow-hidden">
                    <div className="p-4">
                      <p className="text-sm font-medium">{item.name || item.garment_name || `Prenda ${i + 1}`}</p>
                      {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                      {item.price > 0 && (
                        <p className="text-sm font-medium mt-2" style={{ color: accentColor }}>
                          S/{item.price?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recommendations.recommended_outfits?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Outfits Sugeridos</h4>
                {recommendations.recommended_outfits.map((outfit: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <p className="text-sm font-medium">{outfit.name || `Outfit ${i + 1}`}</p>
                    {outfit.description && <p className="text-xs text-gray-500 mt-1">{outfit.description}</p>}
                    {outfit.pieces && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {outfit.pieces.map((p: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleGetRecommendations}
              className="text-sm font-medium hover:underline"
              style={{ color: accentColor }}
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Regenerar recomendaciones
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CATALOG TAB ────────────────────────────────────────────

function CatalogTab({ accentColor, maisonId }: { accentColor: string; maisonId: string }) {
  const [garments, setGarments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGarments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cereus/garments?maisonId=${maisonId}`);
        if (!res.ok) throw new Error('Error cargando catalogo');
        const data = await res.json();
        const all = data.garments || [];
        // Filter to garments available for clients
        const available = all.filter(
          (g: any) =>
            (g.status === 'approved' || g.status === 'in_production') &&
            g.base_price && g.base_price > 0
        );
        setGarments(available);
      } catch (err) {
        setError('Error cargando el catalogo.');
      } finally {
        setLoading(false);
      }
    }
    fetchGarments();
  }, [maisonId]);

  if (loading) return <LoadingSpinner label="Cargando catalogo..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">Catalogo</h3>
          <p className="text-sm text-gray-500">
            {garments.length} {garments.length === 1 ? 'prenda disponible' : 'prendas disponibles'}
          </p>
        </div>
      </div>

      {garments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Eye className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">No hay prendas disponibles en este momento</p>
          <p className="text-sm text-gray-500 mt-1">Vuelve pronto para ver nuevas colecciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {garments.map((garment: any) => {
            const imageUrl = garment.images?.[0] || null;
            const collectionName = garment.collection?.name || null;

            return (
              <div key={garment.id} className="bg-white rounded-xl border overflow-hidden group cursor-pointer">
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={garment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Shirt className="w-12 h-12 text-gray-300" />
                  )}
                  {collectionName && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 text-gray-700 backdrop-blur-sm">
                      {collectionName}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">{garment.name}</p>
                  {garment.category && (
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{garment.category}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-medium" style={{ color: accentColor }}>
                      S/{garment.base_price?.toLocaleString()}
                    </p>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <button
                    className="w-full mt-2 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    Consultar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN CLIENT PORTAL ─────────────────────────────────────

export function ClientPortal({
  maisonId,
  maisonName,
  clientId,
  config,
}: {
  maisonId: string;
  maisonName: string;
  clientId: string;
  config: MaisonConfig;
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const accentColor = config.branding?.accent_color || '#C9A84C';
  const primaryColor = config.branding?.primary_color || '#0A0A0A';

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root { --maison-primary: ${primaryColor}; --maison-accent: ${accentColor}; }
      `}</style>

      {/* Header */}
      <header className="bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold tracking-[0.2em] uppercase">{maisonName}</h1>
          <span className="text-xs text-white/50">Mi Portal</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto py-2">
          {PORTAL_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              style={activeTab === id ? { backgroundColor: accentColor } : {}}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'profile' && <ProfileTab accentColor={accentColor} clientId={clientId} maisonId={maisonId} />}
        {activeTab === 'measurements' && <MeasurementsTab accentColor={accentColor} clientId={clientId} />}
        {activeTab === 'closet' && <ClosetTab accentColor={accentColor} clientId={clientId} maisonId={maisonId} />}
        {activeTab === 'advisor' && <AdvisorTab accentColor={accentColor} clientId={clientId} maisonId={maisonId} />}
        {activeTab === 'catalog' && <CatalogTab accentColor={accentColor} maisonId={maisonId} />}
      </main>
    </div>
  );
}
