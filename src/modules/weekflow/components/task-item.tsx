'use client';

import { useState } from 'react';
import { Check, Trash2, AlertTriangle, Flame, Calendar, Users, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { WFTask, WFMember, Priority, Visibility } from '../types';
import { priorityClasses } from '../lib/utils';

interface TaskItemProps {
  task: WFTask;
  isOwner: boolean;
  members?: WFMember[];
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: {
    text?: string;
    priority?: Priority;
    startDate?: string | null;
    dueDate?: string | null;
    visibility?: Visibility;
  }) => Promise<boolean>;
  onAssignTask?: (taskId: string, memberIds: string[]) => Promise<boolean>;
}

export function TaskItem({ task, isOwner, members, onToggle, onDelete, onUpdateTask, onAssignTask }: TaskItemProps) {
  const t = useTranslations('weekflow.tasks');
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);
  const isCompleted = task.status === 'completed';

  const assignedMembers = members?.filter((m) =>
    task.assignees?.some((a) => a.member_id === m.id)
  ) || [];

  function toggleAssignee(memberId: string) {
    if (!onAssignTask) return;
    const currentIds = task.assignees?.map((a) => a.member_id) || [];
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter((id) => id !== memberId)
      : [...currentIds, memberId];
    onAssignTask(task.id, newIds);
  }

  function toggleVisibility() {
    if (!onUpdateTask) return;
    onUpdateTask(task.id, {
      visibility: task.visibility === 'private' ? 'team' : 'private',
    });
  }

  return (
    <div
      className={`group flex flex-col rounded-lg border-l-4 transition-colors hover:bg-muted/50 ${priorityClasses(task.priority)}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowAssignees(false); }}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-muted-foreground/40 hover:border-primary'
          }`}
        >
          {isCompleted && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <span className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.text}
          </span>

          {/* Task metadata row */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.due_date && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {assignedMembers.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                {assignedMembers.map((m) => (
                  <span key={m.id} title={m.name} className="inline-block">{m.avatar}</span>
                ))}
              </span>
            )}
            {task.visibility === 'private' && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <EyeOff className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {task.priority === 'urgent' && (
          <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        {task.priority === 'important' && (
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}

        {isOwner && showActions && (
          <div className="flex items-center gap-1">
            {/* Expand details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded details panel */}
      {showDetails && isOwner && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2 animate-in slide-in-from-top-1 duration-150">
          {/* Due date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs text-muted-foreground w-16">{t('dueDate')}</label>
            <input
              type="date"
              value={task.due_date || ''}
              onChange={(e) => onUpdateTask?.(task.id, { dueDate: e.target.value || null })}
              className="text-xs bg-muted/50 border border-border rounded px-2 py-1 flex-1"
            />
          </div>

          {/* Start date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs text-muted-foreground w-16">{t('startDate')}</label>
            <input
              type="date"
              value={task.start_date || ''}
              onChange={(e) => onUpdateTask?.(task.id, { startDate: e.target.value || null })}
              className="text-xs bg-muted/50 border border-border rounded px-2 py-1 flex-1"
            />
          </div>

          {/* Visibility toggle */}
          {task.section === 'personal' && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVisibility}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                  task.visibility === 'private'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {task.visibility === 'private' ? (
                  <><EyeOff className="w-3 h-3" /> {t('private')}</>
                ) : (
                  <><Eye className="w-3 h-3" /> {t('shared')}</>
                )}
              </button>
            </div>
          )}

          {/* Assignees */}
          {members && members.length > 1 && (
            <div>
              <button
                onClick={() => setShowAssignees(!showAssignees)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Users className="w-3.5 h-3.5" />
                {t('assignTo')} ({task.assignees?.length || 0})
              </button>

              {showAssignees && (
                <div className="mt-1 space-y-0.5">
                  {members.map((member) => {
                    const isAssigned = task.assignees?.some((a) => a.member_id === member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          isAssigned ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <span>{member.avatar}</span>
                        <span>{member.name}</span>
                        {isAssigned && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
