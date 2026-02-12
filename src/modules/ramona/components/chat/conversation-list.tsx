'use client';

import { useTranslations } from 'next-intl';
import { MessageSquare, Plus } from 'lucide-react';
import type { Conversation } from '../../hooks/use-conversation';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: ConversationListProps) {
  const t = useTranslations('ramona.chat');

  return (
    <div className="space-y-2">
      <button
        onClick={onNew}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-ramona-purple bg-ramona-purple/10 rounded-lg hover:bg-ramona-purple/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('newChat')}
      </button>

      {conversations.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{t('noConversations')}</p>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                activeId === conv.id
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">
                {conv.title || `Chat ${new Date(conv.created_at).toLocaleDateString()}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
