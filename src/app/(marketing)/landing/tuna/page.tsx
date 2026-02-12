import { getTranslations } from 'next-intl/server';
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingDemoPreview, LandingCta } from '@/components/landing';
import { TunaAvatar } from '@/modules/tuna/components/tuna-avatar';

const BRAND_COLOR = '#C41E68';
const GRADIENT_CLASS = 'bg-tuna-gradient';

export default async function TunaLandingPage() {
  const t = await getTranslations('landing.tuna');
  const ts = await getTranslations('landing.shared');
  const th = await getTranslations('landing.hero');
  const td = await getTranslations('landing.demo');
  const thw = await getTranslations('landing.howItWorks');

  const features = [
    { icon: '🔄', title: t('features.consolidation.title'), description: t('features.consolidation.description') },
    { icon: '✅', title: t('features.validation.title'), description: t('features.validation.description') },
    { icon: '📊', title: t('features.reports.title'), description: t('features.reports.description') },
    { icon: '📈', title: t('features.ratios.title'), description: t('features.ratios.description') },
    { icon: '⚖️', title: t('features.comparison.title'), description: t('features.comparison.description') },
    { icon: '🔔', title: t('features.alerts.title'), description: t('features.alerts.description') },
  ];

  const steps = [
    { title: t('howItWorks.upload.title'), description: t('howItWorks.upload.description') },
    { title: t('howItWorks.map.title'), description: t('howItWorks.map.description') },
    { title: t('howItWorks.validate.title'), description: t('howItWorks.validate.description') },
    { title: t('howItWorks.report.title'), description: t('howItWorks.report.description') },
  ];

  return (
    <>
      <LandingHero
        badge={t('hero.badge')}
        title={t('hero.title')}
        titleHighlight={t('hero.titleHighlight')}
        subtitle={t('hero.subtitle')}
        primaryCta={th('cta.primary')}
        secondaryCta={th('cta.secondary')}
        primaryLink="/register"
        secondaryLink="/apps/tuna/demo"
        brandColor={BRAND_COLOR}
        gradientClass={GRADIENT_CLASS}
      >
        <TunaAvatar size="2xl" state="idle" interactive showDataNodes />
      </LandingHero>

      <LandingFeatures
        title={t('features.title')}
        features={features}
        brandColor={BRAND_COLOR}
      />

      <LandingHowItWorks
        title={thw('title')}
        subtitle={thw('subtitle')}
        steps={steps}
        brandColor={BRAND_COLOR}
      />

      <LandingDemoPreview
        title={td('title')}
        subtitle={td('subtitle')}
        demoLink="/apps/tuna/demo"
        buttonText={ts('tryDemo')}
        brandColor={BRAND_COLOR}
      >
        <TunaAvatar size="xl" state="waiting" />
      </LandingDemoPreview>

      <LandingCta
        title={t('cta.title')}
        subtitle={t('cta.subtitle')}
        buttonText={th('cta.primary')}
        buttonLink="/register"
        brandColor={BRAND_COLOR}
      />
    </>
  );
}
