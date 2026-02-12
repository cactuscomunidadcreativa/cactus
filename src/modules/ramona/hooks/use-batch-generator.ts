'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BatchJob {
  id: string;
  brand_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  config: {
    count: number;
    platforms: string[];
    types: string[];
    themes?: string[];
  };
  progress: number;
  total: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface BatchConfig {
  count: number;
  platforms: string[];
  types: string[];
  themes?: string[];
}

interface UseBatchGeneratorReturn {
  isGenerating: boolean;
  currentJob: BatchJob | null;
  progress: number;
  total: number;
  error: string | null;
  startBatch: (brandId: string, config: BatchConfig) => Promise<void>;
  cancelBatch: () => void;
  recentJobs: BatchJob[];
  refreshJobs: (brandId: string) => Promise<void>;
}

export function useBatchGenerator(): UseBatchGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<BatchJob[]>([]);
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
      const response = await fetch(`/api/ramona/batch-generate?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      const job = data.job as BatchJob;

      setCurrentJob(job);
      setProgress(job.progress);
      setTotal(job.total);

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        setIsGenerating(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        if (job.status === 'failed') {
          setError(job.error_message || 'Generation failed');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, []);

  // Start batch generation
  const startBatch = useCallback(async (brandId: string, config: BatchConfig) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setTotal(config.count);

    try {
      const response = await fetch('/api/ramona/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, config }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start batch generation');
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

  // Cancel batch
  const cancelBatch = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGenerating(false);
    setCurrentJob(null);
  }, []);

  // Refresh recent jobs
  const refreshJobs = useCallback(async (brandId: string) => {
    try {
      const response = await fetch(`/api/ramona/batch-generate?brandId=${brandId}`);
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
    total,
    error,
    startBatch,
    cancelBatch,
    recentJobs,
    refreshJobs,
  };
}
