import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

interface LandingHeroProps {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  primaryLink: string;
  secondaryLink: string;
  brandColor: string;
  gradientClass: string;
  children?: React.ReactNode; // For avatar
}

export function LandingHero({
  badge,
  title,
  titleHighlight,
  subtitle,
  primaryCta,
  secondaryCta,
  primaryLink,
  secondaryLink,
  brandColor,
  gradientClass,
  children,
}: LandingHeroProps) {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${brandColor} 0%, transparent 50%)`,
        }}
      />

      <div className="max-w-5xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6"
              style={{
                backgroundColor: `${brandColor}15`,
                color: brandColor,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
              {badge}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
              {title}
              <br />
              <span className={`${gradientClass} bg-clip-text text-transparent`}>
                {titleHighlight}
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href={primaryLink}
                className="w-full sm:w-auto px-6 py-3 text-white rounded-lg font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                {primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryLink}
                className="w-full sm:w-auto px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                {secondaryCta}
              </Link>
            </div>
          </div>

          {/* Avatar/Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow effect */}
              <div
                className="absolute inset-0 blur-3xl opacity-20 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              {/* Avatar container */}
              <div className="relative">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
