'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2, GripVertical } from 'lucide-react';
import { PresentationSection } from '../types';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  cover: 'bg-emerald-500/20 text-emerald-400',
  content: 'bg-blue-500/20 text-blue-400',
  quote: 'bg-purple-500/20 text-purple-400',
  architecture: 'bg-cyan-500/20 text-cyan-400',
  visual: 'bg-pink-500/20 text-pink-400',
  manifesto: 'bg-amber-500/20 text-amber-400',
  closing: 'bg-rose-500/20 text-rose-400',
  brand: 'bg-teal-500/20 text-teal-400',
};

interface SlideListProps {
  sections: PresentationSection[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function SlideList({
  sections,
  selectedIndex,
  onSelect,
  onMoveUp,
  onMoveDown,
  onAdd,
  onDelete,
}: SlideListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-foreground/70">Slides</h3>
        <span className="text-xs text-muted-foreground">{sections.length}</span>
      </div>

      {/* Slide List */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section, index) => (
          <div
            key={section.id}
            onClick={() => onSelect(index)}
            className={cn(
              'group relative px-3 py-2.5 border-b border-border/50 cursor-pointer transition-all',
              index === selectedIndex
                ? 'bg-primary/10 border-l-2 border-l-primary'
                : 'hover:bg-muted/50 border-l-2 border-l-transparent'
            )}
          >
            <div className="flex items-start gap-2">
              {/* Slide Number */}
              <span className={cn(
                'text-xs font-mono mt-0.5 shrink-0',
                index === selectedIndex ? 'text-primary' : 'text-muted-foreground'
              )}>
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  index === selectedIndex ? 'text-foreground' : 'text-foreground/70'
                )}>
                  {section.title || 'Untitled'}
                </p>
                <span className={cn(
                  'inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider',
                  TYPE_COLORS[section.section_type] || 'bg-gray-500/20 text-gray-400'
                )}>
                  {section.section_type}
                </span>
              </div>

              {/* Actions (visible on hover or when selected) */}
              <div className={cn(
                'flex flex-col gap-0.5 shrink-0 transition-opacity',
                index === selectedIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
                  disabled={index === 0}
                  className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground hover:text-foreground transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
                  disabled={index === sections.length - 1}
                  className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground hover:text-foreground transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(section.id); }}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    confirmDeleteId === section.id
                      ? 'bg-destructive text-destructive-foreground'
                      : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  )}
                  title={confirmDeleteId === section.id ? 'Click again to confirm' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No slides yet. Add your first one!
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>
    </div>
  );
}
