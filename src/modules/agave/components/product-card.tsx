'use client';

import {
  calcularPrecioCompleto,
  clasificarPrecio,
  formatearPrecio,
  formatearPorcentaje,
  getEmojiForCategory,
  type MarginRange,
  DEFAULT_MARGIN_RANGES,
} from '../lib/pricing-engine';

interface Product {
  id: string;
  codigo?: string;
  nombre: string;
  proveedor?: string;
  costo_fob?: number;
  costo_cif?: number;
  costo_internado?: number;
  costo_puesto_cliente?: number;
}

interface ProductCardProps {
  product: Product;
  moneda?: string;
  margenObjetivo?: number;
  rangos?: MarginRange[];
  tipoCostoDefault?: string;
  onConsult?: (product: Product) => void;
}

export function ProductCard({
  product,
  moneda = 'USD',
  margenObjetivo = 0.27,
  rangos = DEFAULT_MARGIN_RANGES,
  tipoCostoDefault = 'CIF',
  onConsult,
}: ProductCardProps) {
  // Get the relevant cost based on default type
  const getCosto = () => {
    switch (tipoCostoDefault) {
      case 'FOB':
        return product.costo_fob || product.costo_cif || product.costo_internado || product.costo_puesto_cliente;
      case 'CIF':
        return product.costo_cif || product.costo_fob || product.costo_internado || product.costo_puesto_cliente;
      case 'INTERNADO':
        return product.costo_internado || product.costo_cif || product.costo_fob || product.costo_puesto_cliente;
      case 'PUESTO_CLIENTE':
        return product.costo_puesto_cliente || product.costo_internado || product.costo_cif || product.costo_fob;
      default:
        return product.costo_cif || product.costo_fob || product.costo_internado || product.costo_puesto_cliente;
    }
  };

  const costo = getCosto();

  if (!costo) {
    return (
      <div className="bg-card border rounded-xl p-4 opacity-50">
        <div className="font-medium text-sm truncate">{product.nombre}</div>
        {product.codigo && (
          <div className="text-xs text-muted-foreground font-mono">{product.codigo}</div>
        )}
        <div className="text-xs text-muted-foreground mt-2">Sin costo definido</div>
      </div>
    );
  }

  const calculation = calcularPrecioCompleto(costo, margenObjetivo, rangos);
  const classification = clasificarPrecio(calculation.precioRecomendado, costo, rangos);
  const emoji = getEmojiForCategory(classification.categoria);

  return (
    <div
      className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={() => onConsult?.(product)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {product.nombre}
          </div>
          {product.codigo && (
            <div className="text-xs text-muted-foreground font-mono">{product.codigo}</div>
          )}
        </div>
        <span className="text-lg">{emoji}</span>
      </div>

      {/* Costs */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Costo:</span>
          <span className="font-mono">{formatearPrecio(costo, moneda)}</span>
        </div>
        <div className="flex justify-between text-primary font-medium">
          <span>Recomendado:</span>
          <span className="font-mono">{formatearPrecio(calculation.precioRecomendado, moneda)}</span>
        </div>
      </div>

      {/* Category badge */}
      <div className="mt-3 flex items-center justify-between">
        <div
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: classification.color + '20',
            color: classification.color,
          }}
        >
          {classification.categoria}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatearPorcentaje(margenObjetivo)}
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile
export function ProductCardCompact({
  product,
  moneda = 'USD',
  margenObjetivo = 0.27,
  rangos = DEFAULT_MARGIN_RANGES,
  tipoCostoDefault = 'CIF',
  onConsult,
}: ProductCardProps) {
  const getCosto = () => {
    switch (tipoCostoDefault) {
      case 'FOB':
        return product.costo_fob || product.costo_cif;
      case 'CIF':
        return product.costo_cif || product.costo_fob;
      case 'INTERNADO':
        return product.costo_internado || product.costo_cif;
      case 'PUESTO_CLIENTE':
        return product.costo_puesto_cliente || product.costo_internado;
      default:
        return product.costo_cif || product.costo_fob;
    }
  };

  const costo = getCosto();
  if (!costo) return null;

  const calculation = calcularPrecioCompleto(costo, margenObjetivo, rangos);
  const classification = clasificarPrecio(calculation.precioRecomendado, costo, rangos);
  const emoji = getEmojiForCategory(classification.categoria);

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onConsult?.(product)}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{product.nombre}</div>
        <div className="text-xs text-muted-foreground">
          {formatearPrecio(costo, moneda)} → {formatearPrecio(calculation.precioRecomendado, moneda)}
        </div>
      </div>
      <div
        className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
        style={{
          backgroundColor: classification.color + '20',
          color: classification.color,
        }}
      >
        {classification.categoria}
      </div>
    </div>
  );
}
