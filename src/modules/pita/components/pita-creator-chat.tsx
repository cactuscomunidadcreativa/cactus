'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Bot, User, Sparkles, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type CreatorPhase = 'discovery' | 'structure' | 'generating' | 'done';

function extractStructure(content: string): string | null {
  const match = content.match(/\[STRUCTURE_READY\]([\s\S]*?)\[\/STRUCTURE_READY\]/);
  return match ? match[1].trim() : null;
}

function extractSlidesJSON(content: string): any[] | null {
  const match = content.match(/\[SLIDES_JSON\]([\s\S]*?)\[\/SLIDES_JSON\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function cleanDisplayText(content: string): string {
  return content
    .replace(/\[STRUCTURE_READY\][\s\S]*?\[\/STRUCTURE_READY\]/g, '')
    .replace(/\[SLIDES_JSON\][\s\S]*?\[\/SLIDES_JSON\]/g, '')
    .trim();
}

export function PitaCreatorChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<CreatorPhase>('discovery');
  const [proposedStructure, setProposedStructure] = useState<string | null>(null);
  const [createdPresentation, setCreatedPresentation] = useState<{ id: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (content: string, allMessages?: ChatMessage[]) => {
    const userMsg: ChatMessage = { role: 'user', content };
    const updatedMessages = [...(allMessages || messages), userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pita/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          mode: 'creator',
        }),
      });

      const data = await res.json();

      if (!data.ok || !data.content) {
        setError(data.error || 'AI generation failed');
        return;
      }

      const assistantMsg: ChatMessage = { role: 'assistant', content: data.content };
      const newMessages = [...updatedMessages, assistantMsg];
      setMessages(newMessages);

      // Check for structure proposal
      const structure = extractStructure(data.content);
      if (structure) {
        setProposedStructure(structure);
        setPhase('structure');
      }

      // Check for generated slides
      const slides = extractSlidesJSON(data.content);
      if (slides && slides.length > 0) {
        setPhase('generating');
        await createPresentation(structure || proposedStructure, slides);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [messages, proposedStructure]);

  const createPresentation = async (structure: string | null, slides: any[]) => {
    try {
      // Parse title and colors from structure
      let title = 'New Presentation';
      let subtitle = '';
      let brandColors = {
        primaryColor: '#1E2A38',
        secondaryColor: '#4FAF8F',
        accentColor: '#A38DFF',
        backgroundColor: '#FFFFFF',
        textColor: '#1E2A38',
      };

      if (structure) {
        const titleMatch = structure.match(/title:\s*(.+)/i);
        const subtitleMatch = structure.match(/subtitle:\s*(.+)/i);
        const colorsMatch = structure.match(/colors:\s*(.+)/i);
        if (titleMatch) title = titleMatch[1].trim();
        if (subtitleMatch) subtitle = subtitleMatch[1].trim();
        if (colorsMatch) {
          const colorStr = colorsMatch[1];
          const primary = colorStr.match(/primary=([#\w]+)/)?.[1];
          const secondary = colorStr.match(/secondary=([#\w]+)/)?.[1];
          const accent = colorStr.match(/accent=([#\w]+)/)?.[1];
          if (primary) brandColors.primaryColor = primary;
          if (primary) brandColors.textColor = primary;
          if (secondary) brandColors.secondaryColor = secondary;
          if (accent) brandColors.accentColor = accent;
        }
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);

      // Create presentation in DB
      const presRes = await fetch('/api/pita/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          slug: `${slug}-${Date.now().toString(36)}`,
          brand_config: brandColors,
        }),
      });

      const presData = await presRes.json();
      if (!presData.ok || !presData.presentation) {
        setError(`Failed to create presentation: ${presData.error || 'Unknown error'}`);
        setPhase('structure');
        return;
      }

      const presentationId = presData.presentation.id;

      // Create all sections
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await fetch('/api/pita/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presentation_id: presentationId,
            title: slide.title || `Slide ${i + 1}`,
            subtitle: slide.subtitle || '',
            content: slide.content || '<div class="py-20 text-center"><p>Empty slide</p></div>',
            section_type: slide.section_type || 'content',
            order_index: i,
          }),
        });
      }

      // Activate the presentation
      await fetch(`/api/pita/presentations/${presentationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });

      setCreatedPresentation({ id: presentationId, title });
      setPhase('done');
    } catch (err: any) {
      setError(`Creation error: ${err.message}`);
      setPhase('structure');
    }
  };

  const handleApproveStructure = () => {
    sendMessage('Aprobado. Genera todas las slides ahora.');
  };

  const handleSubmit = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setPhase('discovery');
    setProposedStructure(null);
    setCreatedPresentation(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-pita-green/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-pita-green" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Presentation Creator</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Describe what you need and I'll create a complete presentation for you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'Create a certification program presentation',
                'Design a workshop deck on leadership',
                'Build a brand strategy pitch',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => {
          const displayText = cleanDisplayText(msg.content);
          if (!displayText) return null;

          return (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-pita-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-pita-green" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-pita-green text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}
              >
                {displayText}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-foreground/60" />
                </div>
              )}
            </div>
          );
        })}

        {/* Structure Proposal Card */}
        {phase === 'structure' && proposedStructure && !loading && (
          <div className="mx-auto max-w-lg p-4 rounded-xl border border-pita-green/20 bg-pita-green/[0.03] space-y-3">
            <p className="text-xs font-medium tracking-widest uppercase text-pita-green">Proposed Structure</p>
            <pre className="text-sm text-foreground/70 whitespace-pre-wrap font-mono leading-relaxed">
              {proposedStructure}
            </pre>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApproveStructure}
                className="flex items-center gap-2 px-4 py-2 bg-pita-green text-white rounded-lg text-sm font-medium hover:bg-pita-green/90 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Generate
              </button>
              <button
                onClick={() => setPhase('discovery')}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
              >
                Adjust
              </button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {phase === 'generating' && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin text-pita-green" />
            <p className="text-sm text-muted-foreground">Creating your presentation...</p>
          </div>
        )}

        {/* Done State */}
        {phase === 'done' && createdPresentation && (
          <div className="mx-auto max-w-lg p-6 rounded-xl border border-pita-green/30 bg-pita-green/[0.05] text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-pita-green mx-auto" />
            <div>
              <h3 className="text-lg font-display font-bold">{createdPresentation.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Presentation created successfully!</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push(`/apps/pita/editor/${createdPresentation.id}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-pita-green text-white rounded-lg text-sm font-medium hover:bg-pita-green/90 transition-all"
              >
                Open in Editor
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-pita-green/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-pita-green" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-pita-green/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-pita-green/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-pita-green/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-lg p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      {phase !== 'done' && phase !== 'generating' && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                phase === 'structure'
                  ? 'Type adjustments or click Approve...'
                  : 'Describe the presentation you want to create...'
              }
              rows={1}
              className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-pita-green/30 transition-all"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-pita-green text-white rounded-xl text-sm hover:bg-pita-green/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
