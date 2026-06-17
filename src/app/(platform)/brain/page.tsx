import { BrandKitForm } from '@/components/cactus/brand-kit-form';
import { PageHeader } from '@/components/cactus/page-header';

export const metadata = { title: 'Cerebro · Cactus IA' };

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        emoji="🧠"
        title="Cactus IA · Cerebro"
        subtitle="El conocimiento y la marca que alimentan a todos los agentes. Empieza por tu Brand Kit."
      />
      <BrandKitForm />
    </div>
  );
}
