interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface LandingFeaturesProps {
  title: string;
  features: Feature[];
  brandColor: string;
}

export function LandingFeatures({ title, features, brandColor }: LandingFeaturesProps) {
  const featureIcons: Record<string, string> = {
    consolidation: '🔄',
    validation: '✅',
    reports: '📊',
    ratios: '📈',
    comparison: '⚖️',
    alerts: '🔔',
    content: '✨',
    schedule: '📅',
    analytics: '📉',
    brand: '🎨',
    video: '🎬',
    calendar: '🗓️',
    checkins: '👋',
    emotions: '🎭',
    pulse: '💓',
    async: '⏰',
    insights: '💡',
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-center mb-12">
          {title}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                {featureIcons[Object.keys(featureIcons).find(k => feature.title.toLowerCase().includes(k)) || ''] || '⭐'}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
