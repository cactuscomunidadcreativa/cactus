'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  shape: 'square' | 'circle' | 'triangle' | 'star';
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const defaultColors = [
  '#9A4E9A', // ramona-purple
  '#B86DB8', // ramona-purple-light
  '#F5A623', // ramona-orange
  '#FFD699', // ramona-orange-light
  '#4CAF50', // cactus-green
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#FFE66D', // yellow
];

function generatePieces(count: number, colors: string[]): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 8,
    shape: (['square', 'circle', 'triangle', 'star'] as const)[Math.floor(Math.random() * 4)],
  }));
}

function ConfettiShape({ piece }: { piece: ConfettiPiece }) {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${piece.x}%`,
    top: '-20px',
    width: `${piece.size}px`,
    height: `${piece.size}px`,
    backgroundColor: piece.shape !== 'star' ? piece.color : 'transparent',
    animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
    transform: `rotate(${piece.rotation}deg)`,
  };

  if (piece.shape === 'circle') {
    return <div style={{ ...baseStyle, borderRadius: '50%' }} />;
  }

  if (piece.shape === 'triangle') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: 'transparent',
          width: 0,
          height: 0,
          borderLeft: `${piece.size / 2}px solid transparent`,
          borderRight: `${piece.size / 2}px solid transparent`,
          borderBottom: `${piece.size}px solid ${piece.color}`,
        }}
      />
    );
  }

  if (piece.shape === 'star') {
    return (
      <div style={{ ...baseStyle, fontSize: `${piece.size}px`, color: piece.color }}>
        ✦
      </div>
    );
  }

  // Square (default)
  return <div style={{ ...baseStyle, borderRadius: '2px' }} />;
}

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  colors = defaultColors,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      setPieces(generatePieces(pieceCount, colors));
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, pieceCount, colors, onComplete]);

  if (!mounted || !isVisible || pieces.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <ConfettiShape key={piece.id} piece={piece} />
      ))}
    </div>,
    document.body
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    trigger,
    reset,
    Confetti: (props: Omit<ConfettiProps, 'isActive'>) => (
      <Confetti {...props} isActive={isActive} onComplete={reset} />
    ),
  };
}

// Preset confetti bursts
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  return (
    <Confetti
      isActive={trigger}
      pieceCount={80}
      duration={4000}
      colors={defaultColors}
    />
  );
}

export function ConfettiCelebration({
  title,
  subtitle,
  onDismiss,
}: {
  title: string;
  subtitle?: string;
  onDismiss?: () => void;
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Confetti isActive={true} pieceCount={100} duration={5000} />
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <div
          className={`transform transition-all duration-500 ${
            showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-display font-bold text-ramona-purple mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground mb-4">{subtitle}</p>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="mt-4 px-6 py-2 bg-ramona-purple text-white rounded-full font-medium hover:bg-ramona-purple-light transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Mini celebration for inline use
export function MiniCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <span className="inline-flex items-center gap-1">
      <span className="animate-ramona-sparkle">✨</span>
      <span className="animate-ramona-sparkle" style={{ animationDelay: '0.2s' }}>🎉</span>
      <span className="animate-ramona-sparkle" style={{ animationDelay: '0.4s' }}>✨</span>
    </span>
  );
}
