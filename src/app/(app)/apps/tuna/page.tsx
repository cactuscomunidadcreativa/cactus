'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TunaDashboard } from '@/modules/tuna/components/tuna-dashboard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ClientData {
  id: string;
  nombre: string;
  config: Record<string, any>;
}

export default function TunaAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [userInfo, setUserInfo] = useState<{ nombreContacto?: string; rol?: string } | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/apps/clients?appId=tuna');
      const data = await res.json();

      // If unauthorized, redirect to login
      if (res.status === 401 || data.error === 'Unauthorized') {
        router.push('/login?redirect=/apps/tuna');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      if (!data.hasAccess || !data.client) {
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
      setClient(data.client);
      setUserInfo(data.userInfo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-tuna-blue" />
          <p className="text-muted-foreground">Cargando TUNA...</p>
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
          <span className="text-6xl">🐟</span>
          <h2 className="text-xl font-semibold">TUNA</h2>
          <p className="text-muted-foreground">
            No tienes acceso a TUNA configurado. Contacta al administrador para activar tu cuenta.
          </p>
          <div className="pt-4 space-y-2">
            <Link
              href="/apps/tuna/demo"
              className="block px-4 py-2 bg-tuna-blue text-white rounded-lg hover:bg-tuna-blue/90"
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

  // User has access - show full interface
  return <TunaDashboard />;
}
