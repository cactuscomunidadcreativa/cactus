import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { LandingHero, LandingFeatures, LandingHowItWorks, LandingDemoPreview, LandingCta } from '@/components/landing';

const BRAND_COLOR = '#00B4FF';
const GRADIENT_CLASS = 'bg-saguaro-gradient';

// SAGUARO avatar component using the PNG image
function SaguaroAvatar({ size = 'xl' }: { size?: string }) {
  const sizeClasses: Record<string, { container: string; image: number }> = {
    xl: { container: 'w-32 h-32', image: 128 },
    '2xl': { container: 'w-48 h-48', image: 192 },
  };

  const config = sizeClasses[size] || sizeClasses.xl;

  return (
    <div className={`${config.container} relative animate-saguaro-flow`}>
      <Image
        src="/saguaro.png"
        alt="SAGUARO"
        width={config.image}
        height={config.image}
        className="object-contain drop-shadow-lg"
      />
    </div>
  );
}

export default async function SaguaroLandingPage() {
  const t = await getTranslations('landing.saguaro');
  const ts = await getTranslations('landing.shared');
  const th = await getTranslations('landing.hero');
  const td = await getTranslations('landing.demo');
  const thw = await getTranslations('landing.howItWorks');

  const features = [
    { icon: '📋', title: t('features.tasks.title'), description: t('features.tasks.description') },
    { icon: '🌊', title: t('features.flow.title'), description: t('features.flow.description') },
    { icon: '🎯', title: t('features.priorities.title'), description: t('features.priorities.description') },
    { icon: '👥', title: t('features.team.title'), description: t('features.team.description') },
    { icon: '📈', title: t('features.tracking.title'), description: t('features.tracking.description') },
    { icon: '💡', title: t('features.insights.title'), description: t('features.insights.description') },
  ];

  const steps = [
    { title: t('howItWorks.create.title'), description: t('howItWorks.create.description') },
    { title: t('howItWorks.organize.title'), description: t('howItWorks.organize.description') },
    { title: t('howItWorks.execute.title'), description: t('howItWorks.execute.description') },
    { title: t('howItWorks.review.title'), description: t('howItWorks.review.description') },
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
        secondaryLink="/apps/saguaro/demo"
        brandColor={BRAND_COLOR}
        gradientClass={GRADIENT_CLASS}
      >
        <SaguaroAvatar size="2xl" />
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
        demoLink="/apps/saguaro/demo"
        buttonText={ts('tryDemo')}
        brandColor={BRAND_COLOR}
      >
        <SaguaroAvatar size="xl" />
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
