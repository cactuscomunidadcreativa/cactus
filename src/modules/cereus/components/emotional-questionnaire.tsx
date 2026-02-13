'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Check } from 'lucide-react';
import { EMOTIONAL_QUESTIONNAIRE } from '../lib/emotional-questionnaire';
import type { Question } from '../lib/emotional-questionnaire';

interface EmotionalQuestionnaireProps {
  clientId: string;
  onComplete: (profile: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function EmotionalQuestionnaire({ clientId, onComplete, onCancel }: EmotionalQuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = EMOTIONAL_QUESTIONNAIRE.length + 1; // +1 for review
  const currentQuestion = step < EMOTIONAL_QUESTIONNAIRE.length ? EMOTIONAL_QUESTIONNAIRE[step] : null;
  const isReviewStep = step === EMOTIONAL_QUESTIONNAIRE.length;
  const progress = ((step + 1) / totalSteps) * 100;

  function isStepValid(): boolean {
    if (!currentQuestion) return true;
    const value = responses[currentQuestion.id];

    if (!currentQuestion.required) return true;

    if (currentQuestion.type === 'multi_select') {
      const arr = (value as string[]) || [];
      if (currentQuestion.min_select && arr.length < currentQuestion.min_select) return false;
      return arr.length > 0;
    }

    if (currentQuestion.type === 'single_select') {
      return !!value;
    }

    if (currentQuestion.type === 'slider') {
      return value !== undefined;
    }

    if (currentQuestion.type === 'ranking') {
      const arr = (value as string[]) || [];
      return arr.length === (currentQuestion.options?.length || 0);
    }

    return true;
  }

  function updateMultiSelect(questionId: string, optionValue: string, maxSelect?: number) {
    setResponses(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(optionValue)) {
        return { ...prev, [questionId]: current.filter(v => v !== optionValue) };
      }
      if (maxSelect && current.length >= maxSelect) return prev;
      return { ...prev, [questionId]: [...current, optionValue] };
    });
  }

  function updateRanking(questionId: string, optionValue: string) {
    setResponses(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(optionValue)) {
        return { ...prev, [questionId]: current.filter(v => v !== optionValue) };
      }
      return { ...prev, [questionId]: [...current, optionValue] };
    });
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      // Save emotional profile
      const profileRes = await fetch('/api/cereus/emotional-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, responses }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error);

      // Auto-trigger AI profile generation
      try {
        await fetch('/api/cereus/ai/generate-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profileData.profile.id }),
        });
      } catch {
        // AI generation is optional — profile is still saved
      }

      onComplete(profileData.profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function renderQuestion(question: Question) {
    switch (question.type) {
      case 'multi_select':
        return renderMultiSelect(question);
      case 'single_select':
        return renderSingleSelect(question);
      case 'slider':
        return renderSlider(question);
      case 'ranking':
        return renderRanking(question);
      case 'free_text':
        return renderFreeText(question);
      default:
        return null;
    }
  }

  function renderMultiSelect(question: Question) {
    const selected = (responses[question.id] as string[]) || [];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {question.options?.map(option => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => updateMultiSelect(question.id, option.value, question.max_select)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-cereus-gold bg-cereus-gold/10 shadow-sm'
                  : 'border-border hover:border-cereus-gold/50 hover:bg-muted/50'
              }`}
            >
              <span className="text-xl block mb-1">{option.emoji}</span>
              <span className="text-sm font-medium">{option.labelEs}</span>
              {isSelected && <Check className="w-4 h-4 text-cereus-gold inline ml-2" />}
            </button>
          );
        })}
      </div>
    );
  }

  function renderSingleSelect(question: Question) {
    const selected = responses[question.id] as string;
    return (
      <div className="grid grid-cols-2 gap-3">
        {question.options?.map(option => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setResponses(prev => ({ ...prev, [question.id]: option.value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-cereus-gold bg-cereus-gold/10 shadow-sm'
                  : 'border-border hover:border-cereus-gold/50 hover:bg-muted/50'
              }`}
            >
              <span className="text-xl block mb-1">{option.emoji}</span>
              <span className="text-sm font-medium">{option.labelEs}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function renderSlider(question: Question) {
    const value = (responses[question.id] as number) ?? 5;
    return (
      <div className="px-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>{question.slider_labels?.[0]}</span>
          <span>{question.slider_labels?.[1]}</span>
        </div>
        <input
          type="range"
          min={question.slider_min || 1}
          max={question.slider_max || 10}
          value={value}
          onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: parseInt(e.target.value) }))}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-cereus-gold"
        />
        <div className="text-center mt-3">
          <span className="text-3xl font-display font-bold text-cereus-gold">{value}</span>
          <span className="text-sm text-muted-foreground ml-1">/ {question.slider_max || 10}</span>
        </div>
      </div>
    );
  }

  function renderRanking(question: Question) {
    const ranked = (responses[question.id] as string[]) || [];
    const unranked = question.options?.filter(o => !ranked.includes(o.value)) || [];
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-3">Haz clic en orden de prioridad (1 = mas importante)</p>
        {ranked.length > 0 && (
          <div className="space-y-2 mb-4">
            {ranked.map((value, index) => {
              const option = question.options?.find(o => o.value === value);
              return (
                <div
                  key={value}
                  className="flex items-center gap-3 p-3 bg-cereus-gold/10 border border-cereus-gold/30 rounded-lg cursor-pointer"
                  onClick={() => updateRanking(question.id, value)}
                >
                  <span className="w-7 h-7 rounded-full bg-cereus-gold text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{option?.labelEs}</span>
                </div>
              );
            })}
          </div>
        )}
        {unranked.length > 0 && (
          <div className="space-y-2">
            {unranked.map(option => (
              <button
                key={option.value}
                onClick={() => updateRanking(question.id, option.value)}
                className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:border-cereus-gold/50 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm flex items-center justify-center">
                  ?
                </span>
                <span className="text-sm">{option.labelEs}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderFreeText(question: Question) {
    return (
      <textarea
        value={(responses[question.id] as string) || ''}
        onChange={(e) => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
        placeholder={question.descriptionEs || question.description || ''}
        className="w-full h-32 p-4 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
      />
    );
  }

  function renderReview() {
    return (
      <div className="space-y-4">
        {EMOTIONAL_QUESTIONNAIRE.map((q) => {
          const value = responses[q.id];
          if (!value) return null;
          let display = '';
          if (Array.isArray(value)) {
            display = value.map(v => {
              const opt = q.options?.find(o => o.value === v);
              return opt?.labelEs || v;
            }).join(', ');
          } else if (typeof value === 'number') {
            display = `${value}/${q.slider_max || 10}`;
          } else if (typeof value === 'string') {
            const opt = q.options?.find(o => o.value === value);
            display = opt?.labelEs || value;
          }
          return (
            <div key={q.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{q.labelEs}</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{display}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Paso {step + 1} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-cereus-gold rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="mb-8">
          <h3 className="text-xl font-display font-bold mb-2">{currentQuestion.labelEs}</h3>
          {currentQuestion.descriptionEs && currentQuestion.type !== 'free_text' && (
            <p className="text-sm text-muted-foreground mb-6">{currentQuestion.descriptionEs}</p>
          )}
          {renderQuestion(currentQuestion)}
        </div>
      )}

      {/* Review */}
      {isReviewStep && (
        <div className="mb-8">
          <h3 className="text-xl font-display font-bold mb-2">Resumen de tu perfil</h3>
          <p className="text-sm text-muted-foreground mb-6">Revisa tus respuestas antes de generar tu perfil emocional.</p>
          {renderReview()}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <div>
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : onCancel ? (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          ) : <div />}
        </div>

        <div>
          {!isReviewStep ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid()}
              className="flex items-center gap-1 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando perfil...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generar Perfil Emocional
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
