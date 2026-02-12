'use client';

import { useState } from 'react';
import { LayoutGrid, Heart, BarChart3, Users, Play, RefreshCw, X, Share2, Download, FileSpreadsheet, Link, Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWeekFlow } from '../hooks/use-weekflow';
import { BoardView } from './board-view';
import { MoodPicker } from './mood-picker';
import { TeamPulseView } from './team-pulse';
import { TeamMembers } from './team-members';
import { TeamSetup } from './team-setup';
import { PresenterMode } from './presenter-mode';

type Tab = 'board' | 'mood' | 'pulse' | 'team';

interface WeekFlowAppProps {
  initialTeamId?: string | null;
}

export function WeekFlowApp({ initialTeamId }: WeekFlowAppProps) {
  const t = useTranslations('weekflow');
  const [teamId, setTeamId] = useState<string | null>(initialTeamId || null);
  const [activeTab, setActiveTab] = useState<Tab>('mood');
  const [showPresenter, setShowPresenter] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    team,
    members,
    currentMember,
    tasks,
    moods,
    pulse,
    loading,
    error,
    clearError,
    weekStart,
    currentWeek,
    isCurrentWeek,
    isAdmin,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    assignTask,
    saveMood,
    updateMemberRole,
    refresh,
  } = useWeekFlow(teamId);

  // If no team, show setup
  if (!teamId) {
    return <TeamSetup onTeamReady={(id) => setTeamId(id)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return <TeamSetup onTeamReady={(id) => setTeamId(id)} />;
  }

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'mood', icon: <Heart className="w-4 h-4" />, label: t('tabs.mood') },
    { key: 'board', icon: <LayoutGrid className="w-4 h-4" />, label: t('tabs.board') },
    { key: 'pulse', icon: <BarChart3 className="w-4 h-4" />, label: t('tabs.pulse') },
    { key: 'team', icon: <Users className="w-4 h-4" />, label: t('tabs.team') },
  ];

  // Build shareable join link
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/apps/weekflow/join?code=${team.code}`
    : '';

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(team!.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Export to CSV download
  function handleExportCSV() {
    const csvRows = [
      ['Section', 'Task', 'Status', 'Priority', 'Owner', 'Due Date', 'Week'].join(','),
    ];

    for (const task of tasks) {
      const owner = members.find((m) => m.id === task.member_id);
      csvRows.push([
        task.section,
        `"${task.text.replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        owner?.name || '',
        task.due_date || '',
        task.week_start,
      ].join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekflow-${team?.name || 'team'}-${weekStart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export to Google Sheets (opens Google Sheets with CSV data)
  function handleExportGoogleDrive() {
    // Build CSV content
    const csvRows = [
      ['Section', 'Task', 'Status', 'Priority', 'Owner', 'Due Date', 'Week'].join(','),
    ];

    for (const task of tasks) {
      const owner = members.find((m) => m.id === task.member_id);
      csvRows.push([
        task.section,
        `"${task.text.replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        owner?.name || '',
        task.due_date || '',
        task.week_start,
      ].join(','));
    }

    // Create a Blob and open Google Sheets import
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(blob);

    // Download CSV first, then open Google Sheets
    const a = document.createElement('a');
    a.href = csvUrl;
    a.download = `weekflow-${team?.name || 'team'}-${weekStart}.csv`;
    a.click();
    URL.revokeObjectURL(csvUrl);

    // Open Google Sheets import page
    window.open('https://sheets.google.com/create', '_blank');
  }

  return (
    <>
      {showPresenter && (
        <PresenterMode
          members={members}
          tasks={tasks}
          currentMember={currentMember}
          onToggleTask={toggleTask}
          onClose={() => setShowPresenter(false)}
        />
      )}

      <div className="space-y-4">
        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            <span>{error}</span>
            <button onClick={clearError} className="p-1 hover:bg-destructive/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Share URL - Always visible as a card below header */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('team.shareCode')}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Team code */}
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-muted rounded-lg text-sm font-mono font-bold tracking-widest">
                {team.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={t('team.copyLink')}
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>

            <span className="hidden sm:block text-muted-foreground">|</span>

            {/* Full link */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="px-3 py-2 bg-muted rounded-lg text-xs flex-1 truncate">
                {shareUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 whitespace-nowrap flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedLink ? '✓' : t('team.copyLink')}
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌊</span>
            <div>
              <h1 className="text-2xl font-display font-bold">{team.name}</h1>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative group">
              <button
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={t('export.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-20 py-1 min-w-[200px] hidden group-hover:block">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {t('export.download')}
                </button>
                <button
                  onClick={handleExportGoogleDrive}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 19h20L12 2z" />
                    <path d="M2 19h20" />
                    <path d="M12 2l10 17" />
                  </svg>
                  {t('export.saveToDrive')}
                </button>
              </div>
            </div>

            <button
              onClick={() => refresh()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPresenter(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">{t('presenter.start')}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'board' && (
            <BoardView
              tasks={tasks}
              currentMember={currentMember}
              members={members}
              weekStart={weekStart}
              isCurrentWeek={isCurrentWeek}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onAssignTask={assignTask}
              onPreviousWeek={goToPreviousWeek}
              onNextWeek={goToNextWeek}
              onCurrentWeek={goToCurrentWeek}
            />
          )}
          {activeTab === 'mood' && (
            <MoodPicker
              currentMember={currentMember}
              moods={moods}
              onSave={saveMood}
            />
          )}
          {activeTab === 'pulse' && (
            <TeamPulseView
              pulse={pulse}
              moods={moods}
              members={members}
            />
          )}
          {activeTab === 'team' && (
            <TeamMembers
              team={team}
              members={members}
              currentMember={currentMember}
              isAdmin={isAdmin}
              onUpdateRole={updateMemberRole}
            />
          )}
        </div>
      </div>
    </>
  );
}
