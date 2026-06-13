import type { Metadata } from 'next';
import { ServicesShowcase } from '@/components/marketing/services-showcase';

export const metadata: Metadata = {
  title: 'Servicios — IA, Automatización, SaaS y Experiencias Web | Cactus',
  description:
    'Productos digitales con IA, automatización e integraciones con ERPs, plataformas SaaS a medida, experiencias web cinematográficas, inteligencia de datos y consultoría EQ + Tech.',
};

export default function ServiciosPage() {
  return <ServicesShowcase />;
}
