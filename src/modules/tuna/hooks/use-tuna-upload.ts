'use client';

import { useState, useCallback } from 'react';
import type { DataType, UploadStatus } from '../types';

interface UploadResult {
  success: boolean;
  fileType: string;
  summary: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
  };
  errors: { row?: number; column?: string; message: string }[];
  warnings: { row?: number; column?: string; message: string }[];
  uploadId?: string;
  preview?: Record<string, unknown>[];
}

interface UseUploadState {
  isUploading: boolean;
  progress: number;
  result: UploadResult | null;
  error: string | null;
}

export function useTunaUpload(campaignId?: string) {
  const [state, setState] = useState<UseUploadState>({
    isUploading: false,
    progress: 0,
    result: null,
    error: null,
  });

  const uploadFile = useCallback(
    async (file: File, dataType: DataType): Promise<UploadResult> => {
      setState({ isUploading: true, progress: 10, result: null, error: null });

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', dataType);
        if (campaignId) {
          formData.append('campaignId', campaignId);
        }

        setState((prev) => ({ ...prev, progress: 30 }));

        const response = await fetch('/api/tuna/upload', {
          method: 'POST',
          body: formData,
        });

        setState((prev) => ({ ...prev, progress: 70 }));

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al subir archivo');
        }

        setState({
          isUploading: false,
          progress: 100,
          result: data,
          error: null,
        });

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setState({
          isUploading: false,
          progress: 0,
          result: null,
          error: errorMessage,
        });
        throw error;
      }
    },
    [campaignId]
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    reset,
  };
}

// Hook para gestionar múltiples uploads
export function useTunaMultiUpload(campaignId?: string) {
  const [uploads, setUploads] = useState<
    Record<DataType, { status: UploadStatus; result?: UploadResult; error?: string }>
  >({
    presupuesto: { status: 'pending' },
    gastos_op: { status: 'pending' },
    produccion: { status: 'pending' },
    ventas: { status: 'pending' },
  });

  const uploadFile = useCallback(
    async (file: File, dataType: DataType): Promise<UploadResult> => {
      setUploads((prev) => ({
        ...prev,
        [dataType]: { status: 'processing' },
      }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', dataType);
        if (campaignId) {
          formData.append('campaignId', campaignId);
        }

        const response = await fetch('/api/tuna/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al subir archivo');
        }

        setUploads((prev) => ({
          ...prev,
          [dataType]: { status: 'completed', result: data },
        }));

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setUploads((prev) => ({
          ...prev,
          [dataType]: { status: 'failed', error: errorMessage },
        }));
        throw error;
      }
    },
    [campaignId]
  );

  const getCompletedCount = useCallback(() => {
    return Object.values(uploads).filter((u) => u.status === 'completed').length;
  }, [uploads]);

  const isAllCompleted = useCallback(() => {
    return Object.values(uploads).every((u) => u.status === 'completed');
  }, [uploads]);

  const reset = useCallback(() => {
    setUploads({
      presupuesto: { status: 'pending' },
      gastos_op: { status: 'pending' },
      produccion: { status: 'pending' },
      ventas: { status: 'pending' },
    });
  }, []);

  return {
    uploads,
    uploadFile,
    getCompletedCount,
    isAllCompleted,
    reset,
  };
}
