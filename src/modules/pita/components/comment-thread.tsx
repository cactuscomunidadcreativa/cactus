'use client';

import { useState } from 'react';
import { Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PitaThread } from '../types';

interface CommentThreadProps {
  threads: PitaThread[];
  presentationId: string;
  sectionId: string;
  reviewerId: string;
  reviewerName: string;
  isWhiteBg?: boolean;
  onNewComment: (content: string, parentId?: string) => Promise<void>;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentBubble({
  thread,
  isWhiteBg,
  onReply,
  depth = 0,
}: {
  thread: PitaThread;
  isWhiteBg: boolean;
  onReply: (parentId: string) => void;
  depth?: number;
}) {
  const initial = thread.reviewer_name.charAt(0).toUpperCase();
  const colors = ['#4FAF8F', '#2D6CDF', '#C7A54A', '#9A4E9A', '#C41E68', '#00B4FF'];
  const colorIndex = thread.reviewer_name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <div className={cn('group', depth > 0 && 'ml-8 mt-2')}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${avatarColor}30`, color: avatarColor }}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn(
              'text-sm font-semibold',
              isWhiteBg ? 'text-[#0E1B2C]' : 'text-[#F5F7F9]'
            )}>
              {thread.reviewer_name}
            </span>
            <span className={cn(
              'text-[10px]',
              isWhiteBg ? 'text-[#0E1B2C]/25' : 'text-[#F5F7F9]/25'
            )}>
              {timeAgo(thread.created_at)}
            </span>
          </div>
          <p className={cn(
            'text-sm leading-relaxed',
            isWhiteBg ? 'text-[#0E1B2C]/60' : 'text-[#F5F7F9]/60'
          )}>
            {thread.content}
          </p>

          {/* Reply button */}
          {depth === 0 && (
            <button
              onClick={() => onReply(thread.id)}
              className={cn(
                'flex items-center gap-1 text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
                isWhiteBg ? 'text-[#0E1B2C]/30 hover:text-[#4FAF8F]' : 'text-[#F5F7F9]/30 hover:text-[#4FAF8F]'
              )}
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className={cn(
          'border-l-2 ml-3.5',
          isWhiteBg ? 'border-[#E9EEF2]' : 'border-white/10'
        )}>
          {thread.replies.map(reply => (
            <CommentBubble
              key={reply.id}
              thread={reply}
              isWhiteBg={isWhiteBg}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({
  threads,
  presentationId,
  sectionId,
  reviewerId,
  reviewerName,
  isWhiteBg = false,
  onNewComment,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onNewComment(newComment.trim(), replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const replyingToThread = replyingTo
    ? threads.find(t => t.id === replyingTo)
    : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 text-xs font-medium w-full',
          isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/40'
        )}
      >
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {threads.length} {threads.length === 1 ? 'comment' : 'comments'}
      </button>

      {isExpanded && (
        <>
          {/* Thread list */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {threads.map(thread => (
              <CommentBubble
                key={thread.id}
                thread={thread}
                isWhiteBg={isWhiteBg}
                onReply={(parentId) => setReplyingTo(parentId)}
              />
            ))}
          </div>

          {/* Reply indicator */}
          {replyingToThread && (
            <div className={cn(
              'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg',
              isWhiteBg ? 'bg-[#2D6CDF]/[0.06] text-[#2D6CDF]' : 'bg-[#2D6CDF]/10 text-[#2D6CDF]'
            )}>
              <Reply className="w-3 h-3" />
              Replying to {replyingToThread.reviewer_name}
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-[10px] opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
              className={cn(
                'flex-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all',
                isWhiteBg
                  ? 'bg-[#0E1B2C]/[0.03] border border-[#E9EEF2] text-[#0E1B2C] placeholder-[#0E1B2C]/20 focus:border-[#4FAF8F]/30'
                  : 'bg-white/5 border border-white/10 text-[#F5F7F9] placeholder-[#F5F7F9]/20 focus:border-[#4FAF8F]/30'
              )}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-2.5 bg-[#4FAF8F] text-white rounded-lg text-sm hover:bg-[#4FAF8F]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
