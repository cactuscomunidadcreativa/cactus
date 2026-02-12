'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackPanelProps {
  sectionId: string;
  sectionIndex: number;
  totalSections: number;
  reviewerName: string;
  existingReaction?: 'like' | 'dislike' | 'love' | null;
  existingComment?: string;
  onSubmitFeedback: (sectionId: string, reaction: string | null, comment: string) => void;
  isWhiteBg?: boolean;
}

export function FeedbackPanel({
  sectionId,
  sectionIndex,
  totalSections,
  reviewerName,
  existingReaction,
  existingComment,
  onSubmitFeedback,
  isWhiteBg = false,
}: FeedbackPanelProps) {
  const [reaction, setReaction] = useState<string | null>(existingReaction || null);
  const [comment, setComment] = useState(existingComment || '');
  const [showComment, setShowComment] = useState(!!existingComment);
  const [submitted, setSubmitted] = useState(false);

  const handleReaction = (type: string) => {
    const newReaction = reaction === type ? null : type;
    setReaction(newReaction);
    onSubmitFeedback(sectionId, newReaction, comment);
    if (!submitted) setSubmitted(true);
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onSubmitFeedback(sectionId, reaction, comment.trim());
      if (!submitted) setSubmitted(true);
    }
  };

  const initial = reviewerName.charAt(0).toUpperCase();

  return (
    <div className={cn(
      'border-t backdrop-blur-sm',
      isWhiteBg
        ? 'border-[#E9EEF2] bg-white/80'
        : 'border-white/10 bg-white/[0.02]'
    )}>
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Reviewer Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4FAF8F]/20 flex items-center justify-center text-[#4FAF8F] text-sm font-bold">
              {initial}
            </div>
            <div className="hidden sm:block">
              <p className={cn('text-xs', isWhiteBg ? 'text-[#0E1B2C]/35' : 'text-[#F5F7F9]/40')}>
                Section {sectionIndex + 1} of {totalSections}
              </p>
            </div>
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReaction('like')}
              className={cn(
                'p-2 rounded-lg transition-all',
                reaction === 'like'
                  ? 'bg-[#4FAF8F]/20 text-[#4FAF8F]'
                  : isWhiteBg
                  ? 'text-[#0E1B2C]/25 hover:text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.04]'
                  : 'text-[#F5F7F9]/30 hover:text-[#F5F7F9]/60 hover:bg-white/5'
              )}
              title="Like"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleReaction('dislike')}
              className={cn(
                'p-2 rounded-lg transition-all',
                reaction === 'dislike'
                  ? 'bg-red-500/20 text-red-400'
                  : isWhiteBg
                  ? 'text-[#0E1B2C]/25 hover:text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.04]'
                  : 'text-[#F5F7F9]/30 hover:text-[#F5F7F9]/60 hover:bg-white/5'
              )}
              title="Needs changes"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleReaction('love')}
              className={cn(
                'p-2 rounded-lg transition-all',
                reaction === 'love'
                  ? 'bg-[#C7A54A]/20 text-[#C7A54A]'
                  : isWhiteBg
                  ? 'text-[#0E1B2C]/25 hover:text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.04]'
                  : 'text-[#F5F7F9]/30 hover:text-[#F5F7F9]/60 hover:bg-white/5'
              )}
              title="Love it"
            >
              <Heart className={cn('w-5 h-5', reaction === 'love' && 'fill-current')} />
            </button>

            <div className={cn('w-[1px] h-6 mx-1', isWhiteBg ? 'bg-[#E9EEF2]' : 'bg-white/10')} />

            <button
              onClick={() => setShowComment(!showComment)}
              className={cn(
                'p-2 rounded-lg transition-all',
                showComment
                  ? 'bg-[#2D6CDF]/20 text-[#2D6CDF]'
                  : isWhiteBg
                  ? 'text-[#0E1B2C]/25 hover:text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.04]'
                  : 'text-[#F5F7F9]/30 hover:text-[#F5F7F9]/60 hover:bg-white/5'
              )}
              title="Add comment"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comment Box */}
        {showComment && (
          <div className="mt-4 flex gap-2 animate-pita-slide-up">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
              placeholder="Any thoughts on this section?"
              className={cn(
                'flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none transition-all',
                isWhiteBg
                  ? 'bg-[#0E1B2C]/[0.03] border border-[#E9EEF2] text-[#0E1B2C] placeholder-[#0E1B2C]/20 focus:border-[#4FAF8F]/30'
                  : 'bg-white/5 border border-white/10 text-[#F5F7F9] placeholder-[#F5F7F9]/20 focus:border-[#4FAF8F]/30'
              )}
              autoFocus
            />
            <button
              onClick={handleCommentSubmit}
              disabled={!comment.trim()}
              className="px-4 py-3 bg-[#4FAF8F] text-white rounded-lg font-medium text-sm hover:bg-[#4FAF8F]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {submitted && !showComment && (
          <p className="mt-2 text-xs text-[#4FAF8F]/60 text-center">
            Feedback saved
          </p>
        )}
      </div>
    </div>
  );
}
