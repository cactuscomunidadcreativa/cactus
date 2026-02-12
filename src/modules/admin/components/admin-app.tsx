'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Users, BarChart3, ScrollText, MessageCircle, AppWindow, FileText } from 'lucide-react';
import { useAdmin } from '../hooks/use-admin';
import { ConfigPanel } from './config-panel';
import { UsersPanel } from './users-panel';
import { AnalyticsPanel } from './analytics-panel';
import { AuditLogPanel } from './audit-log-panel';
import { WhatsAppTester } from './whatsapp-tester';
import { AppsAdmin } from './apps-admin';
import { CMSAdmin } from './cms-admin';

type TabId = 'config' | 'users' | 'apps' | 'cms' | 'analytics' | 'audit' | 'whatsapp';

export function AdminApp() {
  const t = useTranslations('admin');
  const tw = useTranslations('whatsapp');
  const {
    configs,
    budgets,
    auditLog,
    analytics,
    loading,
    saveConfig,
    saveBudget,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabId>('config');

  const tabs: { id: TabId; icon: typeof Settings; label: string }[] = [
    { id: 'config', icon: Settings, label: t('tabs.config') },
    { id: 'users', icon: Users, label: t('tabs.users') },
    { id: 'apps', icon: AppWindow, label: 'Apps' },
    { id: 'cms', icon: FileText, label: 'CMS' },
    { id: 'analytics', icon: BarChart3, label: t('tabs.analytics') },
    { id: 'audit', icon: ScrollText, label: t('tabs.audit') },
    { id: 'whatsapp', icon: MessageCircle, label: tw('tester.title') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-xl font-display font-bold">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
      {activeTab === 'config' && (
        <ConfigPanel configs={configs} onSave={saveConfig} />
      )}
      {activeTab === 'users' && (
        <UsersPanel budgets={budgets} onSaveBudget={saveBudget} />
      )}
      {activeTab === 'apps' && (
        <AppsAdmin />
      )}
      {activeTab === 'cms' && (
        <CMSAdmin />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsPanel analytics={analytics} />
      )}
      {activeTab === 'audit' && (
        <AuditLogPanel entries={auditLog} />
      )}
      {activeTab === 'whatsapp' && (
        <WhatsAppTester />
      )}
    </div>
  );
}
