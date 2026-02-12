'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Camera, FileSpreadsheet, FileText, X, Package } from 'lucide-react';
import { AgaveAvatar, AgaveAvatarMini } from './agave-avatar';
import { AgaveMessage } from '../lib/types';
import { PriceCard } from './price-card';
import { ProductCatalogMini } from './product-catalog';
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

interface AgaveChatProps {
  initialMessage?: string;
  onSendMessage?: (message: string, attachments?: File[]) => Promise<any>;
  demoMode?: boolean;
  // Client-specific props
  clientId?: string;
  clientName?: string;
  userName?: string;
  products?: Product[];
  moneda?: string;
  margenObjetivo?: number;
  rangos?: MarginRange[];
  tipoCostoDefault?: string;
  idioma?: string;
}

export function AgaveChat({
  initialMessage,
  onSendMessage,
  demoMode = false,
  clientId,
  clientName,
  userName,
  products = [],
  moneda = 'USD',
  margenObjetivo = 0.27,
  rangos = DEFAULT_MARGIN_RANGES,
  tipoCostoDefault = 'CIF',
  idioma = 'es',
}: AgaveChatProps) {
  const [messages, setMessages] = useState<AgaveMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agaveState, setAgaveState] = useState<'idle' | 'thinking' | 'talking' | 'calculating'>('idle');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedData, setUploadedData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Build greeting message
    let greeting = initialMessage;
    if (!greeting) {
      if (userName) {
        greeting = idioma === 'es'
          ? `Hola ${userName}! Soy AGAVE, tu asistente de pricing.\n\n`
          : `Hi ${userName}! I'm AGAVE, your pricing assistant.\n\n`;
      } else {
        greeting = idioma === 'es'
          ? `Hola! Soy AGAVE, tu asistente de pricing.\n\n`
          : `Hi! I'm AGAVE, your pricing assistant.\n\n`;
      }

      if (products.length > 0) {
        greeting += idioma === 'es'
          ? `Tienes ${products.length} productos cargados. Puedes:\n- Hacer clic en un producto para consultar su precio\n- Preguntarme directamente sobre costos\n- Simular descuentos`
          : `You have ${products.length} products loaded. You can:\n- Click on a product to check its price\n- Ask me directly about costs\n- Simulate discounts`;
      } else {
        greeting += idioma === 'es'
          ? `Puedes:\n- Preguntarme "A cuanto vendo si mi costo es $7?"\n- Subir un Excel con tus datos\n- Simular descuentos`
          : `You can:\n- Ask me "What price if my cost is $7?"\n- Upload an Excel with your data\n- Simulate discounts`;
      }
    }

    const greetingMessage: AgaveMessage = {
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
      data: { tipo: 'texto' },
    };
    setMessages([greetingMessage]);
  }, [initialMessage, userName, products.length, idioma]);

  const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/agave/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error subiendo archivo');
    }

    return response.json();
  };

  const sendToAI = async (message: string, context: any = {}): Promise<any> => {
    const conversationHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('/api/agave/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory,
        clientId,
        demoMode,
        idioma,
        context: {
          ...context,
          productos: uploadedData?.productos || [],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en el chat');
    }

    return response.json();
  };

  const handleProductConsult = (product: Product) => {
    const costo = tipoCostoDefault === 'FOB' ? product.costo_fob :
      tipoCostoDefault === 'CIF' ? product.costo_cif :
      tipoCostoDefault === 'INTERNADO' ? product.costo_internado :
      product.costo_puesto_cliente || product.costo_cif || product.costo_fob;

    if (costo) {
      setInput(idioma === 'es'
        ? `A cuanto debo vender ${product.nombre}? Su costo es $${costo}`
        : `What price for ${product.nombre}? Its cost is $${costo}`);
    } else {
      setInput(idioma === 'es'
        ? `Busca ${product.nombre}`
        : `Search for ${product.nombre}`);
    }
    setShowProducts(false);
  };

  const handleSend = async () => {
    if (!input.trim() && pendingFiles.length === 0) return;

    const userMessage: AgaveMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: pendingFiles.map(f => ({
        tipo: f.type.includes('image') ? 'imagen' : f.type.includes('pdf') ? 'pdf' : 'excel',
        nombre: f.name,
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    setIsLoading(true);
    setAgaveState('thinking');

    try {
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAgaveState('calculating');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const demoResponse = generateDemoResponse(currentInput, currentFiles, idioma);
        setMessages(prev => [...prev, demoResponse]);
      } else {
        // Real mode - process files first if any
        let fileContext = '';
        if (currentFiles.length > 0) {
          setAgaveState('calculating');
          for (const file of currentFiles) {
            try {
              const uploadResult = await uploadFile(file);
              setUploadedData(uploadResult);

              if (uploadResult.resumen) {
                fileContext = `\nArchivo subido: ${file.name}\nProductos encontrados: ${uploadResult.resumen.productosUnicos}\nRegistros: ${uploadResult.resumen.registros}\nMargen promedio: ${uploadResult.resumen.margenPromedio}%`;
              }
            } catch (err) {
              console.error('Error uploading:', err);
            }
          }
        }

        // Send to AI
        const aiResponse = await sendToAI(
          currentInput + fileContext,
          { uploadedData }
        );

        const assistantMessage: AgaveMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date(),
          data: aiResponse.data ? {
            tipo: aiResponse.data.tipo === 'precio' ? 'recomendacion' : aiResponse.data.tipo,
            payload: aiResponse.data.tipo === 'precio' ? {
              producto: { nombre: aiResponse.data.producto?.nombre || 'Producto', costoBase: aiResponse.data.datos.costo, costoFinal: aiResponse.data.datos.costo },
              precioMinimo: aiResponse.data.datos.precioMinimo,
              precioRecomendado: aiResponse.data.datos.precioRecomendado,
              precioOptimo: aiResponse.data.datos.precioOptimo,
              precioPremium: aiResponse.data.datos.precioPremium,
              categoriaActual: aiResponse.data.datos.categoriaObjetivo,
              analisis: { margenActual: aiResponse.data.datos.margenObjetivo * 100 },
            } : aiResponse.data.datos,
          } : { tipo: 'texto' },
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: AgaveMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: idioma === 'es'
          ? `Ups! Hubo un error: ${error.message}\n\nPuedes intentar de nuevo o preguntarme de otra forma.`
          : `Oops! There was an error: ${error.message}\n\nYou can try again or ask me differently.`,
        timestamp: new Date(),
        data: { tipo: 'texto' },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAgaveState('idle');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    setShowAttachMenu(false);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-agave-gradient-soft">
        <AgaveAvatar state={agaveState} size="md" />
        <div className="flex-1">
          <h3 className="font-semibold text-agave-petrol">AGAVE</h3>
          <p className="text-xs text-muted-foreground">
            {agaveState === 'thinking' && (idioma === 'es' ? 'Pensando...' : 'Thinking...')}
            {agaveState === 'calculating' && (idioma === 'es' ? 'Calculando...' : 'Calculating...')}
            {agaveState === 'idle' && (clientName || (idioma === 'es' ? 'Tu asistente de pricing' : 'Your pricing assistant'))}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => setShowProducts(!showProducts)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              showProducts ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <Package className="w-3 h-3" />
            {products.length}
          </button>
        )}
        {uploadedData && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {idioma === 'es' ? 'Datos cargados' : 'Data loaded'}
          </span>
        )}
      </div>

      {/* Products sidebar (mobile: overlay, desktop: sidebar) */}
      {showProducts && products.length > 0 && (
        <div className="border-b border-border p-3 bg-muted/30 max-h-[200px] overflow-y-auto">
          <ProductCatalogMini
            products={products}
            moneda={moneda}
            margenObjetivo={margenObjetivo}
            rangos={rangos}
            tipoCostoDefault={tipoCostoDefault}
            onConsultProduct={handleProductConsult}
            maxItems={5}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <AgaveAvatarMini />
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-agave-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background rounded-md px-2 py-1 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-agave-gold" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removePendingFile(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[180px] z-10">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel / CSV
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  {idioma === 'es' ? 'Foto / Imagen' : 'Photo / Image'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  PDF / {idioma === 'es' ? 'Factura' : 'Invoice'}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={idioma === 'es' ? 'Pregunta sobre precios, costos, margenes...' : 'Ask about prices, costs, margins...'}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agave-gold min-h-[44px] max-h-[120px]"
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
            className="p-2 rounded-full bg-agave-gold text-white hover:bg-agave-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <QuickAction
            text={idioma === 'es' ? 'Calcular precio' : 'Calculate price'}
            onClick={() => setInput(idioma === 'es' ? 'A cuanto debo vender si mi costo es $' : 'What price if my cost is $')}
          />
          <QuickAction
            text={idioma === 'es' ? 'Simular descuento' : 'Simulate discount'}
            onClick={() => setInput(idioma === 'es' ? 'Que pasa si doy 10% de descuento?' : 'What if I give a 10% discount?')}
          />
          {products.length > 0 && (
            <QuickAction
              text={idioma === 'es' ? 'Ver productos' : 'View products'}
              onClick={() => setShowProducts(!showProducts)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AgaveMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <AgaveAvatarMini />}

      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser ? 'bg-agave-gold text-white' : 'bg-muted'
        }`}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1 bg-background/50 rounded px-2 py-1 text-xs">
                {att.tipo === 'excel' && <FileSpreadsheet className="w-3 h-3" />}
                {att.tipo === 'imagen' && <Camera className="w-3 h-3" />}
                {att.tipo === 'pdf' && <FileText className="w-3 h-3" />}
                {att.nombre}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

        {message.data?.tipo === 'recomendacion' && message.data.payload && (
          <div className="mt-3">
            <PriceCard recommendation={message.data.payload} />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full border border-border text-xs hover:bg-muted transition-colors"
    >
      {text}
    </button>
  );
}

function generateDemoResponse(input: string, files: File[], idioma: string = 'es'): AgaveMessage {
  const lowerInput = input.toLowerCase();
  const isEs = idioma === 'es';

  if (files.length > 0) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: isEs
        ? `Perfecto! Recibi tu archivo "${files[0].name}".\n\nEstoy analizando los datos...\n\nEncontre **47 productos** con informacion de costos\nDatos de **2,074 transacciones** de ventas\nPeriodo: Enero - Diciembre 2025\n\nSobre que producto quieres que calculemos el precio?`
        : `Perfect! I received your file "${files[0].name}".\n\nI'm analyzing the data...\n\nFound **47 products** with cost information\n**2,074 transactions** data\nPeriod: January - December 2025\n\nWhich product do you want me to calculate the price for?`,
      timestamp: new Date(),
      data: { tipo: 'texto' },
    };
  }

  if (lowerInput.includes('costo') || lowerInput.includes('cost') || lowerInput.includes('$') || lowerInput.includes('7')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: isEs ? 'Listo! Para un producto con costo de **$7.10**:' : 'Done! For a product with cost of **$7.10**:',
      timestamp: new Date(),
      data: {
        tipo: 'recomendacion',
        payload: {
          producto: { nombre: isEs ? 'Tu producto' : 'Your product', costoBase: 7.10, costoFinal: 7.10 },
          precioMinimo: 8.89,
          precioRecomendado: 9.82,
          precioOptimo: 10.31,
          precioPremium: 11.37,
          categoriaActual: isEs ? 'Aceptable' : 'Acceptable',
          analisis: {
            margenActual: 27,
            sugerencias: isEs
              ? ['Con $9.82 tienes un margen saludable del 27%', 'Por debajo de $8.89 entras en zona de riesgo']
              : ['At $9.82 you have a healthy 27% margin', 'Below $8.89 you enter risk zone'],
          },
        },
      },
    };
  }

  if (lowerInput.includes('descuento') || lowerInput.includes('discount') || lowerInput.includes('%')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: isEs
        ? `**Simulacion de descuento del 10%**\n\nSi das 10% de descuento sobre el precio recomendado ($9.82):\n\n- Precio final: **$8.84**\n- Margen resultante: **19%** (era 27%)\n- Categoria: **Bajo**\n\nMi recomendacion: Si es un cliente grande o estrategico, el descuento es aceptable. Pero no lo hagas recurrente.`
        : `**10% Discount Simulation**\n\nIf you give a 10% discount on the recommended price ($9.82):\n\n- Final price: **$8.84**\n- Resulting margin: **19%** (was 27%)\n- Category: **Low**\n\nMy recommendation: If it's a large or strategic client, the discount is acceptable. But don't make it recurring.`,
      timestamp: new Date(),
      data: { tipo: 'simulacion' },
    };
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: isEs
      ? `Entendido!\n\nPuedo ayudarte con:\n\n- **Calcular precios** - "A cuanto vendo si mi costo es X?"\n- **Analizar datos** - Sube tu Excel de ventas\n- **Simular escenarios** - "Que pasa si doy 15% descuento?"\n\nQue necesitas?`
      : `Got it!\n\nI can help you with:\n\n- **Calculate prices** - "What price if my cost is X?"\n- **Analyze data** - Upload your sales Excel\n- **Simulate scenarios** - "What if I give a 15% discount?"\n\nWhat do you need?`,
    timestamp: new Date(),
    data: { tipo: 'texto' },
  };
}
