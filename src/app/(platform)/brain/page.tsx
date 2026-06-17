import { BrandKitForm } from '@/components/cactus/brand-kit-form';

export const metadata = { title: 'Cerebro · Cactus IA' };

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">🧠 Cactus IA · Cerebro</h1>
        <p className="text-sm text-muted-foreground">
          El conocimiento y la marca que alimentan a todos los agentes. Empieza por tu Brand Kit.
        </p>
      </header>
      <BrandKitForm />
    </div>
  );
}
