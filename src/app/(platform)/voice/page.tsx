import { VoiceStudio } from '@/components/cactus/voice-studio';
import { PageHeader } from '@/components/cactus/page-header';

export const metadata = { title: 'Garambullo · Voz' };

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        emoji="🎙️"
        title="Garambullo · Voz"
        subtitle="Convierte cualquier guion en locución lista para tus reels, podcasts y anuncios."
      />
      <VoiceStudio />
    </div>
  );
}
