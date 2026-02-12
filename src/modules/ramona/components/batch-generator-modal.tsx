'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Zap,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import { useBatchGenerator } from '../hooks/use-batch-generator';
import { Confetti } from './confetti';

interface BatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName: string;
  onComplete?: () => void;
}

const CONTENT_COUNTS = [10, 30, 50, 100];

const PLATFORMS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877F2' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  { id: 'twitter', icon: Twitter, label: 'Twitter/X', color: '#000000' },
  { id: 'tiktok', icon: () => <span className="text-lg">📱</span>, label: 'TikTok', color: '#000000' },
];

const CONTENT_TYPES = [
  { id: 'post', label: 'Posts', icon: '📝' },
  { id: 'story', label: 'Stories', icon: '📸' },
  { id: 'reel', label: 'Reels', icon: '🎬' },
  { id: 'carousel', label: 'Carruseles', icon: '🎠' },
  { id: 'thread', label: 'Hilos', icon: '🧵' },
];

export function BatchGeneratorModal({
  isOpen,
  onClose,
  brandId,
  brandName,
  onComplete,
}: BatchGeneratorModalProps) {
  const t = useTranslations('ramona');
  const [count, setCount] = useState(30);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['post']);
  const [themes, setThemes] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const { isGenerating, progress, total, error, startBatch, cancelBatch } = useBatchGenerator();

  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleStart() {
    const themesList = themes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await startBatch(brandId, {
      count,
      platforms: selectedPlatforms,
      types: selectedTypes,
      themes: themesList.length > 0 ? themesList : undefined,
    });
  }

  // Watch for completion
  if (progress === total && total > 0 && !isGenerating) {
    if (!showConfetti) {
      setShowConfetti(true);
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden animate-ramona-fade-in">
          {/* Header */}
          <div className="relative bg-ramona-gradient p-6 text-white">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-ramona-float">
                <Image
                  src="/ramona.png"
                  alt="Ramona"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('batch.title')}
                </h2>
                <p className="text-white/80 text-sm">{brandName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isGenerating ? (
              /* Progress state */
              <div className="text-center py-8">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <Image
                    src="/ramona.png"
                    alt="Ramona"
                    fill
                    className="object-contain animate-ramona-bounce"
                  />
                </div>

                <h3 className="font-semibold text-lg mb-2">{t('batch.generating')}</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {t('batch.generatingDesc', { count: total })}
                </p>

                {/* Progress bar */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-ramona-gradient transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div className="absolute inset-0 animate-ramona-shimmer opacity-30" />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress} / {total}
                  </span>
                  <span className="font-medium text-ramona-purple">{progressPercent}%</span>
                </div>

                {error && (
                  <p className="mt-4 text-sm text-destructive">{error}</p>
                )}

                <button
                  onClick={cancelBatch}
                  className="mt-6 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('batch.cancel')}
                </button>
              </div>
            ) : showConfetti ? (
              /* Success state */
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">
                  {t('batch.complete')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('batch.completeDesc', { count: total })}
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-ramona-purple text-white rounded-lg font-medium hover:bg-ramona-purple-light transition-colors"
                >
                  {t('batch.viewContent')}
                </button>
              </div>
            ) : (
              /* Configuration state */
              <div className="space-y-6">
                {/* Count selector */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('batch.howMany')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CONTENT_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`py-3 rounded-lg font-semibold transition-colors ${
                          count === n
                            ? 'bg-ramona-purple text-white'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform selector */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('batch.platforms')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-ramona-purple text-white'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{platform.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content types */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('batch.contentTypes')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => {
                      const isSelected = selectedTypes.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => toggleType(type.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-ramona-purple text-white'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span>{type.icon}</span>
                          <span className="text-sm">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Themes (optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('batch.themes')}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({t('batch.optional')})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    placeholder={t('batch.themesPlaceholder')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ramona-purple/50"
                  />
                </div>

                {/* Start button */}
                <button
                  onClick={handleStart}
                  disabled={selectedPlatforms.length === 0 || selectedTypes.length === 0}
                  className="w-full py-3 rounded-lg bg-ramona-gradient text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('batch.startGeneration', { count })}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {t('batch.hint')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
