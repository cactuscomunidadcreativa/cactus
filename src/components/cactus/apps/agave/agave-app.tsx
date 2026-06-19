'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutDashboard, MessageSquare, Boxes, Columns2 } from 'lucide-react';
import { AgaveChat } from '@/modules/agave/components';
import { ProductCatalog } from '@/modules/agave/components/product-catalog';
import { type MarginRange, DEFAULT_MARGIN_RANGES } from '@/modules/agave/lib/pricing-engine';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';

interface AgaveAgent { slug: string; name: string; role: string; color: string; image: string }

interface ClientData {
  id: string; nombre: string; mensajes: Record<string, Record<string, string>>;
  idioma_default: string; margen_objetivo: number; tipo_costo_default: string;
  moneda: string; rangos_margen: MarginRange[];
}
interface Product { id: string; codigo?: string; nombre: string; proveedor?: string; costo_fob?: number; costo_cif?: number; costo_internado?: number; costo_puesto_cliente?: number }

type View = 'chat' | 'catalog' | 'split';

export function AgaveApp({ agent, user, credits }: { agent: AgaveAgent; user?: ShellUser; credits?: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [userInfo, setUserInfo] = useState<{ nombreContacto?: string; rol?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('split');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => { fetchClientData(); }, []);

  async function fetchClientData() {
    try {
      setLoading(true);
      const clientRes = await fetch('/api/agave/clients');
      const clientData = await clientRes.json();
      if (clientRes.status === 401 || clientData.error === 'Unauthorized') { router.push('/login?redirect=/apps/agave'); return; }
      if (clientData.error) { setError(clientData.error); return; }
      if (!clientData.hasAccess || !clientData.client) { setError('No se pudo aprovisionar tu cuenta de Agave.'); return; }
      setClient(clientData.client);
      setUserInfo(clientData.userInfo);
      const productsRes = await fetch(`/api/agave/products?clientId=${clientData.client.id}`);
      const productsData = await productsRes.json();
      if (productsData.products) setProducts(productsData.products);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'split', label: 'Vista completa', icon: LayoutDashboard },
    { key: 'chat', label: 'Asistente', icon: MessageSquare },
    { key: 'catalog', label: 'Catálogo', icon: Boxes },
  ];

  const rangos = client?.rangos_margen || DEFAULT_MARGIN_RANGES;
  const margenObjetivo = client?.margen_objetivo || 0.27;
  const moneda = client?.moneda || 'USD';
  const tipoCostoDefault = client?.tipo_costo_default || 'CIF';
  const idioma = client?.idioma_default || 'es';

  const chat = (
    <AgaveChat
      demoMode={false} clientId={client?.id} clientName={client?.nombre} userName={userInfo?.nombreContacto}
      products={products} moneda={moneda} margenObjetivo={margenObjetivo} rangos={rangos}
      tipoCostoDefault={tipoCostoDefault} idioma={idioma}
    />
  );

  return (
    <AgentAppShell
      agent={agent} nav={nav} activeNav={view} onNav={(k) => setView(k as View)}
      user={user} credits={credits}
      greeting={`¡Hola${firstName ? `, ${firstName}` : ''}! 🌵`}
      subtitle={client ? `Inteligencia de precios · ${client.nombre} · ${products.length} productos` : 'Inteligencia de precios con Agave'}
      cta={{ label: view === 'split' ? 'Solo asistente' : 'Vista completa', icon: Columns2, onClick: () => setView(view === 'split' ? 'chat' : 'split') }}
    >
      {loading ? (
        <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: agent.color }} /></div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="mb-3 text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>Reintentar</button>
        </div>
      ) : (
        <div className="h-[calc(100vh-9rem)]">
          {/* Móvil: solo chat */}
          <div className="h-full md:hidden">{chat}</div>
          {/* Desktop: layout configurable */}
          <div className="hidden h-full gap-4 md:flex">
            {(view === 'catalog' || view === 'split') && (
              <div className={`${view === 'split' ? 'w-1/3' : 'w-full'} overflow-hidden rounded-2xl border border-border bg-card p-4`}>
                <ProductCatalog products={products} moneda={moneda} margenObjetivo={margenObjetivo} rangos={rangos} tipoCostoDefault={tipoCostoDefault} onConsultProduct={(p) => { setSelectedProduct(p); if (view === 'catalog') setView('split'); }} />
              </div>
            )}
            {(view === 'chat' || view === 'split') && (
              <div className={`${view === 'split' ? 'w-2/3' : 'w-full'} overflow-hidden rounded-2xl border border-border bg-card`}>{chat}</div>
            )}
          </div>
        </div>
      )}
    </AgentAppShell>
  );
}
