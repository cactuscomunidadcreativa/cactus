'use client';

import { useState, useRef, useCallback } from 'react';
import { Paperclip, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentUploaderProps {
  presentationId: string;
  sectionId: string;
  reviewerId: string;
  reviewerName: string;
  threadId?: string;
  isWhiteBg?: boolean;
  onUploadComplete: (attachment: any) => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ACCEPT_STRING = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.ppt,.pptx';
const MAX_SIZE_MB = 10;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentUploader({
  presentationId,
  sectionId,
  reviewerId,
  reviewerName,
  threadId,
  isWhiteBg = false,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'File type not supported. Use images, PDFs, or documents.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('presentationId', presentationId);
      formData.append('sectionId', sectionId);
      formData.append('reviewerId', reviewerId);
      formData.append('reviewerName', reviewerName);
      if (threadId) formData.append('threadId', threadId);

      const res = await fetch('/api/pita/attachments', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.attachment) {
        onUploadComplete(data.attachment);
        setShowDropZone(false);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [presentationId, sectionId, reviewerId, reviewerName, threadId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFile]);

  // Compact mode: just the button
  if (!showDropZone) {
    return (
      <button
        onClick={() => setShowDropZone(true)}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all',
          isWhiteBg
            ? 'text-[#0E1B2C]/30 hover:text-[#0E1B2C]/50 hover:bg-[#0E1B2C]/[0.04]'
            : 'text-[#F5F7F9]/30 hover:text-[#F5F7F9]/50 hover:bg-white/5'
        )}
        title="Attach file"
      >
        <Paperclip className="w-3.5 h-3.5" />
        Attach
      </button>
    );
  }

  return (
    <div className="space-y-2 animate-pita-slide-up">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all',
          isDragging
            ? 'border-[#4FAF8F] bg-[#4FAF8F]/[0.05]'
            : isWhiteBg
            ? 'border-[#E9EEF2] hover:border-[#4FAF8F]/40 bg-[#0E1B2C]/[0.01]'
            : 'border-white/10 hover:border-[#4FAF8F]/40 bg-white/[0.02]'
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[#4FAF8F] animate-spin" />
            <p className={cn('text-sm', isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/40')}>
              Uploading...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={cn('w-6 h-6', isWhiteBg ? 'text-[#0E1B2C]/20' : 'text-[#F5F7F9]/20')} />
            <p className={cn('text-sm', isWhiteBg ? 'text-[#0E1B2C]/40' : 'text-[#F5F7F9]/40')}>
              Drop file here or click to browse
            </p>
            <p className={cn('text-[10px]', isWhiteBg ? 'text-[#0E1B2C]/20' : 'text-[#F5F7F9]/20')}>
              Images, PDFs, Docs · Max {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Close button */}
      <button
        onClick={() => { setShowDropZone(false); setError(null); }}
        className={cn(
          'text-[10px]',
          isWhiteBg ? 'text-[#0E1B2C]/25 hover:text-[#0E1B2C]/40' : 'text-[#F5F7F9]/25 hover:text-[#F5F7F9]/40'
        )}
      >
        Cancel
      </button>
    </div>
  );
}
