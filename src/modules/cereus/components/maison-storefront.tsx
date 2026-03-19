'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MaisonConfig } from '@/modules/cereus/types';
import { MaisonChatbot } from './maison-chatbot';
import {
  Search, ShoppingBag, Heart, Menu, X, ChevronRight, ChevronDown,
  Instagram, Phone, MapPin, Mail, ArrowRight, Star,
} from 'lucide-react';

// ─── PRODUCT DATA (Privat catalog) ───────────────────────────
const COLLECTIONS = {
  positano: {
    name: 'POSITANO',
    season: "Summer '25",
    tagline: 'La dolce vita meets Lima.',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&h=900&fit=crop',
  },
  equilibrium: {
    name: 'EQUILIBRIUM',
    season: "Resort '25",
    tagline: 'Balance between form and movement.',
    heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&h=900&fit=crop',
  },
  origenes: {
    name: 'ORIGENES',
    season: "Winter '24",
    tagline: 'Rooted in tradition, designed for now.',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=900&fit=crop',
  },
};

const PRODUCTS = {
  positano: [
    { name: 'Vestido Positano', price: 790, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop', badge: 'New' },
    { name: 'Vestido Taffetan', price: 1990, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop', badge: null },
    { name: 'Falda Bola Amalfi', price: 790, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj7a?w=600&h=800&fit=crop', badge: 'New' },
    { name: 'Chaqueta Corta Amalfi', price: 420, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop', badge: null },
    { name: 'Camisero Midi Amalfi', price: 1190, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop', badge: null },
    { name: 'Body Off Shoulders', price: 390, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop', badge: 'Sale' },
    { name: 'Vestido Strapless Mosaico', price: 1790, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop', badge: null },
    { name: 'Maxi Vestido Piastrelle', price: 1990, image: 'https://images.unsplash.com/photo-1502716119720-b23a1e3b2b22?w=600&h=800&fit=crop', badge: 'New' },
  ],
  teens: [
    { name: 'Enterizo Terciopelo', price: 990, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop', badge: null },
    { name: 'Vestido KIDS', price: 1500, image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop', badge: 'New' },
    { name: 'Conjunto Terciopelo Negro', price: 890, image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707998?w=600&h=800&fit=crop', badge: null },
    { name: 'Vestido Terciopelo', price: 990, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3e5a?w=600&h=800&fit=crop', badge: null },
  ],
  essentials: [
    { name: 'Camisa Clasica 040', price: 320, image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&h=800&fit=crop', badge: null },
    { name: 'Camisa Shantung Seda', price: 390, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop', badge: 'Best Seller' },
    { name: 'Camisa Clasica 036', price: 320, image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&h=800&fit=crop', badge: null },
    { name: 'Camisa Clasica 035', price: 420, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop', badge: null },
    { name: 'Camisa Clasica 034', price: 320, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop', badge: null },
    { name: 'Camisa Clasica 033', price: 420, image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=600&h=800&fit=crop', badge: null },
  ],
};

const CATEGORIES = [
  { name: 'Mujer', subcategories: ['Camisas Clasicas', 'Conjuntos', 'Enterizos', 'Faldas', 'Pantalones', 'Tops', 'Vestidos'] },
  { name: 'Hombre', subcategories: ['Camisas', 'Pantalones'] },
  { name: 'Teens', subcategories: ['Conjuntos', 'Enterizos', 'Faldas', 'Tops', 'Vestidos'] },
  { name: 'Accesorios', subcategories: ['Bisuteria', 'Carteras', 'Cinturones', 'Lentes', 'Sombreros', 'Zapatos'] },
  { name: 'Colecciones', subcategories: ['Positano', 'Equilibrium', 'Origenes'] },
  { name: 'Casual Wear', subcategories: [] },
  { name: 'Outlet', subcategories: [] },
];

function formatPrice(price: number) {
  return `S/${price.toLocaleString('es-PE')}`;
}

// ─── COMPONENTS ─────────────────────────────────────────────

function TopBar() {
  return (
    <div className="bg-black text-white text-xs py-2 text-center tracking-widest uppercase">
      Envio gratis en compras mayores a S/500 &nbsp;|&nbsp; Atelier: 960 139 383
    </div>
  );
}

function NavBar({ maisonName, onMenuToggle }: { maisonName: string; onMenuToggle: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-[#0a0a0a] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-4">
            <button onClick={onMenuToggle} className="lg:hidden p-1">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-1 hover:opacity-70 transition-opacity">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-2xl font-display font-bold tracking-[0.3em] uppercase">
              {maisonName}
            </h1>
          </Link>

          {/* Right: Account + Wishlist + Cart */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="p-1 hover:opacity-70 transition-opacity hidden sm:block">
              <span className="text-xs tracking-wider uppercase">Cuenta</span>
            </Link>
            <button className="p-1 hover:opacity-70 transition-opacity">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-1 hover:opacity-70 transition-opacity relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Categories */}
        <nav className="hidden lg:flex items-center justify-center gap-8 py-3 border-t border-white/10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              className="text-xs tracking-[0.15em] uppercase text-white/80 hover:text-white transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-white/10 py-3">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar productos..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-display font-bold tracking-widest uppercase">Menu</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="py-2">
          {CATEGORIES.map(cat => (
            <div key={cat.name}>
              <button
                onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
                className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium hover:bg-gray-50"
              >
                {cat.name}
                {cat.subcategories.length > 0 && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded === cat.name ? 'rotate-180' : ''}`} />
                )}
              </button>
              {expanded === cat.name && cat.subcategories.length > 0 && (
                <div className="bg-gray-50 py-1">
                  {cat.subcategories.map(sub => (
                    <button key={sub} className="block w-full text-left px-10 py-2 text-sm text-gray-600 hover:text-black">
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t p-4 space-y-3">
          <Link href="/login" className="block text-sm font-medium">Mi Cuenta</Link>
          <Link href="/register" className="block text-sm font-medium">Registrarme</Link>
        </div>
      </div>
    </div>
  );
}

function HeroBanner() {
  const col = COLLECTIONS.positano;
  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      <img
        src={col.heroImage}
        alt={col.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 text-white text-center px-6">
        <p className="text-xs tracking-[0.4em] uppercase mb-3 opacity-80">{col.season}</p>
        <h2 className="text-5xl md:text-7xl font-display font-bold tracking-[0.2em] mb-4">
          {col.name}
        </h2>
        <p className="text-sm md:text-base opacity-80 mb-8 max-w-md">{col.tagline}</p>
        <button className="px-8 py-3 bg-white text-black text-sm font-medium tracking-widest uppercase hover:bg-gray-100 transition-colors">
          Ver Coleccion
        </button>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: { name: string; price: number; image: string; badge: string | null } }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase rounded-sm ${
            product.badge === 'Sale' ? 'bg-red-500 text-white' : 'bg-black text-white'
          }`}>
            {product.badge}
          </span>
        )}
        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <button className="w-full py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-gray-900 transition-colors">
            Agregar al Carrito
          </button>
        </div>
        <button className={`absolute top-3 right-3 p-2 bg-white/90 rounded-full transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-sm font-medium">{product.name}</h3>
      <p className="text-sm text-gray-500 mt-0.5">{formatPrice(product.price)}</p>
    </div>
  );
}

function ProductSection({ title, subtitle, products, dark = false }: {
  title: string;
  subtitle?: string;
  products: typeof PRODUCTS.positano;
  dark?: boolean;
}) {
  return (
    <section className={`py-16 md:py-24 ${dark ? 'bg-[#0a0a0a] text-white' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            {subtitle && (
              <p className={`text-xs tracking-[0.3em] uppercase mb-2 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                {subtitle}
              </p>
            )}
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">{title}</h2>
          </div>
          <button className={`text-xs tracking-widest uppercase font-medium flex items-center gap-1 hover:opacity-70 transition-opacity ${dark ? 'text-white/70' : 'text-gray-500'}`}>
            Ver Todo <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard key={i} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Equilibrium */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm group cursor-pointer">
            <img
              src={COLLECTIONS.equilibrium.heroImage}
              alt="Equilibrium"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-xs tracking-[0.3em] uppercase opacity-70 mb-2">{COLLECTIONS.equilibrium.season}</p>
              <h3 className="text-3xl font-display font-bold tracking-wider mb-3">{COLLECTIONS.equilibrium.name}</h3>
              <button className="text-xs tracking-widest uppercase border border-white/60 px-5 py-2 hover:bg-white hover:text-black transition-colors">
                Explorar
              </button>
            </div>
          </div>
          {/* Origenes */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm group cursor-pointer">
            <img
              src={COLLECTIONS.origenes.heroImage}
              alt="Origenes"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-xs tracking-[0.3em] uppercase opacity-70 mb-2">{COLLECTIONS.origenes.season}</p>
              <h3 className="text-3xl font-display font-bold tracking-wider mb-3">{COLLECTIONS.origenes.name}</h3>
              <button className="text-xs tracking-widest uppercase border border-white/60 px-5 py-2 hover:bg-white hover:text-black transition-colors">
                Explorar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SizeGuide() {
  const sizes = [
    { size: 'XS', chest: 'Hasta 92cm' },
    { size: 'S', chest: 'Hasta 96cm' },
    { size: 'M', chest: 'Hasta 104cm' },
    { size: 'L', chest: 'Hasta 112cm' },
    { size: 'XL', chest: 'Hasta 116cm' },
    { size: 'XXL', chest: 'Hasta 120cm' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-xl font-display font-bold tracking-wide mb-2">Guia de Tallas</h2>
        <p className="text-sm text-gray-500 mb-8">Camisas Clasicas</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {sizes.map(s => (
            <div key={s.size} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-display font-bold text-lg">{s.size}</p>
              <p className="text-xs text-gray-500 mt-1">{s.chest}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter({ accentColor }: { accentColor: string }) {
  return (
    <section className="py-16 bg-[#0a0a0a] text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-display font-bold tracking-wide mb-3">The Only Club</h2>
        <p className="text-sm text-white/60 mb-6">
          Se la primera en conocer nuevas colecciones, eventos exclusivos y ofertas especiales.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="tu@email.com"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
          />
          <button
            className="px-6 py-3 rounded-lg text-sm font-medium text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Suscribirse
          </button>
        </div>
      </div>
    </section>
  );
}

function InstagramFeed() {
  const images = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
  ];

  return (
    <section className="py-12">
      <div className="text-center mb-6">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-1">Siguenos en</p>
        <a className="inline-flex items-center gap-2 text-lg font-display font-bold">
          <Instagram className="w-5 h-5" /> @privatoficial
        </a>
        <p className="text-xs text-gray-400 mt-1">37.5K seguidores</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
        {images.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden group cursor-pointer">
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ maisonName }: { maisonName: string }) {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display font-bold tracking-[0.2em] uppercase mb-4">{maisonName}</h3>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> 960 139 383</div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> hola@privat.pe</div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Lima, Peru</div>
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs tracking-widest uppercase font-medium mb-4">Mi Cuenta</h4>
            <div className="space-y-2">
              <Link href="/login" className="block text-sm text-white/60 hover:text-white transition-colors">Iniciar Sesion</Link>
              <Link href="/register" className="block text-sm text-white/60 hover:text-white transition-colors">Registrarme</Link>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Rastrear Pedido</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Lista de Deseos</button>
            </div>
          </div>

          {/* Store */}
          <div>
            <h4 className="text-xs tracking-widest uppercase font-medium mb-4">Tienda</h4>
            <div className="space-y-2">
              <button className="text-sm text-white/60 hover:text-white transition-colors">Mujer</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Hombre</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Teens</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Accesorios</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Outlet</button>
            </div>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs tracking-widest uppercase font-medium mb-4">Ayuda</h4>
            <div className="space-y-2">
              <button className="text-sm text-white/60 hover:text-white transition-colors">Preguntas Frecuentes</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Cuidado de Prendas</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Envios y Devoluciones</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Politica de Privacidad</button>
              <button className="text-sm text-white/60 hover:text-white transition-colors">Libro de Reclamaciones</button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} {maisonName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">Powered by CEREUS</span>
            <div className="flex gap-2">
              <div className="w-8 h-5 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold">VISA</div>
              <div className="w-8 h-5 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold">MC</div>
              <div className="w-8 h-5 bg-white/20 rounded-sm flex items-center justify-center text-[8px] font-bold">AMEX</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN STOREFRONT ────────────────────────────────────────

export function MaisonStorefront({
  maisonId,
  maisonName,
  config,
}: {
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const accentColor = config.branding?.accent_color || '#C9A84C';

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <style>{`
        :root {
          --maison-primary: ${config.branding?.primary_color || '#0A0A0A'};
          --maison-accent: ${accentColor};
        }
      `}</style>

      <TopBar />
      <NavBar maisonName={maisonName} onMenuToggle={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <HeroBanner />

      <ProductSection
        title="Nueva Coleccion"
        subtitle="Summer '25 — POSITANO"
        products={PRODUCTS.positano}
      />

      <CollectionBanner />

      <ProductSection
        title="Privat Teens"
        subtitle="Jovenes con estilo"
        products={PRODUCTS.teens}
      />

      <SizeGuide />

      <ProductSection
        title="Essentials"
        subtitle="Camisas Clasicas"
        products={PRODUCTS.essentials}
      />

      <InstagramFeed />
      <Newsletter accentColor={accentColor} />
      <Footer maisonName={maisonName} />

      {/* Chatbot */}
      {config.chatbot?.enabled && (
        <MaisonChatbot
          chatbotConfig={config.chatbot}
          maisonName={maisonName}
        />
      )}
    </div>
  );
}
