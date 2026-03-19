'use client';

import { useState } from 'react';
import type { MaisonConfig } from '@/modules/cereus/types';
import {
  Shirt, Sparkles, Eye, Ruler, User, Camera, Heart,
  ChevronRight, Star, ShoppingBag, Upload,
} from 'lucide-react';

// ─── SIZE RECOMMENDATION ENGINE ─────────────────────────────

const WOMEN_SIZES = [
  { size: 'XS', espalda: 36, busto: 88, cintura: 68, cadera: 92 },
  { size: 'S', espalda: 37, busto: 92, cintura: 72, cadera: 96 },
  { size: 'M', espalda: 38, busto: 98, cintura: 76, cadera: 102 },
  { size: 'L', espalda: 39, busto: 102, cintura: 80, cadera: 108 },
  { size: 'XL', espalda: 40, busto: 106, cintura: 88, cadera: 112 },
  { size: 'XXL', espalda: 41, busto: 110, cintura: 98, cadera: 120 },
];

const MEN_SIZES = [
  { size: 'S', pecho: 92, cintura: 78, cadera: 94 },
  { size: 'M', pecho: 98, cintura: 84, cadera: 100 },
  { size: 'L', pecho: 104, cintura: 90, cadera: 106 },
  { size: 'XL', pecho: 110, cintura: 96, cadera: 112 },
  { size: 'XXL', pecho: 116, cintura: 102, cadera: 118 },
];

function recommendSize(gender: 'mujer' | 'hombre', measurements: { busto?: number; cintura?: number; cadera?: number }) {
  if (gender === 'mujer') {
    const { busto, cintura, cadera } = measurements;
    for (const s of WOMEN_SIZES) {
      if ((!busto || busto <= s.busto) && (!cintura || cintura <= s.cintura) && (!cadera || cadera <= s.cadera)) {
        return s.size;
      }
    }
    return 'XXL';
  } else {
    const { busto: pecho, cintura, cadera } = measurements;
    for (const s of MEN_SIZES) {
      if ((!pecho || pecho <= s.pecho) && (!cintura || cintura <= s.cintura) && (!cadera || cadera <= s.cadera)) {
        return s.size;
      }
    }
    return 'XXL';
  }
}

// ─── SAMPLE DATA ────────────────────────────────────────────

const CLOSET_ITEMS = [
  { name: 'Vestido Positano', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop', category: 'Vestidos', size: 'M' },
  { name: 'Camisa Clasica 036', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=400&fit=crop', category: 'Camisas', size: 'S' },
  { name: 'Falda Bola Amalfi', image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=300&h=400&fit=crop', category: 'Faldas', size: 'M' },
];

const MARKET_ITEMS = [
  { name: 'Vestido Taffetan', price: 1990, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&h=400&fit=crop', match: 95 },
  { name: 'Chaqueta Corta Amalfi', price: 420, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=400&fit=crop', match: 88 },
  { name: 'Body Off Shoulders', price: 390, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=300&h=400&fit=crop', match: 82 },
  { name: 'Maxi Vestido Piastrelle', price: 1990, image: 'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=300&h=400&fit=crop', match: 78 },
];

// ─── PORTAL TABS ────────────────────────────────────────────

const PORTAL_TABS = [
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'measurements', label: 'Medidas', icon: Ruler },
  { id: 'closet', label: 'Mi Closet', icon: Shirt },
  { id: 'advisor', label: 'Advisor', icon: Sparkles },
  { id: 'catalog', label: 'Catalogo', icon: Eye },
];

// ─── PROFILE TAB ────────────────────────────────────────────

function ProfileTab({ accentColor }: { accentColor: string }) {
  const archetype = {
    primary: 'La Musa Creativa',
    secondary: 'La Ejecutiva Elegante',
    description: 'Tu estilo combina creatividad artistica con sofisticacion profesional. Buscas piezas que expresen tu individualidad sin perder la elegancia.',
    traits: ['Audaz', 'Sofisticada', 'Artistica', 'Minimalista'],
    colors: ['Negro', 'Blanco Roto', 'Dorado', 'Bordeaux'],
    avoid: ['Estampados excesivos', 'Colores neon'],
  };

  return (
    <div className="space-y-6">
      {/* Photo + Basic Info */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <User className="w-12 h-12 text-gray-300" />
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-display font-bold">Maria Fernanda</h2>
            <p className="text-sm text-gray-500">Cliente desde Enero 2025</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                VIP Gold
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {archetype.primary}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Archetype */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-display font-bold text-lg mb-1">Tu Arquetipo de Estilo</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium" style={{ color: accentColor }}>{archetype.primary}</span>
          <span className="text-xs text-gray-400">+</span>
          <span className="text-sm text-gray-500">{archetype.secondary}</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{archetype.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Rasgos</p>
            <div className="flex flex-wrap gap-1">
              {archetype.traits.map(t => (
                <span key={t} className="px-2 py-1 text-xs bg-gray-100 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Paleta Ideal</p>
            <div className="flex flex-wrap gap-1">
              {archetype.colors.map(c => (
                <span key={c} className="px-2 py-1 text-xs bg-gray-100 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Photo for AI */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold">Actualiza tu Perfil con IA</h3>
            <p className="text-sm text-white/60 mt-1">
              Sube una foto y nuestra IA analizara tu estilo para darte recomendaciones mas precisas.
            </p>
            <button
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-black"
              style={{ backgroundColor: accentColor }}
            >
              <Upload className="w-4 h-4 inline mr-1" /> Subir Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEASUREMENTS TAB ───────────────────────────────────────

function MeasurementsTab({ accentColor }: { accentColor: string }) {
  const [gender] = useState<'mujer' | 'hombre'>('mujer');
  const [measurements, setMeasurements] = useState({
    busto: 94, cintura: 74, cadera: 100, espalda: 37, talleDel: 43, talleEsp: 39,
  });

  const suggestedSize = recommendSize(gender, measurements);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">Mis Medidas</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            <Star className="w-4 h-4" />
            Tu talla recomendada: <strong>{suggestedSize}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'busto', label: 'Busto' },
            { key: 'cintura', label: 'Cintura' },
            { key: 'cadera', label: 'Cadera' },
            { key: 'espalda', label: 'Espalda' },
            { key: 'talleDel', label: 'Talle Delantero' },
            { key: 'talleEsp', label: 'Talle Espalda' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label} (cm)</label>
              <input
                type="number"
                value={(measurements as any)[key]}
                onChange={e => setMeasurements({ ...measurements, [key]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Al modificar tus medidas, tu talla recomendada se actualiza automaticamente.
        </p>
      </div>

      {/* Size chart reference */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-medium mb-3">Referencia de Tallas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left">Talla</th>
                <th className="px-3 py-2 text-center">Espalda</th>
                <th className="px-3 py-2 text-center">Busto</th>
                <th className="px-3 py-2 text-center">Cintura</th>
                <th className="px-3 py-2 text-center">Cadera</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {WOMEN_SIZES.map(s => (
                <tr key={s.size} className={s.size === suggestedSize ? 'bg-yellow-50 font-medium' : ''}>
                  <td className="px-3 py-2 font-bold">{s.size} {s.size === suggestedSize && '  ← Tu talla'}</td>
                  <td className="px-3 py-2 text-center">{s.espalda}</td>
                  <td className="px-3 py-2 text-center">{s.busto}</td>
                  <td className="px-3 py-2 text-center">{s.cintura}</td>
                  <td className="px-3 py-2 text-center">{s.cadera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CLOSET TAB ─────────────────────────────────────────────

function ClosetTab({ accentColor }: { accentColor: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg">Mi Closet</h3>
          <p className="text-sm text-gray-500">{CLOSET_ITEMS.length} prendas</p>
        </div>
      </div>

      {CLOSET_ITEMS.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Shirt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Tu closet esta vacio</p>
          <p className="text-sm text-gray-500 mt-1">Las prendas se agregan cuando tus pedidos son entregados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CLOSET_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden group">
              <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{item.category}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{item.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADVISOR TAB (STYLE RECOMMENDATIONS) ────────────────────

function AdvisorTab({ accentColor }: { accentColor: string }) {
  return (
    <div className="space-y-8">
      {/* Recommendations from Closet */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shirt className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="font-display font-bold text-lg">Outfits con tu Closet</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Combinaciones recomendadas con las prendas que ya tienes.</p>

        {CLOSET_ITEMS.length > 0 ? (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-start gap-4">
              <div className="flex -space-x-3">
                {CLOSET_ITEMS.slice(0, 2).map((item, i) => (
                  <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-sm">Look Clasico Elegante</p>
                <p className="text-xs text-gray-500 mt-1">
                  Combina tu {CLOSET_ITEMS[0]?.name} con {CLOSET_ITEMS[1]?.name} para un look sofisticado
                  ideal para reuniones o cenas. Agrega un cinturon dorado para destacar tu cintura.
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-3 h-3" style={{ color: s <= 4 ? accentColor : '#E5E7EB', fill: s <= 4 ? accentColor : 'none' }} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">Match 92%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-gray-500">Agrega prendas a tu closet para recibir recomendaciones.</p>
          </div>
        )}
      </div>

      {/* Recommendations from Market */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="font-display font-bold text-lg">Recomendado para Ti</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Prendas del catalogo que complementan tu estilo y closet actual.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MARKET_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden group cursor-pointer">
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: accentColor }}>
                  {item.match}% match
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm mt-0.5" style={{ color: accentColor }}>S/{item.price.toLocaleString()}</p>
                <button
                  className="w-full mt-2 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CATALOG TAB ────────────────────────────────────────────

function CatalogTab({ accentColor }: { accentColor: string }) {
  const allProducts = [
    ...MARKET_ITEMS,
    { name: 'Camisero Midi Amalfi', price: 1190, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop', match: 75 },
    { name: 'Vestido Strapless Mosaico', price: 1790, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=400&fit=crop', match: 70 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">Catalogo</h3>
          <p className="text-sm text-gray-500">Colecciones disponibles</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allProducts.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border overflow-hidden group cursor-pointer">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-medium" style={{ color: accentColor }}>S/{item.price.toLocaleString()}</p>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Heart className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN CLIENT PORTAL ─────────────────────────────────────

export function ClientPortal({
  maisonId,
  maisonName,
  config,
}: {
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const accentColor = config.branding?.accent_color || '#C9A84C';
  const primaryColor = config.branding?.primary_color || '#0A0A0A';

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root { --maison-primary: ${primaryColor}; --maison-accent: ${accentColor}; }
      `}</style>

      {/* Header */}
      <header className="bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold tracking-[0.2em] uppercase">{maisonName}</h1>
          <span className="text-xs text-white/50">Mi Portal</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto py-2">
          {PORTAL_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              style={activeTab === id ? { backgroundColor: accentColor } : {}}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'profile' && <ProfileTab accentColor={accentColor} />}
        {activeTab === 'measurements' && <MeasurementsTab accentColor={accentColor} />}
        {activeTab === 'closet' && <ClosetTab accentColor={accentColor} />}
        {activeTab === 'advisor' && <AdvisorTab accentColor={accentColor} />}
        {activeTab === 'catalog' && <CatalogTab accentColor={accentColor} />}
      </main>
    </div>
  );
}
