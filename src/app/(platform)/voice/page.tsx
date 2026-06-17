import { VoiceStudio } from '@/components/cactus/voice-studio';

export const metadata = { title: 'Garambullo · Voz' };

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">🎙️ Garambullo · Estudio de Voz</h1>
        <p className="text-sm text-muted-foreground">Convierte cualquier guion en locución lista para tus reels, podcasts y anuncios.</p>
      </header>
      <VoiceStudio />
    </div>
  );
}
