import { getTranslations } from 'next-intl/server';
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingDemoPreview, LandingCta } from '@/components/landing';
import { RamonaAvatar } from '@/modules/ramona/components/ramona-avatar';

const BRAND_COLOR = '#9A4E9A';
const GRADIENT_CLASS = 'bg-ramona-gradient';

export default async function RamonaLandingPage() {
  const t = await getTranslations('landing.ramona');
  const ts = await getTranslations('landing.shared');
  const th = await getTranslations('landing.hero');
  const td = await getTranslations('landing.demo');
  const thw = await getTranslations('landing.howItWorks');

  const features = [
    { icon: '✨', title: t('features.content.title'), description: t('features.content.description') },
    { icon: '📅', title: t('features.schedule.title'), description: t('features.schedule.description') },
    { icon: '📉', title: t('features.analytics.title'), description: t('features.analytics.description') },
    { icon: '🎨', title: t('features.brand.title'), description: t('features.brand.description') },
    { icon: '🎬', title: t('features.video.title'), description: t('features.video.description') },
    { icon: '🗓️', title: t('features.calendar.title'), description: t('features.calendar.description') },
  ];

  const steps = [
    { title: t('howItWorks.connect.title'), description: t('howItWorks.connect.description') },
    { title: t('howItWorks.generate.title'), description: t('howItWorks.generate.description') },
    { title: t('howItWorks.review.title'), description: t('howItWorks.review.description') },
    { title: t('howItWorks.publish.title'), description: t('howItWorks.publish.description') },
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
        secondaryLink="/apps/ramona/demo"
        brandColor={BRAND_COLOR}
        gradientClass={GRADIENT_CLASS}
      >
        <RamonaAvatar size="2xl" state="idle" />
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
        demoLink="/apps/ramona/demo"
        buttonText={ts('tryDemo')}
        brandColor={BRAND_COLOR}
      >
        <RamonaAvatar size="xl" state="waving" />
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
