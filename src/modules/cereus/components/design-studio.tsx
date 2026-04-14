'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil, Eraser, Undo2, Redo2, Download, Save, Layers, Palette,
  Plus, Trash2, Eye, EyeOff, Upload, Image as ImageIcon, Square,
  Circle, Minus, type LucideIcon, ZoomIn, ZoomOut, RotateCcw,
  Shirt, Scissors, ChevronRight, Sparkles, X, Check, Move,
  PenLine, Send,
} from 'lucide-react';
import { CollapsibleSidebar } from './collapsible-sidebar'

// ─── TYPES ──────────────────────────────────────────────────

interface DesignLayer {
  id: string;
  name: string;
  type: 'sketch' | 'texture' | 'color' | 'image';
  visible: boolean;
  opacity: number;
  data?: string; // base64 canvas data or image URL
  color?: string;
  textureUrl?: string;
}

interface TextureItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface ColorPalette {
  name: string;
  colors: string[];
}

// ─── PRESET DATA ────────────────────────────────────────────

const GARMENT_TEMPLATES = [
  { id: 'dress', name: 'Vestido', icon: '👗', silhouette: 'M 120,40 C 100,40 80,60 75,100 L 70,200 C 70,250 60,300 50,350 L 190,350 C 180,300 170,250 170,200 L 165,100 C 160,60 140,40 120,40 Z' },
  { id: 'blouse', name: 'Blusa', icon: '👚', silhouette: 'M 120,40 C 95,40 70,55 65,80 L 40,120 L 65,130 L 60,200 L 180,200 L 175,130 L 200,120 L 175,80 C 170,55 145,40 120,40 Z' },
  { id: 'skirt', name: 'Falda', icon: '🩳', silhouette: 'M 70,80 L 65,100 C 60,180 50,260 40,340 L 200,340 C 190,260 180,180 175,100 L 170,80 Z' },
  { id: 'pants', name: 'Pantalon', icon: '👖', silhouette: 'M 80,60 L 75,160 L 60,340 L 110,340 L 120,180 L 130,340 L 180,340 L 165,160 L 160,60 Z' },
  { id: 'jacket', name: 'Chaqueta', icon: '🧥', silhouette: 'M 120,30 C 95,30 70,50 65,80 L 30,110 L 55,140 L 50,250 L 90,250 L 95,150 L 120,140 L 145,150 L 150,250 L 190,250 L 185,140 L 210,110 L 175,80 C 170,50 145,30 120,30 Z' },
  { id: 'top', name: 'Top', icon: '👕', silhouette: 'M 120,50 C 100,50 80,60 75,80 L 55,100 L 75,110 L 70,180 L 170,180 L 165,110 L 185,100 L 165,80 C 160,60 140,50 120,50 Z' },
];

const FABRIC_TEXTURES: TextureItem[] = [
  { id: 'silk', name: 'Seda', url: '', category: 'Delicados' },
  { id: 'cotton', name: 'Algodon', url: '', category: 'Basicos' },
  { id: 'linen', name: 'Lino', url: '', category: 'Basicos' },
  { id: 'taffeta', name: 'Taffeta', url: '', category: 'Formales' },
  { id: 'velvet', name: 'Terciopelo', url: '', category: 'Formales' },
  { id: 'chiffon', name: 'Chiffon', url: '', category: 'Delicados' },
  { id: 'organza', name: 'Organza', url: '', category: 'Delicados' },
  { id: 'denim', name: 'Denim', url: '', category: 'Casual' },
  { id: 'leather', name: 'Cuero', url: '', category: 'Especiales' },
  { id: 'lace', name: 'Encaje', url: '', category: 'Delicados' },
  { id: 'shantung', name: 'Shantung', url: '', category: 'Formales' },
  { id: 'crepe', name: 'Crepe', url: '', category: 'Basicos' },
];

const COLOR_PALETTES: ColorPalette[] = [
  { name: 'Positano', colors: ['#FFFFFF', '#F5E6D3', '#E8B87A', '#D4956A', '#8B4513', '#2F1810'] },
  { name: 'Equilibrium', colors: ['#0A0A0A', '#2C2C2C', '#5A5A5A', '#969696', '#C8C8C8', '#F0F0F0'] },
  { name: 'Origenes', colors: ['#6B1D34', '#8B2E4A', '#A04060', '#C4A035', '#D4B84E', '#F0EBE0'] },
  { name: 'Oceano', colors: ['#0C2340', '#1B4569', '#2D7D9F', '#5BB5CF', '#A8D8EA', '#E0F0F5'] },
  { name: 'Tierra', colors: ['#3E2723', '#5D4037', '#795548', '#A1887F', '#BCAAA4', '#D7CCC8'] },
  { name: 'Jardin', colors: ['#1B5E20', '#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#E8F5E9'] },
];

const BRUSH_SIZES = [2, 4, 8, 12, 20, 32];

// ─── CANVAS DRAWING ─────────────────────────────────────────

function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'move' | 'annotate'>('pencil');
  const [brushSize, setBrushSize] = useState(4);
  const [color, setColor] = useState('#0A0A0A');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [correctionLayer, setCorrectionLayer] = useState<string | null>(null)
  const [aiPhase, setAiPhase] = useState('')
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDistRef = useRef<number | null>(null)

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvasRef, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex - 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIndex];
    setHistoryIndex(newIndex);
  }, [canvasRef, history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex + 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIndex];
    setHistoryIndex(newIndex);
  }, [canvasRef, history, historyIndex]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [canvasRef, saveState]);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Pointer tracking for pinch zoom
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values())
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      return
    }
    // Palm rejection - ignore touch when drawing
    if (e.pointerType === 'touch' && tool !== 'move') return

    const canvas = canvasRef.current;
    if (!canvas || tool === 'move') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    const pressure = e.pressure || 0.5
    ctx.lineWidth = brushSize * (0.4 + pressure * 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'annotate') {
      if (!correctionLayer) setCorrectionLayer(canvas.toDataURL('image/png'))
      ctx.strokeStyle = '#FF6B35'
      ctx.globalCompositeOperation = 'source-over'
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    setIsDrawing(true);
  }, [canvasRef, tool, brushSize, color, correctionLayer]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Handle pinch zoom
    if (pointersRef.current.size >= 2) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      if (lastPinchDistRef.current) {
        const scale = dist / lastPinchDistRef.current
        setZoom(prev => Math.min(Math.max(prev * scale, 0.5), 4))
        lastPinchDistRef.current = dist
      }
      return
    }

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, canvasRef]);

  const stopDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) lastPinchDistRef.current = null
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  }, [isDrawing, saveState]);

  return {
    tool, setTool, brushSize, setBrushSize, color, setColor,
    startDrawing, draw, stopDrawing, undo, redo, clearCanvas,
    canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1,
    correctionLayer, setCorrectionLayer, aiPhase, setAiPhase,
    zoom, setZoom, panOffset, setPanOffset,
  };
}

// ─── DESIGN STUDIO COMPONENT ───────────────────────────────

export function DesignStudio({
  maisonId,
  onSaveDesign,
}: {
  maisonId: string;
  collectionId?: string | null;
  onSaveDesign?: (data: { name: string; canvasData: string; template: string; fabric: string; colors: string[] }) => void | Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    tool, setTool, brushSize, setBrushSize, color, setColor,
    startDrawing, draw, stopDrawing, undo, redo, clearCanvas,
    canUndo, canRedo,
    correctionLayer, setCorrectionLayer, aiPhase, setAiPhase,
    zoom, setZoom, panOffset, setPanOffset,
  } = useCanvas(canvasRef);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(['#0A0A0A']);
  const [activePalette, setActivePalette] = useState(0);
  const [designName, setDesignName] = useState('');
  const [activePanel, setActivePanel] = useState<'templates' | 'fabrics' | 'colors' | 'layers'>('templates');
  const [step, setStep] = useState(1); // 1: Template, 2: Sketch, 3: Texture/Color, 4: Save
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [designBrief, setDesignBrief] = useState<{
    concept?: string;
    silhouetteNotes?: string;
    fabricNotes?: string;
    trendAlignment?: string;
    constructionDetails?: string[];
    designerTips?: string;
  } | null>(null);
  const [trendInfo, setTrendInfo] = useState<{
    silhouette?: { name: string; description: string };
    mood?: string[];
  } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 800);
    }
  }, []);

  // Draw template silhouette
  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw silhouette as pencil sketch
    const template = GARMENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const path = new Path2D(template.silhouette);

    // Scale to canvas
    ctx.save();
    ctx.translate(canvas.width / 2 - 120, canvas.height / 2 - 200);
    ctx.scale(2.5, 2.5);

    // Sketch style — light pencil strokes
    ctx.strokeStyle = '#B0B0B0';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.stroke(path);

    // Second pass — slightly offset for hand-drawn feel
    ctx.setLineDash([]);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 0.5;
    ctx.translate(0.5, 0.3);
    ctx.stroke(path);

    ctx.restore();

    setStep(2);
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setSaveMessage(null);
    const canvasData = canvas.toDataURL('image/png');

    try {
      if (onSaveDesign) {
        await onSaveDesign({
          name: designName || 'Sin Nombre',
          canvasData,
          template: selectedTemplate || '',
          fabric: selectedFabrics.join(', '),
          colors: selectedColors,
        });
      }
      setSaveMessage('Diseno guardado exitosamente');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch {
      setSaveMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const handleAICorrection = async () => {
    if (!canvasRef.current) return
    setGeneratingAI(true)
    setAiPhase('Analizando correcciones...')
    try {
      const annotatedCanvas = canvasRef.current.toDataURL('image/png')
      const res = await fetch('/api/cereus/ai/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'correct',
          annotatedCanvasData: annotatedCanvas,
          originalSketchUrl: correctionLayer,
          correctionNotes: '',
          maisonId,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.imageUrl) {
        setAiPhase('Aplicando correcciones...')
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
            setCorrectionLayer(null)
          }
          setGeneratingAI(false)
          setAiPhase('')
        }
        img.src = data.imageUrl
      }
    } catch (err) {
      setAiMessage('Error al procesar correcciones')
      setGeneratingAI(false)
      setAiPhase('')
    }
  }

  const steps = [
    { num: 1, label: 'Silueta', active: step >= 1 },
    { num: 2, label: 'Boceto', active: step >= 2 },
    { num: 3, label: 'Texturas y Color', active: step >= 3 },
    { num: 4, label: 'Guardar', active: step >= 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s.num
                  ? 'bg-cereus-gold text-white'
                  : s.active
                  ? 'bg-cereus-gold/10 text-cereus-gold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px]">
                {s.num}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* ─── LEFT: Canvas ─────────────────────────── */}
        <div className="flex-1">
          {/* Toolbar */}
          {step >= 2 && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-card border rounded-xl">
              <div className="flex items-center gap-1 border-r pr-2">
                <button
                  onClick={() => setTool('pencil')}
                  className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-cereus-gold/10 text-cereus-gold' : 'hover:bg-muted'}`}
                  title="Lapiz"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-cereus-gold/10 text-cereus-gold' : 'hover:bg-muted'}`}
                  title="Borrador"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTool('annotate')}
                  className={`p-2 rounded-lg transition-colors ${tool === 'annotate' ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300' : 'hover:bg-muted'}`}
                  title="Corregir diseño"
                >
                  <PenLine className="w-4 h-4" />
                </button>
              </div>

              {/* Brush sizes */}
              <div className="flex items-center gap-1 border-r pr-2">
                {BRUSH_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      brushSize === size ? 'bg-cereus-gold/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{ width: Math.min(size, 16), height: Math.min(size, 16) }}
                    />
                  </button>
                ))}
              </div>

              {/* Current color */}
              <div className="flex items-center gap-1 border-r pr-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0"
                />
                {selectedColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-cereus-gold' : 'border-gray-200'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1">
                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30">
                  <Redo2 className="w-4 h-4" />
                </button>
                <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-muted text-red-500" title="Limpiar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {correctionLayer && (
                <button
                  onClick={handleAICorrection}
                  disabled={generatingAI}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Enviar corrección a AI
                </button>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ZoomIn className="w-3 h-3" />
                <span>{Math.round(zoom * 100)}%</span>
                {zoom !== 1 && (
                  <button onClick={() => setZoom(1)} className="ml-1 text-xs underline">Reset</button>
                )}
              </div>
            </div>
          )}

          {/* Canvas area */}
          <div className="relative bg-white border rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            {step === 1 ? (
              /* Template Selection */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <Scissors className="w-10 h-10 text-muted-foreground mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Elige una Silueta Base</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Comienza con una plantilla de silueta que se dibujara como boceto a lapiz.
                </p>
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                  {GARMENT_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all hover:border-cereus-gold/50 text-center ${
                        selectedTemplate === t.id ? 'border-cereus-gold bg-cereus-gold/5' : 'border-border'
                      }`}
                    >
                      <span className="text-3xl">{t.icon}</span>
                      <p className="text-xs font-medium mt-2">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-full cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            )}
          </div>
        </div>

        {/* ─── RIGHT: Panel ─────────────────────────── */}
        <CollapsibleSidebar side="right" width="w-72" title="Herramientas">
          {/* Panel tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { id: 'templates' as const, icon: Shirt, label: 'Siluetas' },
              { id: 'fabrics' as const, icon: Layers, label: 'Texturas' },
              { id: 'colors' as const, icon: Palette, label: 'Colores' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => { setActivePanel(p.id); if (p.id === 'fabrics' || p.id === 'colors') setStep(3); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  activePanel === p.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <p.icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Templates Panel */}
          {activePanel === 'templates' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Click para aplicar como boceto base</p>
              {GARMENT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selectedTemplate === t.id ? 'border-cereus-gold bg-cereus-gold/5' : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-sm font-medium">{t.name}</span>
                  {selectedTemplate === t.id && <Check className="w-4 h-4 text-cereus-gold ml-auto" />}
                </button>
              ))}
            </div>
          )}

          {/* Fabrics Panel — Multi-select */}
          {activePanel === 'fabrics' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Selecciona una o mas telas (click para agregar/quitar)</p>

              {selectedFabrics.length > 0 && (
                <div className="flex flex-wrap gap-1 pb-2 border-b">
                  {selectedFabrics.map(fid => {
                    const f = FABRIC_TEXTURES.find(t => t.id === fid);
                    return (
                      <span key={fid} className="inline-flex items-center gap-1 px-2 py-1 bg-cereus-gold/10 text-cereus-gold rounded-full text-[10px] font-medium">
                        {f?.name || fid}
                        <button onClick={() => setSelectedFabrics(selectedFabrics.filter(x => x !== fid))} className="hover:text-red-500">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {['Basicos', 'Delicados', 'Formales', 'Casual', 'Especiales'].map(cat => {
                const items = FABRIC_TEXTURES.filter(f => f.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map(f => {
                        const isSelected = selectedFabrics.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFabrics(selectedFabrics.filter(x => x !== f.id));
                              } else {
                                setSelectedFabrics([...selectedFabrics, f.id]);
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all flex items-center justify-between ${
                              isSelected ? 'border-cereus-gold bg-cereus-gold/5 text-cereus-gold' : 'hover:bg-muted'
                            }`}
                          >
                            {f.name}
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl text-sm text-muted-foreground hover:border-cereus-gold/50 hover:text-cereus-gold transition-colors">
                <Upload className="w-4 h-4" />
                Subir Textura
              </button>
            </div>
          )}

          {/* Colors Panel */}
          {activePanel === 'colors' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Paletas de colores predefinidas</p>

              {COLOR_PALETTES.map((palette, pi) => (
                <div key={palette.name}>
                  <button
                    onClick={() => { setActivePalette(pi); setSelectedColors(palette.colors); }}
                    className={`w-full text-left mb-1.5 ${activePalette === pi ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    <span className="text-xs">{palette.name}</span>
                  </button>
                  <div className="flex gap-1">
                    {palette.colors.map((c, ci) => (
                      <button
                        key={ci}
                        onClick={() => { setColor(c); if (!selectedColors.includes(c)) setSelectedColors([...selectedColors, c]); }}
                        className={`flex-1 h-8 rounded-md border-2 transition-all ${
                          color === c ? 'border-cereus-gold scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Colores seleccionados</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedColors.map((c, i) => (
                    <div key={i} className="relative group">
                      <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: c }} />
                      <button
                        onClick={() => setSelectedColors(selectedColors.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-[8px] hidden group-hover:flex"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="color"
                    onChange={e => setSelectedColors([...selectedColors, e.target.value])}
                    className="w-8 h-8 rounded-lg cursor-pointer opacity-50 hover:opacity-100"
                    title="Agregar color"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save section */}
          <div className="border-t pt-4 space-y-3">
            <input
              value={designName}
              onChange={e => setDesignName(e.target.value)}
              placeholder="Nombre del diseno..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              {selectedTemplate && <p>Silueta: {GARMENT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>}
              {selectedFabrics.length > 0 && <p>Telas: {selectedFabrics.map(fid => FABRIC_TEXTURES.find(f => f.id === fid)?.name || fid).join(', ')}</p>}
              {selectedColors.length > 0 && <p>Colores: {selectedColors.length} seleccionados</p>}
            </div>
            <button
              onClick={() => { setStep(4); handleSave(); }}
              disabled={saving || (!designName && !selectedTemplate)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cereus-gold text-white rounded-lg text-sm font-medium hover:bg-cereus-gold/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Diseno</>
              )}
            </button>
            {saveMessage && (
              <p className={`text-xs text-center ${saveMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {saveMessage.includes('Error') ? '' : '✓ '}{saveMessage}
              </p>
            )}
            <button
              onClick={async () => {
                setGeneratingAI(true);
                setAiMessage(null);
                try {
                  const fabricNames = selectedFabrics.map(fid =>
                    FABRIC_TEXTURES.find(f => f.id === fid)?.name || fid
                  );
                  const res = await fetch('/api/cereus/ai/generate-sketch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      template: selectedTemplate || 'dress',
                      fabrics: fabricNames.length > 0 ? fabricNames : ['Seda'],
                      colors: selectedColors,
                      style: 'haute couture pencil sketch',
                      maisonId,
                      lang: 'es',
                    }),
                  });
                  const data = await res.json();

                  // Store trend + brief info
                  if (data.designBrief) setDesignBrief(data.designBrief);
                  if (data.trends) setTrendInfo({
                    silhouette: data.trends.silhouette,
                    mood: data.trends.mood,
                  });

                  const canvas = canvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;

                  if (data.imageUrl) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      setStep(2);
                      setAiMessage('Boceto generado con DALL-E + tendencias');
                    };
                    img.src = data.imageUrl;
                  } else if (data.svgData) {
                    // Remove XML comments that can break rendering
                    const cleanSvg = (data.svgData as string).replace(/<!--[\s\S]*?-->/g, '');

                    // Try multiple rendering approaches
                    const renderSVG = (svgStr: string): Promise<void> => {
                      return new Promise((resolve, reject) => {
                        // Approach 1: URL-encoded data URI (safest for special chars)
                        const encoded = encodeURIComponent(svgStr)
                          .replace(/'/g, '%27')
                          .replace(/"/g, '%22');
                        const dataUri = `data:image/svg+xml,${encoded}`;

                        const img = new Image();
                        img.onload = () => {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          ctx.fillStyle = '#FAFAF7';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.95;
                          const x = (canvas.width - img.width * scale) / 2;
                          const y = (canvas.height - img.height * scale) / 2;
                          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                          resolve();
                        };
                        img.onerror = () => reject(new Error('SVG render failed'));
                        img.src = dataUri;
                      });
                    };

                    try {
                      await renderSVG(cleanSvg);
                      setStep(2);
                      setAiMessage(data.message || 'Boceto generado con tendencias');
                    } catch {
                      // Approach 2: Blob URL fallback
                      try {
                        const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const img2 = new Image();
                        img2.onload = () => {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          ctx.fillStyle = '#FAFAF7';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
                          URL.revokeObjectURL(url);
                          setStep(2);
                          setAiMessage(data.message || 'Boceto generado');
                        };
                        img2.onerror = () => {
                          URL.revokeObjectURL(url);
                          setAiMessage('Error renderizando SVG. Configura OpenAI key para DALL-E.');
                        };
                        img2.src = url;
                      } catch {
                        setAiMessage('Error renderizando SVG.');
                      }
                    }
                  }
                } catch {
                  setAiMessage('Error al generar. Intenta de nuevo.');
                } finally {
                  setGeneratingAI(false);
                }
              }}
              disabled={generatingAI}
              className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              {generatingAI ? (
                <><div className="w-4 h-4 border-2 border-cereus-gold border-t-transparent rounded-full animate-spin" /> {aiPhase || 'Generando...'}</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar con IA</>
              )}
            </button>
            {aiMessage && (
              <p className="text-xs text-center text-muted-foreground">{aiMessage}</p>
            )}

            {/* Design Brief from AI */}
            {designBrief && (
              <div className="mt-3 p-3 bg-cereus-gold/5 border border-cereus-gold/20 rounded-xl space-y-2">
                <p className="text-[10px] font-medium text-cereus-gold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Concepto IA
                </p>
                {designBrief.concept && (
                  <p className="text-xs font-medium text-foreground">{designBrief.concept}</p>
                )}
                {designBrief.trendAlignment && (
                  <p className="text-[11px] text-muted-foreground">{designBrief.trendAlignment}</p>
                )}
                {designBrief.constructionDetails && designBrief.constructionDetails.length > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Detalles</p>
                    {designBrief.constructionDetails.slice(0, 4).map((d, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <span className="text-cereus-gold mt-0.5">•</span> {d}
                      </p>
                    ))}
                  </div>
                )}
                {designBrief.designerTips && (
                  <p className="text-[11px] italic text-cereus-gold/80">Tip: {designBrief.designerTips}</p>
                )}
              </div>
            )}

            {/* Trend Info */}
            {trendInfo && !designBrief && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tendencias aplicadas</p>
                {trendInfo.silhouette && (
                  <div>
                    <p className="text-xs font-medium">{trendInfo.silhouette.name}</p>
                    <p className="text-[11px] text-muted-foreground">{trendInfo.silhouette.description}</p>
                  </div>
                )}
                {trendInfo.mood && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trendInfo.mood.slice(0, 4).map((m, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-cereus-gold/10 text-cereus-gold rounded-full">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleSidebar>
      </div>
    </div>
  );
}
