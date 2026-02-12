'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Eye, Code, AlertCircle } from 'lucide-react';
import { PresentationSection } from '../types';
import { cn } from '@/lib/utils';

const SECTION_TYPES: { value: string; label: string }[] = [
  { value: 'cover', label: 'Cover' },
  { value: 'content', label: 'Content' },
  { value: 'quote', label: 'Quote' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'visual', label: 'Visual' },
  { value: 'manifesto', label: 'Manifesto' },
  { value: 'closing', label: 'Closing' },
  { value: 'brand', label: 'Brand' },
];

interface SectionEditorProps {
  section: PresentationSection | null;
  onSave: (updated: PresentationSection) => Promise<void>;
  brandConfig: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

export function SectionEditor({ section, onSave, brandConfig }: SectionEditorProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [sectionType, setSectionType] = useState<string>('content');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load section data when section changes
  useEffect(() => {
    if (section) {
      setTitle(section.title || '');
      setSubtitle(section.subtitle || '');
      setContent(section.content || '');
      setSectionType(section.section_type || 'content');
      setIsDirty(false);
    }
  }, [section?.id]);

  // Track dirty state
  useEffect(() => {
    if (!section) return;
    const hasChanges =
      title !== (section.title || '') ||
      subtitle !== (section.subtitle || '') ||
      content !== (section.content || '') ||
      sectionType !== (section.section_type || 'content');
    setIsDirty(hasChanges);
  }, [title, subtitle, content, sectionType, section]);

  const handleSave = useCallback(async () => {
    if (!section || !isDirty) return;
    setSaving(true);
    try {
      await onSave({
        ...section,
        title,
        subtitle,
        content,
        section_type: sectionType as any,
      });
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  }, [section, title, subtitle, content, sectionType, isDirty, onSave]);

  // Keyboard shortcut: Cmd/Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Method to update content from external source (AI)
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setTab('edit');
  }, []);

  // Expose updateContent via a stable ref pattern
  useEffect(() => {
    (window as any).__pitaSectionEditorUpdateContent = updateContent;
    return () => { delete (window as any).__pitaSectionEditorUpdateContent; };
  }, [updateContent]);

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a slide to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Editor Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          {/* Section Type */}
          <select
            value={sectionType}
            onChange={(e) => setSectionType(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Dirty indicator */}
          {isDirty && (
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Unsaved</span>
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setTab('edit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              tab === 'edit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Code className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => setTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              tab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Title + Subtitle */}
      <div className="px-4 pt-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-display font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitle (optional)"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-hidden">
        {tab === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="HTML content with Tailwind classes..."
            className="w-full h-full px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div
            className="w-full h-full overflow-auto rounded-lg border border-border"
            style={{
              backgroundColor: brandConfig.backgroundColor,
              color: brandConfig.textColor,
            }}
          >
            <div className="min-h-full flex items-center p-6">
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
