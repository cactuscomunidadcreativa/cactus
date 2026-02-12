'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  Trophy,
  Mail,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  Star,
  Check,
  Archive,
} from 'lucide-react';

type CMSTab = 'blog' | 'contact' | 'cases' | 'newsletter';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  category?: string;
  tags: string[];
  app_id?: string;
  featured: boolean;
  published: boolean;
  published_at?: string;
  views: number;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
  app_interest?: string;
  status: string;
  created_at: string;
}

interface SuccessCase {
  id: string;
  title: string;
  company?: string;
  industry?: string;
  description?: string;
  metrics: any[];
  quote?: string;
  author_name?: string;
  author_role?: string;
  app_id?: string;
  featured: boolean;
  display_order: number;
  active: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  interests: string[];
  source: string;
  unsubscribed: boolean;
  created_at: string;
}

export function CMSAdmin() {
  const [activeTab, setActiveTab] = useState<CMSTab>('blog');
  const [loading, setLoading] = useState(false);

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showPostEditor, setShowPostEditor] = useState(false);

  // Contact state
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [contactFilter, setContactFilter] = useState<string>('new');

  // Cases state
  const [cases, setCases] = useState<SuccessCase[]>([]);
  const [editingCase, setEditingCase] = useState<SuccessCase | null>(null);
  const [showCaseEditor, setShowCaseEditor] = useState(false);

  // Newsletter state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const tabs = [
    { id: 'blog', icon: FileText, label: 'Blog' },
    { id: 'contact', icon: MessageSquare, label: 'Contacto' },
    { id: 'cases', icon: Trophy, label: 'Casos de Éxito' },
    { id: 'newsletter', icon: Mail, label: 'Newsletter' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, contactFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'blog':
          const blogRes = await fetch('/api/cms/blog?limit=50');
          const blogData = await blogRes.json();
          setPosts(blogData.posts || []);
          break;
        case 'contact':
          const contactRes = await fetch(`/api/cms/contact?status=${contactFilter}`);
          const contactData = await contactRes.json();
          setSubmissions(contactData.submissions || []);
          break;
        case 'cases':
          const casesRes = await fetch('/api/cms/success-cases?limit=50');
          const casesData = await casesRes.json();
          setCases(casesData.cases || []);
          break;
        case 'newsletter':
          const newsRes = await fetch('/api/cms/newsletter');
          const newsData = await newsRes.json();
          setSubscribers(newsData.subscribers || []);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Blog functions
  const savePost = async (post: Partial<BlogPost>) => {
    const method = post.id ? 'PUT' : 'POST';
    const res = await fetch('/api/cms/blog', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (res.ok) {
      setShowPostEditor(false);
      setEditingPost(null);
      loadData();
    }
  };

  const togglePostPublished = async (post: BlogPost) => {
    await fetch('/api/cms/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, published: !post.published }),
    });
    loadData();
  };

  const deletePost = async (id: string) => {
    if (!confirm('¿Eliminar este post?')) return;
    await fetch(`/api/cms/blog?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  // Contact functions
  const updateContactStatus = async (id: string, status: string) => {
    await fetch('/api/cms/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  };

  // Cases functions
  const saveCase = async (caseData: Partial<SuccessCase>) => {
    const method = caseData.id ? 'PUT' : 'POST';
    const res = await fetch('/api/cms/success-cases', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (res.ok) {
      setShowCaseEditor(false);
      setEditingCase(null);
      loadData();
    }
  };

  const deleteCase = async (id: string) => {
    if (!confirm('¿Eliminar este caso?')) return;
    await fetch(`/api/cms/success-cases?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CMSTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Blog Tab */}
          {activeTab === 'blog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Posts del Blog</h3>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setShowPostEditor(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Post
                </button>
              </div>

              {showPostEditor && (
                <PostEditor
                  post={editingPost}
                  onSave={savePost}
                  onCancel={() => {
                    setShowPostEditor(false);
                    setEditingPost(null);
                  }}
                />
              )}

              <div className="border rounded-lg divide-y">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay posts aún
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.title}</span>
                          {post.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {!post.published && (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                              Borrador
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {post.category && <span className="mr-2">{post.category}</span>}
                          {post.views > 0 && <span>{post.views} vistas</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePostPublished(post)}
                          className="p-2 hover:bg-muted rounded"
                          title={post.published ? 'Despublicar' : 'Publicar'}
                        >
                          {post.published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setShowPostEditor(true);
                          }}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 hover:bg-muted rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {['new', 'read', 'replied', 'archived'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setContactFilter(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      contactFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {status === 'new' && 'Nuevos'}
                    {status === 'read' && 'Leídos'}
                    {status === 'replied' && 'Respondidos'}
                    {status === 'archived' && 'Archivados'}
                  </button>
                ))}
              </div>

              <div className="border rounded-lg divide-y">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay mensajes {contactFilter === 'new' ? 'nuevos' : ''}
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div key={sub.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{sub.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sub.email} {sub.company && `• ${sub.company}`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {sub.subject && (
                        <div className="text-sm font-medium">{sub.subject}</div>
                      )}
                      <div className="text-sm">{sub.message}</div>
                      <div className="flex items-center gap-2 pt-2">
                        {sub.status === 'new' && (
                          <button
                            onClick={() => updateContactStatus(sub.id, 'read')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded"
                          >
                            <Check className="w-3 h-3" /> Marcar leído
                          </button>
                        )}
                        {sub.status !== 'replied' && (
                          <button
                            onClick={() => updateContactStatus(sub.id, 'replied')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                          >
                            <Check className="w-3 h-3" /> Marcar respondido
                          </button>
                        )}
                        {sub.status !== 'archived' && (
                          <button
                            onClick={() => updateContactStatus(sub.id, 'archived')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded"
                          >
                            <Archive className="w-3 h-3" /> Archivar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Cases Tab */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Casos de Éxito</h3>
                <button
                  onClick={() => {
                    setEditingCase(null);
                    setShowCaseEditor(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Caso
                </button>
              </div>

              {showCaseEditor && (
                <CaseEditor
                  caseData={editingCase}
                  onSave={saveCase}
                  onCancel={() => {
                    setShowCaseEditor(false);
                    setEditingCase(null);
                  }}
                />
              )}

              <div className="border rounded-lg divide-y">
                {cases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay casos de éxito aún
                  </div>
                ) : (
                  cases.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.title}</span>
                          {c.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {c.company} {c.industry && `• ${c.industry}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCase(c);
                            setShowCaseEditor(true);
                          }}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCase(c.id)}
                          className="p-2 hover:bg-muted rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Newsletter Tab */}
          {activeTab === 'newsletter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Suscriptores ({subscribers.length})</h3>
              </div>

              <div className="border rounded-lg divide-y">
                {subscribers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay suscriptores aún
                  </div>
                ) : (
                  subscribers.map((sub) => (
                    <div key={sub.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{sub.email}</div>
                        {sub.name && (
                          <div className="text-sm text-muted-foreground">{sub.name}</div>
                        )}
                        {sub.interests.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {sub.interests.map((i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-muted text-xs rounded"
                              >
                                {i}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Post Editor Component
function PostEditor({
  post,
  onSave,
  onCancel,
}: {
  post: BlogPost | null;
  onSave: (post: Partial<BlogPost>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    id: post?.id || '',
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    category: post?.category || '',
    tags: post?.tags?.join(', ') || '',
    app_id: post?.app_id || '',
    featured: post?.featured || false,
    published: post?.published || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="auto-generado si vacío"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Extracto</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contenido (Markdown)</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
            rows={8}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Sin categoría</option>
              <option value="noticias">Noticias</option>
              <option value="tutoriales">Tutoriales</option>
              <option value="casos">Casos de Uso</option>
              <option value="comunidad">Comunidad</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">App relacionada</label>
            <select
              value={form.app_id}
              onChange={(e) => setForm({ ...form, app_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Ninguna</option>
              <option value="ramona">RAMONA</option>
              <option value="tuna">TUNA</option>
              <option value="agave">AGAVE</option>
              <option value="saguaro">SAGUARO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (separados por coma)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span className="text-sm">Destacado</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            <span className="text-sm">Publicado</span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// Case Editor Component
function CaseEditor({
  caseData,
  onSave,
  onCancel,
}: {
  caseData: SuccessCase | null;
  onSave: (caseData: Partial<SuccessCase>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    id: caseData?.id || '',
    title: caseData?.title || '',
    company: caseData?.company || '',
    industry: caseData?.industry || '',
    description: caseData?.description || '',
    quote: caseData?.quote || '',
    author_name: caseData?.author_name || '',
    author_role: caseData?.author_role || '',
    app_id: caseData?.app_id || '',
    featured: caseData?.featured || false,
    display_order: caseData?.display_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Empresa</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Industria</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">App relacionada</label>
            <select
              value={form.app_id}
              onChange={(e) => setForm({ ...form, app_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Ninguna</option>
              <option value="ramona">RAMONA</option>
              <option value="tuna">TUNA</option>
              <option value="agave">AGAVE</option>
              <option value="saguaro">SAGUARO</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cita / Testimonial</label>
          <textarea
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del autor</label>
            <input
              type="text"
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol del autor</label>
            <input
              type="text"
              value={form.author_role}
              onChange={(e) => setForm({ ...form, author_role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span className="text-sm">Destacado</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm">Orden:</span>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              className="w-20 px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
