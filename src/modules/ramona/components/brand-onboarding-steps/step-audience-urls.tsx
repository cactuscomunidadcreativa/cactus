'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, Loader2, CheckCircle2, Users, Instagram, Twitter } from 'lucide-react';
import Image from 'next/image';

interface AudienceUrlEntry {
  id: string;
  url: string;
  platform: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
}

interface AudienceAnalysis {
  demographics: {
    estimated_age_range: string;
    gender_distribution: string;
    location_hints: string;
    occupation_hints: string[];
  };
  psychographics: {
    interests: string[];
    values: string[];
    pain_points: string[];
  };
  communication: {
    preferred_tone: string[];
    topics_that_resonate: string[];
  };
  confidence_level: 'high' | 'medium' | 'low';
}

interface StepAudienceUrlsProps {
  urls: AudienceUrlEntry[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (id: string) => void;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  analysisComplete: boolean;
  analysis?: AudienceAnalysis;
}

export function StepAudienceUrls({
  urls,
  onAddUrl,
  onRemoveUrl,
  onAnalyze,
  isAnalyzing,
  analysisComplete,
  analysis,
}: StepAudienceUrlsProps) {
  const t = useTranslations('ramona.onboarding');
  const [inputValue, setInputValue] = useState('');

  function handleAddUrl() {
    if (inputValue.trim()) {
      onAddUrl(inputValue.trim());
      setInputValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  }

  const confidenceColors = {
    high: 'text-green-500',
    medium: 'text-amber-500',
    low: 'text-orange-500',
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-blue-100 dark:bg-blue-500/20 rounded-full">
          <Users className="w-6 h-6 text-blue-500" />
        </div>
        <h4 className="font-semibold mb-1">{t('audienceUrls.title')}</h4>
        <p className="text-sm text-muted-foreground">
          {t('audienceUrls.subtitle')}
        </p>
      </div>

      {/* Description */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 {t('audienceUrls.hint')}
        </p>
      </div>

      {/* URL input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('audienceUrls.inputLabel')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('audienceUrls.placeholder')}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={handleAddUrl}
            disabled={!inputValue.trim() || urls.length >= 5}
            className="px-4 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('audienceUrls.examples')}
        </p>
      </div>

      {/* URL list */}
      {urls.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('audienceUrls.addedProfiles', { count: urls.length })}
          </label>
          <div className="space-y-2">
            {urls.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="text-blue-500">{getPlatformIcon(entry.platform)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.url}</p>
                  <p className="text-xs text-muted-foreground capitalize">{entry.platform}</p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === 'analyzing' && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {entry.status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <button
                    onClick={() => onRemoveUrl(entry.id)}
                    disabled={isAnalyzing}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {urls.length > 0 && !analysisComplete && (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || urls.length === 0}
          className="w-full py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('audienceUrls.analyzing')}
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              {t('audienceUrls.analyzeButton')}
            </>
          )}
        </button>
      )}

      {/* Analysis results */}
      {analysisComplete && analysis && (
        <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h4 className="font-medium">{t('audienceUrls.analysisTitle')}</h4>
            </div>
            <span className={`text-xs font-medium ${confidenceColors[analysis.confidence_level]}`}>
              {t(`audienceUrls.confidence.${analysis.confidence_level}`)}
            </span>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">{t('audienceUrls.ageRange')}</span>
              <p className="text-sm font-medium">{analysis.demographics.estimated_age_range}</p>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">{t('audienceUrls.gender')}</span>
              <p className="text-sm font-medium">{analysis.demographics.gender_distribution}</p>
            </div>
          </div>

          {/* Interests */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('audienceUrls.interests')}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {analysis.psychographics.interests.slice(0, 5).map((interest, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Pain points */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('audienceUrls.painPoints')}
            </span>
            <ul className="mt-1 space-y-1">
              {analysis.psychographics.pain_points.slice(0, 3).map((point, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preferred tone */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('audienceUrls.preferredTone')}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {analysis.communication.preferred_tone.map((tone, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-ramona-purple-lighter text-ramona-purple"
                >
                  {tone}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {urls.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('audienceUrls.emptyState')}</p>
          <p className="text-xs mt-1">{t('audienceUrls.emptyHint')}</p>
        </div>
      )}

      {/* Skip option */}
      <p className="text-xs text-center text-muted-foreground">
        {t('audienceUrls.skipNote')}
      </p>
    </div>
  );
}
