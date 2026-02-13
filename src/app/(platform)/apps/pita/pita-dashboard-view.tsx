'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Pencil, LayoutGrid, MessageSquare, Sparkles, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PitaDashboard } from '@/modules/pita/components/pita-dashboard';
import { PitaCreatorChat } from '@/modules/pita/components/pita-creator-chat';

interface DBPresentation {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  pita_sections?: { count: number }[];
}

interface StaticPres {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  slidesCount: number;
}

interface DashboardViewProps {
  dbPresentations: DBPresentation[];
  staticPresentations: StaticPres[];
  dbSlugs: string[];
}

type Tab = 'presentations' | 'feedback' | 'creator';

function StaticPresentationCard({ pres }: { pres: StaticPres }) {
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/pita/presentations/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pres.slug }),
      });
      const data = await res.json();
      if (data.ok && data.presentation) {
        router.push(`/apps/pita/editor/${data.presentation.id}`);
      }
    } catch {
      // Silently fail
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-pita-green/30 transition-all">
      <div>
        <p className="text-sm font-semibold">{pres.title}</p>
        <p className="text-xs text-muted-foreground">
          /{pres.slug} · {pres.slidesCount} slides
          <span className="ml-1 text-pita-green">· Live</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
          title="Import to DB for editing"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          Edit
        </button>
        <Link
          href={`/pita/${pres.slug}`}
          target="_blank"
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export function PitaDashboardView({ dbPresentations, staticPresentations, dbSlugs }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('presentations');
  const [feedbackPres, setFeedbackPres] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<{ feedback: any[]; reviewers: any[]; sections: any[] } | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // All available presentations for feedback tab
  const allPresentations = [
    ...dbPresentations.map(p => ({ id: p.id, title: p.title, slug: p.slug, isDB: true })),
    ...staticPresentations
      .filter(sp => !dbSlugs.includes(sp.slug))
      .map(sp => ({ id: sp.id, title: sp.title, slug: sp.slug, isDB: false })),
  ];

  // Load feedback when a presentation is selected
  useEffect(() => {
    if (!feedbackPres) return;
    setLoadingFeedback(true);

    async function loadFeedback() {
      try {
        const pres = allPresentations.find(p => p.id === feedbackPres);
        if (!pres) return;

        const presId = pres.isDB ? pres.id : pres.id;
        const [fbRes, threadsRes] = await Promise.all([
          fetch(`/api/pita/feedback?presentationId=${presId}`),
          fetch(`/api/pita/threads?presentationId=${pres.slug}`),
        ]);

        const fbData = await fbRes.json();
        const threadsData = await threadsRes.json();

        // Build sections list for the dashboard
        let sections: any[] = [];
        if (pres.isDB) {
          const secRes = await fetch(`/api/pita/presentations/${pres.id}`);
          const secData = await secRes.json();
          sections = secData.sections || [];
        } else {
          // For static presentations, create mock section references
          const sp = staticPresentations.find(s => s.id === pres.id);
          if (sp) {
            sections = Array.from({ length: sp.slidesCount }, (_, i) => ({
              id: `${pres.slug}-section-${i}`,
              presentation_id: pres.id,
              order_index: i,
              title: `Slide ${i + 1}`,
              content: '',
              section_type: 'content',
            }));
          }
        }

        setFeedbackData({
          feedback: fbData.feedback || [],
          reviewers: fbData.reviewers || [],
          sections,
        });
      } catch {
        setFeedbackData({ feedback: [], reviewers: [], sections: [] });
      } finally {
        setLoadingFeedback(false);
      }
    }

    loadFeedback();
  }, [feedbackPres]);

  // Auto-select first presentation for feedback
  useEffect(() => {
    if (allPresentations.length > 0 && !feedbackPres) {
      setFeedbackPres(allPresentations[0].id);
    }
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'presentations', label: 'Presentations', icon: LayoutGrid },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'creator', label: 'Creator', icon: Sparkles },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'presentations' && (
        <div className="space-y-3">
          {/* DB Presentations */}
          {dbPresentations.map(pres => (
            <div
              key={pres.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-pita-green/30 transition-all"
            >
              <div>
                <p className="text-sm font-semibold">{pres.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{pres.slug} · {pres.pita_sections?.[0]?.count || 0} slides
                  {pres.is_active ? (
                    <span className="ml-1 text-pita-green">· Live</span>
                  ) : (
                    <span className="ml-1 text-amber-500">· Draft</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/apps/pita/editor/${pres.id}`}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                {pres.is_active && (
                  <Link
                    href={`/pita/${pres.slug}`}
                    target="_blank"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="View"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Static Presentations (not in DB yet) */}
          {staticPresentations
            .filter(sp => !dbSlugs.includes(sp.slug))
            .map(pres => (
              <StaticPresentationCard key={pres.id} pres={pres} />
            ))
          }

          {allPresentations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No presentations yet. Use the Creator tab to build one!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {/* Presentation Selector */}
          {allPresentations.length > 1 && (
            <select
              value={feedbackPres || ''}
              onChange={(e) => setFeedbackPres(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-pita-green/30"
            >
              {allPresentations.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          {loadingFeedback && (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-pita-green" />
              <p className="text-sm text-muted-foreground">Loading feedback...</p>
            </div>
          )}

          {!loadingFeedback && feedbackData && feedbackPres && (
            <PitaDashboard
              presentationId={feedbackPres}
              title={allPresentations.find(p => p.id === feedbackPres)?.title || ''}
              slug={allPresentations.find(p => p.id === feedbackPres)?.slug || ''}
              sections={feedbackData.sections}
              feedbackData={feedbackData.feedback}
              reviewers={feedbackData.reviewers}
            />
          )}

          {!loadingFeedback && !feedbackData && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Select a presentation to view feedback.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'creator' && (
        <PitaCreatorChat />
      )}
    </div>
  );
}
