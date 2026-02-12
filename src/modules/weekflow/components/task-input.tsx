'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Section, Priority, Visibility, WFMember } from '../types';

interface TaskInputProps {
  section: Section;
  members?: WFMember[];
  onAdd: (text: string, section: Section, priority: Priority, options?: {
    startDate?: string;
    dueDate?: string;
    visibility?: Visibility;
    assigneeIds?: string[];
  }) => void;
}

export function TaskInput({ section, members = [], onAdd }: TaskInputProps) {
  const t = useTranslations('weekflow.tasks');
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [showPriority, setShowPriority] = useState(false);

  // @ mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIdx, setMentionIdx] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Filter members for mention dropdown
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Reset mention index when list changes
  useEffect(() => {
    setMentionIdx(0);
  }, [mentionQuery]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // Detect @ trigger
    const cursorPos = e.target.selectionStart || val.length;
    const textBefore = val.substring(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);

    if (atMatch && members.length > 0) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [members.length]);

  function insertMention(member: WFMember) {
    const cursorPos = inputRef.current?.selectionStart || text.length;
    const textBefore = text.substring(0, cursorPos);
    const textAfter = text.substring(cursorPos);
    const atIdx = textBefore.lastIndexOf('@');

    if (atIdx >= 0) {
      const newText = textBefore.substring(0, atIdx) + `@${member.name} ` + textAfter;
      setText(newText);

      // Track mentioned member
      if (!mentionedIds.includes(member.id)) {
        setMentionedIds((prev) => [...prev, member.id]);
      }
    }

    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx((prev) => Math.min(prev + 1, filteredMembers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIdx]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim(), section, priority, {
      assigneeIds: mentionedIds.length > 0 ? mentionedIds : undefined,
    });
    setText('');
    setPriority('normal');
    setMentionedIds([]);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={members.length > 0 ? `${t('placeholder')} ${t('mentionHint')}` : t('placeholder')}
          className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />

        {/* @ mention dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div
            ref={mentionListRef}
            className="absolute left-0 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-lg z-20 py-1 min-w-[200px] max-h-[200px] overflow-auto"
          >
            {filteredMembers.map((member, idx) => (
              <button
                key={member.id}
                type="button"
                onClick={() => insertMention(member)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  idx === mentionIdx
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-base">{member.avatar}</span>
                <span className="font-medium">{member.name}</span>
                {member.role === 'admin' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                    {t('admin') || 'admin'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mentioned members badges */}
        {mentionedIds.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {mentionedIds.map((id) => {
              const member = members.find((m) => m.id === id);
              if (!member) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full"
                >
                  {member.avatar} {member.name}
                  <button
                    type="button"
                    onClick={() => setMentionedIds((prev) => prev.filter((mid) => mid !== id))}
                    className="ml-0.5 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPriority(!showPriority)}
          className={`px-2 py-2 text-xs rounded-lg border transition-colors ${
            priority === 'urgent'
              ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
              : priority === 'important'
              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
              : 'border-border bg-background text-muted-foreground'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {showPriority && (
          <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
            {(['normal', 'important', 'urgent'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPriority(p);
                  setShowPriority(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                  priority === p ? 'font-medium text-primary' : ''
                }`}
              >
                {t(`priority.${p}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!text.trim()}
        className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </form>
  );
}
