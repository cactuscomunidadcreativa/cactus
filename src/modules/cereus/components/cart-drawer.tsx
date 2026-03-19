'use client';

import { useCart } from '@/modules/cereus/context/cart-context';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

function formatPrice(price: number) {
  return `S/${price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export function CartDrawer({ accentColor }: { accentColor: string }) {
  const { items, count, total, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-display font-bold text-lg">Bolsa ({count})</h2>
          </div>
          <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Tu bolsa esta vacia</p>
              <button
                onClick={closeCart}
                className="mt-4 text-sm font-medium underline"
                style={{ color: accentColor }}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4">
                  <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{item.name}</h3>
                    {(item.size || item.color) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.size && `Talla: ${item.size}`}
                        {item.size && item.color && ' | '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Envio</span>
              <span className="font-medium">{total >= 500 ? 'Gratis' : 'S/15.00'}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(total >= 500 ? total : total + 15)}</span>
            </div>
            <button
              className="w-full py-3 text-white text-sm font-medium tracking-widest uppercase rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0a0a0a' }}
            >
              Proceder al Pago
            </button>
            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Vaciar bolsa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
