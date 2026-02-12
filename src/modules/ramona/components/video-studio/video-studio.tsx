'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Video,
  FileText,
  Palette,
  Play,
  Loader2,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Film,
  User,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import Image from 'next/image';
import { useVideoGenerator } from '../../hooks/use-video-generator';
import { ScriptEditor } from './script-editor';
import { StylePicker } from './style-picker';
import { VideoPreview } from './video-preview';
import { TemplateGallery } from './template-gallery';
import { RamonaAvatar } from '../ramona-avatar';
import { Confetti } from '../confetti';

interface VideoStudioProps {
  brandId: string;
  brandName: string;
  brandColors?: string[];
}

type VideoType = 'text-to-video' | 'avatar' | 'faceless' | 'carousel';
type Step = 'type' | 'template' | 'script' | 'style' | 'generate';

const VIDEO_TYPES: Array<{
  id: VideoType;
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}> = [
  {
    id: 'text-to-video',
    icon: FileText,
    title: 'Text to Video',
    description: 'Texto animado con transiciones',
  },
  {
    id: 'faceless',
    icon: ImageIcon,
    title: 'Faceless',
    description: 'B-roll + texto + voiceover',
  },
  {
    id: 'carousel',
    icon: Layers,
    title: 'Carousel Video',
    description: 'Slides animados para IG/TikTok',
  },
  {
    id: 'avatar',
    icon: User,
    title: 'Avatar Video',
    description: 'Ramona o avatar personalizado',
  },
];

export function VideoStudio({ brandId, brandName, brandColors }: VideoStudioProps) {
  const t = useTranslations('ramona.videoStudio');
  const [step, setStep] = useState<Step>('type');
  const [videoType, setVideoType] = useState<VideoType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [script, setScript] = useState('');
  const [style, setStyle] = useState<{
    colors: string[];
    font: string;
    transitions: string[];
    aspectRatio: '9:16' | '16:9' | '1:1';
  }>({
    colors: brandColors || ['#9A4E9A', '#F5A623'],
    font: 'modern',
    transitions: ['fade'],
    aspectRatio: '9:16',
  });
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    isGenerating,
    currentJob,
    progress,
    error,
    generateVideo,
    cancelGeneration,
    templates,
    fetchTemplates,
  } = useVideoGenerator();

  // Fetch templates when video type changes
  useEffect(() => {
    if (videoType) {
      const category = videoType === 'text-to-video' ? 'reel' :
        videoType === 'carousel' ? 'story' :
        videoType === 'faceless' ? 'promo' : 'reel';
      fetchTemplates(category);
    }
  }, [videoType, fetchTemplates]);

  // Watch for completion
  useEffect(() => {
    if (currentJob?.status === 'completed') {
      setShowConfetti(true);
    }
  }, [currentJob?.status]);

  async function handleGenerate() {
    if (!videoType || !script) return;

    await generateVideo({
      brandId,
      script,
      videoType,
      style: {
        template: selectedTemplate || undefined,
        colors: style.colors,
        font: style.font,
        transitions: style.transitions,
        aspectRatio: style.aspectRatio,
      },
    });
  }

  function handleNext() {
    if (step === 'type' && videoType) setStep('template');
    else if (step === 'template') setStep('script');
    else if (step === 'script' && script) setStep('style');
    else if (step === 'style') {
      setStep('generate');
      handleGenerate();
    }
  }

  function handleBack() {
    if (step === 'template') setStep('type');
    else if (step === 'script') setStep('template');
    else if (step === 'style') setStep('script');
    else if (step === 'generate' && !isGenerating) setStep('style');
  }

  const canProceed =
    (step === 'type' && videoType) ||
    step === 'template' ||
    (step === 'script' && script.length >= 10) ||
    step === 'style';

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} onComplete={() => setShowConfetti(false)} />

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ramona-gradient flex items-center justify-center text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold">{t('title')}</h2>
              <p className="text-xs text-muted-foreground">{brandName}</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {(['type', 'template', 'script', 'style', 'generate'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-1 ${
                  step === s ? 'text-ramona-purple' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s
                      ? 'bg-ramona-purple text-white'
                      : ['type', 'template', 'script', 'style', 'generate'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {['type', 'template', 'script', 'style', 'generate'].indexOf(step) > i ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select video type */}
          {step === 'type' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <RamonaAvatar state="idle" size="lg" className="mb-4 mx-auto" />
                <h3 className="text-xl font-display font-semibold mb-2">
                  {t('typeStep.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('typeStep.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {VIDEO_TYPES.map(({ id, icon: Icon, title, description }) => (
                  <button
                    key={id}
                    onClick={() => setVideoType(id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      videoType === id
                        ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                        : 'border-border hover:border-ramona-purple/50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${videoType === id ? 'text-ramona-purple' : 'text-muted-foreground'}`} />
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select template */}
          {step === 'template' && (
            <TemplateGallery
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          )}

          {/* Step 3: Write script */}
          {step === 'script' && (
            <ScriptEditor
              script={script}
              onScriptChange={setScript}
              videoType={videoType!}
            />
          )}

          {/* Step 4: Style options */}
          {step === 'style' && (
            <StylePicker
              style={style}
              onStyleChange={setStyle}
              brandColors={brandColors}
            />
          )}

          {/* Step 5: Generate */}
          {step === 'generate' && (
            <div className="max-w-md mx-auto text-center py-8">
              {isGenerating ? (
                <>
                  <RamonaAvatar
                    state={progress < 50 ? 'thinking' : progress < 90 ? 'talking' : 'celebrating'}
                    size="xl"
                    showSparkles={progress > 80}
                    className="mb-6 mx-auto"
                  />
                  <h3 className="font-semibold text-lg mb-2">
                    {progress < 50
                      ? t('generating.processing')
                      : progress < 90
                      ? t('generating.rendering')
                      : t('generating.finishing')}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {t('generating.description')}
                  </p>

                  {/* Progress bar */}
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="absolute inset-y-0 left-0 bg-ramona-gradient transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm font-medium text-ramona-purple">{progress}%</p>

                  <button
                    onClick={cancelGeneration}
                    className="mt-6 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t('generating.cancel')}
                  </button>
                </>
              ) : currentJob?.status === 'completed' ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2 text-green-600 dark:text-green-400">
                    {t('complete.title')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('complete.description')}
                  </p>

                  {/* Video preview */}
                  <VideoPreview
                    videoUrl={currentJob.video_url}
                    thumbnailUrl={currentJob.thumbnail_url}
                    duration={currentJob.duration_seconds}
                  />

                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      onClick={() => window.open(currentJob.video_url, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-ramona-purple text-white rounded-lg hover:bg-ramona-purple-light"
                    >
                      <Download className="w-4 h-4" />
                      {t('complete.download')}
                    </button>
                    <button
                      onClick={() => {
                        setStep('type');
                        setVideoType(null);
                        setScript('');
                        setSelectedTemplate(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('complete.createAnother')}
                    </button>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <span className="text-3xl">😔</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-red-600">
                    {t('error.title')}
                  </h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={() => setStep('style')}
                    className="px-4 py-2 bg-ramona-purple text-white rounded-lg"
                  >
                    {t('error.tryAgain')}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step !== 'generate' && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <button
              onClick={handleBack}
              disabled={step === 'type'}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('back')}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-ramona-purple text-white hover:bg-ramona-purple-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 'style' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('generate')}
                </>
              ) : (
                <>
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
