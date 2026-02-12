'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, LayoutGrid, Calendar, Settings } from 'lucide-react';
import type { RMBrand, RMContent, ContentStatus, SocialPlatform, ContentType } from '../types';
import { useRamona } from '../hooks/use-ramona';
import { BrandOnboarding } from './brand-onboarding';
import { BrandSelector } from './brand-selector';
import { BrandSettings } from './brand-settings';
import { ChatInterface } from './chat/chat-interface';
import { KanbanView } from './kanban-view';
import { CalendarView } from './calendar-view';
import { ContentEditor } from './content-editor';
import { UsageMeter } from './usage-meter';

type TabId = 'studio' | 'kanban' | 'calendar';

interface RamonaAppProps {
  userId: string;
  contentLimit?: number;
}

export function RamonaApp({ userId, contentLimit = 100 }: RamonaAppProps) {
  const t = useTranslations('ramona');
  const {
    brands,
    selectedBrand,
    setSelectedBrand,
    contents,
    usage,
    loading,
    loadBrands,
    loadContents,
    addContent,
    updateContent,
    updateBrand,
    deleteContent,
    changeStatus,
  } = useRamona(userId);

  const [activeTab, setActiveTab] = useState<TabId>('studio');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [editingContent, setEditingContent] = useState<RMContent | null>(null);

  const tabs: { id: TabId; icon: typeof MessageSquare; label: string }[] = [
    { id: 'studio', icon: MessageSquare, label: t('tabs.studio') },
    { id: 'kanban', icon: LayoutGrid, label: t('tabs.kanban') },
    { id: 'calendar', icon: Calendar, label: t('tabs.calendar') },
  ];

  // Show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if no brands or explicit request
  if (brands.length === 0 || showOnboarding) {
    return (
      <BrandOnboarding
        userId={userId}
        onComplete={(brandId) => {
          setShowOnboarding(false);
          loadBrands();
        }}
        onSkip={brands.length > 0 ? () => setShowOnboarding(false) : undefined}
      />
    );
  }

  async function handleSaveFromChat(params: {
    body: string;
    platform: SocialPlatform;
    contentType: ContentType;
    hashtags: string[];
  }) {
    await addContent({
      body: params.body,
      platform: params.platform,
      contentType: params.contentType,
      hashtags: params.hashtags,
      status: 'draft',
    });
    // Switch to kanban to show saved content
    setActiveTab('kanban');
    loadContents();
  }

  function handleDrop(contentId: string, newStatus: ContentStatus) {
    changeStatus(contentId, newStatus);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌵</span>
          <div>
            <h1 className="text-xl font-display font-bold">{t('title')}</h1>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedBrand && (
            <button
              onClick={() => setShowBrandSettings(true)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              title={t('brand.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <BrandSelector
            brands={brands}
            selectedBrand={selectedBrand}
            onSelect={setSelectedBrand}
            onAddNew={() => setShowOnboarding(true)}
          />
        </div>
      </div>

      {/* Usage meter */}
      <UsageMeter usage={usage} limit={contentLimit} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {selectedBrand && activeTab === 'studio' && (
        <ChatInterface
          brand={selectedBrand}
          userId={userId}
          onSaveContent={handleSaveFromChat}
        />
      )}

      {activeTab === 'kanban' && (
        <KanbanView
          contents={contents}
          onEdit={setEditingContent}
          onStatusChange={handleDrop}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarView contents={contents} onEdit={setEditingContent} />
      )}

      {/* Content editor modal */}
      {editingContent && selectedBrand && (
        <ContentEditor
          content={editingContent}
          platforms={selectedBrand.platforms}
          onSave={updateContent}
          onDelete={deleteContent}
          onClose={() => setEditingContent(null)}
        />
      )}

      {/* Brand settings modal */}
      {showBrandSettings && selectedBrand && (
        <BrandSettings
          brand={selectedBrand}
          onSave={updateBrand}
          onClose={() => setShowBrandSettings(false)}
        />
      )}
    </div>
  );
}
