'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onScriptChange: (script: string) => void;
  videoType: 'text-to-video' | 'avatar' | 'faceless' | 'carousel';
}

const SCRIPT_TEMPLATES: Record<string, string[]> = {
  'text-to-video': [
    '3 consejos para mejorar tu [tema]:\n\n1. [Consejo 1]\n2. [Consejo 2]\n3. [Consejo 3]\n\n¡Guarda este video!',
    '¿Sabías que [dato interesante]?\n\nAquí te explico cómo aprovecharlo...',
    'Antes vs Después de usar [producto/servicio]\n\nAntes: [problema]\nDespués: [solución]',
  ],
  carousel: [
    'Slide 1: [Título llamativo]\n\nSlide 2: [Problema que resuelves]\n\nSlide 3: [Tu solución]\n\nSlide 4: [Beneficio 1]\n\nSlide 5: [CTA]',
    'Slide 1: Cómo [lograr algo] en 5 pasos\n\nSlide 2: Paso 1\nSlide 3: Paso 2\nSlide 4: Paso 3\nSlide 5: Paso 4\nSlide 6: Paso 5\nSlide 7: ¡Listo!',
  ],
  faceless: [
    'Voz en off:\n\n[Introducción gancho - 3 segundos]\n\n[Desarrollo del tema - 10 segundos]\n\n[Conclusión y CTA - 5 segundos]',
  ],
  avatar: [
    '¡Hola! Soy [nombre/personaje].\n\nHoy te voy a contar sobre [tema]...\n\n[Contenido principal]\n\n¡No olvides seguirme para más tips!',
  ],
};

export function ScriptEditor({ script, onScriptChange, videoType }: ScriptEditorProps) {
  const t = useTranslations('ramona.videoStudio.scriptEditor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');

  const templates = SCRIPT_TEMPLATES[videoType] || SCRIPT_TEMPLATES['text-to-video'];
  const charCount = script.length;
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;

  // Estimate duration: ~150 words per minute for speaking
  const estimatedSeconds = Math.round((wordCount / 150) * 60);

  async function handleAIGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Genera un script corto para un video de ${videoType === 'text-to-video' ? 'texto animado' :
            videoType === 'carousel' ? 'carrusel de slides' :
            videoType === 'faceless' ? 'voiceover con b-roll' :
            'video con avatar'}.

Tema: ${topic}

Requisitos:
- Máximo 150 palabras
- Lenguaje conversacional
- Incluir gancho inicial
- Terminar con call-to-action
- ${videoType === 'carousel' ? 'Dividir en 5-7 slides claramente marcados' : ''}

Genera solo el script, sin explicaciones adicionales.`,
          systemPrompt: 'Eres un experto en crear scripts para videos cortos de redes sociales. Generas contenido viral y engaging.',
        }),
      });

      const data = await response.json();
      if (data.content) {
        onScriptChange(data.content);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    }

    setIsGenerating(false);
  }

  function handleUseTemplate(template: string) {
    onScriptChange(template);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-display font-semibold mb-2">
          {t('title')}
        </h3>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* AI Generator */}
      <div className="p-4 rounded-xl bg-ramona-purple-lighter dark:bg-ramona-purple/10 border border-ramona-purple/20">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-5 h-5 text-ramona-purple" />
          <h4 className="font-medium">{t('aiGenerate.title')}</h4>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('aiGenerate.placeholder')}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ramona-purple/50"
          />
          <button
            onClick={handleAIGenerate}
            disabled={!topic.trim() || isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-ramona-purple text-white rounded-lg hover:bg-ramona-purple-light disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {t('aiGenerate.button')}
          </button>
        </div>
      </div>

      {/* Script textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t('scriptLabel')}</label>
          <div className="text-xs text-muted-foreground">
            {charCount} {t('characters')} · {wordCount} {t('words')} · ~{estimatedSeconds}s
          </div>
        </div>
        <textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder={t('placeholder')}
          rows={10}
          className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ramona-purple/50 resize-none"
        />
        {charCount > 0 && charCount < 10 && (
          <p className="text-xs text-amber-500 mt-1">{t('tooShort')}</p>
        )}
        {charCount > 5000 && (
          <p className="text-xs text-red-500 mt-1">{t('tooLong')}</p>
        )}
      </div>

      {/* Templates */}
      <div>
        <h4 className="text-sm font-medium mb-3">{t('templates')}</h4>
        <div className="space-y-2">
          {templates.map((template, i) => (
            <button
              key={i}
              onClick={() => handleUseTemplate(template)}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-ramona-purple/50 hover:bg-muted/50 transition-colors"
            >
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.substring(0, 100)}...
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
