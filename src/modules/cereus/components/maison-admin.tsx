'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MaisonConfig } from '@/modules/cereus/types';
import {
  Package, FileText, MessageCircle, Settings, BarChart3, Plus,
  Edit2, Trash2, Eye, EyeOff, Upload, Save, ChevronLeft, Search,
  Brain, Globe, Users, Layers, ShoppingBag,
} from 'lucide-react';

// ─── ADMIN LAYOUT ──────────────────────────────────────────

const ADMIN_NAV = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'pages', label: 'Paginas', icon: FileText },
  { id: 'chatbot', label: 'Chatbot IA', icon: Brain },
  { id: 'settings', label: 'Configuracion', icon: Settings },
];

export function MaisonAdmin({
  maisonId,
  maisonName,
  config,
}: {
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const accentColor = config.branding?.accent_color || '#C9A84C';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="font-display font-bold tracking-widest uppercase">{maisonName}</h1>
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {ADMIN_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                activeTab === id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" /> Ver tienda
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0a0a0a] text-white px-4 py-3 z-40 flex items-center gap-4 overflow-x-auto">
        {ADMIN_NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${
              activeTab === id ? 'bg-white/20 text-white' : 'text-white/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-12 lg:mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {activeTab === 'overview' && <AdminOverview maisonId={maisonId} maisonName={maisonName} accentColor={accentColor} />}
          {activeTab === 'products' && <ProductManager maisonId={maisonId} accentColor={accentColor} />}
          {activeTab === 'pages' && <PageEditor maisonId={maisonId} accentColor={accentColor} />}
          {activeTab === 'chatbot' && <ChatbotTrainer maisonId={maisonId} maisonName={maisonName} accentColor={accentColor} />}
          {activeTab === 'settings' && <AdminSettings maisonId={maisonId} config={config} accentColor={accentColor} />}
        </div>
      </main>
    </div>
  );
}

// ─── OVERVIEW ───────────────────────────────────────────────

function AdminOverview({ maisonId, maisonName, accentColor }: { maisonId: string; maisonName: string; accentColor: string }) {
  const [stats, setStats] = useState({ products: 0, categories: 0, knowledge: 0, conversations: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/cereus/store/products?maisonId=${maisonId}`).then(r => r.json()),
      fetch(`/api/cereus/store/categories?maisonId=${maisonId}`).then(r => r.json()),
      fetch(`/api/cereus/store/knowledge?maisonId=${maisonId}`).then(r => r.json()),
    ]).then(([prods, cats, knowledge]) => {
      setStats({
        products: prods.products?.length || 0,
        categories: cats.categories?.length || 0,
        knowledge: knowledge.knowledge?.length || 0,
        conversations: 0,
      });
    }).catch(() => {});
  }, [maisonId]);

  const cards = [
    { label: 'Productos', value: stats.products, icon: Package, color: accentColor },
    { label: 'Categorias', value: stats.categories, icon: Layers, color: '#3B82F6' },
    { label: 'Base de Conocimiento', value: stats.knowledge, icon: Brain, color: '#8B5CF6' },
    { label: 'Conversaciones', value: stats.conversations, icon: MessageCircle, color: '#10B981' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-1">{maisonName}</h2>
      <p className="text-sm text-gray-500 mb-8">Panel de administracion</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '15' }}>
                <c.icon className="w-4.5 h-4.5" style={{ color: c.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="w-5 h-5" style={{ color: accentColor }} />
            <span className="text-xs font-medium">Nuevo Producto</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-medium">Subir Catalogo</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-medium">Entrenar Chatbot</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Globe className="w-5 h-5 text-green-500" />
            <span className="text-xs font-medium">Ver Tienda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT MANAGER ────────────────────────────────────────

function ProductManager({ maisonId, accentColor }: { maisonId: string; accentColor: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', price: '', description: '', badge: '', images: '[]',
    is_featured: false, is_active: true, stock: '0',
  });

  useEffect(() => {
    loadProducts();
  }, [maisonId]);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch(`/api/cereus/store/products?maisonId=${maisonId}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  async function handleSave() {
    const payload = {
      ...editingProduct ? { id: editingProduct.id } : { maisonId },
      name: form.name,
      price: parseFloat(form.price) || 0,
      description: form.description,
      badge: form.badge || null,
      images: JSON.parse(form.images || '[]'),
      is_featured: form.is_featured,
      is_active: form.is_active,
      stock: parseInt(form.stock) || 0,
    };

    const method = editingProduct ? 'PUT' : 'POST';
    await fetch('/api/cereus/store/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowForm(false);
    setEditingProduct(null);
    setForm({ name: '', price: '', description: '', badge: '', images: '[]', is_featured: false, is_active: true, stock: '0' });
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este producto?')) return;
    await fetch(`/api/cereus/store/products?id=${id}`, { method: 'DELETE' });
    loadProducts();
  }

  function startEdit(p: any) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description || '',
      badge: p.badge || '',
      images: JSON.stringify(p.images || []),
      is_featured: p.is_featured,
      is_active: p.is_active,
      stock: String(p.stock || 0),
    });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Productos</h2>
          <p className="text-sm text-gray-500">{products.length} productos en catalogo</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingProduct(null); setForm({ name: '', price: '', description: '', badge: '', images: '[]', is_featured: false, is_active: true, stock: '0' }); }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-medium mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Vestido Positano" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio (S/)</label>
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                type="number" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="790" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Descripcion del producto..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Badge</label>
              <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Sin badge</option>
                <option value="New">New</option>
                <option value="Sale">Sale</option>
                <option value="Best Seller">Best Seller</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
              <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                type="number" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URLs de Imagenes (JSON array)</label>
              <input value={form.images} onChange={e => setForm({ ...form, images: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder='[{"url":"https://...","alt":"Foto 1"}]' />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                Destacado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Activo
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg" style={{ backgroundColor: accentColor }}>
              <Save className="w-4 h-4" /> {editingProduct ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingProduct(null); }}
              className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Sin productos aun</p>
          <p className="text-sm text-gray-500 mt-1">Agrega tu primer producto para comenzar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0]?.url && (
                        <img src={p.images[0].url} className="w-10 h-10 rounded object-cover" alt="" />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.badge && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded">{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">S/{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{p.stock}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PAGE EDITOR ────────────────────────────────────────────

function PageEditor({ maisonId, accentColor }: { maisonId: string; accentColor: string }) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', sections: '[]' });

  useEffect(() => {
    fetch(`/api/cereus/store/pages?maisonId=${maisonId}`)
      .then(r => r.json())
      .then(d => { setPages(d.pages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [maisonId]);

  async function handleSave() {
    await fetch('/api/cereus/store/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maisonId,
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
        sections: JSON.parse(form.sections || '[]'),
      }),
    });
    setShowForm(false);
    const res = await fetch(`/api/cereus/store/pages?maisonId=${maisonId}`);
    const data = await res.json();
    setPages(data.pages || []);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Paginas</h2>
          <p className="text-sm text-gray-500">Administra el contenido de tu tienda</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4" /> Nueva Pagina
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-medium mb-4">Nueva Pagina</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Titulo de la pagina" />
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="URL slug (ej: about)" />
            <textarea value={form.sections} onChange={e => setForm({ ...form, sections: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={6} placeholder="Secciones JSON" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg" style={{ backgroundColor: accentColor }}>
              <Save className="w-4 h-4" /> Crear
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Sin paginas personalizadas</p>
          <p className="text-sm text-gray-500 mt-1">La tienda usa la landing por defecto. Crea paginas para personalizar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-gray-500">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.is_published ? 'Publicada' : 'Borrador'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CHATBOT TRAINER ────────────────────────────────────────

function ChatbotTrainer({ maisonId, maisonName, accentColor }: { maisonId: string; maisonName: string; accentColor: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', source: 'manual' });

  useEffect(() => {
    loadKnowledge();
  }, [maisonId]);

  async function loadKnowledge() {
    setLoading(true);
    const res = await fetch(`/api/cereus/store/knowledge?maisonId=${maisonId}`);
    const data = await res.json();
    setEntries(data.knowledge || []);
    setTotalTokens(data.totalTokens || 0);
    setLoading(false);
  }

  async function handleSave() {
    await fetch('/api/cereus/store/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maisonId, ...form }),
    });
    setShowForm(false);
    setForm({ title: '', content: '', category: 'general', source: 'manual' });
    loadKnowledge();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta entrada?')) return;
    await fetch(`/api/cereus/store/knowledge?id=${id}`, { method: 'DELETE' });
    loadKnowledge();
  }

  const categories = [
    { value: 'brand', label: 'Marca' },
    { value: 'products', label: 'Productos' },
    { value: 'shipping', label: 'Envios' },
    { value: 'returns', label: 'Cambios y Devoluciones' },
    { value: 'faq', label: 'Preguntas Frecuentes' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Chatbot IA</h2>
          <p className="text-sm text-gray-500">
            Base de conocimiento: {entries.length} entradas ({totalTokens.toLocaleString()} tokens estimados)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4" /> Agregar Conocimiento
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900">Entrenamiento de Ramona</p>
            <p className="text-xs text-purple-700 mt-1">
              Todo lo que agregues aqui sera usado por Ramona para responder a las clientas de {maisonName}.
              Incluye informacion sobre productos, politicas de envio, tallas, historia de marca, etc.
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-medium mb-4">Nueva Entrada de Conocimiento</h3>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Titulo (ej: Politica de envios)" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" rows={8}
              placeholder="Escribe aqui toda la informacion que Ramona debe saber sobre este tema..." />
            <p className="text-xs text-gray-400">
              ~{Math.ceil((form.content?.length || 0) / 4)} tokens estimados
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg" style={{ backgroundColor: accentColor }}>
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Sin conocimiento aun</p>
          <p className="text-sm text-gray-500 mt-1">Agrega informacion para que Ramona pueda ayudar a tus clientas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e: any) => (
            <div key={e.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {categories.find(c => c.value === e.category)?.label || e.category}
                    </span>
                    <span className="text-xs text-gray-400">{e.tokens_estimate} tokens</span>
                  </div>
                  <h4 className="font-medium text-sm">{e.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.content}</p>
                </div>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ───────────────────────────────────────────────

function AdminSettings({ maisonId, config, accentColor }: { maisonId: string; config: MaisonConfig; accentColor: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [openaiKey, setOpenaiKey] = useState((config as any)?.api_keys?.openai || '');
  const [showKey, setShowKey] = useState(false);

  async function saveConfig(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      const currentConfig = { ...config, ...updates };
      await fetch('/api/cereus/maison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maisonId, config: currentConfig }),
      });
      setSaved('Guardado');
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setSaved('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-6">Configuracion</h2>

      <div className="space-y-6">
        {/* API Keys */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">API Keys</h3>
              <p className="text-xs text-gray-500">Conecta servicios de IA para generacion de bocetos, chatbot inteligente y mas.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">OpenAI API Key</label>
              <p className="text-xs text-gray-400 mb-2">Necesaria para: Generar bocetos con DALL-E, chatbot inteligente con GPT-4, AI Brief de colecciones, recomendaciones de estilo.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono pr-20"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <button
                  onClick={() => saveConfig({ api_keys: { openai: openaiKey } })}
                  disabled={saving}
                  className="px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
              {openaiKey && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${openaiKey.startsWith('sk-') ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs text-gray-500">
                    {openaiKey.startsWith('sk-') ? 'Key configurada correctamente' : 'El formato de la key no parece correcto'}
                  </span>
                </div>
              )}
              {!openaiKey && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-400">Sin configurar — las funciones de IA usaran fallbacks basicos</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Funciones que se activan con OpenAI:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Generacion de bocetos con DALL-E 3 (Design Studio)
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Chatbot inteligente Ramona (respuestas contextuales con GPT-4)
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                  AI Brief para colecciones (inspiracion + mood board)
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Perfiles emocionales por foto (analisis de estilo)
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Recomendaciones de estilo personalizadas (Advisor)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium mb-4">Branding</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de Maison</label>
              <input defaultValue={config.maison_name} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
              <input defaultValue={config.maison_tagline} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color Primario</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={config.branding?.primary_color} className="w-10 h-10 rounded cursor-pointer" />
                <input defaultValue={config.branding?.primary_color} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color Accent</label>
              <div className="flex gap-2">
                <input type="color" defaultValue={config.branding?.accent_color} className="w-10 h-10 rounded cursor-pointer" />
                <input defaultValue={config.branding?.accent_color} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Domain */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium mb-4">Dominio Custom</h3>
          <p className="text-sm text-gray-500 mb-3">
            Conecta tu dominio propio para una experiencia white-label completa.
          </p>
          <div className="flex gap-2">
            <input placeholder="tudominio.com" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button className="px-4 py-2 text-white text-sm rounded-lg" style={{ backgroundColor: accentColor }}>
              Conectar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Despues de conectar, configura un CNAME apuntando a cname.vercel-dns.com
          </p>
        </div>

        {/* Chatbot */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium mb-4">Chatbot</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Chatbot</label>
              <input defaultValue={config.chatbot?.name || 'Ramona'} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje de Bienvenida</label>
              <input defaultValue={config.chatbot?.greeting} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {saved && (
          <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg">
            {saved}
          </div>
        )}
      </div>
    </div>
  );
}
