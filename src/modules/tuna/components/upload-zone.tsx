'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { TunaAvatar } from './tuna-avatar';
import type { DataType, UploadStatus } from '../types';

interface UploadZoneProps {
  dataType: DataType;
  onUpload: (file: File) => Promise<void>;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

interface FilePreview {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const dataTypeLabels: Record<DataType, { title: string; description: string; icon: string }> = {
  presupuesto: {
    title: 'Presupuesto',
    description: 'Carga el presupuesto de la campaña',
    icon: '💰',
  },
  gastos_op: {
    title: 'Gastos por OP',
    description: 'Carga el reporte de gastos por Orden de Producción',
    icon: '📊',
  },
  produccion: {
    title: 'Producción',
    description: 'Carga los datos de producción real',
    icon: '🌾',
  },
  ventas: {
    title: 'Ventas',
    description: 'Carga los datos de ventas y lotes de exportación',
    icon: '📈',
  },
};

export function UploadZone({
  dataType,
  onUpload,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  maxSizeMB = 10,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);

  const config = dataTypeLabels[dataType];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      return { error: `Formato no soportado. Use: ${acceptedFormats.join(', ')}` };
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { error: `Archivo muy grande. Máximo ${maxSizeMB}MB` };
    }

    return { error: null };
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);

      for (const file of droppedFiles) {
        const validation = await processFile(file);

        const preview: FilePreview = {
          file,
          status: validation.error ? 'failed' : 'pending',
          progress: 0,
          error: validation.error || undefined,
        };

        setFiles((prev) => [...prev, preview]);

        if (!validation.error) {
          // Start upload
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: 'processing' as UploadStatus, progress: 30 } : f
            )
          );

          try {
            await onUpload(file);
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file ? { ...f, status: 'completed' as UploadStatus, progress: 100 } : f
              )
            );
          } catch (err) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, status: 'failed' as UploadStatus, error: 'Error al procesar archivo' }
                  : f
              )
            );
          }
        }
      }
    },
    [onUpload, acceptedFormats, maxSizeMB]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);

      for (const file of selectedFiles) {
        const validation = await processFile(file);

        const preview: FilePreview = {
          file,
          status: validation.error ? 'failed' : 'pending',
          progress: 0,
          error: validation.error || undefined,
        };

        setFiles((prev) => [...prev, preview]);

        if (!validation.error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: 'processing' as UploadStatus, progress: 30 } : f
            )
          );

          try {
            await onUpload(file);
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file ? { ...f, status: 'completed' as UploadStatus, progress: 100 } : f
              )
            );
          } catch (err) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, status: 'failed' as UploadStatus, error: 'Error al procesar archivo' }
                  : f
              )
            );
          }
        }
      }

      // Reset input
      e.target.value = '';
    },
    [onUpload, acceptedFormats, maxSizeMB]
  );

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5" />;
    return <FileSpreadsheet className="w-5 h-5" />;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className="font-semibold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-tuna-magenta bg-tuna-magenta/5 animate-tuna-dropzone'
            : 'border-border hover:border-tuna-magenta/50 hover:bg-muted/50'
        }`}
      >
        <input
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
        />

        <div className="flex flex-col items-center gap-4">
          {isDragging ? (
            <TunaAvatar state="processing" size="lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-tuna-magenta/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-tuna-magenta" />
            </div>
          )}

          <div>
            <p className="font-medium text-foreground">
              {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra y suelta tu archivo'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              o <span className="text-tuna-magenta font-medium">haz clic para seleccionar</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Formatos: {acceptedFormats.join(', ')}</span>
            <span>•</span>
            <span>Máx: {maxSizeMB}MB</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((filePreview, idx) => (
            <div
              key={`${filePreview.file.name}-${idx}`}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                filePreview.status === 'failed'
                  ? 'bg-destructive/5 border-destructive/20'
                  : filePreview.status === 'completed'
                  ? 'bg-tuna-green/5 border-tuna-green/20'
                  : 'bg-muted/50 border-border'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  filePreview.status === 'failed'
                    ? 'bg-destructive/10 text-destructive'
                    : filePreview.status === 'completed'
                    ? 'bg-tuna-green/10 text-tuna-green'
                    : 'bg-tuna-magenta/10 text-tuna-magenta'
                }`}
              >
                {getFileIcon(filePreview.file.name)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{filePreview.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(filePreview.file.size / 1024).toFixed(1)} KB
                </p>

                {/* Progress bar */}
                {filePreview.status === 'processing' && (
                  <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tuna-gradient rounded-full transition-all duration-500"
                      style={{ width: `${filePreview.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {filePreview.error && (
                  <p className="text-xs text-destructive mt-1">{filePreview.error}</p>
                )}
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {filePreview.status === 'processing' && (
                  <Loader2 className="w-5 h-5 text-tuna-magenta animate-spin" />
                )}
                {filePreview.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-tuna-green" />
                )}
                {filePreview.status === 'failed' && (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFile(filePreview.file)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-source upload component for all data types
export function MultiUploadZone({
  onUploadComplete,
}: {
  onUploadComplete?: () => void;
}) {
  const [completedTypes, setCompletedTypes] = useState<DataType[]>([]);

  const handleUpload = async (dataType: DataType, file: File) => {
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setCompletedTypes((prev) => [...prev, dataType]);

    // Check if all types are complete
    const allTypes: DataType[] = ['presupuesto', 'gastos_op', 'produccion', 'ventas'];
    if (completedTypes.length + 1 === allTypes.length) {
      onUploadComplete?.();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {(['presupuesto', 'gastos_op', 'produccion', 'ventas'] as DataType[]).map((type) => (
        <div
          key={type}
          className={`p-4 rounded-xl border ${
            completedTypes.includes(type) ? 'border-tuna-green bg-tuna-green/5' : 'border-border'
          }`}
        >
          <UploadZone dataType={type} onUpload={(file) => handleUpload(type, file)} />
        </div>
      ))}
    </div>
  );
}
