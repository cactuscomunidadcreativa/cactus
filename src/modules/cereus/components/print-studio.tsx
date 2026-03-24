'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Palette,
  Grid,
  Repeat,
  Image,
  Save,
  RefreshCw,
  X,
} from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────

interface ColorEntry {
  hex: string;
  name: string;
}

interface PrintStudioProps {
  maisonId: string;
  collectionConcept?: string;
  colorStory?: ColorEntry[];
  onSave?: (printUrl: string, printName: string) => void;
  onClose?: () => void;
}

type PrintScale = 'pequeno' | 'mediano' | 'grande';

interface GeneratedPrint {
  imageUrl?: string;
  svgData?: string;
  source: 'dall-e' | 'svg-fallback';
  prompt: string;
  timestamp: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────

const PRINT_STYLES = [
  { value: 'floral', label: 'Floral' },
  { value: 'geometrico', label: 'Geom\u00e9trico' },
  { value: 'abstracto', label: 'Abstracto' },
  { value: 'rayas', label: 'Rayas' },
  { value: 'puntos', label: 'Puntos' },
  { value: 'paisley', label: 'Paisley' },
  { value: 'animal', label: 'Animal' },
  { value: 'tropical', label: 'Tropical' },
  { value: 'etnico', label: '\u00c9tnico' },
];

const SCALE_OPTIONS: { value: PrintScale; label: string }[] = [
  { value: 'pequeno', label: 'Peque\u00f1o' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
];

// ─── COMPONENT ──────────────────────────────────────────────

export default function PrintStudio({
  maisonId,
  collectionConcept,
  colorStory = [],
  onSave,
  onClose,
}: PrintStudioProps) {
  // Controls state
  const [style, setStyle] = useState('floral');
  const [motifs, setMotifs] = useState('');
  const [scale, setScale] = useState<PrintScale>('mediano');
  const [repeatable, setRepeatable] = useState(true);
  const [selectedColors, setSelectedColors] = useState<string[]>(
    colorStory.slice(0, 3).map((c) => c.hex),
  );
  const [customColor, setCustomColor] = useState('#c7a86b');
  const [referenceDescription, setReferenceDescription] = useState('');
  const [printName, setPrintName] = useState('');

  // Generation state
  const [loading, setLoading] = useState(false);
  const [currentPrint, setCurrentPrint] = useState<GeneratedPrint | null>(null);
  const [history, setHistory] = useState<GeneratedPrint[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Color selection helpers ─────────────────────────────

  const toggleColor = useCallback((hex: string) => {
    setSelectedColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex],
    );
  }, []);

  const addCustomColor = useCallback(() => {
    if (customColor && !selectedColors.includes(customColor)) {
      setSelectedColors((prev) => [...prev, customColor]);
    }
  }, [customColor, selectedColors]);

  // ── Generate print ──────────────────────────────────────

  const generate = useCallback(async () => {
    if (!style || !selectedColors.length) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cereus/ai/generate-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maisonId,
          style,
          colors: selectedColors,
          motifs: motifs || style,
          scale,
          repeat: repeatable,
          collectionConcept,
          referenceDescription: referenceDescription || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error generating print' }));
        throw new Error(data.error || 'Error generating print');
      }

      const data = await res.json();
      const print: GeneratedPrint = {
        imageUrl: data.imageUrl,
        svgData: data.svgData,
        source: data.source,
        prompt: data.prompt,
        timestamp: Date.now(),
      };

      setCurrentPrint(print);
      setHistory((prev) => [print, ...prev].slice(0, 3));

      if (!printName) {
        const styleName = PRINT_STYLES.find((s) => s.value === style)?.label || style;
        setPrintName(`Print ${styleName} ${new Date().toLocaleDateString('es-MX')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [
    maisonId,
    style,
    selectedColors,
    motifs,
    scale,
    repeatable,
    collectionConcept,
    referenceDescription,
    printName,
  ]);

  // ── Save handler ────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!currentPrint || !printName) return;

    const url =
      currentPrint.imageUrl ||
      `data:image/svg+xml;base64,${btoa(currentPrint.svgData || '')}`;

    onSave?.(url, printName);
  }, [currentPrint, printName, onSave]);

  // ── SVG preview as CSS background ───────────────────────

  const getPreviewBackground = useCallback((print: GeneratedPrint) => {
    if (print.imageUrl) return undefined;
    if (!print.svgData) return undefined;
    const encoded = encodeURIComponent(print.svgData);
    return `url("data:image/svg+xml,${encoded}")`;
  }, []);

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <Palette className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Print Studio</h2>
            <p className="text-xs text-stone-500">Dise\u00f1a estampados textiles con IA</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body: two-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── LEFT PANEL: Controls ─────────────────────────── */}
        <div className="w-80 shrink-0 border-r border-stone-200 overflow-y-auto p-5 space-y-5">
          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Estilo del Print
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {PRINT_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Motifs */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Motivos
            </label>
            <input
              type="text"
              value={motifs}
              onChange={(e) => setMotifs(e.target.value)}
              placeholder="ej. lib\u00e9lulas doradas sobre hojas"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Scale */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Escala
            </label>
            <div className="flex gap-2">
              {SCALE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 text-center py-1.5 px-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    scale === opt.value
                      ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                      : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="print-scale"
                    value={opt.value}
                    checked={scale === opt.value}
                    onChange={() => setScale(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="print-repeat"
              checked={repeatable}
              onChange={(e) => setRepeatable(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-400"
            />
            <label htmlFor="print-repeat" className="text-sm text-stone-700 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              Repetible
            </label>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Colores
            </label>
            {/* Color story swatches */}
            {colorStory.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {colorStory.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => toggleColor(c.hex)}
                    title={c.name}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColors.includes(c.hex)
                        ? 'border-amber-500 ring-2 ring-amber-300 scale-110'
                        : 'border-stone-300 hover:border-stone-400'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
            {/* Selected colors display */}
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedColors.map((hex) => (
                  <span
                    key={hex}
                    className="inline-flex items-center gap-1 text-xs bg-stone-100 rounded-full pl-1 pr-2 py-0.5"
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-stone-300"
                      style={{ backgroundColor: hex }}
                    />
                    {hex}
                    <button
                      onClick={() => toggleColor(hex)}
                      className="text-stone-400 hover:text-stone-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Custom color picker */}
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <button
                onClick={addCustomColor}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Agregar color
              </button>
            </div>
          </div>

          {/* Reference description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Contexto de referencia
            </label>
            <textarea
              value={referenceDescription}
              onChange={(e) => setReferenceDescription(e.target.value)}
              rows={3}
              placeholder="Describe qu\u00e9 inspir\u00f3 este print..."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !selectedColors.length}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generar Print
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* ─── RIGHT PANEL: Preview + Results ───────────────── */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          {/* Preview area */}
          <div className="flex-1 min-h-[320px] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden relative">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-amber-700">
                <Sparkles className="w-8 h-8 animate-pulse" />
                <span className="text-sm font-medium animate-pulse">Generando print...</span>
              </div>
            )}

            {!loading && !currentPrint && (
              <div className="flex flex-col items-center gap-3 text-stone-400">
                <Image className="w-10 h-10" />
                <span className="text-sm">El preview aparecer\u00e1 aqu\u00ed</span>
              </div>
            )}

            {!loading && currentPrint && currentPrint.imageUrl && (
              <img
                src={currentPrint.imageUrl}
                alt="Generated print"
                className="w-full h-full object-cover"
              />
            )}

            {!loading && currentPrint && currentPrint.svgData && !currentPrint.imageUrl && (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: getPreviewBackground(currentPrint),
                  backgroundRepeat: 'repeat',
                  backgroundSize: scale === 'pequeno' ? '64px 64px' : scale === 'mediano' ? '128px 128px' : '192px 192px',
                }}
              />
            )}

            {currentPrint?.source && (
              <span className="absolute top-3 right-3 text-[10px] bg-white/80 backdrop-blur rounded-full px-2 py-0.5 text-stone-500">
                {currentPrint.source === 'dall-e' ? 'DALL-E' : 'SVG'}
              </span>
            )}
          </div>

          {/* Actions below preview */}
          {currentPrint && !loading && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={generate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm hover:bg-stone-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={printName}
                  onChange={(e) => setPrintName(e.target.value)}
                  placeholder="Nombre del print"
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={handleSave}
                  disabled={!printName}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar como Material
                </button>
              </div>
            </div>
          )}

          {/* History thumbnails */}
          {history.length > 0 && (
            <div className="mt-5 pt-4 border-t border-stone-200">
              <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5" />
                Historial reciente
              </h4>
              <div className="flex gap-2">
                {history.map((print) => (
                  <button
                    key={print.timestamp}
                    onClick={() => setCurrentPrint(print)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden transition-all shrink-0 ${
                      currentPrint?.timestamp === print.timestamp
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {print.imageUrl ? (
                      <img
                        src={print.imageUrl}
                        alt="Print"
                        className="w-full h-full object-cover"
                      />
                    ) : print.svgData ? (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: getPreviewBackground(print),
                          backgroundRepeat: 'repeat',
                          backgroundSize: '32px 32px',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                        <Image className="w-4 h-4 text-stone-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
