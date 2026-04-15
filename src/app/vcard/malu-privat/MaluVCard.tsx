'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'

const CONTACT = {
  name: 'Malu Privat',
  phone: '+51 987 780 358',
  email: 'malu@privat.pe',
  website: 'https://www.privat.pe',
  instagram: 'https://www.instagram.com/privatoficial/',
  igHandle: '@privatoficial',
  country: 'Peru',
  photo: '/contacts/malu-privat.jpg',
}

const VCARD_DATA = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${CONTACT.name}\r\nTEL;TYPE=CELL:${CONTACT.phone}\r\nEMAIL:${CONTACT.email}\r\nURL:${CONTACT.website}\r\nURL:${CONTACT.instagram}\r\nADR;TYPE=HOME:;;;;;;${CONTACT.country}\r\nNOTE:IG: ${CONTACT.igHandle}\r\nEND:VCARD`

function saveContact() {
  // Try direct navigation first (works best on iOS Safari)
  // Create a hidden link with the .vcf file as blob
  const blob = new Blob([VCARD_DATA], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'malu-privat.vcf'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // Cleanup after a delay
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1000)

  // Fallback: also try the API endpoint for iOS
  setTimeout(() => {
    window.location.href = '/api/vcard?slug=malu-privat'
  }, 500)
}

export default function MaluVCard() {
  const [showBanner, setShowBanner] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auto-prompt to save contact on page load
  useEffect(() => {
    const alreadySaved = sessionStorage.getItem('vcard-malu-saved')
    if (!alreadySaved) {
      const timer = setTimeout(() => setShowBanner(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSaveNow = () => {
    saveContact()
    setSaved(true)
    setShowBanner(false)
    sessionStorage.setItem('vcard-malu-saved', '1')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Auto save banner */}
      {showBanner && !saved && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-[#a8115c] to-[#d4247a] text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium truncate">Guardar a Contactos</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleSaveNow}
                className="px-4 py-1.5 bg-white text-[#a8115c] text-sm font-bold rounded-lg hover:bg-white/90 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="px-2 py-1.5 text-white/70 hover:text-white text-sm transition-colors"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with photo */}
          <div className="relative bg-gradient-to-br from-[#a8115c] to-[#d4247a] pt-8 pb-16 px-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
              <Image
                src={CONTACT.photo}
                alt={CONTACT.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              {CONTACT.name}
            </h1>
            <p className="text-white/80 text-sm mt-1">Privat</p>
          </div>

          {/* Contact info */}
          <div className="-mt-8 relative z-10 mx-4 bg-white rounded-2xl shadow-lg p-5 space-y-4">
            {/* Phone */}
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Celular</p>
                <p className="text-gray-800 font-medium">{CONTACT.phone}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Correo</p>
                <p className="text-gray-800 font-medium">{CONTACT.email}</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Instagram</p>
                <p className="text-gray-800 font-medium">{CONTACT.igHandle}</p>
              </div>
            </a>

            {/* Website */}
            <a
              href={CONTACT.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Web</p>
                <p className="text-gray-800 font-medium">www.privat.pe</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/51987780358`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">WhatsApp</p>
                <p className="text-gray-800 font-medium">Enviar mensaje</p>
              </div>
            </a>
          </div>

          {/* QR Code + Download */}
          <div className="p-6 text-center space-y-4">
            <div className="inline-block p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
              <QRCodeSVG
                value={VCARD_DATA}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1a1a"
              />
            </div>
            <p className="text-xs text-gray-400">Escanea para guardar contacto</p>

            <button
              onClick={handleSaveNow}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#a8115c] to-[#d4247a] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {saved ? 'Contacto Guardado' : 'Guardar en Contactos'}
            </button>
          </div>

          {/* Footer */}
          <div className="pb-4 text-center">
            <p className="text-[10px] text-gray-300">Powered by Cactus</p>
          </div>
        </div>
      </div>
    </div>
  )
}
