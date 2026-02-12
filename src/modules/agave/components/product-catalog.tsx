'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List } from 'lucide-react';
import { ProductCard, ProductCardCompact } from './product-card';
import { type MarginRange, DEFAULT_MARGIN_RANGES } from '../lib/pricing-engine';

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

interface ProductCatalogProps {
  products: Product[];
  moneda?: string;
  margenObjetivo?: number;
  rangos?: MarginRange[];
  tipoCostoDefault?: string;
  onConsultProduct?: (product: Product) => void;
  className?: string;
}

export function ProductCatalog({
  products,
  moneda = 'USD',
  margenObjetivo = 0.27,
  rangos = DEFAULT_MARGIN_RANGES,
  tipoCostoDefault = 'CIF',
  onConsultProduct,
  className = '',
}: ProductCatalogProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;

    const searchLower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchLower) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchLower)) ||
        (p.proveedor && p.proveedor.toLowerCase().includes(searchLower))
    );
  }, [products, search]);

  // Sort by name
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [filteredProducts]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 mb-4">
        {/* Search and view toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background"
            />
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="Vista cuadricula"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="Vista lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} de {products.length} productos
        </p>
      </div>

      {/* Products grid/list */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                moneda={moneda}
                margenObjetivo={margenObjetivo}
                rangos={rangos}
                tipoCostoDefault={tipoCostoDefault}
                onConsult={onConsultProduct}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedProducts.map((product) => (
              <ProductCardCompact
                key={product.id}
                product={product}
                moneda={moneda}
                margenObjetivo={margenObjetivo}
                rangos={rangos}
                tipoCostoDefault={tipoCostoDefault}
                onConsult={onConsultProduct}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {search ? (
              <>
                No se encontraron productos para "{search}"
                <button
                  onClick={() => setSearch('')}
                  className="block mx-auto mt-2 text-sm text-primary hover:underline"
                >
                  Limpiar busqueda
                </button>
              </>
            ) : (
              'No hay productos disponibles'
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact catalog for sidebar/mobile
export function ProductCatalogMini({
  products,
  moneda = 'USD',
  margenObjetivo = 0.27,
  rangos = DEFAULT_MARGIN_RANGES,
  tipoCostoDefault = 'CIF',
  onConsultProduct,
  maxItems = 5,
}: ProductCatalogProps & { maxItems?: number }) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, maxItems);

    const searchLower = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchLower) ||
          (p.codigo && p.codigo.toLowerCase().includes(searchLower))
      )
      .slice(0, maxItems);
  }, [products, search, maxItems]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background"
        />
      </div>

      <div className="space-y-1">
        {filteredProducts.map((product) => (
          <ProductCardCompact
            key={product.id}
            product={product}
            moneda={moneda}
            margenObjetivo={margenObjetivo}
            rangos={rangos}
            tipoCostoDefault={tipoCostoDefault}
            onConsult={onConsultProduct}
          />
        ))}
      </div>

      {products.length > maxItems && !search && (
        <p className="text-xs text-center text-muted-foreground">
          +{products.length - maxItems} productos mas
        </p>
      )}
    </div>
  );
}
