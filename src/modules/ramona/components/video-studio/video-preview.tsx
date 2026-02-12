'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export function VideoPreview({ videoUrl, thumbnailUrl, duration }: VideoPreviewProps) {
  const t = useTranslations('ramona.videoStudio.preview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  function formatDuration(seconds?: number) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!videoUrl) {
    return (
      <div className="relative aspect-[9/16] max-w-[200px] mx-auto bg-muted rounded-xl flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('noVideo')}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-xl group">
      {/* Video */}
      <video
        src={videoUrl}
        poster={thumbnailUrl}
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={(e) => {
          const video = e.target as HTMLVideoElement;
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }}
      />

      {/* Play overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const video = (e.target as HTMLElement).closest('.group')?.querySelector('video');
              video?.play();
            }}
            className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Play className="w-6 h-6 text-gray-900 ml-1" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const video = (e.target as HTMLElement).closest('.group')?.querySelector('video');
                if (video?.paused) {
                  video.play();
                } else {
                  video?.pause();
                }
              }}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-xs">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Duration badge */}
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
        {formatDuration(duration)}
      </div>
    </div>
  );
}
