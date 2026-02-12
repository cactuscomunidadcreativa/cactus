import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PresentationEditor } from '@/modules/pita/components/presentation-editor';

export default async function PitaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    redirect('/apps/pita');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch presentation (ownership enforced via created_by)
  const { data: presentation } = await supabase
    .from('pita_presentations')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (!presentation) {
    redirect('/apps/pita');
  }

  // Fetch sections
  const { data: sections } = await supabase
    .from('pita_sections')
    .select('*')
    .eq('presentation_id', id)
    .order('order_index', { ascending: true });

  return (
    <PresentationEditor
      presentation={{
        id: presentation.id,
        slug: presentation.slug,
        title: presentation.title,
        subtitle: presentation.subtitle,
        created_by: presentation.created_by,
        created_at: presentation.created_at,
        updated_at: presentation.updated_at,
        is_active: presentation.is_active,
        brand_config: presentation.brand_config,
      }}
      initialSections={(sections || []).map((s: any) => ({
        id: s.id,
        presentation_id: s.presentation_id,
        order_index: s.order_index,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        section_type: s.section_type,
        metadata: s.metadata,
      }))}
      userId={user.id}
    />
  );
}
