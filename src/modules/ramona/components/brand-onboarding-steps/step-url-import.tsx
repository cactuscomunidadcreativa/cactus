'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';

type UrlType = 'website' | 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';

interface UrlEntry {
  id: string;
  type: UrlType;
  url: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  error?: string;
}

interface StepUrlImportProps {
  urls: UrlEntry[];
  onAddUrl: (type: UrlType, url: string) => void;
  onRemoveUrl: (id: string) => void;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  analysisComplete: boolean;
}

const URL_TYPES: Array<{ type: UrlType; icon: React.ReactNode; label: string; placeholder: string }> = [
  { type: 'website', icon: <Globe className="w-4 h-4" />, label: 'Sitio web', placeholder: 'https://tuempresa.com' },
  { type: 'instagram', icon: <Instagram className="w-4 h-4" />, label: 'Instagram', placeholder: '@usuario o URL' },
  { type: 'facebook', icon: <Facebook className="w-4 h-4" />, label: 'Facebook', placeholder: 'URL de tu página' },
  { type: 'linkedin', icon: <Linkedin className="w-4 h-4" />, label: 'LinkedIn', placeholder: 'URL de empresa' },
  { type: 'twitter', icon: <Twitter className="w-4 h-4" />, label: 'X / Twitter', placeholder: '@usuario o URL' },
  { type: 'tiktok', icon: <span className="text-sm">📱</span>, label: 'TikTok', placeholder: '@usuario o URL' },
];

export function StepUrlImport({
  urls,
  onAddUrl,
  onRemoveUrl,
  onAnalyze,
  isAnalyzing,
  analysisComplete,
}: StepUrlImportProps) {
  const t = useTranslations('ramona.onboarding');
  const [selectedType, setSelectedType] = useState<UrlType>('website');
  const [inputValue, setInputValue] = useState('');

  function handleAddUrl() {
    if (inputValue.trim()) {
      onAddUrl(selectedType, inputValue.trim());
      setInputValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  }

  const selectedTypeInfo = URL_TYPES.find((t) => t.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 animate-ramona-bounce">
          <Image
            src="/ramona.png"
            alt="Ramona"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t('urlImport.subtitle')}
        </p>
      </div>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {URL_TYPES.map((urlType) => (
          <button
            key={urlType.type}
            onClick={() => setSelectedType(urlType.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedType === urlType.type
                ? 'bg-ramona-purple text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {urlType.icon}
            {urlType.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTypeInfo?.placeholder}
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ramona-purple/50"
          />
        </div>
        <button
          onClick={handleAddUrl}
          disabled={!inputValue.trim()}
          className="px-4 py-2.5 rounded-lg bg-ramona-purple text-white hover:bg-ramona-purple-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* URL list */}
      {urls.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('urlImport.addedUrls', { count: urls.length })}
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {urls.map((entry) => {
              const typeInfo = URL_TYPES.find((t) => t.type === entry.type);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="text-muted-foreground">{typeInfo?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.url}</p>
                    <p className="text-xs text-muted-foreground">{typeInfo?.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.status === 'analyzing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-ramona-purple" />
                    )}
                    {entry.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {entry.status === 'error' && (
                      <span title={entry.error}>
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </span>
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
              );
            })}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {urls.length > 0 && !analysisComplete && (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || urls.length === 0}
          className="w-full py-3 rounded-lg bg-ramona-gradient text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('urlImport.analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('urlImport.analyzeButton')}
            </>
          )}
        </button>
      )}

      {/* Analysis complete */}
      {analysisComplete && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-700 dark:text-green-400">
            {t('urlImport.analysisComplete')}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            {t('urlImport.reviewBelow')}
          </p>
        </div>
      )}

      {/* Empty state */}
      {urls.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('urlImport.emptyState')}</p>
        </div>
      )}
    </div>
  );
}

// Re-export Sparkles for the analyze button
function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
