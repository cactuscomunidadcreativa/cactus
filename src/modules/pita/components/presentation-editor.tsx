'use client';

import { useState, useCallback } from 'react';
import { Settings, Sparkles, ExternalLink, ArrowLeft, Database } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Presentation, PresentationSection } from '../types';
import { SlideList } from './slide-list';
import { SectionEditor } from './section-editor';
import { AIAssistant } from './ai-assistant';
import { PresentationSettings } from './presentation-settings';
import { cn } from '@/lib/utils';

interface PresentationEditorProps {
  presentation: Presentation;
  initialSections: PresentationSection[];
  userId: string;
}

export function PresentationEditor({ presentation, initialSections, userId }: PresentationEditorProps) {
  const [sections, setSections] = useState<PresentationSection[]>(initialSections);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presentationData, setPresentationData] = useState<Presentation>(presentation);

  const selectedSection = sections[selectedIndex] || null;

  // ─── Save Section ───
  const handleSaveSection = useCallback(async (updated: PresentationSection) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pita/sections/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updated.title,
          subtitle: updated.subtitle,
          content: updated.content,
          section_type: updated.section_type,
          metadata: updated.metadata,
        }),
      });
      const data = await res.json();
      if (data.ok && data.section) {
        setSections(prev => prev.map(s => s.id === updated.id ? data.section : s));
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── Create Section ───
  const handleAddSection = useCallback(async () => {
    const nextIndex = sections.length;
    try {
      const res = await fetch('/api/pita/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id: presentation.id,
          title: `Slide ${nextIndex + 1}`,
          content: '<div class="py-20 text-center"><h2 class="text-3xl font-display font-bold">New Slide</h2><p class="mt-4 text-lg text-muted-foreground">Edit this content or use AI to generate it.</p></div>',
          section_type: 'content',
          order_index: nextIndex,
        }),
      });
      const data = await res.json();
      if (data.ok && data.section) {
        setSections(prev => [...prev, data.section]);
        setSelectedIndex(nextIndex);
      }
    } catch {
      // Silently fail
    }
  }, [presentation.id, sections.length]);

  // ─── Delete Section ───
  const handleDeleteSection = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pita/sections/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setSections(prev => {
          const updated = prev.filter(s => s.id !== id);
          return updated;
        });
        setSelectedIndex(prev => Math.min(prev, Math.max(0, sections.length - 2)));
      }
    } catch {
      // Silently fail
    }
  }, [sections.length]);

  // ─── Move Up ───
  const handleMoveUp = useCallback(async (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];

    // Update order indexes
    const reordered = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(reordered);
    setSelectedIndex(index - 1);

    // Persist
    try {
      await fetch('/api/pita/sections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id: presentation.id,
          order: reordered.map((s, i) => ({ id: s.id, order_index: i })),
        }),
      });
    } catch {
      // Revert on failure
      setSections(sections);
      setSelectedIndex(index);
    }
  }, [sections, presentation.id]);

  // ─── Move Down ───
  const handleMoveDown = useCallback(async (index: number) => {
    if (index >= sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];

    const reordered = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(reordered);
    setSelectedIndex(index + 1);

    try {
      await fetch('/api/pita/sections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id: presentation.id,
          order: reordered.map((s, i) => ({ id: s.id, order_index: i })),
        }),
      });
    } catch {
      setSections(sections);
      setSelectedIndex(index);
    }
  }, [sections, presentation.id]);

  // ─── Save Presentation Settings ───
  const handleSaveSettings = useCallback(async (updates: Partial<Presentation>) => {
    const res = await fetch(`/api/pita/presentations/${presentation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updates.title,
        subtitle: updates.subtitle,
        slug: updates.slug,
        brand_config: updates.brand_config,
        is_active: updates.is_active,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || 'Failed to save');
    }
    if (data.presentation) {
      setPresentationData(data.presentation);
    }
  }, [presentation.id]);

  // ─── Insert AI Content ───
  const handleInsertAIContent = useCallback((html: string) => {
    // Use the global ref to update the section editor
    if (typeof window !== 'undefined' && (window as any).__pitaSectionEditorUpdateContent) {
      (window as any).__pitaSectionEditorUpdateContent(html);
    }
  }, []);

  // ─── Seed Static Presentation to DB ───
  const handleSeedToDB = useCallback(async () => {
    if (!confirm('This will import the static OWN YOUR IMPACT presentation into the database. Continue?')) return;

    try {
      // Create presentation
      const presRes = await fetch('/api/pita/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'OWN YOUR IMPACT',
          subtitle: 'Emotional Intelligence × Professional Excellence',
          slug: 'own-your-impact',
          brand_config: {
            primaryColor: '#0E1B2C',
            secondaryColor: '#4FAF8F',
            accentColor: '#C7A54A',
            backgroundColor: '#FFFFFF',
            textColor: '#0E1B2C',
          },
        }),
      });
      const presData = await presRes.json();

      if (presData.ok && presData.presentation) {
        alert(`Presentation created! ID: ${presData.presentation.id}\nNow you can add sections via the editor.`);
        window.location.href = `/apps/pita/editor/${presData.presentation.id}`;
      } else {
        alert(`Error: ${presData.error || 'Failed to create'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* ─── Top Bar ─── */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/apps/pita"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Image src="/pita.png" alt="PITA" width={24} height={24} className="opacity-70" />

          <div>
            <h1 className="text-sm font-display font-bold leading-tight">
              {presentationData.title}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {presentationData.slug} · {sections.length} slides
              {presentationData.is_active ? (
                <span className="ml-1 text-pita-green">· Published</span>
              ) : (
                <span className="ml-1 text-amber-500">· Draft</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed button (for initial import) */}
          {sections.length === 0 && (
            <button
              onClick={handleSeedToDB}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all"
              title="Import static presentation to database"
            >
              <Database className="w-3.5 h-3.5" />
              Seed Data
            </button>
          )}

          {/* AI Toggle */}
          <button
            onClick={() => setShowAI(!showAI)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              showAI
                ? 'bg-pita-green/15 text-pita-green'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Writer
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Preview Link */}
          {presentationData.is_active && (
            <Link
              href={`/pita/${presentationData.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pita-green text-white hover:bg-pita-green/90 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </Link>
          )}
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Slide List */}
        <SlideList
          sections={sections}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onAdd={handleAddSection}
          onDelete={handleDeleteSection}
        />

        {/* Center: Section Editor */}
        <SectionEditor
          section={selectedSection}
          onSave={handleSaveSection}
          brandConfig={presentationData.brand_config}
        />

        {/* Right: AI Assistant (conditional) */}
        {showAI && (
          <AIAssistant
            presentationId={presentation.id}
            presentationTitle={presentationData.title}
            brandConfig={presentationData.brand_config}
            currentSection={selectedSection}
            onInsert={handleInsertAIContent}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <PresentationSettings
          presentation={presentationData}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
