'use client';

import { useTranslations } from 'next-intl';
import { Check, Play, Film } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  config: {
    duration: number;
    aspectRatio: string;
    transitions: string[];
    style: string;
  };
  is_premium: boolean;
}

interface TemplateGalleryProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string | null) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  reel: '🎬',
  story: '📸',
  ad: '📢',
  explainer: '📚',
  promo: '🎯',
};

export function TemplateGallery({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: TemplateGalleryProps) {
  const t = useTranslations('ramona.videoStudio.templateGallery');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-display font-semibold mb-2">
          {t('title')}
        </h3>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Skip template option */}
      <button
        onClick={() => onSelectTemplate(null)}
        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
          selectedTemplate === null
            ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
            : 'border-border hover:border-ramona-purple/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Film className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{t('noTemplate')}</h4>
            <p className="text-sm text-muted-foreground">{t('noTemplateDesc')}</p>
          </div>
          {selectedTemplate === null && (
            <Check className="w-5 h-5 text-ramona-purple" />
          )}
        </div>
      </button>

      {/* Template grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                selectedTemplate === template.id
                  ? 'border-ramona-purple ring-2 ring-ramona-purple/20'
                  : 'border-border hover:border-ramona-purple/50'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-[9/16] bg-gradient-to-br from-muted to-muted-foreground/20 relative">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">
                      {CATEGORY_ICONS[template.category] || '🎬'}
                    </span>
                  </div>
                )}

                {/* Play icon overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                  </div>
                </div>

                {/* Premium badge */}
                {template.is_premium && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-medium rounded-full">
                    PRO
                  </div>
                )}

                {/* Selected indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-ramona-purple text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                  {template.config.duration}s
                </div>
              </div>

              {/* Info */}
              <div className="p-3 text-left">
                <h4 className="font-medium text-sm mb-0.5">{template.display_name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('loading')}</p>
        </div>
      )}
    </div>
  );
}
