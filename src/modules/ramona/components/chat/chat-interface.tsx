'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react';
import type { RMBrand, SocialPlatform, ContentType } from '../../types';
import { useConversation } from '../../hooks/use-conversation';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatSidebar } from './chat-sidebar';
import { ConversationList } from './conversation-list';

interface ChatInterfaceProps {
  brand: RMBrand;
  userId: string;
  onSaveContent: (params: {
    body: string;
    platform: SocialPlatform;
    contentType: ContentType;
    hashtags: string[];
  }) => void;
}

export function ChatInterface({ brand, userId, onSaveContent }: ChatInterfaceProps) {
  const t = useTranslations('ramona.chat');
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    sending,
    loadConversations,
    loadMessages,
    startNewConversation,
    sendMessage,
  } = useConversation(userId, brand);

  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(brand.platforms[0] || 'instagram');
  const [selectedType, setSelectedType] = useState<ContentType>('post');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSaveContent(content: string) {
    // Extract hashtags
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];
    const body = content.replace(hashtagRegex, '').trim();

    onSaveContent({
      body,
      platform: selectedPlatform,
      contentType: selectedType,
      hashtags,
    });
  }

  function handleSelectConversation(id: string) {
    loadMessages(id);
  }

  async function handleNewConversation() {
    await startNewConversation();
  }

  return (
    <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
      {/* Conversation list */}
      <div className={`w-56 flex-shrink-0 overflow-y-auto hidden md:block ${showSidebar ? '' : 'md:hidden'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {t('conversations')}
          </h3>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeConversation}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="mb-2 p-1 text-muted-foreground hover:text-foreground self-start"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <span className="text-4xl">🌵</span>
                <p className="text-sm text-muted-foreground">{t('welcome')}</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              onSaveContent={msg.role === 'assistant' ? handleSaveContent : undefined}
            />
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-ramona-purple/10 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-ramona-purple border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
                {t('thinking')}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={sending} />
      </div>

      {/* Context sidebar */}
      <div className="w-48 flex-shrink-0 hidden lg:block">
        <ChatSidebar
          brand={brand}
          selectedPlatform={selectedPlatform}
          selectedType={selectedType}
          onPlatformChange={setSelectedPlatform}
          onTypeChange={setSelectedType}
        />
      </div>
    </div>
  );
}
