import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/home/hero';
import { PortfolioSection } from '@/components/marketing/home/portfolio-section';
import { ServicesSection } from '@/components/marketing/home/services-section';
import { ManifestoSection } from '@/components/marketing/home/manifesto-section';
import { EcosystemSection } from '@/components/marketing/home/ecosystem-section';
import { ProcessSection } from '@/components/marketing/home/process-section';
import { ContactSection } from '@/components/marketing/home/contact-section';

export const metadata: Metadata = {
  title: 'Cactus — Estudio de IA & Software con Alma | Lima → LATAM',
  description:
    'Construimos productos con IA, automatizaciones y plataformas a medida: Rowi (Six Seconds), MadCat (UFC), EGO Intelligence Cloud, SCA Control Arbitral y más. Software que se siente humano.',
  openGraph: {
    title: 'Cactus — Estudio de IA & Software con Alma',
    description:
      'Productos con IA, automatizaciones y plataformas a medida. Del octágono de la UFC a los centros de arbitraje. Software que se siente humano.',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PortfolioSection />
      <ServicesSection />
      <ManifestoSection />
      <EcosystemSection />
      <ProcessSection />
      <ContactSection />
    </>
  );
}
