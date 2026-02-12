'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgaveChat } from '@/modules/agave/components';
import { ProductCatalog } from '@/modules/agave/components/product-catalog';
import { type MarginRange, DEFAULT_MARGIN_RANGES } from '@/modules/agave/lib/pricing-engine';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ClientData {
  id: string;
  nombre: string;
  mensajes: Record<string, Record<string, string>>;
  idioma_default: string;
  margen_objetivo: number;
  tipo_costo_default: string;
  moneda: string;
  rangos_margen: MarginRange[];
}

interface Product {
  id: string;
  codigo?: string;
  nombre: string;
  proveedor?: string;
  costo_fob?: number;
  costo_cif?: number;
  costo_internado?: number;
  costo_puesto_cliente?: number;
}

export default function AgavePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [userInfo, setUserInfo] = useState<{ nombreContacto?: string; rol?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'catalog' | 'split'>('split');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client info
      const clientRes = await fetch('/api/agave/clients');
      const clientData = await clientRes.json();

      // If unauthorized, redirect to login
      if (clientRes.status === 401 || clientData.error === 'Unauthorized') {
        router.push('/login?redirect=/apps/agave');
        return;
      }

      if (clientData.error) {
        setError(clientData.error);
        return;
      }

      if (!clientData.hasAccess || !clientData.client) {
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
      setClient(clientData.client);
      setUserInfo(clientData.userInfo);

      // Fetch products for this client
      const productsRes = await fetch(`/api/agave/products?clientId=${clientData.client.id}`);
      const productsData = await productsRes.json();

      if (productsData.products) {
        setProducts(productsData.products);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductConsult = (product: Product) => {
    setSelectedProduct(product);
    if (viewMode === 'catalog') {
      setViewMode('split');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-agave-gold" />
          <p className="text-muted-foreground">Cargando AGAVE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4 max-w-md">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-semibold">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4 max-w-md p-6">
          <span className="text-6xl">🌵</span>
          <h2 className="text-xl font-semibold">AGAVE</h2>
          <p className="text-muted-foreground">
            No tienes acceso a AGAVE configurado. Contacta al administrador para activar tu cuenta.
          </p>
          <div className="pt-4 space-y-2">
            <Link
              href="/apps/agave/demo"
              className="block px-4 py-2 bg-agave-gold text-white rounded-lg hover:bg-agave-gold/90"
            >
              Probar Demo
            </Link>
            <Link
              href="/apps"
              className="block px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Volver a Apps
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Client has access - show full interface
  const rangos = client?.rangos_margen || DEFAULT_MARGIN_RANGES;
  const margenObjetivo = client?.margen_objetivo || 0.27;
  const moneda = client?.moneda || 'USD';
  const tipoCostoDefault = client?.tipo_costo_default || 'CIF';
  const idioma = client?.idioma_default || 'es';
  const userName = userInfo?.nombreContacto;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with view toggle */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌵</span>
          <div>
            <h1 className="font-semibold">AGAVE</h1>
            {client && <p className="text-xs text-muted-foreground">{client.nombre}</p>}
          </div>
        </div>

        {/* View mode toggle - hidden on mobile */}
        <div className="hidden md:flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-3 py-1.5 text-sm ${viewMode === 'chat' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 text-sm ${viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('catalog')}
            className={`px-3 py-1.5 text-sm ${viewMode === 'catalog' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Catalogo
          </button>
        </div>

        <span className="text-sm text-muted-foreground">
          {products.length} productos
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Always show chat, with product sidebar toggle */}
        <div className="md:hidden h-full">
          <AgaveChat
            demoMode={false}
            clientId={client?.id}
            clientName={client?.nombre}
            userName={userName}
            products={products}
            moneda={moneda}
            margenObjetivo={margenObjetivo}
            rangos={rangos}
            tipoCostoDefault={tipoCostoDefault}
            idioma={idioma}
          />
        </div>

        {/* Desktop: Configurable layout */}
        <div className="hidden md:flex h-full">
          {/* Catalog panel */}
          {(viewMode === 'catalog' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/3 border-r' : 'w-full'} p-4 overflow-hidden`}>
              <ProductCatalog
                products={products}
                moneda={moneda}
                margenObjetivo={margenObjetivo}
                rangos={rangos}
                tipoCostoDefault={tipoCostoDefault}
                onConsultProduct={handleProductConsult}
              />
            </div>
          )}

          {/* Chat panel */}
          {(viewMode === 'chat' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-2/3' : 'w-full'} p-4`}>
              <AgaveChat
                demoMode={false}
                clientId={client?.id}
                clientName={client?.nombre}
                userName={userName}
                products={products}
                moneda={moneda}
                margenObjetivo={margenObjetivo}
                rangos={rangos}
                tipoCostoDefault={tipoCostoDefault}
                idioma={idioma}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
