'use client';

import { useTranslations } from 'next-intl';
import type { WFTask, WFMember, Section, Priority, Visibility } from '../types';
import { TaskItem } from './task-item';
import { TaskInput } from './task-input';

interface SectionPanelProps {
  section: Section;
  tasks: WFTask[];
  currentMember: WFMember | null;
  members: WFMember[];
  onAddTask: (text: string, section: Section, priority: Priority, options?: {
    startDate?: string;
    dueDate?: string;
    visibility?: Visibility;
    assigneeIds?: string[];
  }) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: {
    text?: string;
    priority?: Priority;
    startDate?: string | null;
    dueDate?: string | null;
    visibility?: Visibility;
  }) => Promise<boolean>;
  onAssignTask?: (taskId: string, memberIds: string[]) => Promise<boolean>;
}

const sectionIcons: Record<Section, string> = {
  personal: '📋',
  show_and_tell: '🎤',
  to_discuss: '💬',
  focus: '🎯',
};

const sectionKeys: Record<Section, string> = {
  personal: 'personal',
  show_and_tell: 'showAndTell',
  to_discuss: 'toDiscuss',
  focus: 'focus',
};

export function SectionPanel({
  section,
  tasks,
  currentMember,
  members,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onAssignTask,
}: SectionPanelProps) {
  const t = useTranslations('weekflow.sections');
  const tTasks = useTranslations('weekflow.tasks');
  const sectionKey = sectionKeys[section];
  const sectionTasks = tasks.filter((task) => task.section === section);
  const completedCount = sectionTasks.filter((task) => task.status === 'completed').length;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sectionIcons[section]}</span>
          <div>
            <h3 className="font-semibold text-sm">{t(sectionKey)}</h3>
            <p className="text-xs text-muted-foreground">{t(`${sectionKey}Desc`)}</p>
          </div>
        </div>
        {sectionTasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{sectionTasks.length}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {sectionTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{tTasks('empty')}</p>
        ) : (
          sectionTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isOwner={task.member_id === currentMember?.id}
              members={members}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onUpdateTask={onUpdateTask}
              onAssignTask={onAssignTask}
            />
          ))
        )}
      </div>

      {currentMember && (
        <TaskInput section={section} members={members} onAdd={onAddTask} />
      )}
    </div>
  );
}
