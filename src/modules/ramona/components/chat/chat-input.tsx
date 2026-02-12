'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useTranslations('ramona.chat');
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  function handleSubmit() {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border pt-3">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('placeholder')}
        disabled={disabled}
        rows={1}
        className="flex-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || disabled}
        aria-label={t('send')}
        className="p-2.5 bg-ramona-purple text-white rounded-xl hover:bg-ramona-purple/90 disabled:opacity-50 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
