'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Campaign, CampaignSeason } from '../types';

interface UseCampaignsReturn {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  createCampaign: (data: CreateCampaignData) => Promise<Campaign>;
  setActiveCampaign: (campaign: Campaign) => void;
  refreshCampaigns: () => Promise<void>;
}

interface CreateCampaignData {
  name?: string;
  season: CampaignSeason;
  year: number;
  exchangeRate?: number;
}

export function useCampaigns(): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaignState] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCampaigns = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      setError('Error de conexión');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('tuna_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedCampaigns: Campaign[] = (data || []).map((c) => ({
        id: c.id,
        season: c.season as CampaignSeason,
        year: c.year,
        name: c.name,
        startDate: new Date(c.start_date),
        endDate: new Date(c.end_date),
        status: c.status,
        totalBudget: parseFloat(c.total_budget) || 0,
        totalActual: parseFloat(c.total_actual) || 0,
        exchangeRate: parseFloat(c.exchange_rate) || 3.8,
        createdAt: new Date(c.created_at),
        closedAt: c.closed_at ? new Date(c.closed_at) : undefined,
      }));

      setCampaigns(mappedCampaigns);

      // Set active campaign (most recent active, or first one)
      const active = mappedCampaigns.find((c) => c.status === 'active') || mappedCampaigns[0];
      if (active && !activeCampaign) {
        setActiveCampaignState(active);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, activeCampaign]);

  const createCampaign = useCallback(
    async (data: CreateCampaignData): Promise<Campaign> => {
      if (!supabase) {
        throw new Error('Error de conexión');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No autenticado');
      }

      // Calculate dates based on season
      const startMonth = data.season === 'invierno' ? 6 : 0; // July or January
      const endMonth = data.season === 'invierno' ? 11 : 5; // December or June

      const startDate = new Date(data.year, startMonth, 1);
      const endDate = new Date(data.year, endMonth + 1, 0); // Last day of month

      const name = data.name || `${data.season === 'invierno' ? 'Invierno' : 'Verano'} ${data.year}`;

      const { data: newCampaign, error: createError } = await supabase
        .from('tuna_campaigns')
        .insert({
          user_id: user.id,
          name,
          season: data.season,
          year: data.year,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          exchange_rate: data.exchangeRate || 3.8,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      const campaign: Campaign = {
        id: newCampaign.id,
        season: newCampaign.season as CampaignSeason,
        year: newCampaign.year,
        name: newCampaign.name,
        startDate: new Date(newCampaign.start_date),
        endDate: new Date(newCampaign.end_date),
        status: newCampaign.status,
        totalBudget: parseFloat(newCampaign.total_budget) || 0,
        totalActual: parseFloat(newCampaign.total_actual) || 0,
        exchangeRate: parseFloat(newCampaign.exchange_rate) || 3.8,
        createdAt: new Date(newCampaign.created_at),
      };

      setCampaigns((prev) => [campaign, ...prev]);
      setActiveCampaignState(campaign);

      return campaign;
    },
    [supabase]
  );

  const setActiveCampaign = useCallback((campaign: Campaign) => {
    setActiveCampaignState(campaign);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    activeCampaign,
    isLoading,
    error,
    createCampaign,
    setActiveCampaign,
    refreshCampaigns: fetchCampaigns,
  };
}

// Hook to get or create a default campaign
export function useDefaultCampaign() {
  const { campaigns, activeCampaign, createCampaign, isLoading } = useCampaigns();
  const [isCreating, setIsCreating] = useState(false);

  const getOrCreateCampaign = useCallback(async (): Promise<Campaign> => {
    if (activeCampaign) {
      return activeCampaign;
    }

    if (campaigns.length > 0) {
      return campaigns[0];
    }

    // Create a default campaign
    setIsCreating(true);
    try {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      // Determine season based on current month
      const season: CampaignSeason = month >= 6 ? 'invierno' : 'verano';

      return await createCampaign({ season, year });
    } finally {
      setIsCreating(false);
    }
  }, [activeCampaign, campaigns, createCampaign]);

  return {
    campaign: activeCampaign,
    isLoading: isLoading || isCreating,
    getOrCreateCampaign,
  };
}
