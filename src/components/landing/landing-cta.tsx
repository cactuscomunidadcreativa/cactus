import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LandingCtaProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  brandColor: string;
}

export function LandingCta({ title, subtitle, buttonText, buttonLink, brandColor }: LandingCtaProps) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-12 text-center text-white relative overflow-hidden"
          style={{ backgroundColor: brandColor }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-display font-bold mb-4">{title}</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">{subtitle}</p>

            <Link
              href={buttonLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white rounded-lg font-semibold transition-all hover:bg-white/90"
              style={{ color: brandColor }}
            >
              {buttonText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
