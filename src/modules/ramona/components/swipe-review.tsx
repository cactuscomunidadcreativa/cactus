'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Check,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Undo2,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Confetti } from './confetti';

interface ContentItem {
  id: string;
  title: string;
  body: string;
  platform: string;
  content_type: string;
  hashtags: string[];
}

interface SwipeReviewProps {
  contents: ContentItem[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onComplete?: () => void;
}

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook: 'from-blue-600 to-blue-700',
  linkedin: 'from-blue-700 to-blue-800',
  twitter: 'from-gray-800 to-black',
  tiktok: 'from-gray-900 to-black',
};

function SwipeCard({
  content,
  onSwipe,
  onEdit,
  isTop,
}: {
  content: ContentItem;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onEdit: () => void;
  isTop: boolean;
}) {
  const t = useTranslations('ramona.swipe');
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Overlay opacity based on swipe direction
  const approveOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, 0], [1, 0]);
  const editOpacity = useTransform(y, [-100, 0], [1, 0]);

  const PlatformIcon = PLATFORM_ICONS[content.platform] || Instagram;
  const platformGradient = PLATFORM_COLORS[content.platform] || PLATFORM_COLORS.instagram;

  function handleDragEnd(_: never, info: PanInfo) {
    const threshold = 100;

    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    } else if (info.offset.y < -threshold) {
      onSwipe('up');
    }
  }

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ x, y, rotate, opacity }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: 0,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 },
      }}
    >
      <div className="relative h-full bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Platform header */}
        <div className={`bg-gradient-to-r ${platformGradient} p-4 text-white`}>
          <div className="flex items-center gap-2">
            <PlatformIcon className="w-5 h-5" />
            <span className="font-medium capitalize">{content.platform}</span>
            <span className="text-white/70 text-sm">• {content.content_type}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 h-[calc(100%-8rem)] overflow-y-auto">
          {content.title && (
            <h3 className="font-semibold text-lg mb-3">{content.title}</h3>
          )}
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {content.body}
          </p>
          {content.hashtags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {content.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="text-sm text-ramona-purple bg-ramona-purple-lighter px-2 py-0.5 rounded"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Swipe hints */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-muted-foreground">
          <span>← {t('reject')}</span>
          <span>↑ {t('edit')}</span>
          <span>{t('approve')} →</span>
        </div>

        {/* Swipe overlays */}
        {isTop && (
          <>
            {/* Approve overlay */}
            <motion.div
              className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none"
              style={{ opacity: approveOpacity }}
            >
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Reject overlay */}
            <motion.div
              className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none"
              style={{ opacity: rejectOpacity }}
            >
              <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Edit overlay */}
            <motion.div
              className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none"
              style={{ opacity: editOpacity }}
            >
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
                <Edit3 className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function SwipeReview({
  contents,
  onApprove,
  onReject,
  onEdit,
  onComplete,
}: SwipeReviewProps) {
  const t = useTranslations('ramona.swipe');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const remaining = contents.length - currentIndex;
  const reviewed = currentIndex;
  const progress = contents.length > 0 ? Math.round((reviewed / contents.length) * 100) : 0;

  const handleSwipe = useCallback(
    async (direction: 'left' | 'right' | 'up') => {
      if (isProcessing || currentIndex >= contents.length) return;

      const currentContent = contents[currentIndex];
      setIsProcessing(true);

      try {
        if (direction === 'right') {
          await onApprove(currentContent.id);
          setHistory((prev) => [...prev, currentContent.id]);
        } else if (direction === 'left') {
          await onReject(currentContent.id);
          setHistory((prev) => [...prev, currentContent.id]);
        } else if (direction === 'up') {
          onEdit(currentContent.id);
          setIsProcessing(false);
          return;
        }

        setCurrentIndex((prev) => prev + 1);

        // Check if complete
        if (currentIndex + 1 >= contents.length) {
          setShowConfetti(true);
          setTimeout(() => {
            onComplete?.();
          }, 2000);
        }
      } catch (error) {
        console.error('Swipe action failed:', error);
      }

      setIsProcessing(false);
    },
    [currentIndex, contents, isProcessing, onApprove, onReject, onEdit, onComplete]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'a') {
        handleSwipe('right');
      } else if (e.key === 'ArrowLeft' || e.key === 'r') {
        handleSwipe('left');
      } else if (e.key === 'ArrowUp' || e.key === 'e') {
        handleSwipe('up');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe]);

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Image
          src="/ramona.png"
          alt="Ramona"
          width={80}
          height={80}
          className="opacity-50 mb-4"
        />
        <h3 className="font-semibold text-lg mb-2">{t('noContent')}</h3>
        <p className="text-muted-foreground text-sm">{t('noContentDesc')}</p>
      </div>
    );
  }

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} />

      <div className="flex flex-col h-full">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center gap-3">
            <Image
              src="/ramona.png"
              alt="Ramona"
              width={32}
              height={32}
              className={isProcessing ? 'animate-ramona-bounce' : 'animate-ramona-float'}
            />
            <div>
              <p className="font-medium">
                {t('progress', { current: reviewed, total: contents.length })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('remaining', { count: remaining })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{progress}%</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-ramona-gradient transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card stack */}
        <div className="relative flex-1 min-h-[400px] max-w-md mx-auto w-full px-4">
          <AnimatePresence mode="popLayout">
            {currentIndex < contents.length && (
              <SwipeCard
                key={contents[currentIndex].id}
                content={contents[currentIndex]}
                onSwipe={handleSwipe}
                onEdit={() => onEdit(contents[currentIndex].id)}
                isTop={true}
              />
            )}
          </AnimatePresence>

          {/* Show next card preview */}
          {currentIndex + 1 < contents.length && (
            <div className="absolute inset-0 scale-95 -translate-y-4 opacity-50 pointer-events-none">
              <div className="h-full bg-card border border-border rounded-2xl shadow-lg" />
            </div>
          )}

          {/* Complete state */}
          {currentIndex >= contents.length && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-ramona-fade-in">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="font-semibold text-xl mb-2">{t('allDone')}</h3>
              <p className="text-muted-foreground">
                {t('allDoneDesc', { count: contents.length })}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {currentIndex < contents.length && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => handleSwipe('left')}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            >
              <X className="w-7 h-7" />
            </button>

            <button
              onClick={() => handleSwipe('up')}
              disabled={isProcessing}
              className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Edit3 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSwipe('right')}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 text-green-500 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Check className="w-7 h-7" />
            </button>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <span className="inline-flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←</kbd> {t('reject')}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑</kbd> {t('edit')}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">→</kbd> {t('approve')}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
