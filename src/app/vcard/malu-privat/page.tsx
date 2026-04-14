import type { Metadata } from 'next'
import MaluVCard from './MaluVCard'

export const metadata: Metadata = {
  title: 'Malu Privat - Contacto',
  description: 'Tarjeta de contacto digital de Malu Privat',
  openGraph: {
    title: 'Malu Privat - Contacto',
    description: 'Tarjeta de contacto digital de Malu Privat',
    images: ['/contacts/malu-privat.jpg'],
  },
}

export default function MaluPrivatPage() {
  return <MaluVCard />
}
