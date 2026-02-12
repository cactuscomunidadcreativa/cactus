import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PitaDashboard } from '@/modules/pita/components/pita-dashboard';
import { OWN_YOUR_IMPACT_SECTIONS } from '@/modules/pita/lib/presentations';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default async function PitaPage() {
  const supabase = await createClient();

  // For now, show the static presentation dashboard
  // TODO: Fetch from Supabase when presentations are dynamic
  const presentationId = 'own-your-impact-001';
  const slug = 'own-your-impact';
  const title = 'OWN YOUR IMPACT';

  const sectionsWithIds = OWN_YOUR_IMPACT_SECTIONS.map((section, i) => ({
    ...section,
    id: `${slug}-section-${i}`,
    presentation_id: presentationId,
    created_at: new Date().toISOString(),
  }));

  // Try to fetch feedback from Supabase
  let feedbackData: any[] = [];
  let reviewers: any[] = [];

  if (supabase) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pita/feedback?presentationId=${presentationId}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        feedbackData = data.feedback || [];
        reviewers = data.reviewers || [];
      }
    } catch {
      // Silently fail - show empty dashboard
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div />
        <Link
          href={`/pita/${slug}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-pita-green text-white rounded-lg text-sm font-medium hover:bg-pita-green/90 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          View Presentation
        </Link>
      </div>

      <PitaDashboard
        presentationId={presentationId}
        title={title}
        slug={slug}
        sections={sectionsWithIds}
        feedbackData={feedbackData}
        reviewers={reviewers}
      />
    </div>
  );
}
