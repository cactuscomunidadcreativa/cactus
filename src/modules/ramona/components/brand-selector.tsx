'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Plus } from 'lucide-react';
import type { RMBrand } from '../types';

interface BrandSelectorProps {
  brands: RMBrand[];
  selectedBrand: RMBrand | null;
  onSelect: (brand: RMBrand) => void;
  onAddNew: () => void;
}

export function BrandSelector({ brands, selectedBrand, onSelect, onAddNew }: BrandSelectorProps) {
  const t = useTranslations('ramona.brand');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (brands.length <= 1 && selectedBrand) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
      >
        <span>{selectedBrand?.name || t('select')}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-20 py-1">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => { onSelect(brand); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                selectedBrand?.id === brand.id ? 'font-medium text-primary' : ''
              }`}
            >
              {brand.name}
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => { onAddNew(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('addNew')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
