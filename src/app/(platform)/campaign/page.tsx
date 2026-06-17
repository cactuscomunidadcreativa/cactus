import { CampaignStudio } from '@/components/cactus/campaign-studio';

export const metadata = { title: 'Campaign Studio · Cactus' };

export default function CampaignPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Campaign Studio</h1>
        <p className="text-sm text-muted-foreground">
          Tu primera campaña con click emocional. Peyote escribe una variante por perfil — cada una
          diseñada para gatillar la emoción correcta en su público.
        </p>
      </header>
      <CampaignStudio />
    </div>
  );
}
