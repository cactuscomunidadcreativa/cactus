import { getTranslations } from 'next-intl/server';
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingDemoPreview, LandingCta } from '@/components/landing';

const BRAND_COLOR = '#B8943A';
const GRADIENT_CLASS = 'bg-cereus-gradient';

export default async function CereusLandingPage() {
  const t = await getTranslations('landing.cereus');
  const ts = await getTranslations('landing.shared');
  const th = await getTranslations('landing.hero');
  const td = await getTranslations('landing.demo');
  const thw = await getTranslations('landing.howItWorks');

  const features = [
    { icon: '🖤', title: t('features.emotional.title'), description: t('features.emotional.description') },
    { icon: '📐', title: t('features.measurements.title'), description: t('features.measurements.description') },
    { icon: '💰', title: t('features.costing.title'), description: t('features.costing.description') },
    { icon: '🏭', title: t('features.production.title'), description: t('features.production.description') },
    { icon: '👗', title: t('features.closet.title'), description: t('features.closet.description') },
    { icon: '🤖', title: t('features.advisor.title'), description: t('features.advisor.description') },
  ];

  const steps = [
    { title: t('howItWorks.profile.title'), description: t('howItWorks.profile.description') },
    { title: t('howItWorks.design.title'), description: t('howItWorks.design.description') },
    { title: t('howItWorks.produce.title'), description: t('howItWorks.produce.description') },
    { title: t('howItWorks.deliver.title'), description: t('howItWorks.deliver.description') },
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
        secondaryLink="/apps/cereus"
        brandColor={BRAND_COLOR}
        gradientClass={GRADIENT_CLASS}
      />

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
        demoLink="/apps/cereus"
        buttonText={ts('tryDemo')}
        brandColor={BRAND_COLOR}
      />

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
