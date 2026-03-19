'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { MaisonConfig } from '@/modules/cereus/types';

interface MaisonContextValue {
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
  /** true when served from a custom domain (white-label mode) */
  isWhiteLabel: boolean;
  /** Base path for links: "" on custom domain, "/apps/cereus" on platform */
  basePath: string;
}

const MaisonContext = createContext<MaisonContextValue | null>(null);

export function MaisonProvider({
  children,
  maisonId,
  maisonName,
  config,
  isWhiteLabel = false,
}: {
  children: ReactNode;
  maisonId: string;
  maisonName: string;
  config: MaisonConfig;
  isWhiteLabel?: boolean;
}) {
  const value: MaisonContextValue = {
    maisonId,
    maisonName,
    config,
    isWhiteLabel,
    basePath: isWhiteLabel ? '' : '/apps/cereus',
  };

  return (
    <MaisonContext.Provider value={value}>
      {children}
    </MaisonContext.Provider>
  );
}

export function useMaison() {
  const ctx = useContext(MaisonContext);
  if (!ctx) {
    throw new Error('useMaison must be used within a MaisonProvider');
  }
  return ctx;
}

export function useMaisonOptional() {
  return useContext(MaisonContext);
}
