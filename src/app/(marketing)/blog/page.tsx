'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Eye, Loader2 } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover_image?: string;
  author_name?: string;
  category?: string;
  tags: string[];
  app_id?: string;
  featured: boolean;
  published_at?: string;
  views: number;
}

const APP_COLORS: Record<string, string> = {
  ramona: '#9A4E9A',
  tuna: '#0891B2',
  agave: '#16A34A',
  saguaro: '#059669',
};

const APP_EMOJIS: Record<string, string> = {
  ramona: '🎨',
  tuna: '🐟',
  agave: '🌵',
  saguaro: '🌿',
};

const CATEGORIES = [
  { id: '', label: 'Todos' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'tutoriales', label: 'Tutoriales' },
  { id: 'casos', label: 'Casos de Uso' },
  { id: 'comunidad', label: 'Comunidad' },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadPosts();
  }, [category]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const url = category
        ? `/api/cms/blog?category=${category}&limit=20`
        : '/api/cms/blog?limit=20';
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured || posts.indexOf(p) > 0);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-cactus-green/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Noticias, tutoriales y casos de éxito de nuestra comunidad creativa.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-cactus-green text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-4 block">📝</span>
              <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
              <p className="text-muted-foreground">
                Estamos preparando contenido increíble para ti. ¡Vuelve pronto!
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="block mb-12 group"
                >
                  <div className="grid md:grid-cols-2 gap-8 items-center rounded-2xl border p-6 hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                      {featuredPost.cover_image ? (
                        <img
                          src={featuredPost.cover_image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-6xl">
                          {featuredPost.app_id
                            ? APP_EMOJIS[featuredPost.app_id]
                            : '📝'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {featuredPost.category && (
                          <span className="px-3 py-1 bg-cactus-green/10 text-cactus-green rounded-full text-xs font-medium">
                            {featuredPost.category}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Destacado
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 group-hover:text-cactus-green transition-colors">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {featuredPost.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(featuredPost.published_at).toLocaleDateString('es')}
                          </span>
                        )}
                        {featuredPost.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredPost.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Regular Posts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">
                          {post.app_id ? APP_EMOJIS[post.app_id] : '📝'}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {post.category && (
                          <span className="px-2 py-0.5 bg-muted text-xs rounded-full">
                            {post.category}
                          </span>
                        )}
                        {post.app_id && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: APP_COLORS[post.app_id] }}
                          >
                            {post.app_id.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-cactus-green transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {post.published_at && (
                          <span>
                            {new Date(post.published_at).toLocaleDateString('es')}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-cactus-green group-hover:gap-2 transition-all">
                          Leer más <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-cactus-green/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold mb-2">
            Suscríbete a nuestro newsletter
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Recibe las últimas noticias, tutoriales y consejos directamente en tu correo.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              try {
                await fetch('/api/cms/newsletter', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, source: 'blog' }),
                });
                alert('¡Gracias por suscribirte!');
                form.reset();
              } catch (error) {
                alert('Error al suscribirse');
              }
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              required
              className="flex-1 px-4 py-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-cactus-green text-white rounded-lg text-sm font-medium hover:bg-cactus-green/90 transition-colors"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
