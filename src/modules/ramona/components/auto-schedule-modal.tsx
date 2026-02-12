'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Calendar,
  Clock,
  Loader2,
  Check,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import Image from 'next/image';
import { Confetti } from './confetti';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName: string;
  onComplete?: () => void;
}

interface SchedulePreview {
  id: string;
  title: string;
  platform: string;
  scheduledFor: string;
}

const PLATFORMS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', defaultFreq: 4 },
  { id: 'facebook', icon: Facebook, label: 'Facebook', defaultFreq: 3 },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', defaultFreq: 2 },
  { id: 'twitter', icon: Twitter, label: 'Twitter', defaultFreq: 7 },
  { id: 'tiktok', icon: () => <span>📱</span>, label: 'TikTok', defaultFreq: 5 },
];

const TIME_SLOTS = [
  { id: 'morning', icon: Sun, label: 'Mañana', time: '8-11am' },
  { id: 'afternoon', icon: Sun, label: 'Mediodía', time: '12-2pm' },
  { id: 'evening', icon: Sunset, label: 'Tarde', time: '6-9pm' },
  { id: 'night', icon: Moon, label: 'Noche', time: '9-11pm' },
];

const DATE_PRESETS = [
  { weeks: 2, label: '2 semanas' },
  { weeks: 4, label: '1 mes' },
  { weeks: 8, label: '2 meses' },
  { weeks: 12, label: '3 meses' },
];

export function AutoScheduleModal({
  isOpen,
  onClose,
  brandId,
  brandName,
  onComplete,
}: AutoScheduleModalProps) {
  const t = useTranslations('ramona.autoSchedule');
  const [step, setStep] = useState<'config' | 'preview' | 'success'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [availableContent, setAvailableContent] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Config state
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [frequency, setFrequency] = useState<Record<string, number>>({});
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['morning', 'evening']);
  const [excludeWeekends, setExcludeWeekends] = useState(false);

  // Results
  const [scheduledCount, setScheduledCount] = useState(0);
  const [preview, setPreview] = useState<SchedulePreview[]>([]);

  // Fetch available content count
  useEffect(() => {
    if (isOpen && brandId) {
      fetch(`/api/ramona/auto-schedule?brandId=${brandId}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableContent(data.availableContent || 0);
        })
        .catch(console.error);
    }
  }, [isOpen, brandId]);

  function toggleTime(id: string) {
    setSelectedTimes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleFrequencyChange(platform: string, value: number) {
    setFrequency((prev) => ({ ...prev, [platform]: value }));
  }

  async function handleSchedule() {
    setIsLoading(true);

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedWeeks * 7);

      const response = await fetch('/api/ramona/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          contentIds: ['all_approved'],
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          frequency,
          preferredTimes: selectedTimes,
          excludeWeekends,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScheduledCount(data.scheduled);
        setPreview(data.preview || []);
        setStep('success');
        setShowConfetti(true);
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      } else {
        alert(data.message || data.error || 'Failed to schedule content');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Failed to schedule content');
    }

    setIsLoading(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (!isOpen) return null;

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden animate-ramona-fade-in">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">{t('title')}</h2>
                <p className="text-white/80 text-sm">{brandName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {step === 'config' && (
              <div className="space-y-6">
                {/* Available content notice */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="font-bold text-blue-600">{availableContent}</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        {t('availableContent', { count: availableContent })}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {t('availableDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('dateRange')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DATE_PRESETS.map(({ weeks, label }) => (
                      <button
                        key={weeks}
                        onClick={() => setSelectedWeeks(weeks)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedWeeks === weeks
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred times */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('preferredTimes')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(({ id, icon: Icon, label, time }) => (
                      <button
                        key={id}
                        onClick={() => toggleTime(id)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedTimes.includes(id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs opacity-70">{time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform frequency */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {t('frequency')}
                  </label>
                  <div className="space-y-2">
                    {PLATFORMS.map(({ id, icon: Icon, label, defaultFreq }) => (
                      <div key={id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="flex-1 text-sm">{label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="14"
                            value={frequency[id] ?? defaultFreq}
                            onChange={(e) => handleFrequencyChange(id, parseInt(e.target.value))}
                            className="w-20 accent-blue-500"
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {frequency[id] ?? defaultFreq}/sem
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="excludeWeekends"
                    checked={excludeWeekends}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="excludeWeekends" className="text-sm">
                    {t('excludeWeekends')}
                  </label>
                </div>

                {/* Action button */}
                <button
                  onClick={handleSchedule}
                  disabled={isLoading || availableContent === 0 || selectedTimes.length === 0}
                  className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('scheduling')}
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      {t('scheduleButton')}
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-green-600 dark:text-green-400">
                  {t('success')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('successDesc', { count: scheduledCount })}
                </p>

                {/* Preview */}
                {preview.length > 0 && (
                  <div className="text-left mb-6">
                    <h4 className="text-sm font-medium mb-2">{t('preview')}</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {preview.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.scheduledFor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  {t('viewCalendar')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
