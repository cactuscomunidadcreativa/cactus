'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  exportable?: boolean;
  onExport?: () => void;
  rowKey: keyof T;
  emptyMessage?: string;
  maxHeight?: string;
  variant?: 'default' | 'compact' | 'striped';
  highlightRow?: (row: T) => 'success' | 'warning' | 'error' | null;
}

export function DataTable<T extends object>({
  data,
  columns,
  title,
  searchable = false,
  searchKeys = [],
  exportable = false,
  onExport,
  rowKey,
  emptyMessage = 'No hay datos disponibles',
  maxHeight,
  variant = 'default',
  highlightRow,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || searchKeys.length === 0) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key];
        return value != null && String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const getRowHighlightClass = (row: T) => {
    if (!highlightRow) return '';
    const highlight = highlightRow(row);
    switch (highlight) {
      case 'success':
        return 'bg-tuna-green/5 border-l-2 border-l-tuna-green';
      case 'warning':
        return 'bg-yellow-500/5 border-l-2 border-l-yellow-500';
      case 'error':
        return 'bg-destructive/5 border-l-2 border-l-destructive';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      {(title || searchable || exportable) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
          {title && <h3 className="font-semibold text-foreground">{title}</h3>}

          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:ring-2 focus:ring-tuna-magenta/20 outline-none w-48"
                />
              </div>
            )}

            {/* Export */}
            {exportable && onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`overflow-x-auto ${maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''}`}>
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig?.key === col.key && (
                      <span className="text-tuna-magenta">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr
                  key={String(row[rowKey])}
                  className={`hover:bg-muted/30 transition-colors ${
                    variant === 'striped' && rowIdx % 2 === 0 ? 'bg-muted/20' : ''
                  } ${getRowHighlightClass(row)}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      } ${variant === 'compact' ? 'py-2' : ''}`}
                    >
                      {col.format ? col.format(row[col.key], row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-sm text-muted-foreground">
        <span>
          {filteredData.length} de {data.length} registros
        </span>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-tuna-magenta hover:underline">
            Limpiar filtro
          </button>
        )}
      </div>
    </div>
  );
}

// Variance cell renderer
export function VarianceCell({ value, threshold = 5 }: { value: number; threshold?: number }) {
  const isPositive = value > 0;
  const isSignificant = Math.abs(value) > threshold;

  return (
    <span
      className={`font-medium ${
        isSignificant
          ? isPositive
            ? 'text-destructive'
            : 'text-tuna-green'
          : 'text-muted-foreground'
      }`}
    >
      {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

// Currency cell renderer
export function CurrencyCell({ value, currency = 'USD' }: { value: number; currency?: string }) {
  return (
    <span className="font-mono">
      {currency === 'USD' ? '$' : 'S/'} {value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
    </span>
  );
}

// Status badge renderer
export function StatusCell({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    cerrado: { bg: 'bg-tuna-green/10 text-tuna-green', text: 'Cerrado' },
    en_proceso: { bg: 'bg-yellow-500/10 text-yellow-600', text: 'En Proceso' },
    cancelado: { bg: 'bg-destructive/10 text-destructive', text: 'Cancelado' },
  };

  const config = statusConfig[status.toLowerCase()] || { bg: 'bg-muted', text: status };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg}`}>{config.text}</span>
  );
}
