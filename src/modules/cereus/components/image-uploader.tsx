'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, Check, ZoomIn } from 'lucide-react';

interface UploadedImage {
  url: string;
  fileName: string;
  fileSize: number;
}

interface ImageUploaderProps {
  bucket: string;
  folder?: string;
  onUpload: (url: string) => void;
  onMultiUpload?: (urls: string[]) => void;
  maxSize?: number; // MB
  multiple?: boolean;
  label?: string;
  labelEs?: string;
  existingImages?: string[];
  onRemove?: (url: string) => void;
  compact?: boolean;
  accept?: string;
}

export function ImageUploader({
  bucket,
  folder,
  onUpload,
  onMultiUpload,
  maxSize = 15,
  multiple = false,
  label = 'Upload Image',
  labelEs = 'Subir Imagen',
  existingImages = [],
  onRemove,
  compact = false,
  accept = 'image/jpeg,image/png,image/webp,image/svg+xml',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<UploadedImage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadedImage | null> => {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Max ${maxSize}MB / Archivo muy grande. Máx ${maxSize}MB`);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) formData.append('folder', folder);

    const res = await fetch('/api/cereus/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    return {
      url: data.url,
      fileName: data.fileName,
      fileSize: data.fileSize,
    };
  }, [bucket, folder, maxSize]);

  const uploadingRef = useRef(false);

  async function handleFiles(files: FileList | File[]) {
    // Prevent double-trigger on iPad/mobile
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    setError(null);
    setUploading(true);

    try {
      const fileArray = Array.from(files);
      // Deduplicate by name+size to prevent double uploads
      const seen = new Set<string>();
      const uniqueFiles = fileArray.filter(f => {
        const key = `${f.name}-${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const results: UploadedImage[] = [];

      for (const file of uniqueFiles) {
        const result = await uploadFile(file);
        if (result) {
          results.push(result);
          onUpload(result.url);
        }
      }

      if (results.length > 0) {
        setRecentUploads(prev => [...prev, ...results]);
        if (multiple && onMultiUpload) {
          onMultiUpload(results.map(r => r.url));
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      uploadingRef.current = false;
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  const allImages = [...existingImages, ...recentUploads.map(u => u.url)];

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {labelEs}
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        {allImages.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {allImages.map((url, i) => (
              <div key={i} className="relative group cursor-pointer" onClick={() => setPreviewUrl(url)}>
                <img
                  src={url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-border hover:ring-2 hover:ring-cereus-gold/50 transition-all"
                />
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal (compact) */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setPreviewUrl(null)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 z-10">
                <X className="w-5 h-5" />
              </button>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" style={{ maxHeight: '85vh' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-cereus-gold bg-cereus-gold/5'
            : 'border-border hover:border-cereus-gold/50 hover:bg-muted/30'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
            <p className="text-sm text-muted-foreground">Uploading... / Subiendo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-cereus-gold/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-cereus-gold" />
            </div>
            <div>
              <p className="text-sm font-medium">{label} / {labelEs}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click / Arrastra o haz clic
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSize}MB — JPEG, PNG, WebP, SVG
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Image gallery */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {allImages.map((url, i) => (
            <div key={i} className="relative group aspect-square cursor-pointer" onClick={() => setPreviewUrl(url)}>
              <img
                src={url}
                alt=""
                className="w-full h-full rounded-lg object-cover border border-border"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(url); }}
                  className="w-8 h-8 bg-white/90 text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {recentUploads.some(u => u.url === url) && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-xl"
              style={{ maxHeight: '85vh' }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {onRemove && (
                <button
                  type="button"
                  onClick={() => { onRemove(previewUrl); setPreviewUrl(null); }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              )}
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Abrir original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
