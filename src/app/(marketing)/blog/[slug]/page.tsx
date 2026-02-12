import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, Tag, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  // Fetch post
  const { data: post, error } = await supabase
    .from('cms_blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !post) {
    notFound();
  }

  // Increment views
  await supabase
    .from('cms_blog_posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', post.id);

  // Fetch related posts
  const { data: relatedPosts } = await supabase
    .from('cms_blog_posts')
    .select('id, slug, title, excerpt, cover_image, app_id, category, published_at')
    .eq('published', true)
    .neq('id', post.id)
    .limit(3)
    .order('published_at', { ascending: false });

  return (
    <div className="bg-background">
      {/* Back Link */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Blog
        </Link>
      </div>

      {/* Article */}
      <article className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {post.category && (
                  <span className="px-3 py-1 bg-cactus-green/10 text-cactus-green rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                )}
                {post.app_id && (
                  <span
                    className="px-3 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: APP_COLORS[post.app_id] }}
                  >
                    {APP_EMOJIS[post.app_id]} {post.app_id.toUpperCase()}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {post.author_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author_name}
                  </span>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {post.views > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views} lecturas
                  </span>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {post.cover_image && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {post.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: post.content
                      .replace(/\n/g, '<br />')
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                  }}
                />
              ) : (
                <p className="text-muted-foreground">Contenido próximamente...</p>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-display font-bold mb-8 text-center">
              Artículos Relacionados
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group block rounded-xl border bg-background overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {related.cover_image ? (
                      <img
                        src={related.cover_image}
                        alt={related.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {related.app_id ? APP_EMOJIS[related.app_id] : '📝'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-cactus-green transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
