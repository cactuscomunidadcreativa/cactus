'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { WelcomeGate } from './welcome-gate';
import { SectionRenderer } from './section-renderer';
import { FeedbackPanel } from './feedback-panel';
import { PresentationSection, BrandConfig } from '../types';
import { cn } from '@/lib/utils';

interface PitaViewerProps {
  presentationId: string;
  slug: string;
  title: string;
  subtitle?: string;
  sections: PresentationSection[];
  brandConfig: BrandConfig;
}

interface FeedbackData {
  [sectionId: string]: {
    reaction: string | null;
    comment: string;
  };
}

export function PitaViewer({
  presentationId,
  slug,
  title,
  sections,
  brandConfig,
}: PitaViewerProps) {
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const [reviewerId, setReviewerId] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem(`pita_reviewer_${slug}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setReviewerName(data.name);
        setReviewerId(data.id);
      } catch {
        // Invalid data, ignore
      }
    }
  }, [slug]);

  // Register reviewer
  const handleEnter = useCallback(async (name: string) => {
    setReviewerName(name);

    try {
      const res = await fetch(`/api/pita/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentationId, name }),
      });
      const data = await res.json();
      if (data.id) {
        setReviewerId(data.id);
        localStorage.setItem(`pita_reviewer_${slug}`, JSON.stringify({ name, id: data.id }));
      }
    } catch {
      // Store locally if API fails
      const localId = `local_${Date.now()}`;
      setReviewerId(localId);
      localStorage.setItem(`pita_reviewer_${slug}`, JSON.stringify({ name, id: localId }));
    }
  }, [presentationId, slug]);

  // Submit feedback
  const handleFeedback = useCallback(async (sectionId: string, reaction: string | null, comment: string) => {
    setFeedback(prev => ({
      ...prev,
      [sectionId]: { reaction, comment },
    }));

    try {
      await fetch(`/api/pita/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          reviewerId,
          reviewerName,
          reaction,
          comment,
        }),
      });
    } catch {
      // Silently store locally
    }
  }, [reviewerId, reviewerName]);

  // Navigate sections
  const goNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Welcome Gate
  if (!reviewerName) {
    return <WelcomeGate presentationTitle={title} onEnter={handleEnter} />;
  }

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);
  const section = sortedSections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: brandConfig.backgroundColor, color: brandConfig.textColor }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0E1B2C]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/pita.png" alt="PITA" width={28} height={28} className="opacity-70" />
            <span className="text-sm text-[#F5F7F9]/40 hidden sm:block font-editorial">{title}</span>
          </div>

          {/* Section Navigation Dots */}
          <div className="flex items-center gap-1.5">
            {sortedSections.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSection(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentSection
                    ? 'bg-[#4FAF8F] w-6'
                    : i < currentSection
                    ? 'bg-[#4FAF8F]/40'
                    : 'bg-white/10'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-[#F5F7F9]/30">
            <div className="w-6 h-6 rounded bg-[#4FAF8F]/20 flex items-center justify-center text-[#4FAF8F] text-xs font-bold">
              {reviewerName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block">{reviewerName}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-[2px] bg-white/5">
          <div
            className="h-full bg-[#4FAF8F] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionRenderer
            key={section?.id || currentSection}
            section={section}
            isActive={true}
          />
        </div>

        {/* Navigation Arrows */}
        <div className="fixed bottom-24 left-4 right-4 flex justify-between pointer-events-none">
          <button
            onClick={goPrev}
            disabled={currentSection === 0}
            className={cn(
              'pointer-events-auto p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm transition-all',
              currentSection === 0
                ? 'opacity-0 cursor-default'
                : 'opacity-100 hover:bg-white/10'
            )}
          >
            <ChevronLeft className="w-5 h-5 text-[#F5F7F9]/60" />
          </button>
          <button
            onClick={goNext}
            disabled={currentSection === sections.length - 1}
            className={cn(
              'pointer-events-auto p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm transition-all',
              currentSection === sections.length - 1
                ? 'opacity-0 cursor-default'
                : 'opacity-100 hover:bg-white/10'
            )}
          >
            <ChevronRight className="w-5 h-5 text-[#F5F7F9]/60" />
          </button>
        </div>
      </main>

      {/* Feedback Panel */}
      <div className="sticky bottom-0 z-40">
        <FeedbackPanel
          key={section?.id || currentSection}
          sectionId={section?.id || String(currentSection)}
          sectionIndex={currentSection}
          totalSections={sections.length}
          reviewerName={reviewerName}
          existingReaction={feedback[section?.id]?.reaction as any}
          existingComment={feedback[section?.id]?.comment}
          onSubmitFeedback={handleFeedback}
        />
      </div>

      {/* Completion Message */}
      {currentSection === sections.length - 1 && (
        <div className="text-center py-4 bg-[#4FAF8F]/5 border-t border-[#4FAF8F]/10">
          <p className="text-sm text-[#4FAF8F]/60">
            {reviewerName}, your feedback helps this idea take root. Thank you!
          </p>
        </div>
      )}
    </div>
  );
}
