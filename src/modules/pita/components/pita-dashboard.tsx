'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Users,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionFeedback, PresentationSection } from '../types';

interface PitaDashboardProps {
  presentationId: string;
  title: string;
  slug: string;
  sections: PresentationSection[];
  feedbackData: SectionFeedback[];
  reviewers: { id: string; name: string; last_seen_at: string }[];
}

export function PitaDashboard({
  title,
  slug,
  sections,
  feedbackData,
  reviewers,
}: PitaDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const presentationUrl = `${baseUrl}/pita/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(presentationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group feedback by section
  const feedbackBySection = sections.reduce((acc, section) => {
    const sectionFeedback = feedbackData.filter(f => f.section_id === section.id);
    acc[section.id] = {
      reactions: {
        like: sectionFeedback.filter(f => f.reaction === 'like').length,
        dislike: sectionFeedback.filter(f => f.reaction === 'dislike').length,
        love: sectionFeedback.filter(f => f.reaction === 'love').length,
      },
      comments: sectionFeedback.filter(f => f.comment).map(f => ({
        name: f.reviewer_name,
        comment: f.comment!,
        created_at: f.created_at,
      })),
    };
    return acc;
  }, {} as Record<string, { reactions: { like: number; dislike: number; love: number }; comments: { name: string; comment: string; created_at: string }[] }>);

  const totalComments = feedbackData.filter(f => f.comment).length;
  const totalReactions = feedbackData.filter(f => f.reaction).length;

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image src="/pita.png" alt="PITA" width={48} height={48} />
          <div>
            <h1 className="text-2xl font-editorial font-bold">{title}</h1>
            <p className="text-muted-foreground text-sm">Presentation & Feedback Vault</p>
          </div>
        </div>
      </div>

      {/* Share Link */}
      <div className="flex items-center gap-2 p-4 bg-muted rounded-xl">
        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <code className="flex-1 text-sm truncate text-muted-foreground">
          {presentationUrl}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-pita-green text-white rounded-lg text-sm font-medium hover:bg-pita-green/90 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs">Reviewers</span>
          </div>
          <p className="text-2xl font-bold">{reviewers.length}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Reactions</span>
          </div>
          <p className="text-2xl font-bold">{totalReactions}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Comments</span>
          </div>
          <p className="text-2xl font-bold">{totalComments}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Sections</span>
          </div>
          <p className="text-2xl font-bold">{sections.length}</p>
        </div>
      </div>

      {/* Reviewers */}
      {reviewers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Reviewers</h3>
          <div className="flex flex-wrap gap-2">
            {reviewers.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                <div className="w-5 h-5 rounded bg-pita-green/20 flex items-center justify-center text-pita-green text-xs font-bold">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Feedback */}
      <div className="space-y-3">
        <h3 className="font-semibold">Feedback by Section</h3>
        {sortedSections.map(section => {
          const fb = feedbackBySection[section.id] || { reactions: { like: 0, dislike: 0, love: 0 }, comments: [] };
          const isExpanded = selectedSection === section.id;
          const hasActivity = fb.reactions.like + fb.reactions.dislike + fb.reactions.love + fb.comments.length > 0;

          return (
            <div
              key={section.id}
              className={cn(
                'bg-card border rounded-xl overflow-hidden transition-all',
                hasActivity ? 'border-pita-green/20' : 'border-border'
              )}
            >
              <button
                onClick={() => setSelectedSection(isExpanded ? null : section.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {String(section.order_index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium">{section.title}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {fb.reactions.like > 0 && (
                    <span className="flex items-center gap-1 text-pita-green">
                      <ThumbsUp className="w-3.5 h-3.5" /> {fb.reactions.like}
                    </span>
                  )}
                  {fb.reactions.love > 0 && (
                    <span className="flex items-center gap-1 text-pita-gold">
                      <Heart className="w-3.5 h-3.5 fill-current" /> {fb.reactions.love}
                    </span>
                  )}
                  {fb.reactions.dislike > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <ThumbsDown className="w-3.5 h-3.5" /> {fb.reactions.dislike}
                    </span>
                  )}
                  {fb.comments.length > 0 && (
                    <span className="flex items-center gap-1 text-pita-blue">
                      <MessageSquare className="w-3.5 h-3.5" /> {fb.comments.length}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && fb.comments.length > 0 && (
                <div className="px-4 pb-4 space-y-2 border-t border-border">
                  {fb.comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 pt-3">
                      <div className="w-6 h-6 rounded bg-pita-green/20 flex items-center justify-center text-pita-green text-xs font-bold flex-shrink-0 mt-0.5">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
