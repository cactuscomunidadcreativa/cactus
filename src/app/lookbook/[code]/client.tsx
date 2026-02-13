'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Palette, X, ExternalLink } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  season: string;
  year: number;
  cover_image_url: string | null;
  mood_board_urls: string[] | null;
  inspiration_notes: string | null;
}

interface Garment {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string;
  images: { url: string; type: string; alt?: string }[];
  base_price: number | null;
  status: string;
}

interface Variant {
  id: string;
  garment_id: string;
  variant_name: string | null;
  color: string | null;
  color_hex: string | null;
  preview_image_url: string | null;
  final_price: number;
  status: string;
}

interface LookbookClientProps {
  collection: Collection;
  garments: Garment[];
  variants: Variant[];
  maisonName: string;
}

const SEASON_LABELS: Record<string, { en: string; es: string }> = {
  spring_summer: { en: 'Spring/Summer', es: 'Primavera/Verano' },
  fall_winter: { en: 'Fall/Winter', es: 'Otoño/Invierno' },
  resort: { en: 'Resort', es: 'Resort' },
  cruise: { en: 'Cruise', es: 'Crucero' },
  capsule: { en: 'Capsule', es: 'Cápsula' },
  bridal: { en: 'Bridal', es: 'Nupcial' },
  custom: { en: 'Custom', es: 'Especial' },
};

function formatPrice(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function LookbookClient({ collection, garments, variants, maisonName }: LookbookClientProps) {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [expandedGarment, setExpandedGarment] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});

  const seasonLabel = SEASON_LABELS[collection.season] || { en: collection.season, es: collection.season };

  function getGarmentVariants(garmentId: string) {
    return variants.filter(v => v.garment_id === garmentId);
  }

  function getCurrentImageIndex(garmentId: string) {
    return imageIndex[garmentId] || 0;
  }

  function setCurrentImageIndex(garmentId: string, index: number) {
    setImageIndex(prev => ({ ...prev, [garmentId]: index }));
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
          className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80 hover:bg-white/20 transition-colors"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
      </div>

      {/* Hero */}
      <div className="relative">
        {collection.cover_image_url ? (
          <div className="relative h-[60vh] min-h-[400px]">
            <img
              src={collection.cover_image_url}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
          </div>
        ) : (
          <div className="h-[40vh] min-h-[300px] bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <p className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-medium mb-3">
            {maisonName}
          </p>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-3 tracking-tight">
            {collection.name}
          </h1>
          <p className="text-white/50 text-sm">
            {lang === 'es' ? seasonLabel.es : seasonLabel.en} {collection.year}
          </p>
          {collection.description && (
            <p className="text-white/70 mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Inspiration */}
      {collection.inspiration_notes && (
        <div className="max-w-4xl mx-auto px-8 py-16">
          <blockquote className="text-lg md:text-xl italic text-white/60 border-l-2 border-[#C9A84C] pl-6 font-serif leading-relaxed">
            {collection.inspiration_notes}
          </blockquote>
        </div>
      )}

      {/* Mood Board */}
      {collection.mood_board_urls && collection.mood_board_urls.length > 0 && (
        <div className="px-8 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2">
            {collection.mood_board_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Garments Gallery */}
      <div className="max-w-6xl mx-auto px-8 pb-24">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[#C9A84C] font-medium mb-8">
          {lang === 'es' ? 'La Colección' : 'The Collection'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {garments.map(garment => {
            const gVariants = getGarmentVariants(garment.id);
            const isExpanded = expandedGarment === garment.id;
            const currentIdx = getCurrentImageIndex(garment.id);
            const images = garment.images || [];
            const hasMultipleImages = images.length > 1;

            return (
              <div
                key={garment.id}
                className="group"
              >
                {/* Image carousel */}
                <div className="relative overflow-hidden rounded-xl bg-[#1A1A1A]">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[currentIdx]?.url}
                        alt={garment.name}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(garment.id, (currentIdx - 1 + images.length) % images.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(garment.id, (currentIdx + 1) % images.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          {/* Dots */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i === currentIdx ? 'bg-white' : 'bg-white/30'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center">
                      <Palette className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Image type label */}
                  {images[currentIdx]?.type && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] bg-black/50 rounded-full text-white/70">
                      {images[currentIdx].type}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg">{garment.name}</h3>
                      {garment.code && (
                        <p className="text-xs text-white/30 mt-0.5">{garment.code}</p>
                      )}
                    </div>
                    {garment.base_price && (
                      <p className="text-lg font-display font-bold text-[#C9A84C]">
                        {formatPrice(garment.base_price)}
                      </p>
                    )}
                  </div>

                  {garment.description && (
                    <p className="text-sm text-white/50 mt-2">{garment.description}</p>
                  )}

                  {/* Variants */}
                  {gVariants.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedGarment(isExpanded ? null : garment.id)}
                        className="text-xs text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
                      >
                        {isExpanded
                          ? (lang === 'es' ? 'Ocultar variantes' : 'Hide variants')
                          : `${gVariants.length} ${lang === 'es' ? 'variantes disponibles' : 'variants available'}`}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {gVariants.map(v => (
                            <div
                              key={v.id}
                              className="bg-white/5 rounded-lg p-3 border border-white/10"
                            >
                              {v.preview_image_url ? (
                                <img
                                  src={v.preview_image_url}
                                  alt={v.variant_name || ''}
                                  className="w-full aspect-square rounded-lg object-cover mb-2"
                                />
                              ) : v.color_hex ? (
                                <div
                                  className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center"
                                  style={{ backgroundColor: v.color_hex + '30' }}
                                >
                                  <div
                                    className="w-10 h-10 rounded-full"
                                    style={{ backgroundColor: v.color_hex }}
                                  />
                                </div>
                              ) : null}
                              <p className="text-xs font-medium truncate">
                                {v.variant_name || v.color || 'Variant'}
                              </p>
                              <p className="text-xs text-[#C9A84C] font-medium mt-0.5">
                                {formatPrice(v.final_price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-4">
                    <a
                      href="/login?redirect=/apps/cereus/catalog"
                      className="inline-flex items-center gap-2 text-xs text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
                    >
                      {lang === 'es' ? 'Personalizar →' : 'Customize →'}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8 text-center">
        <p className="text-xs text-white/30">
          {maisonName} — {lang === 'es' ? 'Colección' : 'Collection'} {collection.name}
        </p>
        <p className="text-[10px] text-white/20 mt-2">
          Powered by CEREUS x PRIVAT
        </p>
      </div>
    </div>
  );
}
