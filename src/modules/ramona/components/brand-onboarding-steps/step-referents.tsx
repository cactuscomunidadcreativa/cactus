'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, Loader2, CheckCircle2, Lightbulb, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ReferentEntry {
  id: string;
  url: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  analysis?: {
    strengths: string[];
    content_style: string;
    takeaways: string[];
  };
  error?: string;
}

interface StepReferentsProps {
  referents: ReferentEntry[];
  onAddReferent: (url: string) => void;
  onRemoveReferent: (id: string) => void;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  analysisComplete: boolean;
  recommendations?: {
    combined_strengths: string[];
    suggested_approach: string;
    differentiation_opportunities: string[];
  };
}

export function StepReferents({
  referents,
  onAddReferent,
  onRemoveReferent,
  onAnalyze,
  isAnalyzing,
  analysisComplete,
  recommendations,
}: StepReferentsProps) {
  const t = useTranslations('ramona.onboarding');
  const [inputValue, setInputValue] = useState('');

  function handleAddReferent() {
    if (inputValue.trim()) {
      onAddReferent(inputValue.trim());
      setInputValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReferent();
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-amber-100 dark:bg-amber-500/20 rounded-full">
          <Lightbulb className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t('referents.subtitle')}
        </p>
      </div>

      {/* URL input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('referents.inputLabel')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('referents.placeholder')}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <button
            onClick={handleAddReferent}
            disabled={!inputValue.trim() || referents.length >= 5}
            className="px-4 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('referents.maxHint', { current: referents.length, max: 5 })}
        </p>
      </div>

      {/* Referent list */}
      {referents.length > 0 && (
        <div className="space-y-3">
          {referents.map((referent, index) => (
            <div
              key={referent.id}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-600">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={referent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-ramona-purple truncate flex items-center gap-1"
                    >
                      {referent.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>

                  {referent.status === 'analyzing' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t('referents.analyzing')}
                    </div>
                  )}

                  {referent.status === 'success' && referent.analysis && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {t('referents.strengths')}:
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {referent.analysis.strengths.slice(0, 2).join(' · ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-ramona-purple">
                          {t('referents.takeaways')}:
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {referent.analysis.takeaways.slice(0, 2).join(' · ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {referent.status === 'error' && (
                    <p className="text-xs text-destructive mt-1">
                      {referent.error || t('referents.error')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveReferent(referent.id)}
                  disabled={isAnalyzing}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {referents.length > 0 && !analysisComplete && (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || referents.length === 0}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('referents.analyzing')}
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5" />
              {t('referents.analyzeButton')}
            </>
          )}
        </button>
      )}

      {/* Recommendations */}
      {analysisComplete && recommendations && (
        <div className="space-y-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            <h4 className="font-medium text-amber-700 dark:text-amber-400">
              {t('referents.recommendationsTitle')}
            </h4>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-1 text-amber-600">
              {t('referents.combinedStrengths')}
            </h5>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {recommendations.combined_strengths.slice(0, 3).map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-1 text-amber-600">
              {t('referents.suggestedApproach')}
            </h5>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {recommendations.suggested_approach}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-medium mb-1 text-amber-600">
              {t('referents.differentiation')}
            </h5>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {recommendations.differentiation_opportunities.map((opp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>💡</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {referents.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('referents.emptyState')}</p>
          <p className="text-xs mt-1">{t('referents.emptyHint')}</p>
        </div>
      )}

      {/* Suggestions */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">{t('referents.suggestions')}</p>
        <ul className="space-y-1">
          <li>• {t('referents.suggestion1')}</li>
          <li>• {t('referents.suggestion2')}</li>
          <li>• {t('referents.suggestion3')}</li>
        </ul>
      </div>
    </div>
  );
}
