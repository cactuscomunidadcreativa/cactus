'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RMBrand, RMContent, RMUsage, ContentStatus, SocialPlatform, ContentType } from '../types';
import { getMonthKey } from '../lib/utils';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRamona(userId: string | null) {
  const [brands, setBrands] = useState<RMBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<RMBrand | null>(null);
  const [contents, setContents] = useState<RMContent[]>([]);
  const [usage, setUsage] = useState<RMUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Load brands — use functional update to avoid selectedBrand in deps
  const loadBrands = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: dbError } = await supabase
        .from('rm_brands')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (dbError) throw new Error(dbError.message);
      if (data) {
        setBrands(data);
        // Use functional update to avoid race condition
        setSelectedBrand((prev) => prev || (data.length > 0 ? data[0] : null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    }
  }, [userId]);

  // Load contents for selected brand
  const loadContents = useCallback(async () => {
    if (!selectedBrand) return;
    try {
      const { data, error: dbError } = await supabase
        .from('rm_contents')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .neq('status', 'archived')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (dbError) throw new Error(dbError.message);
      if (data) setContents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contents');
    }
  }, [selectedBrand]);

  // Load usage
  const loadUsage = useCallback(async () => {
    if (!userId || !selectedBrand) return;
    try {
      const month = getMonthKey();
      const { data } = await supabase
        .from('rm_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('brand_id', selectedBrand.id)
        .eq('month', month)
        .single();
      setUsage(data);
    } catch (err) {
      // No usage record is normal for new users
      setUsage(null);
    }
  }, [userId, selectedBrand]);

  useEffect(() => {
    setLoading(true);
    loadBrands().finally(() => setLoading(false));
  }, [loadBrands]);

  useEffect(() => {
    if (selectedBrand) {
      loadContents();
      loadUsage();
    }
  }, [selectedBrand, loadContents, loadUsage]);

  // Add content
  const addContent = useCallback(async (params: {
    body: string;
    platform: SocialPlatform;
    contentType: ContentType;
    hashtags?: string[];
    generationId?: string;
    status?: ContentStatus;
    scheduledAt?: string;
  }) => {
    if (!userId || !selectedBrand) return null;

    try {
      const { data, error: dbError } = await supabase
        .from('rm_contents')
        .insert({
          brand_id: selectedBrand.id,
          user_id: userId,
          body: params.body,
          platform: params.platform,
          content_type: params.contentType,
          hashtags: params.hashtags || [],
          generation_id: params.generationId || null,
          status: params.status || 'draft',
          scheduled_at: params.scheduledAt || null,
          sort_order: contents.length,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      if (data) {
        setContents((prev) => [data, ...prev]);
        // Update usage
        const month = getMonthKey();
        const { data: existing } = await supabase
          .from('rm_usage')
          .select('id, content_count')
          .eq('user_id', userId)
          .eq('brand_id', selectedBrand.id)
          .eq('month', month)
          .single();

        if (existing) {
          await supabase
            .from('rm_usage')
            .update({ content_count: existing.content_count + 1 })
            .eq('id', existing.id);
        } else {
          await supabase.from('rm_usage').insert({
            user_id: userId,
            brand_id: selectedBrand.id,
            month,
            content_count: 1,
            generation_count: 0,
          });
        }
        loadUsage();
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add content');
      return null;
    }
  }, [userId, selectedBrand, contents.length, loadUsage]);

  // Update content
  const updateContent = useCallback(async (updated: Partial<RMContent> & { id: string }) => {
    try {
      const { data, error: dbError } = await supabase
        .from('rm_contents')
        .update({
          ...updated,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updated.id)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      if (data) {
        setContents((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  }, []);

  // Delete content
  const deleteContent = useCallback(async (id: string) => {
    try {
      const { error: dbError } = await supabase.from('rm_contents').delete().eq('id', id);
      if (dbError) throw new Error(dbError.message);
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  }, []);

  // Change content status (for drag & drop)
  const changeStatus = useCallback(async (id: string, newStatus: ContentStatus) => {
    await updateContent({ id, status: newStatus });
  }, [updateContent]);

  // Update brand
  const updateBrand = useCallback(async (brandId: string, partial: Partial<RMBrand>) => {
    try {
      const { data, error: dbError } = await supabase
        .from('rm_brands')
        .update({
          ...partial,
          updated_at: new Date().toISOString(),
        })
        .eq('id', brandId)
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      if (data) {
        setBrands((prev) => prev.map((b) => (b.id === data.id ? data : b)));
        setSelectedBrand((prev) => (prev?.id === data.id ? data : prev));
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brand');
      return null;
    }
  }, []);

  return {
    brands,
    selectedBrand,
    setSelectedBrand,
    contents,
    usage,
    loading,
    error,
    clearError,
    loadBrands,
    loadContents,
    addContent,
    updateContent,
    updateBrand,
    deleteContent,
    changeStatus,
  };
}
