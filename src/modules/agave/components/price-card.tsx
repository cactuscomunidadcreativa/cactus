'use client';

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, DollarSign } from 'lucide-react';

interface PriceRecommendation {
  producto: {
    nombre: string;
    costoBase: number;
    costoFinal: number;
  };
  precioMinimo: number;
  precioRecomendado: number;
  precioOptimo: number;
  precioPremium: number;
  categoriaActual: string;
  analisis?: {
    margenActual?: number;
    comparacionHistorico?: string;
    impactoAnual?: number;
    advertencias?: string[];
    sugerencias?: string[];
  };
}

interface PriceCardProps {
  recommendation: PriceRecommendation;
  compact?: boolean;
}

export function PriceCard({ recommendation, compact = false }: PriceCardProps) {
  const { producto, precioMinimo, precioRecomendado, precioOptimo, precioPremium, categoriaActual, analisis } = recommendation;

  const categoriaColors: Record<string, { bg: string; text: string; border: string }> = {
    'Crítico': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    'Muy Bajo': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    'Bajo': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    'Aceptable': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'Bueno': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'Muy Bueno': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    'Sobresaliente': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'Excelente': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  };

  const catStyle = categoriaColors[categoriaActual] || categoriaColors['Aceptable'];

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-agave-gold/30 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Precio recomendado</span>
          <span className="text-lg font-bold text-agave-petrol">${precioRecomendado.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-agave-gold/30 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-agave-gradient-soft px-4 py-3 border-b border-agave-gold/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-agave-gold" />
            <span className="font-medium text-agave-petrol">Precio Recomendado</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
            {categoriaActual}
          </span>
        </div>
      </div>

      {/* Main price */}
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-agave-petrol">
            ${precioRecomendado.toFixed(2)}
          </div>
          {analisis?.margenActual && (
            <div className="text-sm text-muted-foreground mt-1">
              Margen: <span className="font-medium text-green-600">{analisis.margenActual}%</span>
            </div>
          )}
        </div>

        {/* Price range */}
        <div className="space-y-2">
          <PriceRow
            label="Mínimo viable"
            price={precioMinimo}
            icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
            sublabel="15% margen"
            color="text-orange-600"
          />
          <PriceRow
            label="Recomendado"
            price={precioRecomendado}
            icon={<CheckCircle className="w-4 h-4 text-green-500" />}
            sublabel="27% margen"
            color="text-green-600"
            highlight
          />
          <PriceRow
            label="Óptimo"
            price={precioOptimo}
            icon={<TrendingUp className="w-4 h-4 text-teal-500" />}
            sublabel="31% margen"
            color="text-teal-600"
          />
          <PriceRow
            label="Premium"
            price={precioPremium}
            icon={<DollarSign className="w-4 h-4 text-purple-500" />}
            sublabel="37% margen"
            color="text-purple-600"
          />
        </div>

        {/* Suggestions */}
        {analisis?.sugerencias && analisis.sugerencias.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">💡 Sugerencias:</div>
            <ul className="space-y-1">
              {analisis.sugerencias.map((sug, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-agave-gold">•</span>
                  {sug}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Visual price bar */}
      <div className="px-4 pb-4">
        <div className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-purple-400 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-agave-petrol rounded-full shadow"
            style={{
              left: `${Math.min(90, Math.max(10, ((precioRecomendado - precioMinimo) / (precioPremium - precioMinimo)) * 100))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>⚠️ Riesgo</span>
          <span>💰 Premium</span>
        </div>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  price,
  icon,
  sublabel,
  color,
  highlight = false,
}: {
  label: string;
  price: number;
  icon: React.ReactNode;
  sublabel: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-lg ${
        highlight ? 'bg-green-50 border border-green-200' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
      </div>
      <div className={`font-semibold ${color}`}>${price.toFixed(2)}</div>
    </div>
  );
}

// Mini price indicator for quick view
export function PriceMini({ price, categoria }: { price: number; categoria: string }) {
  const isGood = ['Aceptable', 'Bueno', 'Muy Bueno', 'Sobresaliente', 'Excelente'].includes(categoria);

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
      isGood ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    }`}>
      <DollarSign className="w-3 h-3" />
      <span className="font-medium">{price.toFixed(2)}</span>
    </div>
  );
}
