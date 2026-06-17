'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function PackActivateButton({ packKey, packName, featured }: { packKey: string; packName: string; featured?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    try {
      const res = await fetch('/api/cactus/packs/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: packKey }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      // Sin Price ID configurado → contacto
      window.location.href = `mailto:eduardo@cactuscomunidadcreativa.com?subject=Activar%20${encodeURIComponent(packName)}`;
    } catch {
      window.location.href = `mailto:eduardo@cactuscomunidadcreativa.com?subject=Activar%20${encodeURIComponent(packName)}`;
    } finally { setLoading(false); }
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-center text-sm font-medium transition-colors disabled:opacity-60 ${
        featured ? 'bg-cactus-green text-white hover:bg-cactus-green/90' : 'border border-border hover:border-cactus-green hover:text-cactus-green'
      }`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Activar {packName.replace('Cactus ', '')}
    </button>
  );
}
