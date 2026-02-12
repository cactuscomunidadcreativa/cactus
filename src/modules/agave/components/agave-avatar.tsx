'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type AgaveState = 'idle' | 'thinking' | 'talking' | 'happy' | 'calculating' | 'warning';

interface AgaveAvatarProps {
  state?: AgaveState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
  onClick?: () => void;
}

const sizeConfig = {
  sm: { container: 'w-10 h-10', image: 40 },
  md: { container: 'w-16 h-16', image: 64 },
  lg: { container: 'w-24 h-24', image: 96 },
  xl: { container: 'w-32 h-32', image: 128 },
  '2xl': { container: 'w-48 h-48', image: 192 },
};

const stateAnimations: Record<AgaveState, string> = {
  idle: 'animate-agave-float',
  thinking: 'animate-agave-calculate',
  talking: 'animate-pulse',
  happy: 'animate-bounce',
  calculating: 'animate-agave-calculate',
  warning: 'animate-pulse',
};

const stateGlowColors: Record<AgaveState, string> = {
  idle: 'shadow-agave-gold/30',
  thinking: 'shadow-agave-cyan/50',
  talking: 'shadow-agave-gold/40',
  happy: 'shadow-green-400/50',
  calculating: 'shadow-agave-cyan/60',
  warning: 'shadow-orange-400/50',
};

export function AgaveAvatar({
  state = 'idle',
  size = 'md',
  showGlow = true,
  onClick,
}: AgaveAvatarProps) {
  const config = sizeConfig[size];
  const animation = stateAnimations[state];
  const glowColor = stateGlowColors[state];

  return (
    <div
      className={`
        ${config.container}
        relative
        ${animation}
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        ${showGlow ? `shadow-lg ${glowColor}` : ''}
        rounded-full
      `}
      onClick={onClick}
    >
      <Image
        src="/agave.png"
        alt="AGAVE"
        width={config.image}
        height={config.image}
        className="object-contain drop-shadow-md"
        priority
      />

      {/* Indicador de estado */}
      {state === 'thinking' && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-agave-cyan rounded-full animate-ping" />
      )}
      {state === 'calculating' && (
        <div className="absolute -bottom-1 -right-1 flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      {state === 'warning' && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          !
        </div>
      )}
    </div>
  );
}

// Mini avatar para mensajes del chat
export function AgaveAvatarMini({ state = 'idle' }: { state?: AgaveState }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-agave-gold-lighter flex items-center justify-center">
      <Image
        src="/agave.png"
        alt="AGAVE"
        width={28}
        height={28}
        className="object-contain"
      />
    </div>
  );
}
