'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, ArrowDownToLine, X, Bot, User } from 'lucide-react';
import { PresentationSection, BrandConfig, AIMessage } from '../types';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  presentationId: string;
  presentationTitle: string;
  brandConfig: BrandConfig;
  currentSection: PresentationSection | null;
  onInsert: (html: string) => void;
  onClose: () => void;
}

export function AIAssistant({
  presentationId,
  presentationTitle,
  brandConfig,
  currentSection,
  onInsert,
  onClose,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (content: string, mode: 'chat' | 'generate' | 'refine' = 'chat') => {
    if (!content.trim() || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/pita/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          currentContent: mode === 'refine' ? currentSection?.content : undefined,
          sectionType: currentSection?.section_type,
          mode,
        }),
      });

      const data = await res.json();

      if (data.ok && data.content) {
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: AIMessage = {
          role: 'assistant',
          content: `Error: ${data.error || 'AI generation failed'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Error: Failed to connect to AI service',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, presentationId, currentSection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleGenerate = () => {
    const prompt = `Generate a ${currentSection?.section_type || 'content'} slide titled "${currentSection?.title || 'New Slide'}"`;
    sendMessage(prompt, 'generate');
  };

  const handleRefine = () => {
    if (!currentSection?.content) return;
    const prompt = input.trim() || 'Improve this slide. Make it more impactful and visually engaging.';
    sendMessage(prompt, 'refine');
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pita-green/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-pita-green" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold">AI Writer</h3>
            <p className="text-[10px] text-muted-foreground">Strategic Emotional Copy</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-border flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pita-green/10 text-pita-green rounded-lg text-xs font-medium hover:bg-pita-green/20 disabled:opacity-40 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate
        </button>
        <button
          onClick={handleRefine}
          disabled={loading || !currentSection?.content}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pita-blue/10 text-pita-blue rounded-lg text-xs font-medium hover:bg-pita-blue/20 disabled:opacity-40 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refine
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">PITA AI Writer</p>
            <p className="text-xs leading-relaxed">
              Describe the slide you want and I will generate professional HTML content with the right emotional impact.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-pita-green/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-pita-green" />
              </div>
            )}

            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}>
              {msg.role === 'assistant' ? (
                <div>
                  {/* Show a snippet of the HTML */}
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-4 font-mono leading-relaxed">
                    {msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}
                  </div>

                  {/* Mini preview */}
                  {!msg.content.startsWith('Error:') && (
                    <>
                      <div
                        className="rounded-lg border border-border overflow-hidden mb-2 p-2 max-h-32"
                        style={{ backgroundColor: brandConfig.backgroundColor, color: brandConfig.textColor, fontSize: '4px' }}
                      >
                        <div
                          className="transform scale-[0.25] origin-top-left w-[400%]"
                          dangerouslySetInnerHTML={{ __html: msg.content }}
                        />
                      </div>

                      <button
                        onClick={() => onInsert(msg.content)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-pita-green/10 text-pita-green rounded-lg text-[10px] font-medium hover:bg-pita-green/20 transition-all w-full justify-center"
                      >
                        <ArrowDownToLine className="w-3 h-3" />
                        Insert into Editor
                      </button>
                    </>
                  )}

                  {msg.content.startsWith('Error:') && (
                    <p className="text-xs text-destructive">{msg.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs">{msg.content}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-pita-green/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-pita-green animate-pulse" />
            </div>
            <div className="bg-muted rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want..."
            rows={2}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="self-end p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
