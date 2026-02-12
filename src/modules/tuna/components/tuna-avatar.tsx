'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type AvatarState = 'idle' | 'processing' | 'consolidating' | 'success' | 'error' | 'waiting';
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface TunaAvatarProps {
  state?: AvatarState;
  size?: AvatarSize;
  showDataNodes?: boolean;
  showOrbitIcons?: boolean;
  showGlow?: boolean;
  className?: string;
  interactive?: boolean;
  progress?: number; // 0-100 for processing state
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-10 h-10',
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-36 h-36',
  '2xl': 'w-48 h-48',
};

const animationClasses: Record<AvatarState, string> = {
  idle: 'animate-tuna-float',
  processing: 'animate-tuna-process',
  consolidating: 'animate-tuna-consolidate',
  success: '',
  error: '',
  waiting: 'animate-tuna-float',
};

const DATA_ICONS = ['📊', '📈', '💰', '🌾', '📋', '✅'];
const ORBIT_ICONS = ['📊', '📧', '📈', '💹'];

export function TunaAvatar({
  state = 'idle',
  size = 'md',
  showDataNodes = false,
  showOrbitIcons = false,
  showGlow = false,
  className = '',
  interactive = false,
  progress = 0,
}: TunaAvatarProps) {
  const [dataNodePositions, setDataNodePositions] = useState<{ x: number; y: number; delay: number; icon: string }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [clickAnimation, setClickAnimation] = useState(false);

  useEffect(() => {
    if (showDataNodes || state === 'processing' || state === 'consolidating') {
      const positions = Array.from({ length: 6 }, (_, i) => ({
        x: 50 + 45 * Math.cos((i * Math.PI * 2) / 6 - Math.PI / 2),
        y: 50 + 45 * Math.sin((i * Math.PI * 2) / 6 - Math.PI / 2),
        delay: i * 0.2,
        icon: DATA_ICONS[i % DATA_ICONS.length],
      }));
      setDataNodePositions(positions);
    }
  }, [showDataNodes, state]);

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
      {/* Glow effect */}
      {(showGlow || state === 'success') && (
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full animate-tuna-glow`}
          style={{ filter: 'blur(20px)', opacity: 0.6 }}
        />
      )}

      {/* Hover glow */}
      {interactive && isHovered && (
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-tuna-magenta/20 blur-xl scale-125 transition-all duration-300`}
        />
      )}

      {/* Orbit icons */}
      {(showOrbitIcons || state === 'processing') && (
        <div className="absolute inset-0">
          {ORBIT_ICONS.map((icon, i) => (
            <span
              key={i}
              className="absolute text-lg animate-tuna-orbit"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-10px',
                marginTop: '-10px',
                animationDelay: `${i * -2}s`,
                animationDuration: '8s',
              }}
            >
              {icon}
            </span>
          ))}
        </div>
      )}

      {/* Main avatar container */}
      <div
        className={`relative ${sizeClasses[size]} ${animationClasses[state]} ${
          clickAnimation ? 'animate-tuna-seal' : ''
        } ${interactive && isHovered ? 'scale-110' : ''} transition-transform duration-200`}
      >
        {/* TUNA logo image */}
        <Image
          src="/tuna.png"
          alt="TUNA - El Cierre de Campaña. Consolidado."
          fill
          className={`object-contain drop-shadow-lg transition-all duration-300 ${
            state === 'error' ? 'grayscale' : ''
          } ${isHovered ? 'drop-shadow-2xl' : ''}`}
          priority
        />

        {/* Processing indicator */}
        {state === 'processing' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-tuna-gradient rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Consolidating effect */}
        {state === 'consolidating' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {dataNodePositions.map((pos, i) => (
              <span
                key={i}
                className="absolute animate-tuna-data-pulse"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${pos.delay}s`,
                  fontSize: size === 'xs' || size === 'sm' ? '10px' : size === '2xl' ? '16px' : '12px',
                }}
              >
                {pos.icon}
              </span>
            ))}
          </div>
        )}

        {/* Success checkmark */}
        {state === 'success' && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-tuna-green rounded-full flex items-center justify-center animate-tuna-seal shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Error indicator */}
        {state === 'error' && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <span className="text-white text-lg">!</span>
          </div>
        )}

        {/* Waiting dots */}
        {state === 'waiting' && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 bg-tuna-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-tuna-magenta-light rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-tuna-purple-light rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Data nodes decoration */}
        {showDataNodes && state === 'idle' && (
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            {dataNodePositions.map((pos, i) => (
              <span
                key={i}
                className="absolute animate-tuna-data-pulse opacity-60"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${pos.delay}s`,
                  fontSize: size === 'xs' || size === 'sm' ? '8px' : size === '2xl' ? '14px' : '10px',
                }}
              >
                {pos.icon}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading state with TUNA
export function TunaLoading({ text = 'Procesando datos...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <TunaAvatar state="processing" size="lg" showOrbitIcons progress={50} />
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}

// Empty state with TUNA
export function TunaEmpty({
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
      <TunaAvatar state="waiting" size="xl" />
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Success celebration with TUNA
export function TunaSuccess({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <TunaAvatar state="success" size="lg" showGlow />
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-lg text-tuna-magenta">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

// Inline TUNA badge
export function TunaInline({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Image
        src="/tuna.png"
        alt="TUNA"
        width={20}
        height={20}
        className="inline-block"
      />
      <span className="font-bold text-tuna-magenta">TUNA</span>
    </span>
  );
}

// TUNA Seal of approval
export function TunaSeal({
  status = 'pending',
  size = 'md'
}: {
  status?: 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-24 h-24 text-sm',
    lg: 'w-32 h-32 text-base',
  };

  const statusConfig = {
    pending: { bg: 'bg-muted', text: 'Pendiente', icon: '⏳' },
    approved: { bg: 'bg-tuna-green', text: 'Consolidado', icon: '✓' },
    rejected: { bg: 'bg-destructive', text: 'Rechazado', icon: '✗' },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`${sizeClasses[size]} ${config.bg} rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg ${
        status === 'approved' ? 'animate-tuna-seal' : ''
      }`}
    >
      <span className="text-2xl">{config.icon}</span>
      <span className="uppercase tracking-wider">{config.text}</span>
    </div>
  );
}
