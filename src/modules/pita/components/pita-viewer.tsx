'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import Image from 'next/image';
import { WelcomeGate } from './welcome-gate';
import { SectionRenderer } from './section-renderer';
import { FeedbackPanel } from './feedback-panel';
import { PresentationSection, BrandConfig, PitaThread, PitaAttachment, CoCreationData } from '../types';
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
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Co-creation state: threads and attachments per section
  const [coCreationData, setCoCreationData] = useState<Record<string, CoCreationData>>({});

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

  // Language toggle effect — show/hide bilingual spans
  useEffect(() => {
    const root = document.documentElement;
    if (lang === 'en') {
      root.classList.add('pita-lang-en');
    } else {
      root.classList.remove('pita-lang-en');
    }
    return () => root.classList.remove('pita-lang-en');
  }, [lang]);

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

  // ─── Co-Creation: Load threads + attachments for current section ───
  const loadCoCreationData = useCallback(async (sectionId: string) => {
    // Skip if already loaded
    if (coCreationData[sectionId]) return;

    try {
      const [threadsRes, attachmentsRes] = await Promise.all([
        fetch(`/api/pita/threads?presentationId=${presentationId}&sectionId=${sectionId}`),
        fetch(`/api/pita/attachments?presentationId=${presentationId}&sectionId=${sectionId}`),
      ]);

      const threadsData = await threadsRes.json();
      const attachmentsData = await attachmentsRes.json();

      setCoCreationData(prev => ({
        ...prev,
        [sectionId]: {
          threads: threadsData.threads || [],
          attachments: attachmentsData.attachments || [],
        },
      }));
    } catch {
      // If API fails, set empty data
      setCoCreationData(prev => ({
        ...prev,
        [sectionId]: { threads: [], attachments: [] },
      }));
    }
  }, [presentationId, coCreationData]);

  // Load co-creation data when section changes
  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);
  const section = sortedSections[currentSection];

  useEffect(() => {
    if (section?.id && reviewerName) {
      loadCoCreationData(section.id);
    }
  }, [section?.id, reviewerName, loadCoCreationData]);

  // Handle new comment
  const handleNewComment = useCallback(async (content: string, parentId?: string) => {
    if (!section?.id) return;

    try {
      const res = await fetch('/api/pita/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId,
          sectionId: section.id,
          reviewerId: reviewerId || `anon_${Date.now()}`,
          reviewerName,
          content,
          parentId,
        }),
      });

      const data = await res.json();
      if (data.ok && data.thread) {
        // Re-fetch threads to get updated list with proper nesting
        const threadsRes = await fetch(`/api/pita/threads?presentationId=${presentationId}&sectionId=${section.id}`);
        const threadsData = await threadsRes.json();

        setCoCreationData(prev => ({
          ...prev,
          [section.id]: {
            ...prev[section.id],
            threads: threadsData.threads || [],
          },
        }));
      }
    } catch {
      // Silently fail
    }
  }, [presentationId, section?.id, reviewerId, reviewerName]);

  // Handle upload complete
  const handleUploadComplete = useCallback((attachment: PitaAttachment) => {
    if (!section?.id) return;

    setCoCreationData(prev => ({
      ...prev,
      [section.id]: {
        ...prev[section.id],
        attachments: [...(prev[section.id]?.attachments || []), attachment],
      },
    }));
  }, [section?.id]);

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
      // Don't hijack navigation when user is typing in form elements
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, sections.length]);

  // Welcome Gate
  if (!reviewerName) {
    return <WelcomeGate presentationTitle={title} onEnter={handleEnter} />;
  }

  const progress = ((currentSection + 1) / sections.length) * 100;

  const isWhiteBg = brandConfig.backgroundColor === '#FFFFFF' || brandConfig.backgroundColor === '#fff';

  const currentCoCreation = section?.id ? coCreationData[section.id] : undefined;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: brandConfig.backgroundColor, color: brandConfig.textColor }}
    >
      {/* Top Bar */}
      <header className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl',
        isWhiteBg
          ? 'border-[#E9EEF2] bg-white/90'
          : 'border-white/5 bg-[#0E1B2C]/90'
      )}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/pita.png" alt="PITA" width={28} height={28} className={isWhiteBg ? 'opacity-80' : 'opacity-70'} />
            <span className={cn(
              'text-sm hidden sm:block font-editorial',
              isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/40'
            )}>{title}</span>
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
                    : isWhiteBg ? 'bg-[#0E1B2C]/10' : 'bg-white/10'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                isWhiteBg
                  ? 'bg-[#0E1B2C]/[0.04] hover:bg-[#0E1B2C]/[0.08] text-[#0E1B2C]/50'
                  : 'bg-white/5 hover:bg-white/10 text-[#F5F7F9]/50'
              )}
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{lang}</span>
            </button>

            {/* Reviewer Badge */}
            <div className={cn(
              'flex items-center gap-2 text-sm',
              isWhiteBg ? 'text-[#0E1B2C]/30' : 'text-[#F5F7F9]/30'
            )}>
              <div className="w-6 h-6 rounded bg-[#4FAF8F]/20 flex items-center justify-center text-[#4FAF8F] text-xs font-bold">
                {reviewerName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block">{reviewerName}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={cn('h-[2px]', isWhiteBg ? 'bg-[#E9EEF2]' : 'bg-white/5')}>
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
        <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-between pointer-events-none">
          <button
            onClick={goPrev}
            disabled={currentSection === 0}
            className={cn(
              'pointer-events-auto p-3 rounded-full backdrop-blur-sm transition-all',
              isWhiteBg
                ? 'bg-[#0E1B2C]/[0.04] border border-[#E9EEF2] hover:bg-[#0E1B2C]/[0.08]'
                : 'bg-white/5 border border-white/10 hover:bg-white/10',
              currentSection === 0
                ? 'opacity-0 cursor-default'
                : 'opacity-100'
            )}
          >
            <ChevronLeft className={cn('w-5 h-5', isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/60')} />
          </button>
          <button
            onClick={goNext}
            disabled={currentSection === sections.length - 1}
            className={cn(
              'pointer-events-auto p-3 rounded-full backdrop-blur-sm transition-all',
              isWhiteBg
                ? 'bg-[#0E1B2C]/[0.04] border border-[#E9EEF2] hover:bg-[#0E1B2C]/[0.08]'
                : 'bg-white/5 border border-white/10 hover:bg-white/10',
              currentSection === sections.length - 1
                ? 'opacity-0 cursor-default'
                : 'opacity-100'
            )}
          >
            <ChevronRight className={cn('w-5 h-5', isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/60')} />
          </button>
        </div>
      </main>

      {/* Feedback Panel with Co-Creation */}
      <div className="sticky bottom-0 z-40">
        <FeedbackPanel
          key={section?.id || currentSection}
          sectionId={section?.id || String(currentSection)}
          sectionIndex={currentSection}
          totalSections={sections.length}
          presentationId={presentationId}
          reviewerId={reviewerId || `anon_${Date.now()}`}
          reviewerName={reviewerName}
          existingReaction={feedback[section?.id]?.reaction as any}
          existingComment={feedback[section?.id]?.comment}
          onSubmitFeedback={handleFeedback}
          isWhiteBg={isWhiteBg}
          threads={currentCoCreation?.threads}
          attachments={currentCoCreation?.attachments}
          onNewComment={handleNewComment}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Completion Message */}
      {currentSection === sections.length - 1 && (
        <div className={cn(
          'text-center py-4 border-t',
          isWhiteBg
            ? 'bg-[#4FAF8F]/[0.03] border-[#4FAF8F]/10'
            : 'bg-[#4FAF8F]/5 border-[#4FAF8F]/10'
        )}>
          <p className="text-sm text-[#4FAF8F]/60">
            {reviewerName}, your feedback helps this idea take root. Thank you!
          </p>
        </div>
      )}
    </div>
  );
}
