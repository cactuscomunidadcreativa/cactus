'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Ruler, DollarSign, Factory, Shirt, Brain,
  Plus, Search, Sparkles, ChevronRight, Loader2,
  Layers, Eye, ShoppingBag, MessageCircle, Globe, Settings,
  Key, Check, ExternalLink, Save,
} from 'lucide-react';

interface Maison {
  id: string;
  nombre: string;
  config: Record<string, any>;
}

interface CereusClient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  vip_tier: string;
  role: string;
  created_at: string;
  cereus_emotional_profiles: { id: string; primary_archetype: string | null }[];
  cereus_body_measurements: { id: string; is_current: boolean }[];
}

export function CereusDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maison, setMaison] = useState<Maison | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [clients, setClients] = useState<CereusClient[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize openaiKey from maison config once loaded
  useEffect(() => {
    if (maison?.config) {
      setOpenaiKey((maison.config as any)?.api_keys?.openai || '');
    }
  }, [maison]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Get maison
      const maisonRes = await fetch('/api/cereus/maison');
      if (maisonRes.status === 401) {
        router.push('/login?redirect=/apps/cereus');
        return;
      }
      const maisonData = await maisonRes.json();
      if (!maisonData.hasAccess || !maisonData.maison) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      setHasAccess(true);
      setMaison(maisonData.maison);

      // 2. Get clients
      const clientsRes = await fetch(`/api/cereus/clients?maisonId=${maisonData.maison.id}&limit=10`);
      const clientsData = await clientsRes.json();
      setClients(clientsData.clients || []);
      setTotalClients(clientsData.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Access Required</h2>
        <p className="text-muted-foreground mb-6">
          You need to be assigned to a Maison to access CEREUS.
        </p>
        <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-cereus-gold text-white rounded-lg font-medium">
          View Plans
        </Link>
      </div>
    );
  }

  const maisonId = maison?.id || '';

  const modules = [
    { icon: Users, label: 'Clients', count: totalClients, href: '/apps/cereus/clients', color: 'text-cereus-gold', bg: 'bg-cereus-gold/10' },
    { icon: Layers, label: 'Designer', count: '-', href: '/apps/cereus/designer', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { icon: DollarSign, label: 'Costing', count: '-', href: '/apps/cereus/costing', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Factory, label: 'Produccion', count: '-', href: '/apps/cereus/production', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Ruler, label: 'Moldes', count: '-', href: '/apps/cereus/patterns', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Shirt, label: 'Closet', count: '-', href: '/apps/cereus/closet', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Brain, label: 'Advisor', count: '-', href: '/apps/cereus/advisor', color: 'text-cereus-gold', bg: 'bg-cereus-gold/10' },
    { icon: Eye, label: 'Catalogo', count: '-', href: '/apps/cereus/catalog', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  async function saveApiKey() {
    setSavingKey(true);
    try {
      await fetch('/api/cereus/maison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          config: { ...(maison?.config || {}), api_keys: { openai: openaiKey } },
        }),
      });
      setSavedMsg('API Key guardada');
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      setSavedMsg('Error al guardar');
    } finally {
      setSavingKey(false);
    }
  }

  const adminModules = [
    { icon: ShoppingBag, label: 'Tienda', description: 'Storefront, productos y catalogo', href: `/maison/${maisonId}/admin`, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: MessageCircle, label: 'Chatbot IA', description: 'Entrenar a Ramona', href: `/maison/${maisonId}/admin`, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Globe, label: 'Ver Tienda', description: 'Storefront publico', href: `/maison/${maisonId}`, color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: Users, label: 'Portal Cliente', description: 'Vista de clientas', href: `/maison/${maisonId}/portal`, color: 'text-cereus-gold', bg: 'bg-cereus-gold/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">CEREUS</h1>
            <span className="px-3 py-1 text-xs font-medium bg-cereus-gold/10 text-cereus-gold rounded-full">
              {maison?.nombre}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {(maison?.config as any)?.maison_tagline || 'Emotional Algorithmic Atelier'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.label}
              href={mod.href}
              className="group p-4 rounded-xl border bg-card hover:border-cereus-gold/30 transition-all text-center"
            >
              <div className={`w-10 h-10 rounded-lg ${mod.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${mod.color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{mod.count}</p>
              <p className="text-xs text-muted-foreground">{mod.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Admin & Store Management */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Administracion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.label}
                href={mod.href}
                className="group p-5 rounded-xl border bg-card hover:border-cereus-gold/30 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${mod.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <p className="font-medium group-hover:text-cereus-gold transition-colors">{mod.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* API Key & Settings */}
      <div className="bg-card border border-border rounded-xl p-5">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cereus-gold/10 flex items-center justify-center">
              <Key className={`w-4.5 h-4.5 ${openaiKey ? 'text-green-500' : 'text-cereus-gold'}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Configuracion & API Keys</p>
              <p className="text-xs text-muted-foreground">
                {openaiKey ? 'OpenAI conectado — IA activa' : 'Configura OpenAI para activar funciones de IA'}
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showSettings ? 'rotate-90' : ''}`} />
        </button>

        {showSettings && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* OpenAI Key */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">OpenAI API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono bg-background pr-16"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <button
                  onClick={saveApiKey}
                  disabled={savingKey}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cereus-gold text-white text-sm rounded-lg hover:bg-cereus-gold/90 disabled:opacity-50 transition-colors"
                >
                  {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Guardar
                </button>
              </div>
              {openaiKey ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${openaiKey.startsWith('sk-') ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {openaiKey.startsWith('sk-') ? 'Key configurada — DALL-E, GPT-4, AI Brief activos' : 'Formato incorrecto'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Sin OpenAI: bocetos usan SVG fallback, chatbot usa respuestas basicas.
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cereus-gold hover:underline ml-1">
                    Obtener key
                  </a>
                </p>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/maison/${maisonId}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Admin Panel Completo
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
              </a>
              <a
                href={`/maison/${maisonId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                Ver Storefront
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
              </a>
            </div>
          </div>
        )}

        {savedMsg && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" /> {savedMsg}
          </div>
        )}
      </div>

      {/* Recent Clients */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Clients</h2>
          <Link
            href="/apps/cereus/clients"
            className="text-sm text-cereus-gold hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first client to start building their profile.
            </p>
            <Link
              href="/apps/cereus/clients?new=true"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Client
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/apps/cereus/clients?id=${client.id}`}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-cereus-gold/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cereus-gold/10 flex items-center justify-center text-cereus-gold font-bold text-sm">
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-cereus-gold transition-colors">
                      {client.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.email || client.phone || 'No contact info'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    client.vip_tier === 'privat' ? 'bg-cereus-gold/20 text-cereus-gold' :
                    client.vip_tier === 'platinum' ? 'bg-purple-500/20 text-purple-500' :
                    client.vip_tier === 'gold' ? 'bg-yellow-500/20 text-yellow-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {client.vip_tier}
                  </span>
                  {client.cereus_emotional_profiles?.length > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-pink-500/10 text-pink-500">
                      Profile
                    </span>
                  )}
                  {client.cereus_body_measurements?.some(m => m.is_current) && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500">
                      Measured
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
