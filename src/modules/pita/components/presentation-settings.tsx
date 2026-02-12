'use client';

import { useState } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { Presentation, BrandConfig } from '../types';
import { cn } from '@/lib/utils';

interface PresentationSettingsProps {
  presentation: Presentation;
  onSave: (updates: Partial<Presentation>) => Promise<void>;
  onClose: () => void;
}

const COLOR_FIELDS: { key: keyof BrandConfig; label: string }[] = [
  { key: 'primaryColor', label: 'Primary' },
  { key: 'secondaryColor', label: 'Secondary' },
  { key: 'accentColor', label: 'Accent' },
  { key: 'backgroundColor', label: 'Background' },
  { key: 'textColor', label: 'Text' },
];

export function PresentationSettings({ presentation, onSave, onClose }: PresentationSettingsProps) {
  const [title, setTitle] = useState(presentation.title);
  const [subtitle, setSubtitle] = useState(presentation.subtitle || '');
  const [slug, setSlug] = useState(presentation.slug);
  const [isActive, setIsActive] = useState(presentation.is_active);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(
    presentation.brand_config || {
      primaryColor: '#0E1B2C',
      secondaryColor: '#4FAF8F',
      accentColor: '#C7A54A',
      backgroundColor: '#FFFFFF',
      textColor: '#0E1B2C',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleColorChange = (key: keyof BrandConfig, value: string) => {
    setBrandConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        slug: slug.trim(),
        is_active: isActive,
        brand_config: brandConfig,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display font-semibold">Presentation Settings</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Presentation title"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-sm font-medium mb-1 block">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-sm font-medium mb-1 block">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/pita/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="your-presentation"
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Published Status */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">Make visible to reviewers via public link</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-pita-green/10 text-pita-green'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {isActive ? 'Active' : 'Draft'}
            </button>
          </div>

          {/* Brand Colors */}
          <div>
            <label className="text-sm font-medium mb-2 block">Brand Colors</label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div className="relative group">
                    <div
                      className="w-full aspect-square rounded-lg border border-border cursor-pointer mb-1"
                      style={{ backgroundColor: brandConfig[key] as string || '#000000' }}
                    >
                      <input
                        type="color"
                        value={brandConfig[key] as string || '#000000'}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <input
                    type="text"
                    value={brandConfig[key] as string || ''}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-full px-1 py-0.5 text-[10px] font-mono text-center bg-muted border border-border rounded"
                  />
                </div>
              ))}
            </div>

            {/* Preview */}
            <div
              className="mt-3 p-3 rounded-lg border border-border"
              style={{ backgroundColor: brandConfig.backgroundColor, color: brandConfig.textColor }}
            >
              <p className="text-xs font-display font-bold" style={{ color: brandConfig.primaryColor }}>
                Preview Title
              </p>
              <p className="text-[10px] mt-1" style={{ color: brandConfig.secondaryColor }}>
                Secondary text element
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: brandConfig.accentColor, color: '#fff' }}>
                Accent badge
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
