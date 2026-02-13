'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Ruler, DollarSign, Factory, Shirt, Brain,
  Plus, Search, Sparkles, ChevronRight, Loader2,
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const modules = [
    { icon: Users, label: 'Clients', count: totalClients, href: '/apps/cereus/clients', color: 'text-cereus-gold', bg: 'bg-cereus-gold/10' },
    { icon: Ruler, label: 'Measurements', count: '-', href: '/apps/cereus/clients', color: 'text-cereus-bordeaux', bg: 'bg-cereus-bordeaux/10' },
    { icon: DollarSign, label: 'Costing', count: '-', href: '/apps/cereus/costing', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Factory, label: 'Production', count: '-', href: '/apps/cereus/production', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Shirt, label: 'Closet', count: '-', href: '/apps/cereus/closet', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Brain, label: 'Advisor', count: '-', href: '/apps/cereus/advisor', color: 'text-cereus-gold', bg: 'bg-cereus-gold/10' },
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
