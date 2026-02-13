'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { PresentationSection, SectionFeedback, PitaThread, PitaAttachment } from '../types';
import { cn } from '@/lib/utils';

interface PdfExportButtonProps {
  title: string;
  slug: string;
  sections: PresentationSection[];
  feedbackData: SectionFeedback[];
  reviewers: { id: string; name: string }[];
  threads: PitaThread[];
  attachments: PitaAttachment[];
  className?: string;
}

export function PdfExportButton({
  title,
  slug,
  sections,
  feedbackData,
  reviewers,
  threads,
  attachments,
  className,
}: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Dynamic import — keeps jspdf + html2canvas out of the main bundle
      const { exportPresentationPDF } = await import('../lib/pdf-export');

      await exportPresentationPDF({
        title,
        slug,
        sections,
        feedbackData,
        reviewers,
        threads,
        attachments,
        lang: 'es',
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'bg-pita-deep text-white hover:bg-pita-deep/90 disabled:opacity-60',
        className
      )}
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Export PDF
        </>
      )}
    </button>
  );
}
