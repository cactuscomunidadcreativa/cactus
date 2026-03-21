'use client';

import { useState, useCallback } from 'react';
import {
  TrendingUp,
  Lightbulb,
  Layers,
  Shirt,
  DollarSign,
  ChevronLeft,
  Check,
} from 'lucide-react';
import type {
  TrendSilhouette,
  ColorStory,
  FabricTrend,
  DetailTrend,
} from '../lib/trend-engine';
import CollectionContext from './collection-context';
import CollectionBriefEditor from './collection-brief-editor';
import FabricStudio from './fabric-studio';
import PieceCreator from './piece-creator';
import { CereusCostingPage } from './costing-page';

// ============================================================
// Types
// ============================================================

export interface MarketContext {
  city: string;
  country: string;
  avgTemp: number;
  humidity: string;
  targetArchetypes: string[];
  budgetMin: number;
  budgetMax: number;
  targetPieces: number;
  referenceImageUrls: string[];
  notes: string;
}

export interface WorkflowState {
  step: number;
  selectedSeason: string | null;
  selectedYear: number | null;
  pinnedTrends: PinnedTrends | null;
  marketContext: MarketContext | null;
  collectionId: string | null;
  collectionBrief: CollectionBrief | null;
  selectedFabrics: string[];
  pieces: PieceEntry[];
}

export interface PinnedTrends {
  silhouettes: TrendSilhouette[];
  colorStories: ColorStory[];
  fabricTrends: FabricTrend[];
  details: DetailTrend[];
  moodKeywords: string[];
}

export interface CollectionBrief {
  name: string;
  description: string;
  targetPieces: number;
  targetRevenue: number;
  avgPricePoint: number;
}

export interface PieceEntry {
  id: string;
  name: string;
  template: string;
  fabric: string;
  colors: string[];
  svgUrl: string | null;
}

// ============================================================
// Step definitions
// ============================================================

const STEPS = [
  { number: 1, label: 'Contexto', icon: TrendingUp },
  { number: 2, label: 'Concepto', icon: Lightbulb },
  { number: 3, label: 'Telas', icon: Layers },
  { number: 4, label: 'Piezas', icon: Shirt },
  { number: 5, label: 'Costeo', icon: DollarSign },
] as const;

// ============================================================
// Component
// ============================================================

interface DesignerWorkflowProps {
  maisonId: string;
}

export function DesignerWorkflow({ maisonId }: DesignerWorkflowProps) {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    step: 1,
    selectedSeason: null,
    selectedYear: null,
    pinnedTrends: null,
    marketContext: null,
    collectionId: null,
    collectionBrief: null,
    selectedFabrics: [],
    pieces: [],
  });

  const goToStep = useCallback((target: number) => {
    if (target < 1 || target > 5) return;
    setWorkflow((prev) => ({ ...prev, step: target }));
  }, []);

  const goBack = useCallback(() => {
    setWorkflow((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1),
    }));
  }, []);

  const handleTrendComplete = useCallback(
    (pinned: PinnedTrends, season: string, year: number, market?: MarketContext) => {
      setWorkflow((prev) => ({
        ...prev,
        selectedSeason: season,
        selectedYear: year,
        pinnedTrends: pinned,
        marketContext: market || null,
        step: 2,
      }));
    },
    [],
  );

  const handleBriefComplete = useCallback(
    (collectionId: string, brief: CollectionBrief) => {
      setWorkflow((prev) => ({
        ...prev,
        collectionId,
        collectionBrief: brief,
        step: 3,
      }));
    },
    [],
  );

  const handleFabricsComplete = useCallback(
    (materialIds: string[]) => {
      setWorkflow((prev) => ({
        ...prev,
        selectedFabrics: materialIds,
        step: 4,
      }));
    },
    [],
  );

  const handlePiecesComplete = useCallback(() => {
    setWorkflow((prev) => ({ ...prev, step: 5 }));
  }, []);

  // Determine which steps are completed
  const isStepCompleted = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return workflow.pinnedTrends !== null;
      case 2:
        return workflow.collectionBrief !== null;
      case 3:
        return workflow.selectedFabrics.length > 0;
      case 4:
        return workflow.pieces.length > 0;
      case 5:
        return false; // Final step, never auto-completed
      default:
        return false;
    }
  };

  const canNavigateTo = (stepNumber: number): boolean => {
    if (stepNumber === workflow.step) return false;
    // Can navigate to any completed step or the current step
    if (stepNumber < workflow.step) return true;
    // Can navigate forward only if current step is completed
    return isStepCompleted(stepNumber - 1);
  };

  // ── Step indicator ──────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((s, idx) => {
        const isActive = s.number === workflow.step;
        const completed = isStepCompleted(s.number);
        const clickable = canNavigateTo(s.number);
        const Icon = s.icon;

        return (
          <div key={s.number} className="flex items-center">
            {/* Step circle + label */}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && goToStep(s.number)}
              className={`
                flex flex-col items-center gap-1.5 transition-all
                ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-semibold transition-all border-2
                  ${
                    isActive
                      ? 'bg-cereus-gold border-cereus-gold text-white shadow-md'
                      : completed
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-stone-100 border-stone-300 text-stone-400'
                  }
                `}
              >
                {completed && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`
                  text-xs font-medium hidden sm:block
                  ${
                    isActive
                      ? 'text-cereus-gold'
                      : completed
                        ? 'text-emerald-600'
                        : 'text-stone-400'
                  }
                `}
              >
                {s.label}
              </span>
            </button>

            {/* Connector line between steps */}
            {idx < STEPS.length - 1 && (
              <div
                className={`
                  w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mt-[-1.25rem] sm:mt-0
                  ${
                    isStepCompleted(s.number)
                      ? 'bg-emerald-400'
                      : 'bg-stone-200'
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Step content ────────────────────────────────────────────

  const renderStepContent = () => {
    switch (workflow.step) {
      case 1:
        return <CollectionContext maisonId={maisonId} onComplete={handleTrendComplete} />;

      case 2:
        return workflow.pinnedTrends && workflow.selectedSeason && workflow.selectedYear ? (
          <CollectionBriefEditor
            maisonId={maisonId}
            season={workflow.selectedSeason}
            year={workflow.selectedYear}
            pinnedTrends={workflow.pinnedTrends}
            onComplete={handleBriefComplete}
            onBack={goBack}
          />
        ) : null;

      case 3:
        return (
          <FabricStudio
            maisonId={maisonId}
            collectionConcept={workflow.collectionBrief?.description || ''}
            colorStory={workflow.pinnedTrends?.colorStories?.flatMap(cs =>
              cs.colors.map((hex, i) => ({ hex, name: `${cs.name} ${i + 1}` }))
            ) || []}
            season={workflow.selectedSeason || 'spring_summer'}
            onComplete={handleFabricsComplete}
            onBack={goBack}
          />
        );

      case 4:
        return workflow.collectionId ? (
          <PieceCreator
            maisonId={maisonId}
            collectionId={workflow.collectionId}
            collectionName={workflow.collectionBrief?.name || 'Coleccion'}
            season={workflow.selectedSeason || 'spring_summer'}
            selectedMaterialIds={workflow.selectedFabrics}
            onComplete={handlePiecesComplete}
            onBack={goBack}
          />
        ) : null;

      case 5:
        return <CereusCostingPage />;

      default:
        return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Back button */}
      {workflow.step > 1 && (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
      )}

      {/* Active step content */}
      {renderStepContent()}
    </div>
  );
}
