import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingDemoPreview, LandingCta } from '@/components/landing';

const BRAND_COLOR = '#D4AF37';
const GRADIENT_CLASS = 'bg-agave-gradient';

// AGAVE avatar component using the PNG image
function AgaveAvatar({ size = 'xl' }: { size?: string }) {
  const sizeClasses: Record<string, { container: string; image: number }> = {
    xl: { container: 'w-32 h-32', image: 128 },
    '2xl': { container: 'w-48 h-48', image: 192 },
  };

  const config = sizeClasses[size] || sizeClasses.xl;

  return (
    <div className={`${config.container} relative animate-agave-float`}>
      <Image
        src="/agave.png"
        alt="AGAVE"
        width={config.image}
        height={config.image}
        className="object-contain drop-shadow-lg"
      />
    </div>
  );
}

export default async function AgaveLandingPage() {
  const t = await getTranslations('landing.agave');
  const ts = await getTranslations('landing.shared');
  const th = await getTranslations('landing.hero');
  const td = await getTranslations('landing.demo');
  const thw = await getTranslations('landing.howItWorks');

  const features = [
    { icon: '⚡', title: t('features.quickMode.title'), description: t('features.quickMode.description') },
    { icon: '🔄', title: t('features.simulation.title'), description: t('features.simulation.description') },
    { icon: '📊', title: t('features.margins.title'), description: t('features.margins.description') },
    { icon: '📈', title: t('features.history.title'), description: t('features.history.description') },
    { icon: '📋', title: t('features.policy.title'), description: t('features.policy.description') },
    { icon: '💰', title: t('features.impact.title'), description: t('features.impact.description') },
  ];

  const steps = [
    { title: t('howItWorks.input.title'), description: t('howItWorks.input.description') },
    { title: t('howItWorks.analyze.title'), description: t('howItWorks.analyze.description') },
    { title: t('howItWorks.recommend.title'), description: t('howItWorks.recommend.description') },
    { title: t('howItWorks.decide.title'), description: t('howItWorks.decide.description') },
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
        secondaryLink="/apps/agave/demo"
        brandColor={BRAND_COLOR}
        gradientClass={GRADIENT_CLASS}
      >
        <AgaveAvatar size="2xl" />
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
        demoLink="/apps/agave/demo"
        buttonText={ts('tryDemo')}
        brandColor={BRAND_COLOR}
      >
        <AgaveAvatar size="xl" />
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
