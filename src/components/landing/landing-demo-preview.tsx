import Link from 'next/link';
import { Play } from 'lucide-react';

interface LandingDemoPreviewProps {
  title: string;
  subtitle: string;
  demoLink: string;
  buttonText: string;
  brandColor: string;
  children?: React.ReactNode; // For avatar in waiting state
}

export function LandingDemoPreview({
  title,
  subtitle,
  demoLink,
  buttonText,
  brandColor,
  children,
}: LandingDemoPreviewProps) {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-display font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-8">{subtitle}</p>

        {/* Demo preview card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            {children}
          </div>

          <Link
            href={demoLink}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            <Play className="h-4 w-4" />
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
