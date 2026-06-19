'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Reorder, useDragControls } from 'framer-motion';
import {
  LayoutDashboard, Blocks, Plug, Wand2, Loader2, Monitor, Tablet, Smartphone, Eye, Pencil,
  Download, Trash2, Copy, GripVertical, Plus, PanelTop, LayoutTemplate, Type, Image as ImageIcon,
  Sparkles, MessageSquareQuote, CreditCard, HelpCircle, Mail, AlignLeft, TrendingUp, Rocket,
  ShoppingBag, Package, Files, FileText, Check, Upload, Zap,
} from 'lucide-react';
import { AgentAppShell, type AppNavItem, type ShellUser } from '@/components/cactus/app-shell/agent-app-shell';
import { KpiRow, type Kpi } from '@/components/cactus/app-shell/kpi-row';
import { SubAgentBar } from '@/components/cactus/apps/shared/sub-agent-bar';
import { useAutomations, AutomationsPanel } from '@/components/cactus/apps/shared/automations';
import { defaultAutomationsFor } from '@/lib/cactus/automations-catalog';

interface OpuntiaAgent { slug: string; name: string; role: string; color: string; image: string }

// ═══ Modelo: Sitio = tema + páginas + catálogo de productos ═══════════════════
type BlockType = 'navbar' | 'hero' | 'text' | 'features' | 'image' | 'gallery' | 'cta' | 'testimonials' | 'pricing' | 'faq' | 'contact' | 'footer' | 'products' | 'product';
interface Block { id: string; type: BlockType; props: Record<string, any> }
interface PageDef { id: string; name: string; blocks: Block[] }
interface Product { id: string; name: string; price: string; image: string; description: string; badge: string }
interface Site { theme: { color: string }; pages: PageDef[]; products: Product[] }

type FieldKind = 'text' | 'textarea' | 'image' | 'pairs' | 'urls' | 'product';
interface Field { k: string; l: string; t: FieldKind; aL?: string; bL?: string }
interface BlockDef { label: string; icon: typeof PanelTop; make: () => Record<string, any>; fields: Field[] }

const BLOCKS: Record<BlockType, BlockDef> = {
  navbar: {
    label: 'Navbar', icon: PanelTop,
    make: () => ({ brand: 'Tu Marca', links: 'Inicio, Tienda, Nosotros, Contacto', ctaText: 'Comprar' }),
    fields: [{ k: 'brand', l: 'Marca', t: 'text' }, { k: 'links', l: 'Enlaces (separa con comas)', t: 'text' }, { k: 'ctaText', l: 'Botón', t: 'text' }],
  },
  hero: {
    label: 'Hero', icon: LayoutTemplate,
    make: () => ({ title: 'Tu propuesta de valor en una línea', subtitle: 'Explica en una frase qué vendes y para quién, de forma clara y atractiva.', ctaText: 'Ver tienda', ctaLink: '#', image: '' }),
    fields: [{ k: 'title', l: 'Título', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'textarea' }, { k: 'ctaText', l: 'Texto del botón', t: 'text' }, { k: 'ctaLink', l: 'Enlace', t: 'text' }, { k: 'image', l: 'Imagen de fondo (URL)', t: 'image' }],
  },
  products: {
    label: 'Catálogo', icon: ShoppingBag,
    make: () => ({ heading: 'Nuestros productos' }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }],
  },
  product: {
    label: 'Producto', icon: Package,
    make: () => ({ productId: '' }),
    fields: [{ k: 'productId', l: 'Producto a destacar', t: 'product' }],
  },
  text: {
    label: 'Texto', icon: Type,
    make: () => ({ heading: 'Una sección de texto', body: 'Cuenta tu historia, tu misión o el detalle de tu oferta. Este párrafo es totalmente editable.' }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'body', l: 'Texto', t: 'textarea' }],
  },
  features: {
    label: 'Características', icon: Blocks,
    make: () => ({ heading: '¿Por qué comprarnos?', items: [{ a: 'Envío rápido', b: 'Recíbelo en 24-48h.' }, { a: 'Pago seguro', b: 'Checkout protegido.' }, { a: 'Garantía', b: 'Devolución sin preguntas.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Características', t: 'pairs', aL: 'Título', bL: 'Descripción' }],
  },
  image: {
    label: 'Imagen', icon: ImageIcon,
    make: () => ({ url: '', caption: '' }),
    fields: [{ k: 'url', l: 'Imagen (URL)', t: 'image' }, { k: 'caption', l: 'Pie de foto', t: 'text' }],
  },
  gallery: {
    label: 'Galería', icon: ImageIcon,
    make: () => ({ images: ['', '', ''] }),
    fields: [{ k: 'images', l: 'Imágenes (URLs)', t: 'urls' }],
  },
  cta: {
    label: 'Llamada a la acción', icon: Sparkles,
    make: () => ({ title: '¿List@ para comprar?', subtitle: 'Aprovecha el envío gratis por tiempo limitado.', ctaText: 'Ir a la tienda', ctaLink: '#' }),
    fields: [{ k: 'title', l: 'Título', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'text' }, { k: 'ctaText', l: 'Botón', t: 'text' }, { k: 'ctaLink', l: 'Enlace', t: 'text' }],
  },
  testimonials: {
    label: 'Testimonios', icon: MessageSquareQuote,
    make: () => ({ heading: 'Lo que dicen', items: [{ a: 'Ana', b: 'Producto increíble, repetiré.' }, { a: 'Luis', b: 'Llegó rapidísimo y tal cual la foto.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Testimonios', t: 'pairs', aL: 'Autor', bL: 'Cita' }],
  },
  pricing: {
    label: 'Precios', icon: CreditCard,
    make: () => ({ heading: 'Planes', items: [{ a: 'Básico — $9', b: 'Lo esencial para empezar' }, { a: 'Pro — $29', b: 'Para quien va en serio' }, { a: 'Premium — $59', b: 'Todo incluido' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Planes', t: 'pairs', aL: 'Plan y precio', bL: 'Qué incluye' }],
  },
  faq: {
    label: 'Preguntas', icon: HelpCircle,
    make: () => ({ heading: 'Preguntas frecuentes', items: [{ a: '¿Hacen envíos?', b: 'Sí, a todo el país.' }, { a: '¿Puedo devolver?', b: 'Tienes 30 días.' }] }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'items', l: 'Preguntas', t: 'pairs', aL: 'Pregunta', bL: 'Respuesta' }],
  },
  contact: {
    label: 'Contacto', icon: Mail,
    make: () => ({ heading: 'Hablemos', subtitle: 'Déjanos tus datos y te escribimos.', buttonText: 'Enviar', email: '' }),
    fields: [{ k: 'heading', l: 'Encabezado', t: 'text' }, { k: 'subtitle', l: 'Subtítulo', t: 'text' }, { k: 'buttonText', l: 'Botón', t: 'text' }, { k: 'email', l: 'Correo de destino (a dónde llegan los mensajes)', t: 'text' }],
  },
  footer: {
    label: 'Footer', icon: AlignLeft,
    make: () => ({ text: '© Tu Marca. Todos los derechos reservados.', links: 'Privacidad, Términos, Contacto' }),
    fields: [{ k: 'text', l: 'Texto', t: 'text' }, { k: 'links', l: 'Enlaces (separa con comas)', t: 'text' }],
  },
};
const BLOCK_ORDER: BlockType[] = ['navbar', 'hero', 'products', 'product', 'features', 'text', 'image', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'contact', 'footer'];

const SITE_KEY = 'cactus.opuntia.site.v1';
const OLD_PAGE_KEY = 'cactus.opuntia.page.v1';
const uid = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const splitCommas = (s: string) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

function starterSite(): Site {
  const products: Product[] = [
    { id: uid(), name: 'Producto estrella', price: '$299', image: '', description: 'Tu best-seller. Describe aquí por qué lo van a amar.', badge: 'Top' },
    { id: uid(), name: 'Producto clásico', price: '$199', image: '', description: 'El infaltable de tu catálogo.', badge: '' },
    { id: uid(), name: 'Edición limitada', price: '$349', image: '', description: 'Pocas unidades disponibles.', badge: 'Nuevo' },
  ];
  return {
    theme: { color: '#2D6CDF' },
    pages: [
      { id: uid(), name: 'Inicio', blocks: [
        { id: uid(), type: 'navbar', props: BLOCKS.navbar.make() },
        { id: uid(), type: 'hero', props: BLOCKS.hero.make() },
        { id: uid(), type: 'features', props: BLOCKS.features.make() },
        { id: uid(), type: 'products', props: { heading: 'Lo más vendido' } },
        { id: uid(), type: 'cta', props: BLOCKS.cta.make() },
        { id: uid(), type: 'footer', props: BLOCKS.footer.make() },
      ] },
      { id: uid(), name: 'Tienda', blocks: [
        { id: uid(), type: 'navbar', props: BLOCKS.navbar.make() },
        { id: uid(), type: 'products', props: { heading: 'Todos los productos' } },
        { id: uid(), type: 'footer', props: BLOCKS.footer.make() },
      ] },
    ],
    products,
  };
}

// ═══ Plantillas / landings modelo (librería) ══════════════════════════════════
const mk = (type: BlockType, overrides: Record<string, any> = {}): Block => ({ id: uid(), type, props: { ...BLOCKS[type].make(), ...overrides } });

interface Template { key: string; name: string; desc: string; build: () => Block[] }
const TEMPLATES: Template[] = [
  {
    key: 'producto', name: 'Landing de producto', desc: 'Presenta un producto: beneficios, prueba social y cierre.',
    build: () => [
      mk('navbar', { brand: 'Tu Producto', links: 'Inicio, Beneficios, Precio, Contacto', ctaText: 'Comprar' }),
      mk('hero', { title: 'El producto que estabas esperando', subtitle: 'Resuelve tu problema en minutos. Pruébalo hoy sin riesgo.', ctaText: 'Lo quiero' }),
      mk('features', { heading: 'Por qué te va a encantar', items: [{ a: 'Ahorra tiempo', b: 'Automatiza lo tedioso.' }, { a: 'Fácil de usar', b: 'Sin curva de aprendizaje.' }, { a: 'Soporte real', b: 'Te acompañamos siempre.' }] }),
      mk('testimonials', {}),
      mk('faq', {}),
      mk('cta', { title: 'Empieza hoy', subtitle: 'Garantía de devolución de 30 días.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'tienda', name: 'Tienda / eCommerce', desc: 'Catálogo de productos con envíos y garantías.',
    build: () => [
      mk('navbar', { brand: 'Tu Tienda', links: 'Inicio, Tienda, Ofertas, Contacto', ctaText: 'Ver carrito' }),
      mk('hero', { title: 'Productos que vas a amar', subtitle: 'Envío a todo el país. Paga seguro.', ctaText: 'Comprar ahora' }),
      mk('products', { heading: 'Lo más vendido' }),
      mk('features', { heading: 'Comprar con nosotros es fácil', items: [{ a: 'Envío rápido', b: 'Recíbelo en 24-48h.' }, { a: 'Pago seguro', b: 'Checkout protegido.' }, { a: 'Devolución', b: 'Hasta 30 días.' }] }),
      mk('cta', { title: 'Envío gratis hoy', subtitle: 'En compras mayores a $50.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'servicios', name: 'Servicios profesionales', desc: 'Para agencias, consultorías y freelancers.',
    build: () => [
      mk('navbar', { brand: 'Tu Estudio', links: 'Inicio, Servicios, Casos, Contacto', ctaText: 'Cotizar' }),
      mk('hero', { title: 'Soluciones a la medida de tu negocio', subtitle: 'Estrategia, ejecución y resultados medibles.', ctaText: 'Agenda una llamada' }),
      mk('features', { heading: 'Nuestros servicios', items: [{ a: 'Estrategia', b: 'Plan claro y accionable.' }, { a: 'Ejecución', b: 'Hacemos que pase.' }, { a: 'Medición', b: 'Decisiones con datos.' }] }),
      mk('pricing', {}),
      mk('testimonials', {}),
      mk('contact', { heading: '¿Trabajamos juntos?', subtitle: 'Cuéntanos tu reto y te respondemos en 24h.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'restaurante', name: 'Restaurante / Café', desc: 'Carta, ambiente y reservas para hostelería.',
    build: () => [
      mk('navbar', { brand: 'Tu Restaurante', links: 'Inicio, Menú, Reservas, Ubicación', ctaText: 'Reservar' }),
      mk('hero', { title: 'Sabor que se queda contigo', subtitle: 'Cocina de autor con ingredientes locales.', ctaText: 'Ver el menú' }),
      mk('gallery', { images: ['', '', '', '', '', ''] }),
      mk('text', { heading: 'Nuestra historia', body: 'Abrimos en 20XX con una idea simple: buena comida, buen ambiente. Aquí cada plato cuenta una historia.' }),
      mk('testimonials', { heading: 'Lo que dicen los comensales' }),
      mk('contact', { heading: 'Reserva tu mesa', subtitle: 'Te confirmamos por correo.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'evento', name: 'Evento / Webinar', desc: 'Registro a un evento, curso o webinar.',
    build: () => [
      mk('navbar', { brand: 'Tu Evento', links: 'Agenda, Ponentes, Tickets, FAQ', ctaText: 'Registrarme' }),
      mk('hero', { title: 'El evento del año', subtitle: 'Un día, los mejores del sector, una experiencia inolvidable.', ctaText: 'Reservar lugar' }),
      mk('features', { heading: 'Lo que vivirás', items: [{ a: 'Charlas magistrales', b: 'Aprende de los mejores.' }, { a: 'Networking', b: 'Conecta con tu industria.' }, { a: 'Workshops', b: 'Llévate herramientas.' }] }),
      mk('pricing', { heading: 'Tickets', items: [{ a: 'General — $49', b: 'Acceso a todas las charlas' }, { a: 'VIP — $99', b: 'Acceso + workshops + after' }, { a: 'Empresa — A medida', b: 'Pase para tu equipo' }] }),
      mk('faq', {}),
      mk('cta', { title: 'Cupos limitados', subtitle: 'Asegura tu lugar hoy.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'saas', name: 'App / SaaS', desc: 'Software con planes y prueba gratis.',
    build: () => [
      mk('navbar', { brand: 'Tu App', links: 'Producto, Precios, Recursos, Login', ctaText: 'Prueba gratis' }),
      mk('hero', { title: 'La herramienta que tu equipo necesita', subtitle: 'Más productividad, menos caos. Empieza gratis.', ctaText: 'Crear cuenta' }),
      mk('features', { heading: 'Todo en un solo lugar', items: [{ a: 'Rápido', b: 'Veloz desde el día uno.' }, { a: 'Seguro', b: 'Tus datos, protegidos.' }, { a: 'Integraciones', b: 'Conecta tus herramientas.' }] }),
      mk('pricing', { heading: 'Planes para cada etapa' }),
      mk('faq', {}),
      mk('cta', { title: 'Empieza gratis', subtitle: 'Sin tarjeta. Cancela cuando quieras.' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'comingsoon', name: 'Coming soon', desc: 'Página de espera con captación de correos.',
    build: () => [
      mk('hero', { title: 'Algo grande viene en camino', subtitle: 'Déjanos tu correo y sé el primero en enterarte.', ctaText: 'Avísame' }),
      mk('contact', { heading: 'Únete a la lista', subtitle: 'Sin spam, solo el lanzamiento.', buttonText: 'Apuntarme' }),
      mk('footer', {}),
    ],
  },
  {
    key: 'portafolio', name: 'Portafolio / Personal', desc: 'Muestra tu trabajo y deja que te contacten.',
    build: () => [
      mk('navbar', { brand: 'Tu Nombre', links: 'Inicio, Trabajo, Sobre mí, Contacto', ctaText: 'Hablemos' }),
      mk('hero', { title: 'Hola, soy [tu nombre]', subtitle: 'Diseño / desarrollo / creo cosas que importan.', ctaText: 'Ver mi trabajo' }),
      mk('gallery', { images: ['', '', '', '', '', ''] }),
      mk('text', { heading: 'Sobre mí', body: 'Cuento corto sobre quién eres, qué haces y qué te apasiona. Hazlo personal.' }),
      mk('contact', { heading: 'Trabajemos juntos', subtitle: 'Escríbeme y te respondo pronto.' }),
      mk('footer', {}),
    ],
  },
];

type View = 'resumen' | 'builder' | 'productos' | 'automatizaciones';

export function OpuntiaApp({ agent, user, credits }: { agent: OpuntiaAgent; user?: ShellUser; credits?: number }) {
  const [view, setView] = useState<View>('builder');
  const [site, setSite] = useState<Site>(starterSite);
  const [loaded, setLoaded] = useState(false);
  const autos = useAutomations(agent.slug, defaultAutomationsFor(agent.slug));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SITE_KEY);
      if (raw) { setSite(JSON.parse(raw)); setLoaded(true); return; }
      // Migración desde el builder de una sola página (v1)
      const old = localStorage.getItem(OLD_PAGE_KEY);
      if (old) {
        const op = JSON.parse(old);
        setSite({ theme: op.theme || { color: '#2D6CDF' }, pages: [{ id: uid(), name: 'Inicio', blocks: (op.blocks || []).map((b: any) => ({ ...b, id: b.id || uid() })) }], products: [] });
      }
    } catch { /* noop */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SITE_KEY, JSON.stringify(site)); } catch { /* noop */ }
  }, [site, loaded]);

  const firstName = user?.name?.split(' ')[0];
  const nav: AppNavItem[] = [
    { key: 'resumen', label: 'Mi sitio', icon: LayoutDashboard },
    { key: 'builder', label: 'Builder', icon: Blocks },
    { key: 'productos', label: 'Productos', icon: ShoppingBag },
    { key: 'conexiones', label: 'Dominio & pagos', icon: Plug, href: '/empresa', section: 'Cuenta' },
    { key: 'automatizaciones', label: 'Automatizaciones', icon: Zap },
  ];

  return (
    <AgentAppShell
      agent={agent}
      nav={nav}
      activeNav={view}
      onNav={(k) => { if (k !== 'conexiones') setView(k as View); }}
      user={user}
      credits={credits}
      greeting={`Hola${firstName ? `, ${firstName}` : ''} 🌐`}
      subtitle="Tu sitio y tienda con Opuntia"
      cta={{ label: 'Abrir builder', icon: Blocks, onClick: () => setView('builder') }}
    >
      {view === 'resumen' && <Resumen site={site} accent={agent.color} onGo={setView} />}
      {view === 'builder' && <Builder agent={agent} site={site} setSite={setSite} />}
      {view === 'productos' && <Productos site={site} setSite={setSite} accent={agent.color} />}
      {view === 'automatizaciones' && <AutomationsPanel autos={autos} accent={agent.color} />}
    </AgentAppShell>
  );
}

// ═══ Resumen ══════════════════════════════════════════════════════════════════
function Resumen({ site, accent, onGo }: { site: Site; accent: string; onGo: (v: View) => void }) {
  const kpis: Kpi[] = [
    { label: 'Páginas', value: site.pages.length, icon: <Files className="h-4 w-4" /> },
    { label: 'Productos', value: site.products.length, icon: <Package className="h-4 w-4" /> },
    { label: 'Publicado', value: '—', icon: <Rocket className="h-4 w-4" />, hint: 'Conecta dominio (Fase F)' },
    { label: 'Ventas', value: '—', icon: <TrendingUp className="h-4 w-4" />, hint: 'Conecta pagos (Fase F)' },
  ];
  return (
    <div className="space-y-5">
      <KpiRow items={kpis} accent={accent} />
      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">Páginas internas</h3>
            <div className="space-y-2">
              {site.pages.map((p) => (
                <button key={p.id} onClick={() => onGo('builder')} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-[color:var(--c)]" style={{ ['--c' as string]: accent }}>
                  <FileText className="h-4 w-4" style={{ color: accent }} />
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-[11px] text-muted-foreground">{p.blocks.length} bloques</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Catálogo</h3>
              <button onClick={() => onGo('productos')} className="text-xs font-medium" style={{ color: accent }}>Gestionar →</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {site.products.slice(0, 6).map((pr) => (
                <div key={pr.id} className="rounded-lg border border-border p-2">
                  <div className="mb-1 flex h-16 items-center justify-center overflow-hidden rounded bg-muted">
                    {pr.image ? <img src={pr.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <p className="truncate text-xs font-medium">{pr.name}</p>
                  <p className="text-[11px] text-muted-foreground">{pr.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 text-sm font-medium"><Rocket className="h-4 w-4" style={{ color: accent }} /> Publicar & cobrar</div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Hoy diseñas tu sitio multi-página y tu catálogo, y <strong>exportas el HTML</strong>. Conectar un
            <strong> dominio propio</strong> y una <strong>pasarela de pago</strong> (cobro real) llega con las integraciones (Fase F).
          </p>
          <Link href="/empresa" className="mt-2 inline-block text-xs font-semibold" style={{ color: accent }}>Ir a Conexiones →</Link>
        </aside>
      </div>
    </div>
  );
}

// ═══ Productos (catálogo: subir / editar / eliminar) ══════════════════════════
function Productos({ site, setSite, accent }: { site: Site; setSite: (fn: (s: Site) => Site) => void; accent: string }) {
  const empty: Product = { id: '', name: '', price: '', image: '', description: '', badge: '' };
  const [form, setForm] = useState<Product>(empty);
  const editing = !!form.id;

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) setSite((s) => ({ ...s, products: s.products.map((p) => (p.id === form.id ? form : p)) }));
    else setSite((s) => ({ ...s, products: [{ ...form, id: uid() }, ...s.products] }));
    setForm(empty);
  };
  const remove = (id: string) => setSite((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        Sube tu catálogo aquí; aparece en los bloques <strong>Catálogo</strong> y <strong>Producto</strong> del builder. El cobro real
        (conexión con pasarela de pago) se activa en Conexiones (Fase F).
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">{editing ? 'Editar producto' : 'Subir producto'}</h3>
          <FormField label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="$299" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></FormField>
            <FormField label="Etiqueta"><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Nuevo / Top" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></FormField>
          </div>
          <FormField label="Imagen"><ImageInput value={form.image} accent={accent} onChange={(v) => setForm({ ...form, image: v })} /></FormField>
          <FormField label="Descripción"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" /></FormField>
          <div className="flex gap-2">
            <button onClick={save} disabled={!form.name.trim()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}>
              {editing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? 'Guardar' : 'Subir producto'}
            </button>
            {editing && <button onClick={() => setForm(empty)} className="rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted">Cancelar</button>}
          </div>
        </div>

        <div>
          {site.products.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-center text-muted-foreground">
              <Package className="h-7 w-7 opacity-50" />
              <p className="text-sm">Tu catálogo está vacío. Sube tu primer producto.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {site.products.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative flex h-32 items-center justify-center bg-muted">
                    {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Package className="h-7 w-7 text-muted-foreground" />}
                    {p.badge && <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: accent }}>{p.badge}</span>}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <span className="shrink-0 text-sm font-bold" style={{ color: accent }}>{p.price}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button onClick={() => setForm(p)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted"><Pencil className="h-3 w-3" /> Editar</button>
                      <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Builder (multi-página) ═══════════════════════════════════════════════════
const DEVICE = { desktop: 'w-full', tablet: 'max-w-[768px]', mobile: 'max-w-[400px]' } as const;

function Builder({ agent, site, setSite }: { agent: OpuntiaAgent; site: Site; setSite: (fn: (s: Site) => Site) => void }) {
  const [activePageId, setActivePageId] = useState<string>(site.pages[0]?.id || '');
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICE>('desktop');
  const [preview, setPreview] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);

  const page = site.pages.find((p) => p.id === activePageId) || site.pages[0];
  const pageId = page?.id;

  const mutPage = (fn: (blocks: Block[]) => Block[]) =>
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === pageId ? { ...p, blocks: fn(p.blocks) } : p)) }));
  const setBlocks = (blocks: Block[]) => mutPage(() => blocks);
  const addBlock = (type: BlockType) => { const b: Block = { id: uid(), type, props: BLOCKS[type].make() }; mutPage((bl) => [...bl, b]); setSelected(b.id); };
  const updateBlock = (id: string, props: Record<string, any>) => mutPage((bl) => bl.map((b) => (b.id === id ? { ...b, props } : b)));
  const deleteBlock = (id: string) => mutPage((bl) => bl.filter((b) => b.id !== id));
  const dupBlock = (id: string) => mutPage((bl) => { const i = bl.findIndex((b) => b.id === id); if (i < 0) return bl; const copy = { id: uid(), type: bl[i].type, props: { ...bl[i].props } }; const next = [...bl]; next.splice(i + 1, 0, copy); return next; });
  const setTheme = (color: string) => setSite((s) => ({ ...s, theme: { ...s.theme, color } }));

  const renamePage = (name: string) => setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === pageId ? { ...p, name } : p)) }));
  const addPage = () => { const np: PageDef = { id: uid(), name: `Página ${site.pages.length + 1}`, blocks: [{ id: uid(), type: 'navbar', props: BLOCKS.navbar.make() }, { id: uid(), type: 'footer', props: BLOCKS.footer.make() }] }; setSite((s) => ({ ...s, pages: [...s.pages, np] })); setActivePageId(np.id); setSelected(null); };
  const addTemplatePage = (name: string, blocks: Block[]) => { const np: PageDef = { id: uid(), name, blocks }; setSite((s) => ({ ...s, pages: [...s.pages, np] })); setActivePageId(np.id); setSelected(null); };
  const deletePage = () => { if (site.pages.length <= 1) return; setSite((s) => { const pages = s.pages.filter((p) => p.id !== pageId); return { ...s, pages }; }); setActivePageId(site.pages.find((p) => p.id !== pageId)?.id || ''); setSelected(null); };

  const sel = page?.blocks.find((b) => b.id === selected) || null;

  function exportHtml() {
    const html = pageToHtml(page, site.theme, site.products);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${page.name.toLowerCase().replace(/\s+/g, '-')}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!page) return null;

  return (
    <div className="space-y-3">
      {/* Tabs de páginas */}
      <div className="flex flex-wrap items-center gap-1.5">
        {site.pages.map((p) => (
          <button key={p.id} onClick={() => { setActivePageId(p.id); setSelected(null); }} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${p.id === pageId ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} style={p.id === pageId ? { backgroundColor: agent.color } : undefined}>
            <FileText className="h-3.5 w-3.5" /> {p.name}
          </button>
        ))}
        <button onClick={addPage} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Plus className="h-3.5 w-3.5" /> Página</button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setDevice(k)} title={k} className={`rounded-md p-1.5 ${device === k ? 'text-white' : 'text-muted-foreground hover:bg-muted'}`} style={device === k ? { backgroundColor: agent.color } : undefined}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
          {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {preview ? 'Editar' : 'Vista previa'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setTplOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <LayoutTemplate className="h-4 w-4" /> Plantillas
          </button>
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: agent.color }}>
            <Wand2 className="h-4 w-4" /> Generar con IA
          </button>
          <button onClick={exportHtml} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[200px_1fr_300px]">
        {!preview && (
          <div className="hidden xl:block">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bloques</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_ORDER.map((t) => {
                  const def = BLOCKS[t];
                  return (
                    <button key={t} onClick={() => addBlock(t)} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-1 py-2 text-[10px] text-muted-foreground transition-colors hover:border-[color:var(--c)] hover:text-foreground" style={{ ['--c' as string]: agent.color }}>
                      <def.icon className="h-4 w-4" /> {def.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 rounded-xl border border-border bg-muted/30 p-3">
          <div className={`mx-auto overflow-hidden rounded-lg bg-white shadow-sm transition-all ${DEVICE[device]}`}>
            {page.blocks.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-gray-400">
                <Blocks className="h-7 w-7" />
                <p className="text-sm">Agrega bloques desde la paleta o genera la página con IA.</p>
              </div>
            ) : preview ? (
              <div>{page.blocks.map((b) => <div key={b.id}><BlockView block={b} theme={site.theme} products={site.products} /></div>)}</div>
            ) : (
              <Reorder.Group axis="y" values={page.blocks} onReorder={setBlocks} className="list-none">
                {page.blocks.map((b) => (
                  <BlockItem
                    key={b.id} block={b} theme={site.theme} products={site.products} accent={agent.color}
                    selected={b.id === selected}
                    onSelect={() => setSelected(b.id)}
                    onDelete={() => { deleteBlock(b.id); if (selected === b.id) setSelected(null); }}
                    onDup={() => dupBlock(b.id)}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>

        {!preview && (
          <div className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border bg-card p-4">
              {sel ? (
                <Inspector block={sel} products={site.products} accent={agent.color} onChange={(props) => updateBlock(sel.id, props)} />
              ) : (
                <PageSettings page={page} theme={site.theme} accent={agent.color} canDelete={site.pages.length > 1} onName={renamePage} onColor={setTheme} onDelete={deletePage} />
              )}
            </div>
          </div>
        )}
      </div>

      {aiOpen && <AiModal agent={agent} onClose={() => setAiOpen(false)} onApply={(blocks, color) => { setBlocks(blocks); if (color) setTheme(color); setSelected(null); setAiOpen(false); }} />}
      {tplOpen && <TemplatesModal accent={agent.color} onClose={() => setTplOpen(false)} onPick={(name, blocks) => { addTemplatePage(name, blocks); setTplOpen(false); }} />}
    </div>
  );
}

function BlockItem({
  block, theme, products, accent, selected, onSelect, onDelete, onDup,
}: {
  block: Block; theme: Site['theme']; products: Product[]; accent: string; selected: boolean;
  onSelect: () => void; onDelete: () => void; onDup: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls} className="relative">
      <div
        onClick={onSelect}
        className="group relative cursor-pointer"
        style={selected ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
          <button onPointerDown={(e) => controls.start(e)} title="Arrastrar" className="cursor-grab rounded p-1 text-gray-500 hover:bg-gray-100 active:cursor-grabbing"><GripVertical className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDup(); }} title="Duplicar" className="rounded p-1 text-gray-500 hover:bg-gray-100"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar" className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <span className="absolute left-2 top-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">{BLOCKS[block.type].label}</span>
        <BlockView block={block} theme={theme} products={products} />
      </div>
    </Reorder.Item>
  );
}

function Inspector({ block, products, accent, onChange }: { block: Block; products: Product[]; accent: string; onChange: (props: Record<string, any>) => void }) {
  const def = BLOCKS[block.type];
  const set = (k: string, v: any) => onChange({ ...block.props, [k]: v });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><def.icon className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">{def.label}</h3></div>
      {(block.type === 'products') && <p className="rounded-lg bg-muted/50 p-2 text-[11px] text-muted-foreground">Muestra tu catálogo. Edita los productos en la pestaña <strong>Productos</strong>.</p>}
      {def.fields.map((f) => (
        <div key={f.k}>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{f.l}</label>
          {f.t === 'textarea' ? (
            <textarea value={block.props[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
          ) : f.t === 'pairs' ? (
            <PairsEditor value={block.props[f.k] || []} aL={f.aL} bL={f.bL} accent={accent} onChange={(v) => set(f.k, v)} />
          ) : f.t === 'urls' ? (
            <UrlsEditor value={block.props[f.k] || []} accent={accent} onChange={(v) => set(f.k, v)} />
          ) : f.t === 'product' ? (
            <select value={block.props[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none">
              <option value="">{products.length ? 'Elige un producto' : 'Sube productos primero'}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : f.t === 'image' ? (
            <ImageInput value={block.props[f.k] ?? ''} accent={accent} onChange={(v) => set(f.k, v)} />
          ) : (
            <input value={block.props[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
          )}
        </div>
      ))}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData(); fd.append('file', file);
  const res = await fetch('/api/cactus/opuntia/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo subir');
  return data.url as string;
}

// Campo de imagen: pega una URL o sube un archivo (Supabase Storage)
function ImageInput({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); setErr(null);
    try { onChange(await uploadImage(f)); } catch (e: any) { setErr(e?.message || 'Error'); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… o sube" className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} title="Subir imagen" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: accent }}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        </button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={onPick} />
      </div>
      {value && <img src={value} alt="" className="h-16 w-full rounded-lg border border-border object-cover" />}
      {err && <p className="text-[10px] text-red-500">{err}</p>}
    </div>
  );
}

function PairsEditor({ value, aL, bL, accent, onChange }: { value: { a: string; b: string }[]; aL?: string; bL?: string; accent: string; onChange: (v: { a: string; b: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((it, i) => (
        <div key={i} className="space-y-1 rounded-lg border border-border p-2">
          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">#{i + 1}</span><button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button></div>
          <input value={it.a} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} placeholder={aL} className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none" />
          <input value={it.b} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)))} placeholder={bL} className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none" />
        </div>
      ))}
      <button onClick={() => onChange([...value, { a: '', b: '' }])} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="h-3.5 w-3.5" /> Agregar</button>
    </div>
  );
}

function UrlsEditor({ value, accent, onChange }: { value: string[]; accent: string; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((u, i) => (
        <div key={i} className="rounded-lg border border-border p-2">
          <div className="mb-1 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Imagen #{i + 1}</span><button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button></div>
          <ImageInput value={u} accent={accent} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
        </div>
      ))}
      <button onClick={() => onChange([...value, ''])} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="h-3.5 w-3.5" /> Agregar imagen</button>
    </div>
  );
}

function PageSettings({ page, theme, accent, canDelete, onName, onColor, onDelete }: { page: PageDef; theme: Site['theme']; accent: string; canDelete: boolean; onName: (n: string) => void; onColor: (c: string) => void; onDelete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display font-semibold">Página</h3></div>
      <p className="text-xs text-muted-foreground">Selecciona un bloque en el lienzo para editarlo, o ajusta la página aquí.</p>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Nombre de la página</label>
        <input value={page.name} onChange={(e) => onName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Color de marca</label>
        <div className="flex items-center gap-2">
          <input type="color" value={theme.color} onChange={(e) => onColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
          <input value={theme.color} onChange={(e) => onColor(e.target.value)} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none" />
        </div>
      </div>
      {canDelete && <button onClick={onDelete} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Eliminar página</button>}
    </div>
  );
}

function TemplatesModal({ accent, onClose, onPick }: { accent: string; onClose: () => void; onPick: (name: string, blocks: Block[]) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-1 flex items-center gap-2"><LayoutTemplate className="h-4 w-4" style={{ color: accent }} /><h3 className="font-display text-lg font-semibold">Plantillas</h3></div>
        <p className="mb-4 text-sm text-muted-foreground">Empieza desde una página modelo. Se añade como una página nueva que puedes editar a tu gusto.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const blocks = t.build();
            return (
              <div key={t.key} className="flex flex-col rounded-xl border border-border bg-background p-4">
                <h4 className="font-display font-semibold">{t.name}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {blocks.map((b, i) => <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{BLOCKS[b.type].label}</span>)}
                </div>
                <button onClick={() => onPick(t.name, t.build())} className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
                  <Plus className="h-4 w-4" /> Usar plantilla
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-right"><button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Cerrar</button></div>
      </div>
    </div>
  );
}

function AiModal({ agent, onClose, onApply }: { agent: OpuntiaAgent; onClose: () => void; onApply: (blocks: Block[], color?: string) => void }) {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subAgent, setSubAgent] = useState<string | null>(null);
  async function generate() {
    const b = brief.trim();
    if (!b || loading) return;
    setLoading(true); setError(null);
    const prompt =
      `Eres un constructor de páginas web. Diseña la página para: ${b}.\n` +
      `Devuelve SOLO un JSON válido (sin markdown) con la forma:\n` +
      `{"theme":{"color":"#2D6CDF"},"blocks":[{"type":"navbar","props":{...}}, ...]}\n` +
      `Tipos y props válidos:\n` +
      `navbar:{brand,links,ctaText} · hero:{title,subtitle,ctaText,ctaLink} · products:{heading} · text:{heading,body} · ` +
      `features:{heading,items:[{a,b}]} · cta:{title,subtitle,ctaText,ctaLink} · testimonials:{heading,items:[{a,b}]} · ` +
      `pricing:{heading,items:[{a,b}]} · faq:{heading,items:[{a,b}]} · contact:{heading,subtitle,buttonText} · footer:{text,links}\n` +
      `Si es una tienda, incluye un bloque "products". Usa de 5 a 8 bloques, navbar primero y footer al final. Texto en español, específico y real. Solo el JSON.`;
    try {
      const res = await fetch('/api/cactus/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: agent.slug, subAgent, messages: [{ role: 'user', content: prompt }], maxTokens: 4000 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar.');
      const parsed = parseBlocks(String(data.content || ''));
      if (!parsed.blocks.length) throw new Error('La IA no devolvió una página válida. Intenta de nuevo.');
      onApply(parsed.blocks, parsed.color);
    } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-2 flex items-center gap-2"><Wand2 className="h-4 w-4" style={{ color: agent.color }} /><h3 className="font-display text-lg font-semibold">Generar página con IA</h3></div>
        <p className="mb-3 text-sm text-muted-foreground">Describe el negocio o la página y Opuntia arma esta página. (Reemplaza los bloques de la página actual.)</p>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} placeholder="Ej. Tienda de café de especialidad, venta online, envíos a todo el país…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none" />
        <SubAgentBar slug={agent.slug} value={subAgent} onChange={setSubAgent} accent={agent.color} />
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">Cancelar</button>
          <button onClick={generate} disabled={loading || !brief.trim()} className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: agent.color }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {loading ? 'Diseñando…' : 'Generar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseBlocks(raw: string): { blocks: Block[]; color?: string } {
  try {
    let s = raw.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) s = fence[1].trim();
    const start = s.indexOf('{'); const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) s = s.slice(start, end + 1);
    const obj = JSON.parse(s);
    const color = obj?.theme?.color && /^#?[0-9a-fA-F]{3,8}$/.test(String(obj.theme.color)) ? String(obj.theme.color).replace(/^#?/, '#') : undefined;
    const blocks: Block[] = (Array.isArray(obj?.blocks) ? obj.blocks : [])
      .filter((b: any) => b && BLOCKS[b.type as BlockType])
      .map((b: any) => ({ id: uid(), type: b.type as BlockType, props: { ...BLOCKS[b.type as BlockType].make(), ...(b.props || {}) } }));
    return { blocks, color };
  } catch { return { blocks: [] }; }
}

// ═══ Render de bloques (pantalla — Tailwind) ══════════════════════════════════
function ProductCard({ p, c }: { p: Product; c: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="relative flex h-40 items-center justify-center bg-gray-50">
        {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Package className="h-7 w-7 text-gray-300" />}
        {p.badge && <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: c }}>{p.badge}</span>}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
          <span className="shrink-0 font-bold" style={{ color: c }}>{p.price}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{p.description}</p>
        <span className="mt-2 inline-block w-full rounded-lg py-2 text-center text-xs font-semibold text-white" style={{ backgroundColor: c }}>Comprar</span>
      </div>
    </div>
  );
}

function BlockView({ block, theme, products }: { block: Block; theme: Site['theme']; products: Product[] }) {
  const c = theme.color;
  const p = block.props;
  switch (block.type) {
    case 'navbar':
      return (
        <nav className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <span className="font-bold text-gray-900">{p.brand}</span>
          <div className="hidden items-center gap-5 text-sm text-gray-600 sm:flex">{splitCommas(p.links).map((l, i) => <span key={i}>{l}</span>)}</div>
          <span className="rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.ctaText}</span>
        </nav>
      );
    case 'hero':
      return (
        <header className="relative px-6 py-16 text-center" style={p.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `linear-gradient(135deg, ${c}12, transparent)` }}>
          <h1 className={`mx-auto max-w-2xl text-3xl font-extrabold leading-tight ${p.image ? 'text-white' : 'text-gray-900'}`}>{p.title}</h1>
          <p className={`mx-auto mt-3 max-w-xl ${p.image ? 'text-white/90' : 'text-gray-600'}`}>{p.subtitle}</p>
          <span className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow" style={{ backgroundColor: c }}>{p.ctaText}</span>
        </header>
      );
    case 'products':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          {products.length === 0 ? (
            <p className="text-center text-sm text-gray-400">Sube productos en la pestaña “Productos”.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((pr) => <ProductCard key={pr.id} p={pr} c={c} />)}</div>
          )}
        </section>
      );
    case 'product': {
      const prod = products.find((x) => x.id === p.productId) || products[0];
      if (!prod) return <section className="px-6 py-12 text-center text-sm text-gray-400">Selecciona un producto (sube productos primero).</section>;
      return (
        <section className="grid items-center gap-6 px-6 py-12 sm:grid-cols-2">
          <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-50">{prod.image ? <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" /> : <Package className="h-10 w-10 text-gray-300" />}</div>
          <div>
            {prod.badge && <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: c }}>{prod.badge}</span>}
            <h2 className="text-2xl font-bold text-gray-900">{prod.name}</h2>
            <p className="mt-1 text-xl font-bold" style={{ color: c }}>{prod.price}</p>
            <p className="mt-3 text-gray-600">{prod.description}</p>
            <span className="mt-5 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>Comprar ahora</span>
          </div>
        </section>
      );
    }
    case 'text':
      return (<section className="px-6 py-12">{p.heading && <h2 className="mb-3 text-2xl font-bold text-gray-900">{p.heading}</h2>}<p className="whitespace-pre-wrap leading-relaxed text-gray-600">{p.body}</p></section>);
    case 'features':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-5 sm:grid-cols-3">{(p.items || []).map((it: any, i: number) => (<div key={i} className="rounded-xl border border-gray-100 p-5 text-center"><div className="mx-auto mb-2 h-9 w-9 rounded-lg" style={{ backgroundColor: c + '22' }} /><h3 className="font-semibold text-gray-900">{it.a}</h3><p className="mt-1 text-sm text-gray-600">{it.b}</p></div>))}</div>
        </section>
      );
    case 'image':
      return (<section className="px-6 py-8">{p.url ? <img src={p.url} alt={p.caption || ''} className="mx-auto max-h-80 w-full rounded-xl object-cover" /> : <div className="flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">Imagen (añade una URL)</div>}{p.caption && <p className="mt-2 text-center text-xs text-gray-500">{p.caption}</p>}</section>);
    case 'gallery':
      return (<section className="grid grid-cols-3 gap-2 px-6 py-8">{(p.images || []).map((u: string, i: number) => (u ? <img key={i} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">+</div>))}</section>);
    case 'cta':
      return (<section className="px-6 py-14 text-center" style={{ backgroundColor: c + '10' }}><h2 className="text-2xl font-bold text-gray-900">{p.title}</h2><p className="mt-2 text-gray-600">{p.subtitle}</p><span className="mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.ctaText}</span></section>);
    case 'testimonials':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-4 sm:grid-cols-2">{(p.items || []).map((it: any, i: number) => (<figure key={i} className="rounded-xl border border-gray-100 p-5"><blockquote className="text-gray-700">“{it.b}”</blockquote><figcaption className="mt-2 text-sm font-semibold" style={{ color: c }}>{it.a}</figcaption></figure>))}</div>
        </section>
      );
    case 'pricing':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="grid gap-4 sm:grid-cols-3">{(p.items || []).map((it: any, i: number) => (<div key={i} className="rounded-xl border border-gray-100 p-5 text-center"><h3 className="font-bold text-gray-900">{it.a}</h3><p className="mt-1 text-sm text-gray-600">{it.b}</p><span className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: c }}>Elegir</span></div>))}</div>
        </section>
      );
    case 'faq':
      return (
        <section className="px-6 py-12">
          {p.heading && <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{p.heading}</h2>}
          <div className="mx-auto max-w-2xl space-y-3">{(p.items || []).map((it: any, i: number) => (<div key={i} className="rounded-lg border border-gray-100 p-4"><p className="font-semibold text-gray-900">{it.a}</p><p className="mt-1 text-sm text-gray-600">{it.b}</p></div>))}</div>
        </section>
      );
    case 'contact':
      return (
        <section className="px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{p.heading}</h2>
          <p className="mt-2 text-gray-600">{p.subtitle}</p>
          <div className="mx-auto mt-5 max-w-sm space-y-2">
            <div className="flex h-10 items-center rounded-lg border border-gray-200 px-3 text-xs text-gray-400">Nombre</div>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 px-3 text-xs text-gray-400">Email</div>
            <span className="inline-block w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: c }}>{p.buttonText}</span>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">{p.email ? `Los mensajes llegan a ${p.email}` : '⚠ Define el correo de destino en el panel para recibir los mensajes'}</p>
        </section>
      );
    case 'footer':
      return (<footer className="flex flex-col items-center gap-2 border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-500"><div className="flex flex-wrap justify-center gap-4">{splitCommas(p.links).map((l, i) => <span key={i}>{l}</span>)}</div><p>{p.text}</p></footer>);
    default:
      return null;
  }
}

// ═══ Export HTML ══════════════════════════════════════════════════════════════
function esc(s: any) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function btn(c: string, label: string) { return `<a href="#" style="display:inline-block;background:${c};color:#fff;padding:12px 22px;border-radius:10px;font-weight:600;text-decoration:none">${esc(label)}</a>`; }
function productCardHtml(p: Product, c: string) {
  return `<div style="border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="height:160px;background:#f7f7f7;display:flex;align-items:center;justify-content:center">${p.image ? `<img src="${esc(p.image)}" style="width:100%;height:100%;object-fit:cover"/>` : ''}</div><div style="padding:12px"><div style="display:flex;justify-content:space-between;gap:8px"><strong style="font-size:14px">${esc(p.name)}</strong><strong style="color:${c}">${esc(p.price)}</strong></div><p style="color:#777;font-size:12px;margin:4px 0">${esc(p.description)}</p><a href="#" style="display:block;text-align:center;background:${c};color:#fff;border-radius:10px;padding:8px;font-size:12px;font-weight:600;text-decoration:none">Comprar</a></div></div>`;
}
function blockToHtml(b: Block, c: string, products: Product[]): string {
  const p = b.props;
  switch (b.type) {
    case 'navbar': return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #eee"><strong>${esc(p.brand)}</strong><div style="display:flex;gap:20px;color:#555;font-size:14px">${splitCommas(p.links).map((l) => `<span>${esc(l)}</span>`).join('')}</div>${btn(c, p.ctaText)}</nav>`;
    case 'hero': return `<header style="padding:64px 24px;text-align:center;${p.image ? `background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url('${esc(p.image)}');background-size:cover;background-position:center;color:#fff` : `background:linear-gradient(135deg,${c}12,transparent)`}"><h1 style="font-size:34px;font-weight:800;max-width:640px;margin:0 auto;${p.image ? 'color:#fff' : 'color:#111'}">${esc(p.title)}</h1><p style="max-width:560px;margin:12px auto;${p.image ? 'color:#eee' : 'color:#555'}">${esc(p.subtitle)}</p><div style="margin-top:24px">${btn(c, p.ctaText)}</div></header>`;
    case 'products': return `<section style="padding:48px 24px;max-width:1040px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${products.map((pr) => productCardHtml(pr, c)).join('')}</div></section>`;
    case 'product': { const prod = products.find((x) => x.id === p.productId) || products[0]; if (!prod) return ''; return `<section style="padding:48px 24px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center"><div style="height:260px;background:#f7f7f7;border-radius:16px;overflow:hidden">${prod.image ? `<img src="${esc(prod.image)}" style="width:100%;height:100%;object-fit:cover"/>` : ''}</div><div><h2 style="font-size:24px;font-weight:700;color:#111">${esc(prod.name)}</h2><p style="font-size:20px;font-weight:700;color:${c}">${esc(prod.price)}</p><p style="color:#555;margin:12px 0">${esc(prod.description)}</p>${btn(c, 'Comprar ahora')}</div></section>`; }
    case 'text': return `<section style="padding:48px 24px;max-width:780px;margin:0 auto">${p.heading ? `<h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:12px">${esc(p.heading)}</h2>` : ''}<p style="color:#555;line-height:1.7;white-space:pre-wrap">${esc(p.body)}</p></section>`;
    case 'features': return `<section style="padding:48px 24px;max-width:980px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:12px;padding:20px;text-align:center"><div style="width:36px;height:36px;border-radius:10px;background:${c}22;margin:0 auto 8px"></div><h3 style="font-weight:600;color:#111">${esc(it.a)}</h3><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p></div>`).join('')}</div></section>`;
    case 'image': return `<section style="padding:32px 24px;max-width:900px;margin:0 auto;text-align:center">${p.url ? `<img src="${esc(p.url)}" alt="${esc(p.caption)}" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px"/>` : ''}${p.caption ? `<p style="color:#888;font-size:12px;margin-top:8px">${esc(p.caption)}</p>` : ''}</section>`;
    case 'gallery': return `<section style="padding:32px 24px;max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${(p.images || []).filter(Boolean).map((u: string) => `<img src="${esc(u)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"/>`).join('')}</section>`;
    case 'cta': return `<section style="padding:56px 24px;text-align:center;background:${c}10"><h2 style="font-size:24px;font-weight:700;color:#111">${esc(p.title)}</h2><p style="color:#555;margin-top:8px">${esc(p.subtitle)}</p><div style="margin-top:20px">${btn(c, p.ctaText)}</div></section>`;
    case 'testimonials': return `<section style="padding:48px 24px;max-width:900px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">${(p.items || []).map((it: any) => `<figure style="border:1px solid #eee;border-radius:12px;padding:20px;margin:0"><blockquote style="color:#444">“${esc(it.b)}”</blockquote><figcaption style="margin-top:8px;font-weight:600;color:${c}">${esc(it.a)}</figcaption></figure>`).join('')}</div></section>`;
    case 'pricing': return `<section style="padding:48px 24px;max-width:980px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:12px;padding:20px;text-align:center"><h3 style="font-weight:700;color:#111">${esc(it.a)}</h3><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p><div style="margin-top:16px">${btn(c, 'Elegir')}</div></div>`).join('')}</div></section>`;
    case 'faq': return `<section style="padding:48px 24px;max-width:720px;margin:0 auto">${p.heading ? `<h2 style="text-align:center;font-size:24px;font-weight:700;color:#111;margin-bottom:24px">${esc(p.heading)}</h2>` : ''}${(p.items || []).map((it: any) => `<div style="border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:12px"><p style="font-weight:600;color:#111">${esc(it.a)}</p><p style="color:#555;font-size:14px;margin-top:4px">${esc(it.b)}</p></div>`).join('')}</section>`;
    case 'contact': {
      const to = String(p.email || '').trim();
      const action = to ? ` action="mailto:${esc(to)}" method="post" enctype="text/plain"` : '';
      return `<section style="padding:48px 24px;text-align:center;max-width:420px;margin:0 auto"><h2 style="font-size:24px;font-weight:700;color:#111">${esc(p.heading)}</h2><p style="color:#555;margin-top:8px">${esc(p.subtitle)}</p><form${action} style="margin-top:20px;display:flex;flex-direction:column;gap:8px"><input name="Nombre" placeholder="Nombre" required style="height:40px;border:1px solid #ddd;border-radius:10px;padding:0 12px"/><input name="Email" type="email" placeholder="Email" required style="height:40px;border:1px solid #ddd;border-radius:10px;padding:0 12px"/><textarea name="Mensaje" placeholder="Mensaje" rows="3" style="border:1px solid #ddd;border-radius:10px;padding:8px 12px"></textarea><button type="submit" style="background:${c};color:#fff;padding:12px 22px;border:0;border-radius:10px;font-weight:600;cursor:pointer">${esc(p.buttonText)}</button></form></section>`;
    }
    case 'footer': return `<footer style="padding:32px 24px;text-align:center;border-top:1px solid #eee;color:#888;font-size:14px"><div style="display:flex;justify-content:center;gap:16px;margin-bottom:8px">${splitCommas(p.links).map((l) => `<span>${esc(l)}</span>`).join('')}</div><p>${esc(p.text)}</p></footer>`;
    default: return '';
  }
}
function pageToHtml(page: PageDef, theme: Site['theme'], products: Product[]): string {
  const body = page.blocks.map((b) => blockToHtml(b, theme.color, products)).join('\n');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(page.name)} · Cactus</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111}img{display:block}</style>
</head><body>
${body}
<!-- Generado con Opuntia · Cactus Comunidad Creativa -->
</body></html>`;
}
