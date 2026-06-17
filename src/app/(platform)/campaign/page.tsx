import { CampaignStudio } from '@/components/cactus/campaign-studio';
import { PageHeader } from '@/components/cactus/page-header';

export const metadata = { title: 'Campaign Studio · Cactus' };

export default function CampaignPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="💡"
        title="Campaign Studio"
        subtitle="Peyote escribe una variante por perfil emocional — cada una para gatillar la emoción correcta en su público."
      />
      <CampaignStudio />
    </div>
  );
}
