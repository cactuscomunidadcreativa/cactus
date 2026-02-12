'use client';

import { PresentationSection } from '../types';

interface SectionRendererProps {
  section: PresentationSection;
  isActive: boolean;
}

export function SectionRenderer({ section, isActive }: SectionRendererProps) {
  if (!isActive) return null;

  return (
    <div className="min-h-[60vh] flex items-center animate-pita-fade-in">
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    </div>
  );
}
