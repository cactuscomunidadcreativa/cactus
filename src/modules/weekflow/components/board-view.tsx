'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { WFTask, WFMember, Section, Priority, Visibility } from '../types';
import { SectionPanel } from './section-panel';
import { formatWeekLabel } from '../lib/utils';

interface BoardViewProps {
  tasks: WFTask[];
  currentMember: WFMember | null;
  members: WFMember[];
  weekStart: string;
  isCurrentWeek: boolean;
  onAddTask: (text: string, section: Section, priority: Priority, options?: {
    startDate?: string;
    dueDate?: string;
    visibility?: Visibility;
    assigneeIds?: string[];
  }) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: {
    text?: string;
    priority?: Priority;
    startDate?: string | null;
    dueDate?: string | null;
    visibility?: Visibility;
  }) => Promise<boolean>;
  onAssignTask: (taskId: string, memberIds: string[]) => Promise<boolean>;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

const sections: Section[] = ['personal', 'show_and_tell', 'to_discuss', 'focus'];

export function BoardView({
  tasks,
  currentMember,
  members,
  weekStart,
  isCurrentWeek,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onAssignTask,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
}: BoardViewProps) {
  const t = useTranslations('weekflow');
  const locale = useLocale();

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPreviousWeek}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={t('week.previous')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t('weekOf', { date: formatWeekLabel(weekStart, locale) })}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={onCurrentWeek}
              className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              {t('week.today')}
            </button>
          )}
        </div>

        <button
          onClick={onNextWeek}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={t('week.next')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <SectionPanel
            key={section}
            section={section}
            tasks={tasks}
            currentMember={currentMember}
            members={members}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onAssignTask={onAssignTask}
          />
        ))}
      </div>
    </div>
  );
}
