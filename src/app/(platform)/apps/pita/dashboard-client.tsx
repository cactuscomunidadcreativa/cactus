'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Database, Loader2 } from 'lucide-react';

interface StaticPresentation {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  slidesCount: number;
}

export function PitaDashboardClient({ presentation }: { presentation: StaticPresentation }) {
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  const handleImportToDB = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/pita/presentations/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: presentation.slug }),
      });
      const data = await res.json();

      if (data.ok && data.presentation) {
        if (data.alreadyExists) {
          router.push(`/apps/pita/editor/${data.presentation.id}`);
        } else {
          router.push(`/apps/pita/editor/${data.presentation.id}`);
        }
      } else {
        alert(`Error: ${data.error || 'Import failed'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-pita-green/30 transition-all">
      <div>
        <p className="text-sm font-semibold">{presentation.title}</p>
        <p className="text-xs text-muted-foreground">
          /{presentation.slug} · {presentation.slidesCount} slides
          <span className="ml-1 text-pita-green">· Live (static)</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleImportToDB}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
          title="Import to database for editing"
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
          {importing ? 'Importing...' : 'Edit'}
        </button>
        <Link
          href={`/pita/${presentation.slug}`}
          target="_blank"
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="View presentation"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
