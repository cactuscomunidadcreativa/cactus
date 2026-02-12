'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type AvatarState = 'idle' | 'thinking' | 'talking' | 'celebrating' | 'sleeping' | 'waving' | 'love';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface RamonaAvatarProps {
  state?: AvatarState;
  size?: AvatarSize;
  showSparkles?: boolean;
  showSpeechBubble?: boolean;
  speechText?: string;
  className?: string;
  interactive?: boolean;
  showHearts?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  '2xl': 'w-40 h-40',
};

const animationClasses: Record<AvatarState, string> = {
  idle: 'animate-ramona-float',
  thinking: 'animate-ramona-bounce',
  talking: 'animate-ramona-talk',
  celebrating: 'animate-ramona-celebrate',
  sleeping: 'animate-ramona-sleep',
  waving: 'animate-ramona-wave',
  love: 'animate-ramona-love',
};

const SPARKLE_EMOJIS = ['✨', '⭐', '💫', '🌟'];
const HEART_EMOJIS = ['💜', '💖', '💕', '🧡'];

export function RamonaAvatar({
  state = 'idle',
  size = 'md',
  showSparkles = false,
  showSpeechBubble = false,
  speechText,
  className = '',
  interactive = false,
  showHearts = false,
}: RamonaAvatarProps) {
  const [sparklePositions, setSparklePositions] = useState<{ x: number; y: number; delay: number; emoji: string }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);

  useEffect(() => {
    if (showSparkles || state === 'celebrating' || showHearts || state === 'love') {
      const emojis = showHearts || state === 'love' ? HEART_EMOJIS : SPARKLE_EMOJIS;
      const positions = Array.from({ length: 8 }, () => ({
        x: Math.random() * 120 - 10,
        y: Math.random() * 120 - 10,
        delay: Math.random() * 1.5,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }));
      setSparklePositions(positions);
    }
  }, [showSparkles, state, showHearts]);

  const handleClick = () => {
    if (interactive) {
      setClickAnimation(true);
      setTimeout(() => setClickAnimation(false), 600);
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className} ${interactive ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Glow effect - enhanced */}
      <div
        className={`absolute inset-0 ${sizeClasses[size]} rounded-full transition-all duration-500 ${
          state === 'celebrating' || state === 'love'
            ? 'bg-ramona-purple/30 blur-2xl scale-150 opacity-100'
            : isHovered
            ? 'bg-ramona-purple/20 blur-xl scale-125 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Pulse ring on hover */}
      {interactive && isHovered && (
        <div className="absolute inset-0 rounded-full animate-ramona-pulse" style={{ width: '100%', height: '100%' }} />
      )}

      {/* Main avatar container */}
      <div
        className={`relative ${sizeClasses[size]} ${animationClasses[state]} ${
          clickAnimation ? 'animate-ramona-jump' : ''
        } ${interactive && isHovered ? 'scale-110' : ''} transition-transform duration-200`}
      >
        {/* Ramona logo image */}
        <Image
          src="/ramona.png"
          alt="Ramona - Tu Asistente Personal IA"
          fill
          className={`object-contain drop-shadow-lg transition-all duration-300 ${
            state === 'sleeping' ? 'brightness-90 saturate-75' : ''
          } ${isHovered ? 'drop-shadow-2xl' : ''}`}
          priority
        />

        {/* Thinking dots - more animated */}
        {state === 'thinking' && (
          <div className="absolute -top-3 -right-1 flex gap-1">
            <span className="w-2.5 h-2.5 bg-ramona-purple rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
            <span className="w-2.5 h-2.5 bg-ramona-purple-light rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
            <span className="w-2.5 h-2.5 bg-ramona-orange rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
          </div>
        )}

        {/* Sleeping Zzz - more playful */}
        {state === 'sleeping' && (
          <div className="absolute -top-6 -right-3 flex flex-col items-end">
            <span className="text-ramona-purple/40 font-bold text-xs animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '2s' }}>z</span>
            <span className="text-ramona-purple/60 font-bold text-sm animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '2s' }}>z</span>
            <span className="text-ramona-purple font-bold text-base animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>Z</span>
          </div>
        )}

        {/* Waving hand indicator */}
        {state === 'waving' && (
          <div className="absolute -top-2 -right-2 text-xl animate-bounce">
            👋
          </div>
        )}

        {/* Love hearts floating */}
        {state === 'love' && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="animate-bounce text-lg" style={{ animationDelay: '0s' }}>💜</span>
            <span className="animate-bounce text-sm" style={{ animationDelay: '0.2s' }}>💖</span>
            <span className="animate-bounce text-lg" style={{ animationDelay: '0.4s' }}>💜</span>
          </div>
        )}

        {/* Sparkles/Hearts - enhanced */}
        {(showSparkles || state === 'celebrating' || showHearts || state === 'love') && (
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            {sparklePositions.map((pos, i) => (
              <span
                key={i}
                className="absolute animate-ramona-sparkle"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  animationDelay: `${pos.delay}s`,
                  animationDuration: '1.5s',
                  fontSize: size === 'xs' || size === 'sm' ? '10px' : size === '2xl' ? '18px' : '14px',
                }}
              >
                {pos.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Speech bubble - improved */}
      {showSpeechBubble && speechText && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 animate-ramona-fade-in">
          <div className="relative bg-white dark:bg-card border-2 border-ramona-purple/20 rounded-2xl px-4 py-3 shadow-xl max-w-56">
            {/* Triangle */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white dark:border-r-card" />
            <div className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-ramona-purple/20" />
            <p className="text-sm text-foreground leading-relaxed">{speechText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini inline avatar for use in text
export function RamonaInline({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Image
        src="/ramona.png"
        alt="Ramona"
        width={20}
        height={20}
        className="inline-block"
      />
      <span className="font-medium text-ramona-purple">Ramona</span>
    </span>
  );
}

// Loading state with Ramona
export function RamonaLoading({ text = 'Pensando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <RamonaAvatar state="thinking" size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

// Empty state with Ramona
export function RamonaEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <RamonaAvatar state="idle" size="xl" />
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Success celebration
export function RamonaCelebrate({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <RamonaAvatar state="celebrating" size="lg" showSparkles />
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-lg text-ramona-purple">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
