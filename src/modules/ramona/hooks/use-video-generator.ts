'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface VideoJob {
  id: string;
  brand_id: string;
  script: string;
  video_type: 'text-to-video' | 'avatar' | 'faceless' | 'carousel';
  style: {
    template?: string;
    colors?: string[];
    font?: string;
    transitions?: string[];
    aspectRatio?: string;
  };
  status: 'pending' | 'processing' | 'rendering' | 'completed' | 'failed';
  progress: number;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  config: {
    duration: number;
    aspectRatio: string;
    transitions: string[];
    style: string;
  };
  is_premium: boolean;
}

interface VideoConfig {
  brandId: string;
  script: string;
  videoType: VideoJob['video_type'];
  style: VideoJob['style'];
  contentId?: string;
}

interface UseVideoGeneratorReturn {
  // Generation state
  isGenerating: boolean;
  currentJob: VideoJob | null;
  progress: number;
  error: string | null;

  // Actions
  generateVideo: (config: VideoConfig) => Promise<void>;
  cancelGeneration: () => void;

  // Templates
  templates: VideoTemplate[];
  loadingTemplates: boolean;
  fetchTemplates: (category?: string) => Promise<void>;

  // History
  recentJobs: VideoJob[];
  refreshJobs: (brandId: string) => Promise<void>;
}

export function useVideoGenerator(): UseVideoGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [recentJobs, setRecentJobs] = useState<VideoJob[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/ramona/video/status?jobId=${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch job status');

      const data = await response.json();
      const job = data.job as VideoJob;

      setCurrentJob(job);
      setProgress(job.progress);

      if (job.status === 'completed' || job.status === 'failed') {
        setIsGenerating(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        if (job.status === 'failed') {
          setError(job.error_message || 'Video generation failed');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, []);

  // Generate video
  const generateVideo = useCallback(async (config: VideoConfig) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setCurrentJob(null);

    try {
      const response = await fetch('/api/ramona/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start video generation');
      }

      const data = await response.json();
      const jobId = data.jobId;

      // Start polling
      pollJobStatus(jobId);
      pollingRef.current = setInterval(() => pollJobStatus(jobId), 2000);

    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [pollJobStatus]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGenerating(false);
    setCurrentJob(null);
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async (category?: string) => {
    setLoadingTemplates(true);
    try {
      const url = category
        ? `/api/ramona/video/generate?category=${category}`
        : '/api/ramona/video/generate';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
    setLoadingTemplates(false);
  }, []);

  // Refresh recent jobs
  const refreshJobs = useCallback(async (brandId: string) => {
    try {
      const response = await fetch(`/api/ramona/video/status?brandId=${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setRecentJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent jobs:', err);
    }
  }, []);

  return {
    isGenerating,
    currentJob,
    progress,
    error,
    generateVideo,
    cancelGeneration,
    templates,
    loadingTemplates,
    fetchTemplates,
    recentJobs,
    refreshJobs,
  };
}
