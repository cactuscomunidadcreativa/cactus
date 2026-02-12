'use client';

import { useState } from 'react';
import { FileText, Download, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PitaAttachment } from '../types';

interface AttachmentGalleryProps {
  attachments: PitaAttachment[];
  isWhiteBg?: boolean;
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith('image/');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentGallery({ attachments, isWhiteBg = false }: AttachmentGalleryProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const images = attachments.filter(a => isImageType(a.file_type));
  const files = attachments.filter(a => !isImageType(a.file_type));

  return (
    <>
      <div className="space-y-3">
        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <button
                key={img.id}
                onClick={() => setLightboxUrl(img.file_url)}
                className="group relative aspect-square rounded-lg overflow-hidden border transition-all hover:border-[#4FAF8F]/40"
                style={{ borderColor: isWhiteBg ? '#E9EEF2' : 'rgba(255,255,255,0.1)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.file_url}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[9px] text-white/80 truncate">{img.reviewer_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map(file => (
              <a
                key={file.id}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg transition-all group',
                  isWhiteBg
                    ? 'bg-[#0E1B2C]/[0.02] hover:bg-[#0E1B2C]/[0.05] border border-[#E9EEF2]'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  isWhiteBg ? 'bg-[#2D6CDF]/[0.08]' : 'bg-[#2D6CDF]/10'
                )}>
                  <FileText className="w-4 h-4 text-[#2D6CDF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    isWhiteBg ? 'text-[#0E1B2C]/70' : 'text-[#F5F7F9]/70'
                  )}>
                    {file.file_name}
                  </p>
                  <p className={cn(
                    'text-[10px]',
                    isWhiteBg ? 'text-[#0E1B2C]/25' : 'text-[#F5F7F9]/25'
                  )}>
                    {file.reviewer_name} · {formatFileSize(file.file_size)}
                  </p>
                </div>
                <Download className={cn(
                  'w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity',
                  isWhiteBg ? 'text-[#0E1B2C]/30' : 'text-[#F5F7F9]/30'
                )} />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Attachment"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
