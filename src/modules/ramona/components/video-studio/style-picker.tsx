'use client';

import { useTranslations } from 'next-intl';

interface StylePickerProps {
  style: {
    colors: string[];
    font: string;
    transitions: string[];
    aspectRatio: '9:16' | '16:9' | '1:1';
  };
  onStyleChange: (style: StylePickerProps['style']) => void;
  brandColors?: string[];
}

const FONTS = [
  { id: 'modern', label: 'Moderna', preview: 'Aa' },
  { id: 'bold', label: 'Bold', preview: 'Aa' },
  { id: 'elegant', label: 'Elegante', preview: 'Aa' },
  { id: 'playful', label: 'Divertida', preview: 'Aa' },
];

const TRANSITIONS = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'bounce', label: 'Bounce' },
];

const ASPECT_RATIOS = [
  { id: '9:16' as const, label: 'Vertical', desc: 'Reels/Stories', icon: '📱' },
  { id: '1:1' as const, label: 'Cuadrado', desc: 'Feed', icon: '⬛' },
  { id: '16:9' as const, label: 'Horizontal', desc: 'YouTube', icon: '📺' },
];

const COLOR_PRESETS = [
  ['#9A4E9A', '#F5A623'], // Ramona
  ['#1DA1F2', '#14171A'], // Twitter-like
  ['#E4405F', '#833AB4'], // Instagram-like
  ['#0077B5', '#313335'], // LinkedIn-like
  ['#000000', '#FFFFFF'], // Monochrome
  ['#FF6B6B', '#4ECDC4'], // Coral Teal
];

export function StylePicker({ style, onStyleChange, brandColors }: StylePickerProps) {
  const t = useTranslations('ramona.videoStudio.stylePicker');

  function updateStyle<K extends keyof typeof style>(key: K, value: (typeof style)[K]) {
    onStyleChange({ ...style, [key]: value });
  }

  function toggleTransition(transitionId: string) {
    const current = style.transitions || [];
    if (current.includes(transitionId)) {
      updateStyle('transitions', current.filter((t) => t !== transitionId));
    } else {
      updateStyle('transitions', [...current, transitionId]);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-display font-semibold mb-2">
          {t('title')}
        </h3>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium mb-3">{t('aspectRatio')}</label>
        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIOS.map(({ id, label, desc, icon }) => (
            <button
              key={id}
              onClick={() => updateStyle('aspectRatio', id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                style.aspectRatio === id
                  ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                  : 'border-border hover:border-ramona-purple/50'
              }`}
            >
              <span className="text-2xl mb-2 block">{icon}</span>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium mb-3">{t('colors')}</label>

        {/* Brand colors option */}
        {brandColors && brandColors.length > 0 && (
          <button
            onClick={() => updateStyle('colors', brandColors)}
            className={`w-full mb-3 p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
              JSON.stringify(style.colors) === JSON.stringify(brandColors)
                ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                : 'border-border hover:border-ramona-purple/50'
            }`}
          >
            <div className="flex gap-1">
              {brandColors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-white shadow"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{t('brandColors')}</span>
          </button>
        )}

        {/* Color presets */}
        <div className="grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((colors, i) => (
            <button
              key={i}
              onClick={() => updateStyle('colors', colors)}
              className={`p-3 rounded-lg border-2 flex justify-center gap-2 transition-all ${
                JSON.stringify(style.colors) === JSON.stringify(colors)
                  ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                  : 'border-border hover:border-ramona-purple/50'
              }`}
            >
              {colors.map((color, j) => (
                <div
                  key={j}
                  className="w-8 h-8 rounded-full border border-white shadow"
                  style={{ backgroundColor: color }}
                />
              ))}
            </button>
          ))}
        </div>

        {/* Custom color inputs */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">{t('primaryColor')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={style.colors[0]}
                onChange={(e) => updateStyle('colors', [e.target.value, style.colors[1]])}
                className="w-10 h-10 rounded border-0 cursor-pointer"
              />
              <input
                type="text"
                value={style.colors[0]}
                onChange={(e) => updateStyle('colors', [e.target.value, style.colors[1]])}
                className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">{t('secondaryColor')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={style.colors[1]}
                onChange={(e) => updateStyle('colors', [style.colors[0], e.target.value])}
                className="w-10 h-10 rounded border-0 cursor-pointer"
              />
              <input
                type="text"
                value={style.colors[1]}
                onChange={(e) => updateStyle('colors', [style.colors[0], e.target.value])}
                className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font */}
      <div>
        <label className="block text-sm font-medium mb-3">{t('font')}</label>
        <div className="grid grid-cols-4 gap-2">
          {FONTS.map(({ id, label, preview }) => (
            <button
              key={id}
              onClick={() => updateStyle('font', id)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                style.font === id
                  ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                  : 'border-border hover:border-ramona-purple/50'
              }`}
            >
              <span
                className={`text-2xl block mb-1 ${
                  id === 'bold' ? 'font-bold' :
                  id === 'elegant' ? 'italic' :
                  id === 'playful' ? 'font-semibold' : ''
                }`}
              >
                {preview}
              </span>
              <p className="text-xs text-muted-foreground">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transitions */}
      <div>
        <label className="block text-sm font-medium mb-3">{t('transitions')}</label>
        <div className="flex flex-wrap gap-2">
          {TRANSITIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => toggleTransition(id)}
              className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                style.transitions.includes(id)
                  ? 'border-ramona-purple bg-ramona-purple text-white'
                  : 'border-border hover:border-ramona-purple/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <h4 className="text-sm font-medium mb-3">{t('preview')}</h4>
        <div
          className="relative mx-auto rounded-lg overflow-hidden shadow-lg"
          style={{
            aspectRatio: style.aspectRatio.replace(':', '/'),
            maxHeight: '200px',
            background: `linear-gradient(135deg, ${style.colors[0]} 0%, ${style.colors[1]} 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className={`text-white text-center px-4 ${
                style.font === 'bold' ? 'font-bold text-xl' :
                style.font === 'elegant' ? 'italic text-lg' :
                style.font === 'playful' ? 'font-semibold text-lg' : 'text-lg'
              }`}
            >
              {t('previewText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
