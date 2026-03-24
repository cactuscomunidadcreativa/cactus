'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Palette,
  Shirt,
  Heart,
  X,
  Plus,
  Save,
  Sliders,
  Eye,
  Target,
  Paintbrush,
  Loader2,
  Check,
  Trash2,
  Ruler,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────

export interface AITrainingData {
  brandVoice: string;
  brandValues: string[];
  targetAudience: string;
  styleKeywords: string[];
  avoidKeywords: string[];
  preferredColors: string[];
  avoidColors: string[];
  skinToneContext: string;
  preferredFabrics: string[];
  avoidFabrics: string[];
  bodyContext: string;
  fitPreferences: string;
  designRules: string;
  inspirationBrands: string[];
  inspirationNotes: string;
  creativityLevel: number;
  languagePreference: string;
  likedExamples: { type: string; content: string; date: string }[];
  dislikedExamples: { type: string; content: string; reason: string; date: string }[];
  pieceVocabulary: Record<string, {
    designerMeaning: string;
    defaultSilhouette: string;
    keyDetails: string[];
    fitNotes: string;
    versatility: string;
  }>;
}

const PIECE_TYPES = [
  { id: 'dress', name: 'Vestido', icon: '👗' },
  { id: 'gown', name: 'Vestido de Gala', icon: '✨' },
  { id: 'suit', name: 'Traje', icon: '🤵' },
  { id: 'blazer', name: 'Blazer', icon: '🧥' },
  { id: 'coat', name: 'Abrigo', icon: '🧥' },
  { id: 'skirt', name: 'Falda', icon: '👗' },
  { id: 'pants', name: 'Pantalon', icon: '👖' },
  { id: 'blouse', name: 'Blusa', icon: '👚' },
  { id: 'shirt', name: 'Camisa', icon: '👔' },
  { id: 'jumpsuit', name: 'Jumpsuit', icon: '🩱' },
  { id: 'cape', name: 'Capa', icon: '🦸' },
  { id: 'corset', name: 'Corset', icon: '🎀' },
  { id: 'top', name: 'Top', icon: '👕' },
  { id: 'crop_top', name: 'Crop Top', icon: '👕' },
  { id: 'vest', name: 'Chaleco', icon: '🦺' },
  { id: 'kimono', name: 'Kimono', icon: '👘' },
  { id: 'poncho', name: 'Poncho', icon: '🧣' },
  { id: 'shorts', name: 'Short', icon: '🩳' },
  { id: 'bermuda', name: 'Bermuda', icon: '🩳' },
  { id: 'bodysuit', name: 'Body', icon: '🩱' },
  { id: 'accessory', name: 'Accesorio', icon: '💎' },
];

const EMPTY_TRAINING: AITrainingData = {
  brandVoice: '',
  brandValues: [],
  targetAudience: '',
  styleKeywords: [],
  avoidKeywords: [],
  preferredColors: [],
  avoidColors: [],
  skinToneContext: '',
  preferredFabrics: [],
  avoidFabrics: [],
  bodyContext: '',
  fitPreferences: '',
  designRules: '',
  inspirationBrands: [],
  inspirationNotes: '',
  creativityLevel: 5,
  languagePreference: 'es',
  likedExamples: [],
  dislikedExamples: [],
  pieceVocabulary: {},
};

const EXAMPLE_TYPES = [
  { value: 'silueta', label: 'Silueta' },
  { value: 'color', label: 'Color' },
  { value: 'tela', label: 'Tela' },
  { value: 'concepto', label: 'Concepto' },
  { value: 'print', label: 'Print / Estampado' },
];

const PRESET_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#f38181', '#fce38a', '#eaffd0',
  '#95e1d3', '#aa96da', '#c4edde', '#fef9ef',
  '#f8b500', '#d4a574', '#8b4513', '#2d1b0e',
  '#fff5e6', '#ffe4c9', '#ffd6a5', '#c9ada7',
  '#9a8c98', '#4a4e69', '#22223b', '#f2e9e4',
];

const CREATIVITY_LABELS: Record<number, string> = {
  1: 'Clasico y seguro',
  2: 'Muy conservador',
  3: 'Conservador',
  4: 'Ligeramente conservador',
  5: 'Equilibrado',
  6: 'Ligeramente experimental',
  7: 'Creativo',
  8: 'Bastante experimental',
  9: 'Muy experimental',
  10: 'Experimental y arriesgado',
};

// ─── HELPERS ────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── buildAITrainingContext ─────────────────────────────────

export function buildAITrainingContext(training: AITrainingData): string {
  const lines: string[] = [];
  lines.push('=== PREFERENCIAS DE LA DISENADORA ===');
  lines.push('');

  if (training.brandVoice) {
    lines.push(`Voz de marca: ${training.brandVoice}`);
  }
  if (training.brandValues.length > 0) {
    lines.push(`Valores: ${training.brandValues.join(', ')}`);
  }
  if (training.targetAudience) {
    lines.push(`Publico objetivo: ${training.targetAudience}`);
  }
  lines.push('');

  if (training.styleKeywords.length > 0) {
    lines.push(`Estilo: ${training.styleKeywords.join(', ')}`);
  }
  if (training.avoidKeywords.length > 0) {
    lines.push(`NUNCA usar: ${training.avoidKeywords.join(', ')}`);
  }
  lines.push('');

  if (training.preferredColors.length > 0) {
    lines.push(`Colores preferidos: ${training.preferredColors.join(', ')}`);
  }
  if (training.avoidColors.length > 0) {
    lines.push(`Colores a evitar: ${training.avoidColors.join(', ')}`);
  }
  if (training.skinToneContext) {
    lines.push(`Contexto de piel: ${training.skinToneContext}`);
  }
  lines.push('');

  if (training.preferredFabrics.length > 0) {
    lines.push(`Telas preferidas: ${training.preferredFabrics.join(', ')}`);
  }
  if (training.avoidFabrics.length > 0) {
    lines.push(`Telas a evitar: ${training.avoidFabrics.join(', ')}`);
  }
  lines.push('');

  if (training.bodyContext) {
    lines.push(`Contexto corporal: ${training.bodyContext}`);
  }
  if (training.fitPreferences) {
    lines.push(`Preferencias de ajuste: ${training.fitPreferences}`);
  }
  lines.push('');

  if (training.designRules) {
    lines.push(`Reglas de diseno:`);
    training.designRules.split('\n').forEach((rule, i) => {
      const trimmed = rule.trim();
      if (trimmed) lines.push(`  ${i + 1}. ${trimmed}`);
    });
  }
  lines.push('');

  if (training.inspirationBrands.length > 0) {
    lines.push(`Marcas de inspiracion: ${training.inspirationBrands.join(', ')}`);
  }
  if (training.inspirationNotes) {
    lines.push(`Notas de inspiracion: ${training.inspirationNotes}`);
  }
  lines.push('');

  lines.push(`Creatividad: ${training.creativityLevel}/10 (${CREATIVITY_LABELS[training.creativityLevel] ?? 'Equilibrado'})`);
  lines.push(`Idioma: ${training.languagePreference}`);

  if (training.likedExamples.length > 0) {
    lines.push('');
    lines.push('Ejemplos que le gustaron:');
    training.likedExamples.forEach((ex) => {
      lines.push(`  - [${ex.type}] ${ex.content}`);
    });
  }

  if (training.dislikedExamples.length > 0) {
    lines.push('');
    lines.push('Ejemplos que NO le gustaron:');
    training.dislikedExamples.forEach((ex) => {
      lines.push(`  - [${ex.type}] ${ex.content} (Razon: ${ex.reason})`);
    });
  }

  // Piece vocabulary
  if (training.pieceVocabulary && Object.keys(training.pieceVocabulary).length > 0) {
    lines.push('');
    lines.push('=== VOCABULARIO DE PIEZAS (que significa cada tipo para la disenadora) ===');
    for (const [type, def] of Object.entries(training.pieceVocabulary)) {
      if (!def.designerMeaning && !def.defaultSilhouette) continue;
      const pieceName = PIECE_TYPES.find(p => p.id === type)?.name || type;
      lines.push(`${pieceName}:`);
      if (def.designerMeaning) lines.push(`  Significado: ${def.designerMeaning}`);
      if (def.defaultSilhouette) lines.push(`  Silueta: ${def.defaultSilhouette}`);
      if (def.keyDetails?.length > 0) lines.push(`  Detalles clave: ${def.keyDetails.join(', ')}`);
      if (def.fitNotes) lines.push(`  Ajuste: ${def.fitNotes}`);
      if (def.versatility) lines.push(`  Versatilidad: ${def.versatility}`);
    }
  }

  lines.push('');
  lines.push('=== FIN PREFERENCIAS ===');

  return lines.join('\n');
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  variant = 'default',
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  variant?: 'default' | 'gold' | 'red';
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  const tagColors = {
    default: 'bg-muted text-foreground border-border',
    gold: 'bg-cereus-gold/10 text-cereus-gold border-cereus-gold/30',
    red: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-background min-h-[44px] focus-within:ring-2 focus-within:ring-cereus-gold/50 transition-all">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
            tagColors[variant],
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="ml-0.5 hover:opacity-70 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

function ColorGrid({
  colors,
  onAdd,
  onRemove,
  variant = 'default',
}: {
  colors: string[];
  onAdd: (color: string) => void;
  onRemove: (index: number) => void;
  variant?: 'default' | 'avoid';
}) {
  const [customColor, setCustomColor] = useState('#d4a574');
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      {/* Selected colors */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color, i) => (
            <button
              key={`${color}-${i}`}
              type="button"
              onClick={() => onRemove(i)}
              className={cn(
                'group relative w-10 h-10 rounded-lg shadow-sm transition-all hover:scale-110',
                variant === 'avoid' && 'ring-2 ring-red-500/50',
              )}
              style={{ backgroundColor: color }}
              title={`${color} — click para quitar`}
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                <X className="w-4 h-4 text-white" />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Preset palette */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.filter((c) => !colors.includes(c)).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onAdd(color)}
            className="w-7 h-7 rounded-md border border-border/50 hover:scale-125 hover:shadow-md transition-all"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom color picker */}
      <div className="flex items-center gap-2">
        <input
          ref={pickerRef}
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="w-8 h-8 rounded-md cursor-pointer border border-border"
        />
        <span className="text-xs text-muted-foreground font-mono">{customColor}</span>
        <button
          type="button"
          onClick={() => {
            if (!colors.includes(customColor)) onAdd(customColor);
          }}
          className="text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Agregar
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cereus-gold/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cereus-gold" />
        </div>
        <h3 className="text-lg font-display font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PreviewModal({
  training,
  onClose,
}: {
  training: AITrainingData;
  onClose: () => void;
}) {
  const context = buildAITrainingContext(training);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-cereus-gold" />
            <h3 className="font-display font-semibold">Vista previa del contexto IA</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <p className="text-xs text-muted-foreground mb-3">
            Este texto se agrega automaticamente como contexto en cada generacion de IA:
          </p>
          <pre className="text-sm font-mono bg-muted/50 border border-border rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
            {context}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

export function AITrainingPage() {
  const [training, setTraining] = useState<AITrainingData>(EMPTY_TRAINING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Liked / Disliked example form state
  const [likedType, setLikedType] = useState('silueta');
  const [likedContent, setLikedContent] = useState('');
  const [dislikedType, setDislikedType] = useState('silueta');
  const [dislikedContent, setDislikedContent] = useState('');
  const [dislikedReason, setDislikedReason] = useState('');

  // ─── Load ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cereus/ai/training');
        if (res.ok) {
          const data = await res.json();
          if (data.ai_training) {
            setTraining({ ...EMPTY_TRAINING, ...data.ai_training });
          }
        }
      } catch {
        // ignore — use empty defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Save ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/cereus/ai/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(training),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [training]);

  // ─── Updaters ───────────────────────────────────────────
  const update = useCallback(<K extends keyof AITrainingData>(key: K, value: AITrainingData[K]) => {
    setTraining((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addTag = useCallback((key: keyof AITrainingData, tag: string) => {
    setTraining((prev) => ({
      ...prev,
      [key]: [...(prev[key] as string[]), tag],
    }));
  }, []);

  const removeTag = useCallback((key: keyof AITrainingData, index: number) => {
    setTraining((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index),
    }));
  }, []);

  const addLikedExample = useCallback(() => {
    if (!likedContent.trim()) return;
    setTraining((prev) => ({
      ...prev,
      likedExamples: [
        ...prev.likedExamples,
        { type: likedType, content: likedContent.trim(), date: new Date().toISOString().split('T')[0] },
      ],
    }));
    setLikedContent('');
  }, [likedType, likedContent]);

  const addDislikedExample = useCallback(() => {
    if (!dislikedContent.trim() || !dislikedReason.trim()) return;
    setTraining((prev) => ({
      ...prev,
      dislikedExamples: [
        ...prev.dislikedExamples,
        {
          type: dislikedType,
          content: dislikedContent.trim(),
          reason: dislikedReason.trim(),
          date: new Date().toISOString().split('T')[0],
        },
      ],
    }));
    setDislikedContent('');
    setDislikedReason('');
  }, [dislikedType, dislikedContent, dislikedReason]);

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cereus-gold" />
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cereus-gold to-cereus-gold/60 flex items-center justify-center shadow-lg shadow-cereus-gold/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Entrenar mi IA</h1>
            <p className="text-sm text-muted-foreground">
              Define tu estilo y preferencias para que la IA te entienda mejor cada vez
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Section 1: Identidad de Marca */}
        <SectionCard icon={Target} title="Identidad de Marca">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Voz de marca</label>
              <textarea
                value={training.brandVoice}
                onChange={(e) => update('brandVoice', e.target.value)}
                placeholder="Describe el tono de tu marca... ej: elegante pero accesible, vanguardista y disruptivo"
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valores de marca</label>
              <TagInput
                tags={training.brandValues}
                onAdd={(tag) => addTag('brandValues', tag)}
                onRemove={(i) => removeTag('brandValues', i)}
                placeholder="Agrega valores: artesania, sostenibilidad, feminidad..."
                variant="gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Publico objetivo</label>
              <textarea
                value={training.targetAudience}
                onChange={(e) => update('targetAudience', e.target.value)}
                placeholder="Describe a tu clienta ideal... ej: Mujer peruana 25-45, profesional, busca piezas unicas"
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Estilo y Preferencias */}
        <SectionCard icon={Sparkles} title="Estilo y Preferencias">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Palabras clave de mi estilo</label>
              <TagInput
                tags={training.styleKeywords}
                onAdd={(tag) => addTag('styleKeywords', tag)}
                onRemove={(i) => removeTag('styleKeywords', i)}
                placeholder="fluido, organico, bordado a mano..."
                variant="gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                Palabras que NUNCA quiero ver
                <X className="w-3.5 h-3.5 text-red-500" />
              </label>
              <TagInput
                tags={training.avoidKeywords}
                onAdd={(tag) => addTag('avoidKeywords', tag)}
                onRemove={(i) => removeTag('avoidKeywords', i)}
                placeholder="cadenas, herrajes, industrial..."
                variant="red"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cereus-gold" />
                Nivel de creatividad
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={training.creativityLevel}
                  onChange={(e) => update('creativityLevel', Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-cereus-gold"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Clasico y seguro</span>
                  <span className="text-lg font-display font-bold text-cereus-gold">
                    {training.creativityLevel}
                  </span>
                  <span className="text-xs text-muted-foreground">Experimental y arriesgado</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {CREATIVITY_LABELS[training.creativityLevel]}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Color y Tono de Piel */}
        <SectionCard icon={Palette} title="Color y Tono de Piel">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Colores preferidos</label>
              <ColorGrid
                colors={training.preferredColors}
                onAdd={(color) => addTag('preferredColors', color)}
                onRemove={(i) => removeTag('preferredColors', i)}
              />
            </div>
            <div className="border-t border-border pt-5">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                Colores a evitar
                <X className="w-3.5 h-3.5 text-red-500" />
              </label>
              <ColorGrid
                colors={training.avoidColors}
                onAdd={(color) => addTag('avoidColors', color)}
                onRemove={(i) => removeTag('avoidColors', i)}
                variant="avoid"
              />
            </div>
            <div className="border-t border-border pt-5">
              <label className="text-sm font-medium mb-1.5 block">Contexto de tono de piel</label>
              <textarea
                value={training.skinToneContext}
                onChange={(e) => update('skinToneContext', e.target.value)}
                placeholder="Describe el tono de piel de tus clientas... ej: Piel trigue&ntilde;a, morena, mestiza peruana - subtonos calidos"
                rows={2}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 4: Telas y Materiales */}
        <SectionCard icon={Shirt} title="Telas y Materiales">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Telas preferidas</label>
              <TagInput
                tags={training.preferredFabrics}
                onAdd={(tag) => addTag('preferredFabrics', tag)}
                onRemove={(i) => removeTag('preferredFabrics', i)}
                placeholder="seda, algodon organico, lino..."
                variant="gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                Telas a evitar
                <X className="w-3.5 h-3.5 text-red-500" />
              </label>
              <TagInput
                tags={training.avoidFabrics}
                onAdd={(tag) => addTag('avoidFabrics', tag)}
                onRemove={(i) => removeTag('avoidFabrics', i)}
                placeholder="poliester, nylon..."
                variant="red"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Cuerpo y Ajuste */}
        <SectionCard icon={Ruler} title="Cuerpo y Ajuste">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Contexto corporal</label>
              <textarea
                value={training.bodyContext}
                onChange={(e) => update('bodyContext', e.target.value)}
                placeholder="ej: Mujer latina 1.55-1.65m, curvas, caderas pronunciadas"
                rows={2}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Preferencias de ajuste</label>
              <textarea
                value={training.fitPreferences}
                onChange={(e) => update('fitPreferences', e.target.value)}
                placeholder="ej: Siluetas que abracen el cuerpo sin apretar, cintura definida"
                rows={2}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 6: Reglas de Diseno */}
        <SectionCard icon={BookOpen} title="Reglas de Diseno">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Escribe las reglas que la IA debe seguir siempre
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Escribe una regla por linea. Se mostraran como lista numerada.
            </p>
            <textarea
              value={training.designRules}
              onChange={(e) => update('designRules', e.target.value)}
              placeholder={"Nunca mas de 3 colores por pieza\nSiempre incluir bolsillos funcionales\nEvitar cierres visibles\nLas costuras deben ser francesas o invisibles"}
              rows={6}
              className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all font-mono"
            />
            {training.designRules && (
              <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Vista previa:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {training.designRules.split('\n').filter((l) => l.trim()).map((rule, i) => (
                    <li key={i} className="text-foreground/80">{rule.trim()}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Section 7: Inspiracion */}
        <SectionCard icon={Heart} title="Inspiracion">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Marcas de inspiracion</label>
              <TagInput
                tags={training.inspirationBrands}
                onAdd={(tag) => addTag('inspirationBrands', tag)}
                onRemove={(i) => removeTag('inspirationBrands', i)}
                placeholder="Johanna Ortiz, Carolina Herrera, Silvia Tcherassi..."
                variant="gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notas de inspiracion</label>
              <textarea
                value={training.inspirationNotes}
                onChange={(e) => update('inspirationNotes', e.target.value)}
                placeholder="ej: Me inspira la artesania peruana, los textiles de Cusco, la naturaleza..."
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50 transition-all"
              />
            </div>
          </div>
        </SectionCard>

        {/* Section 8: Ejemplos */}
        <SectionCard icon={Paintbrush} title="Ejemplos: Lo que me gusta / Lo que NO">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liked */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-emerald-600">Me gusto</h4>
              </div>

              {/* Add form */}
              <div className="space-y-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <select
                  value={likedType}
                  onChange={(e) => setLikedType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs"
                >
                  {EXAMPLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  value={likedContent}
                  onChange={(e) => setLikedContent(e.target.value)}
                  placeholder="Describe lo que te gusto..."
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs"
                  onKeyDown={(e) => { if (e.key === 'Enter') addLikedExample(); }}
                />
                <button
                  type="button"
                  onClick={addLikedExample}
                  disabled={!likedContent.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {training.likedExamples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                          {ex.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{ex.date}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{ex.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        update('likedExamples', training.likedExamples.filter((_, idx) => idx !== i))
                      }
                      className="p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
                {training.likedExamples.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aun no has agregado ejemplos que te gusten
                  </p>
                )}
              </div>
            </div>

            {/* Disliked */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-500">No me gusto</h4>
              </div>

              {/* Add form */}
              <div className="space-y-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                <select
                  value={dislikedType}
                  onChange={(e) => setDislikedType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs"
                >
                  {EXAMPLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  value={dislikedContent}
                  onChange={(e) => setDislikedContent(e.target.value)}
                  placeholder="Describe lo que NO te gusto..."
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs"
                />
                <input
                  value={dislikedReason}
                  onChange={(e) => setDislikedReason(e.target.value)}
                  placeholder="Por que no te gusto?"
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs"
                  onKeyDown={(e) => { if (e.key === 'Enter') addDislikedExample(); }}
                />
                <button
                  type="button"
                  onClick={addDislikedExample}
                  disabled={!dislikedContent.trim() || !dislikedReason.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {training.dislikedExamples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                          {ex.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{ex.date}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{ex.content}</p>
                      <p className="text-[11px] text-red-500/80 mt-0.5 italic">Razon: {ex.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        update('dislikedExamples', training.dislikedExamples.filter((_, idx) => idx !== i))
                      }
                      className="p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
                {training.dislikedExamples.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aun no has agregado ejemplos que no te gusten
                  </p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 9: Vocabulario de Piezas */}
        <SectionCard
          icon={Shirt}
          title="Vocabulario de Piezas"
        >
          <p className="text-sm text-muted-foreground -mt-3 mb-4">
            Define que significa cada tipo de prenda en TU lenguaje de diseno
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PIECE_TYPES.map(piece => {
              const vocab = training.pieceVocabulary[piece.id] || { designerMeaning: '', defaultSilhouette: '', keyDetails: [], fitNotes: '', versatility: '' };
              const hasContent = vocab.designerMeaning || vocab.defaultSilhouette;
              return (
                <details key={piece.id} className={`border rounded-xl overflow-hidden transition-colors ${hasContent ? 'border-cereus-gold/30 bg-cereus-gold/5' : 'border-border'}`}>
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <span className="text-lg">{piece.icon}</span>
                    <span className="text-sm font-medium flex-1">{piece.name}</span>
                    {hasContent && <Check className="w-4 h-4 text-cereus-gold" />}
                  </summary>
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Que significa esta pieza para ti?</label>
                      <textarea
                        value={vocab.designerMeaning}
                        onChange={e => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, designerMeaning: e.target.value } } })}
                        rows={2}
                        placeholder={`Ej: Para mi un ${piece.name.toLowerCase()} es...`}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Silueta por defecto</label>
                        <input
                          value={vocab.defaultSilhouette}
                          onChange={e => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, defaultSilhouette: e.target.value } } })}
                          placeholder="Ej: A-line, recto, fluido..."
                          className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Como debe quedar</label>
                        <input
                          value={vocab.fitNotes}
                          onChange={e => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, fitNotes: e.target.value } } })}
                          placeholder="Ej: Ceñido cintura, fluido cadera"
                          className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Versatilidad / Combinaciones</label>
                      <input
                        value={vocab.versatility}
                        onChange={e => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, versatility: e.target.value } } })}
                        placeholder="Ej: Se usa con falda larga O pantalon ancho, tambien sola"
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-cereus-gold/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Detalles que siempre incluyo</label>
                      <TagInput
                        tags={vocab.keyDetails}
                        onAdd={tag => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, keyDetails: [...vocab.keyDetails, tag] } } })}
                        onRemove={idx => setTraining({ ...training, pieceVocabulary: { ...training.pieceVocabulary, [piece.id]: { ...vocab, keyDetails: vocab.keyDetails.filter((_, i) => i !== idx) } } })}
                        placeholder="Ej: bolsillos, cinturon..."
                      />
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium animate-in fade-in slide-in-from-left-2">
                <Check className="w-4 h-4" />
                Guardado
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Eye className="w-4 h-4" />
              Vista previa
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-cereus-gold text-white hover:bg-cereus-gold/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cereus-gold/20"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Preferencias
            </button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal training={training} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
