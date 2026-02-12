'use client';

import { useTranslations } from 'next-intl';
import { Building2, Sparkles, Lightbulb } from 'lucide-react';
import Image from 'next/image';

export type OnboardingMode = 'existing' | 'referents' | 'scratch';

interface StepSourceSelectionProps {
  selectedMode: OnboardingMode | null;
  onSelectMode: (mode: OnboardingMode) => void;
}

export function StepSourceSelection({ selectedMode, onSelectMode }: StepSourceSelectionProps) {
  const t = useTranslations('ramona.onboarding');

  const modes: Array<{
    id: OnboardingMode;
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    color: string;
  }> = [
    {
      id: 'existing',
      icon: <Building2 className="w-8 h-8" />,
      title: t('sourceSelection.existing.title'),
      description: t('sourceSelection.existing.description'),
      features: [
        t('sourceSelection.existing.feature1'),
        t('sourceSelection.existing.feature2'),
        t('sourceSelection.existing.feature3'),
      ],
      color: 'from-ramona-purple to-ramona-purple-light',
    },
    {
      id: 'referents',
      icon: <Lightbulb className="w-8 h-8" />,
      title: t('sourceSelection.referents.title'),
      description: t('sourceSelection.referents.description'),
      features: [
        t('sourceSelection.referents.feature1'),
        t('sourceSelection.referents.feature2'),
        t('sourceSelection.referents.feature3'),
      ],
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'scratch',
      icon: <Sparkles className="w-8 h-8" />,
      title: t('sourceSelection.scratch.title'),
      description: t('sourceSelection.scratch.description'),
      features: [
        t('sourceSelection.scratch.feature1'),
        t('sourceSelection.scratch.feature2'),
        t('sourceSelection.scratch.feature3'),
      ],
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 animate-ramona-float">
          <Image
            src="/ramona.png"
            alt="Ramona"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {t('sourceSelection.subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedMode === mode.id
                ? 'border-ramona-purple bg-ramona-purple-lighter dark:bg-ramona-purple/10'
                : 'border-border hover:border-ramona-purple/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${mode.color} text-white flex-shrink-0`}
              >
                {mode.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base mb-1">{mode.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {mode.description}
                </p>
                <ul className="space-y-1">
                  {mode.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-ramona-purple flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedMode === mode.id
                    ? 'border-ramona-purple bg-ramona-purple'
                    : 'border-muted-foreground/30'
                }`}
              >
                {selectedMode === mode.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
