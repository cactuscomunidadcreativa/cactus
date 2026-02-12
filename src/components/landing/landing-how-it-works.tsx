interface Step {
  title: string;
  description: string;
}

interface LandingHowItWorksProps {
  title: string;
  subtitle: string;
  steps: Step[];
  brandColor: string;
}

export function LandingHowItWorks({ title, subtitle, steps, brandColor }: LandingHowItWorksProps) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div
            className="absolute left-8 top-8 bottom-8 w-0.5 hidden md:block"
            style={{ backgroundColor: `${brandColor}30` }}
          />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 items-start">
                {/* Step number */}
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl relative z-10"
                  style={{ backgroundColor: brandColor }}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-3">
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
