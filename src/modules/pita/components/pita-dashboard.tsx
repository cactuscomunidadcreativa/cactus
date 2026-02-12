'use client';

import { useState, useEffect } from 'react';
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
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionFeedback, PresentationSection, PitaThread, PitaAttachment } from '../types';

interface PitaDashboardProps {
  presentationId: string;
  title: string;
  slug: string;
  sections: PresentationSection[];
  feedbackData: SectionFeedback[];
  reviewers: { id: string; name: string; last_seen_at: string }[];
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PitaDashboard({
  presentationId,
  title,
  slug,
  sections,
  feedbackData,
  reviewers,
}: PitaDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [threads, setThreads] = useState<PitaThread[]>([]);
  const [attachments, setAttachments] = useState<PitaAttachment[]>([]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const presentationUrl = `${baseUrl}/pita/${slug}`;

  // Load threads and attachments
  useEffect(() => {
    async function loadCoCreationData() {
      try {
        const [threadsRes, attachmentsRes] = await Promise.all([
          fetch(`/api/pita/threads?presentationId=${presentationId}`),
          fetch(`/api/pita/attachments?presentationId=${presentationId}`),
        ]);
        const threadsData = await threadsRes.json();
        const attachmentsData = await attachmentsRes.json();
        setThreads(threadsData.threads || []);
        setAttachments(attachmentsData.attachments || []);
      } catch {
        // Silently fail
      }
    }
    loadCoCreationData();
  }, [presentationId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(presentationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group feedback by section
  const feedbackBySection = sections.reduce((acc, section) => {
    const sectionFeedback = feedbackData.filter(f => f.section_id === section.id);
    const sectionThreads = threads.filter(t => t.section_id === section.id);
    const sectionAttachments = attachments.filter(a => a.section_id === section.id);
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
      threads: sectionThreads,
      attachments: sectionAttachments,
    };
    return acc;
  }, {} as Record<string, {
    reactions: { like: number; dislike: number; love: number };
    comments: { name: string; comment: string; created_at: string }[];
    threads: PitaThread[];
    attachments: PitaAttachment[];
  }>);

  const totalComments = feedbackData.filter(f => f.comment).length;
  const totalReactions = feedbackData.filter(f => f.reaction).length;
  const totalThreads = threads.length;
  const totalAttachments = attachments.length;

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image src="/pita.png" alt="PITA" width={48} height={48} />
          <div>
            <h1 className="text-2xl font-editorial font-bold">{title}</h1>
            <p className="text-muted-foreground text-sm">Presentation & Co-Creation Vault</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <p className="text-2xl font-bold">{totalComments + totalThreads}</p>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Paperclip className="w-4 h-4" />
            <span className="text-xs">Files</span>
          </div>
          <p className="text-2xl font-bold">{totalAttachments}</p>
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
          const fb = feedbackBySection[section.id] || { reactions: { like: 0, dislike: 0, love: 0 }, comments: [], threads: [], attachments: [] };
          const isExpanded = selectedSection === section.id;
          const hasActivity = fb.reactions.like + fb.reactions.dislike + fb.reactions.love + fb.comments.length + fb.threads.length + fb.attachments.length > 0;

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
                  {(fb.comments.length + fb.threads.length) > 0 && (
                    <span className="flex items-center gap-1 text-pita-blue">
                      <MessageSquare className="w-3.5 h-3.5" /> {fb.comments.length + fb.threads.length}
                    </span>
                  )}
                  {fb.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-pita-gold">
                      <Paperclip className="w-3.5 h-3.5" /> {fb.attachments.length}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border">
                  {/* Quick Comments (from feedback) */}
                  {fb.comments.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Feedback</p>
                      {fb.comments.map((c, i) => (
                        <div key={i} className="flex items-start gap-3">
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

                  {/* Persistent Threads */}
                  {fb.threads.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Co-Creation Threads</p>
                      {fb.threads.map(thread => (
                        <div key={thread.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-6 h-6 rounded bg-pita-blue/20 flex items-center justify-center text-pita-blue text-xs font-bold flex-shrink-0 mt-0.5"
                            >
                              {thread.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{thread.reviewer_name}</p>
                                <span className="text-[10px] text-muted-foreground">{timeAgo(thread.created_at)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{thread.content}</p>
                            </div>
                          </div>
                          {/* Replies */}
                          {thread.replies && thread.replies.length > 0 && (
                            <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
                              {thread.replies.map(reply => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <div
                                    className="w-5 h-5 rounded bg-pita-green/20 flex items-center justify-center text-pita-green text-[10px] font-bold flex-shrink-0 mt-0.5"
                                  >
                                    {reply.reviewer_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-semibold">{reply.reviewer_name}</p>
                                      <span className="text-[10px] text-muted-foreground">{timeAgo(reply.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {fb.attachments.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Uploaded Files</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {fb.attachments.filter(a => a.file_type.startsWith('image/')).map(img => (
                          <a
                            key={img.id}
                            href={img.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-pita-green/40 transition-all"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-[10px] text-white/80 truncate">{img.reviewer_name}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                      {/* Non-image files */}
                      {fb.attachments.filter(a => !a.file_type.startsWith('image/')).map(file => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-pita-blue/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-pita-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">{file.reviewer_name} · {formatFileSize(file.file_size)}</p>
                          </div>
                          <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {fb.comments.length === 0 && fb.threads.length === 0 && fb.attachments.length === 0 && (
                    <p className="text-sm text-muted-foreground pt-3">No feedback yet for this section.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
