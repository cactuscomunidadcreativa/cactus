'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, LayoutGrid, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { WFTask, WFMember, Section } from '../types';
import { TaskItem } from './task-item';

interface PresenterModeProps {
  members: WFMember[];
  tasks: WFTask[];
  currentMember: WFMember | null;
  onToggleTask: (taskId: string) => void;
  onClose: () => void;
}

const PRESENT_SECTIONS: Section[] = ['show_and_tell', 'to_discuss', 'focus'];

type ViewMode = 'individual' | 'overview';

export function PresenterMode({ members, tasks, currentMember, onToggleTask, onClose }: PresenterModeProps) {
  const t = useTranslations('weekflow.presenter');
  const tSections = useTranslations('weekflow.sections');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const presentableMembers = useMemo(() => {
    if (skipEmpty) {
      return members.filter((m) =>
        tasks.some(
          (task) => task.member_id === m.id && PRESENT_SECTIONS.includes(task.section)
        )
      );
    }
    return members;
  }, [members, tasks, skipEmpty]);

  const activeMember = presentableMembers[currentIdx];
  const allDone = currentIdx >= presentableMembers.length;

  function next() {
    if (currentIdx < presentableMembers.length) {
      setCurrentIdx((prev) => prev + 1);
    }
  }

  function prev() {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }

  function getMemberTasks(memberId: string, section: Section) {
    return tasks.filter((task) => task.member_id === memberId && task.section === section);
  }

  const sectionLabels: Record<string, string> = {
    show_and_tell: 'showAndTell',
    to_discuss: 'toDiscuss',
    focus: 'focus',
  };

  const sectionIcons: Record<string, string> = {
    show_and_tell: '🎤',
    to_discuss: '💬',
    focus: '🎯',
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎤</span>
          <h2 className="font-display font-bold text-lg">{t('title')}</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode toggle */}
          <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {t('viewAll')}
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {t('viewOne')}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipEmpty}
              onChange={(e) => {
                setSkipEmpty(e.target.checked);
                setCurrentIdx(0);
              }}
              className="rounded border-border"
            />
            {t('skipEmpty')}
          </label>

          {viewMode === 'individual' && (
            <span className="text-sm text-muted-foreground">
              {Math.min(currentIdx + 1, presentableMembers.length)} / {presentableMembers.length}
            </span>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar (individual mode only) */}
      {viewMode === 'individual' && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(currentIdx / Math.max(presentableMembers.length, 1)) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        {viewMode === 'overview' ? (
          /* ===== OVERVIEW MODE: All members at once ===== */
          <div className="max-w-6xl mx-auto space-y-8">
            {PRESENT_SECTIONS.map((section) => {
              const allSectionTasks = presentableMembers.flatMap((m) =>
                getMemberTasks(m.id, section).map((task) => ({
                  ...task,
                  memberName: m.name,
                  memberAvatar: m.avatar,
                }))
              );

              if (allSectionTasks.length === 0) return null;

              return (
                <div key={section}>
                  <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                    <span>{sectionIcons[section]}</span>
                    {tSections(sectionLabels[section])}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {presentableMembers.map((member) => {
                      const memberTasks = getMemberTasks(member.id, section);
                      if (memberTasks.length === 0) return null;

                      return (
                        <div key={member.id} className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{member.avatar}</span>
                            <span className="font-medium text-sm">{member.name}</span>
                          </div>
                          <div className="space-y-1">
                            {memberTasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                isOwner={task.member_id === currentMember?.id}
                                onToggle={onToggleTask}
                                onDelete={() => {}}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ===== INDIVIDUAL MODE: One member at a time ===== */
          <>
            {allDone ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-6xl mb-6">🎉</p>
                <h3 className="text-2xl font-display font-bold mb-2">{t('allDone')}</h3>
              </div>
            ) : activeMember ? (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Current speaker */}
                <div className="text-center mb-8">
                  <span className="text-5xl mb-3 block">{activeMember.avatar}</span>
                  <h3 className="text-2xl font-display font-bold">{activeMember.name}</h3>
                  <p className="text-sm text-muted-foreground">{t('currentSpeaker')}</p>
                </div>

                {/* Member's sections */}
                {PRESENT_SECTIONS.map((section) => {
                  const sectionTasks = getMemberTasks(activeMember.id, section);
                  if (sectionTasks.length === 0) return null;

                  return (
                    <div key={section} className="bg-card border border-border rounded-xl p-4">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <span>{sectionIcons[section]}</span>
                        {tSections(sectionLabels[section])}
                      </h4>
                      <div className="space-y-1">
                        {sectionTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            isOwner={task.member_id === currentMember?.id}
                            onToggle={onToggleTask}
                            onDelete={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Navigation (individual mode only) */}
      {viewMode === 'individual' && (
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border">
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('previous')}
          </button>

          {/* Member dots */}
          <div className="flex items-center gap-2">
            {presentableMembers.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                  i === currentIdx
                    ? 'bg-primary text-primary-foreground'
                    : i < currentIdx
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={m.name}
              >
                {m.avatar}
              </button>
            ))}
          </div>

          <button
            onClick={next}
            disabled={allDone}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
