'use client';

import { useTranslations } from 'next-intl';
import { Bot, User, Save } from 'lucide-react';
import { CONTENT_READY_REGEX } from '../../lib/ramona-personality';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onSaveContent?: (content: string) => void;
}

export function ChatMessage({ role, content, onSaveContent }: ChatMessageProps) {
  const t = useTranslations('ramona.chat');
  const isUser = role === 'user';

  // Check for [CONTENT_READY] blocks
  const readyBlocks: string[] = [];
  let match;
  const regex = /\[CONTENT_READY\]([\s\S]*?)\[\/CONTENT_READY\]/g;
  while ((match = regex.exec(content)) !== null) {
    readyBlocks.push(match[1].trim());
  }

  // Clean display text (remove markers)
  const displayText = content
    .replace(/\[CONTENT_READY\]/g, '')
    .replace(/\[\/CONTENT_READY\]/g, '')
    .trim();

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-ramona-purple/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-ramona-purple" />
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          {displayText}
        </div>

        {/* Save to pipeline buttons for ready content */}
        {!isUser && readyBlocks.length > 0 && onSaveContent && (
          <div className="flex flex-wrap gap-2">
            {readyBlocks.map((block, i) => (
              <button
                key={i}
                onClick={() => onSaveContent(block)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ramona-purple/10 text-ramona-purple rounded-full hover:bg-ramona-purple/20 transition-colors"
              >
                <Save className="w-3 h-3" />
                {t('saveToKanban')}
              </button>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
}
