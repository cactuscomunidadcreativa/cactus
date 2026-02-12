'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { TunaAvatar } from './tuna-avatar';

interface CategoryMapping {
  id?: string;
  budgetCategory: string;
  budgetProcess: string;
  eeffConcept: string;
  confidence: number;
  matchType: 'exact' | 'suggested' | 'manual' | 'ignored' | 'none';
  confirmed: boolean;
}

interface CategoryMapperProps {
  campaignId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function CategoryMapper({ campaignId, onClose, onComplete }: CategoryMapperProps) {
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [eeffConcepts, setEeffConcepts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing mappings
  const fetchMappings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/tuna/ai-mapping?campaignId=${campaignId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar mapeos');
      }

      // Transform DB format to component format
      const loadedMappings: CategoryMapping[] = (data.mappings || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        budgetCategory: m.budget_category as string,
        budgetProcess: m.budget_process as string,
        eeffConcept: m.eeff_concept as string,
        confidence: m.confidence as number,
        matchType: m.match_type as CategoryMapping['matchType'],
        confirmed: m.confirmed as boolean,
      }));

      setMappings(loadedMappings);

      // Fetch EEFF concepts for dropdown options
      const conceptsResponse = await fetch(`/api/tuna/eeff-concepts?campaignId=${campaignId}`);
      if (conceptsResponse.ok) {
        const conceptsData = await conceptsResponse.json();
        setEeffConcepts(conceptsData.concepts || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  // Update a single mapping
  const updateMapping = async (index: number, updates: Partial<CategoryMapping>) => {
    const mapping = mappings[index];
    const newMappings = [...mappings];
    newMappings[index] = { ...mapping, ...updates };
    setMappings(newMappings);

    // If has ID, persist to DB
    if (mapping.id) {
      try {
        await fetch('/api/tuna/ai-mapping', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mappingId: mapping.id,
            eeffConcept: updates.eeffConcept ?? mapping.eeffConcept,
            confirmed: updates.confirmed ?? mapping.confirmed,
            matchType: updates.matchType ?? mapping.matchType,
          }),
        });
      } catch (err) {
        console.error('Error updating mapping:', err);
      }
    }
  };

  // Confirm all mappings
  const confirmAll = async () => {
    const newMappings = mappings.map((m) => ({
      ...m,
      confirmed: m.eeffConcept ? true : m.confirmed,
    }));
    setMappings(newMappings);

    // Batch update in DB
    setSaving(true);
    try {
      await Promise.all(
        mappings
          .filter((m) => m.id && m.eeffConcept && !m.confirmed)
          .map((m) =>
            fetch('/api/tuna/ai-mapping', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mappingId: m.id,
                confirmed: true,
              }),
            })
          )
      );
    } finally {
      setSaving(false);
    }
  };

  // Save and calculate Real values
  const saveAndCalculate = async () => {
    setSaving(true);
    try {
      // Trigger Real calculation based on confirmed mappings
      const response = await fetch('/api/tuna/calculate-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al calcular');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const stats = {
    exact: mappings.filter((m) => m.matchType === 'exact').length,
    suggested: mappings.filter((m) => m.matchType === 'suggested').length,
    none: mappings.filter((m) => m.matchType === 'none' || !m.eeffConcept).length,
    confirmed: mappings.filter((m) => m.confirmed).length,
    total: mappings.length,
  };

  const getConfidenceColor = (confidence: number, matchType: string) => {
    if (matchType === 'ignored') return 'text-muted-foreground';
    if (confidence >= 95) return 'text-green-500';
    if (confidence >= 80) return 'text-yellow-500';
    if (confidence > 0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusIcon = (mapping: CategoryMapping) => {
    if (mapping.matchType === 'ignored') {
      return <X className="w-4 h-4 text-muted-foreground" />;
    }
    if (mapping.confirmed || mapping.matchType === 'exact') {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    if (mapping.matchType === 'suggested') {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <HelpCircle className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <TunaAvatar state="processing" size="lg" />
          <p className="mt-4 text-muted-foreground">Analizando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-tuna-magenta" />
            <div>
              <h2 className="text-lg font-bold">Mapeo Inteligente de Categorías</h2>
              <p className="text-sm text-muted-foreground">
                TUNA analizó tus archivos y encontró {stats.total} categorías
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 text-sm">
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            {stats.exact} exactos
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            {stats.suggested} sugeridos
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-red-500" />
            {stats.none} sin mapeo
          </span>
          <span className="ml-auto text-muted-foreground">
            {stats.confirmed}/{stats.total} confirmados
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>
        )}

        {/* Mappings list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mappings.map((mapping, index) => (
            <div
              key={mapping.id || index}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                mapping.confirmed
                  ? 'border-green-500/30 bg-green-500/5'
                  : mapping.matchType === 'ignored'
                  ? 'border-border/50 bg-muted/30 opacity-60'
                  : 'border-border hover:border-tuna-magenta/30'
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">{getStatusIcon(mapping)}</div>

              {/* Budget category */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{mapping.budgetCategory}</p>
                <p className="text-xs text-muted-foreground capitalize">{mapping.budgetProcess?.replace('_', ' ')}</p>
              </div>

              {/* Arrow */}
              <span className="text-muted-foreground">→</span>

              {/* EEFF concept selector */}
              <div className="flex-1 min-w-0">
                {mapping.matchType === 'ignored' ? (
                  <span className="text-muted-foreground italic">Ignorado</span>
                ) : (
                  <div className="relative">
                    <select
                      value={mapping.eeffConcept}
                      onChange={(e) =>
                        updateMapping(index, {
                          eeffConcept: e.target.value,
                          matchType: e.target.value ? 'manual' : 'none',
                          confirmed: false,
                        })
                      }
                      disabled={mapping.confirmed}
                      className="w-full px-3 py-2 pr-8 bg-muted rounded-lg text-sm border-0 focus:ring-2 focus:ring-tuna-magenta/20 appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Sin mapeo --</option>
                      {eeffConcepts.map((concept) => (
                        <option key={concept} value={concept}>
                          {concept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Confidence */}
              <div className={`flex-shrink-0 w-12 text-right text-sm font-medium ${getConfidenceColor(mapping.confidence, mapping.matchType)}`}>
                {mapping.matchType !== 'ignored' && mapping.eeffConcept ? `${mapping.confidence}%` : '-'}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {!mapping.confirmed && mapping.eeffConcept && (
                  <button
                    onClick={() => updateMapping(index, { confirmed: true })}
                    className="p-1.5 hover:bg-green-500/10 rounded text-green-500 transition-colors"
                    title="Confirmar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {mapping.matchType !== 'ignored' && (
                  <button
                    onClick={() =>
                      updateMapping(index, {
                        matchType: 'ignored',
                        confirmed: false,
                        eeffConcept: '',
                      })
                    }
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
                    title="Ignorar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {mapping.matchType === 'ignored' && (
                  <button
                    onClick={() => updateMapping(index, { matchType: 'none' })}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
                    title="Restaurar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {mappings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay mapeos para mostrar.</p>
              <p className="text-sm mt-1">Sube el archivo de presupuesto y EEFF primero.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <button
            onClick={confirmAll}
            disabled={isSaving || stats.suggested === 0}
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            Confirmar Todos los Sugeridos
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveAndCalculate}
              disabled={isSaving || stats.confirmed === 0}
              className="px-4 py-2 bg-tuna-gradient text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Guardar y Calcular Real
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
