'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Brain, Sparkles, Loader2, Search,
  Palette, Send, ShoppingBag, ExternalLink,
  ChevronDown, Check,
} from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  vip_tier: string;
  cereus_emotional_profiles?: { id: string; primary_archetype: string }[];
}

interface Collection {
  id: string;
  name: string;
  season: string;
  year: number;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const SEASON_OPTIONS = [
  { value: 'spring_summer', label: 'Primavera / Verano' },
  { value: 'fall_winter', label: 'Otono / Invierno' },
  { value: 'resort', label: 'Resort' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'bridal', label: 'Bridal' },
];

const OCCASION_OPTIONS = [
  { value: 'gala', label: 'Gala' },
  { value: 'business', label: 'Negocios' },
  { value: 'cocktail', label: 'Coctel' },
  { value: 'casual_elevated', label: 'Casual Elevado' },
  { value: 'bridal', label: 'Nupcial' },
  { value: 'travel', label: 'Viaje' },
];

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
];

export function AdvisorPage() {
  const router = useRouter();
  const [maisonId, setMaisonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Client selector
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientProfile, setClientProfile] = useState<AnyRecord | null>(null);

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);

  // Recommendations
  const [recsOccasion, setRecsOccasion] = useState('cocktail');
  const [recsSeason, setRecsSeason] = useState('fall_winter');
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState<AnyRecord | null>(null);

  // Collection Brief
  const [briefSeason, setBriefSeason] = useState('fall_winter');
  const [briefYear, setBriefYear] = useState(new Date().getFullYear().toString());
  const [briefPieces, setBriefPieces] = useState('12');
  const [briefTrends, setBriefTrends] = useState('');
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [collectionBrief, setCollectionBrief] = useState<AnyRecord | null>(null);

  // RAMONA Campaign
  const [campaignCollection, setCampaignCollection] = useState('');
  const [campaignPlatforms, setCampaignPlatforms] = useState<string[]>(['instagram']);
  const [campaignCount, setCampaignCount] = useState('10');
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<AnyRecord | null>(null);

  // Recommendation history
  const [recsHistory, setRecsHistory] = useState<AnyRecord[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const maisonRes = await fetch('/api/cereus/maison');
      const maisonData = await maisonRes.json();
      if (!maisonData.hasAccess) {
        router.push('/apps/cereus');
        return;
      }
      setMaisonId(maisonData.maison.id);

      // Load clients + collections in parallel
      const [clientsRes, collectionsRes] = await Promise.all([
        fetch(`/api/cereus/clients?maisonId=${maisonData.maison.id}&limit=100`),
        fetch(`/api/cereus/collections?maisonId=${maisonData.maison.id}`),
      ]);

      const clientsData = await clientsRes.json();
      setClients(clientsData.clients || []);

      const collectionsData = await collectionsRes.json();
      setCollections(collectionsData.collections || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function selectClient(client: Client) {
    setSelectedClient(client);
    setShowClientDropdown(false);
    setClientSearch('');
    setRecommendations(null);

    // Load emotional profile
    try {
      const res = await fetch(`/api/cereus/emotional-profiles?clientId=${client.id}`);
      const data = await res.json();
      setClientProfile(data.profile);
    } catch {
      setClientProfile(null);
    }
  }

  async function generateRecommendations() {
    if (!selectedClient || !maisonId) return;
    setGeneratingRecs(true);
    setRecommendations(null);
    try {
      const res = await fetch('/api/cereus/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          maisonId,
          occasion: recsOccasion,
          season: recsSeason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.parsed || data.recommendation);
        setRecsHistory(prev => [data.recommendation, ...prev]);
      } else {
        setRecommendations({ error: data.error });
      }
    } catch (err: unknown) {
      setRecommendations({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      setGeneratingRecs(false);
    }
  }

  async function generateCollectionBrief() {
    if (!maisonId) return;
    setGeneratingBrief(true);
    setCollectionBrief(null);
    try {
      const res = await fetch('/api/cereus/ai/collection-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          season: briefSeason,
          year: briefYear,
          targetPieces: parseInt(briefPieces) || 12,
          trendContext: briefTrends || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCollectionBrief(data.brief);
      } else {
        setCollectionBrief({ error: data.error });
      }
    } catch (err: unknown) {
      setCollectionBrief({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      setGeneratingBrief(false);
    }
  }

  async function createCollectionFromBrief() {
    if (!maisonId || !collectionBrief) return;
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/cereus/ai/collection-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          season: briefSeason,
          year: briefYear,
          targetPieces: parseInt(briefPieces) || 12,
          trendContext: briefTrends || undefined,
          autoCreate: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.collection) {
        setCollections(prev => [data.collection, ...prev]);
        setCollectionBrief({ ...collectionBrief, created: true, collectionId: data.collection.id });
      }
    } catch {
      // Silent
    } finally {
      setGeneratingBrief(false);
    }
  }

  async function generateCampaign() {
    if (!maisonId || !campaignCollection) return;
    setGeneratingCampaign(true);
    setCampaignResult(null);
    try {
      const res = await fetch('/api/cereus/ai/ramona-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: campaignCollection,
          maisonId,
          platforms: campaignPlatforms,
          count: parseInt(campaignCount) || 10,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCampaignResult(data);
      } else {
        setCampaignResult({ error: data.error });
      }
    } catch (err: unknown) {
      setCampaignResult({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      setGeneratingCampaign(false);
    }
  }

  function togglePlatform(platform: string) {
    setCampaignPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  }

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/apps/cereus" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Advisor</h1>
          <p className="text-sm text-muted-foreground">Inteligencia emocional & recomendaciones de estilo</p>
        </div>
      </div>

      {/* Section A: Client Selector */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Seleccionar Cliente</h3>

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={selectedClient ? selectedClient.full_name : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setSelectedClient(null);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Buscar cliente..."
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
              />
            </div>
            {selectedClient && (
              <button
                onClick={() => { setSelectedClient(null); setClientProfile(null); setRecommendations(null); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cambiar
              </button>
            )}
          </div>

          {showClientDropdown && !selectedClient && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No se encontraron clientes</p>
              ) : (
                filteredClients.map(client => {
                  const hasProfile = client.cereus_emotional_profiles && client.cereus_emotional_profiles.length > 0;
                  return (
                    <button
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="w-full text-left p-3 hover:bg-muted/50 flex items-center justify-between border-b border-border last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium">{client.full_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{client.vip_tier}</span>
                      </div>
                      {hasProfile && (
                        <span className="text-xs bg-cereus-gold/10 text-cereus-gold px-2 py-0.5 rounded">
                          Perfil IA
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Client Profile Preview */}
        {selectedClient && clientProfile && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs bg-cereus-gold/10 text-cereus-gold px-2 py-1 rounded-full font-medium">
                {clientProfile.primary_archetype?.replace(/_/g, ' ')}
              </span>
              {clientProfile.style_archetypes?.slice(1, 3).map((a: string) => (
                <span key={a} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">
                {clientProfile.emotional_season}
              </span>
            </div>
            {clientProfile.style_summary && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                {clientProfile.style_summary}
              </p>
            )}
          </div>
        )}

        {selectedClient && !clientProfile && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Este cliente no tiene perfil emocional.{' '}
              <Link href={`/apps/cereus/clients?id=${selectedClient.id}`} className="underline">
                Completar cuestionario
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Section B: AI Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tool 1: Style Recommendations */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cereus-gold" />
            <h3 className="font-medium text-sm">Recomendaciones de Estilo</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground">Ocasion</label>
              <select
                value={recsOccasion}
                onChange={(e) => setRecsOccasion(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              >
                {OCCASION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Temporada</label>
              <select
                value={recsSeason}
                onChange={(e) => setRecsSeason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              >
                {SEASON_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateRecommendations}
            disabled={!selectedClient || !clientProfile || generatingRecs}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 transition-colors"
          >
            {generatingRecs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generatingRecs ? 'Generando...' : 'Generar'}
          </button>

          {recommendations && !recommendations.error && (
            <div className="mt-4 space-y-3">
              {recommendations.recommended_garments?.map((g: AnyRecord, i: number) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{g.garment_id || g.name || `Prenda ${i + 1}`}</p>
                  <p className="text-xs text-muted-foreground mt-1">{g.reason}</p>
                </div>
              ))}
              {recommendations.reasoning && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
                  {recommendations.reasoning}
                </p>
              )}
            </div>
          )}

          {recommendations?.error && (
            <p className="mt-3 text-xs text-red-500">{recommendations.error}</p>
          )}
        </div>

        {/* Tool 2: Collection Brief */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-cereus-bordeaux" />
            <h3 className="font-medium text-sm">Brief de Coleccion</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Temporada</label>
                <select
                  value={briefSeason}
                  onChange={(e) => setBriefSeason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
                >
                  {SEASON_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ano</label>
                <input
                  type="number"
                  value={briefYear}
                  onChange={(e) => setBriefYear(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Piezas objetivo</label>
              <input
                type="number"
                value={briefPieces}
                onChange={(e) => setBriefPieces(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Contexto de tendencias (opcional)</label>
              <textarea
                value={briefTrends}
                onChange={(e) => setBriefTrends(e.target.value)}
                placeholder="Ej: quiet luxury, telas organicas..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background h-16 resize-none"
              />
            </div>
          </div>

          <button
            onClick={generateCollectionBrief}
            disabled={generatingBrief}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cereus-bordeaux text-white rounded-lg text-sm font-medium hover:bg-cereus-bordeaux/90 disabled:opacity-40 transition-colors"
          >
            {generatingBrief ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {generatingBrief ? 'Generando...' : 'Generar Brief'}
          </button>

          {collectionBrief && !collectionBrief.error && (
            <div className="mt-4 space-y-3">
              {collectionBrief.name_suggestions && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nombres sugeridos:</p>
                  <div className="flex flex-wrap gap-1">
                    {collectionBrief.name_suggestions.map((n: string, i: number) => (
                      <span key={i} className="text-xs bg-cereus-bordeaux/10 text-cereus-bordeaux px-2 py-0.5 rounded">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {collectionBrief.description && (
                <p className="text-xs text-muted-foreground italic">{collectionBrief.description}</p>
              )}
              {collectionBrief.color_story && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Color Story:</p>
                  <div className="flex gap-1">
                    {collectionBrief.color_story.map((c: AnyRecord, i: number) => (
                      <div key={i} className="text-center">
                        <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: c.hex }} />
                        <p className="text-[9px] text-muted-foreground mt-0.5">{c.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {collectionBrief.garment_types && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prendas:</p>
                  {collectionBrief.garment_types.map((g: AnyRecord, i: number) => (
                    <p key={i} className="text-xs">{g.count}x {g.category} — {g.notes}</p>
                  ))}
                </div>
              )}
              {!collectionBrief.created && (
                <button
                  onClick={createCollectionFromBrief}
                  disabled={generatingBrief}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  <ShoppingBag className="w-3 h-3" />
                  Crear Coleccion
                </button>
              )}
              {collectionBrief.created && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    Coleccion creada
                  </p>
                </div>
              )}
            </div>
          )}

          {collectionBrief?.error && (
            <p className="mt-3 text-xs text-red-500">{collectionBrief.error}</p>
          )}
        </div>

        {/* Tool 3: RAMONA Campaign */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-emerald-500" />
            <h3 className="font-medium text-sm">Campana RAMONA</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground">Coleccion</label>
              <select
                value={campaignCollection}
                onChange={(e) => setCampaignCollection(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              >
                <option value="">Seleccionar coleccion...</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.season} {c.year})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Plataformas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      campaignPlatforms.includes(p.value)
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-border text-muted-foreground hover:border-emerald-500/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cantidad de posts</label>
              <input
                type="number"
                value={campaignCount}
                onChange={(e) => setCampaignCount(e.target.value)}
                min="1"
                max="30"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"
              />
            </div>
          </div>

          <button
            onClick={generateCampaign}
            disabled={!campaignCollection || campaignPlatforms.length === 0 || generatingCampaign}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {generatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {generatingCampaign ? 'Generando...' : 'Generar Campana'}
          </button>

          {campaignResult && !campaignResult.error && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
              <p className="text-lg font-display font-bold text-emerald-700 dark:text-emerald-400">
                {campaignResult.contentCount} piezas creadas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Generadas con {campaignResult.provider}
              </p>
              <Link
                href="/apps/ramona"
                className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Abrir en RAMONA <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {campaignResult?.error && (
            <p className="mt-3 text-xs text-red-500">{campaignResult.error}</p>
          )}
        </div>
      </div>

      {/* Section C: History */}
      {recsHistory.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Historial de Recomendaciones</h3>
          <div className="space-y-2">
            {recsHistory.map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-cereus-gold" />
                  <div>
                    <p className="text-sm font-medium">{rec.occasion} — {rec.season}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rec.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{rec.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
