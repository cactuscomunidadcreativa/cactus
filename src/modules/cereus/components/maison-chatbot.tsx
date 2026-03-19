'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface ChatbotConfig {
  enabled: boolean;
  name: string;
  greeting: string;
  avatar_emoji: string;
  accent_color: string;
}

export function MaisonChatbot({
  chatbotConfig,
  maisonName,
}: {
  chatbotConfig: ChatbotConfig;
  maisonName: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: chatbotConfig.greeting,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accentColor = chatbotConfig.accent_color || '#C9A84C';
  const botName = chatbotConfig.name || 'Asistente';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (will be replaced with real API later)
    setTimeout(() => {
      const responses = [
        `Gracias por tu mensaje! Estoy aqui para ayudarte con cualquier consulta sobre ${maisonName}.`,
        `Excelente pregunta! Dejame revisar eso por ti. Puedes contactarnos al 960 139 383 para una atencion mas personalizada.`,
        `Me encanta que te interese! En ${maisonName} tenemos las mejores colecciones de la temporada. Quieres que te cuente mas?`,
        `Claro! Nuestro equipo de atelier estara encantado de ayudarte. Puedes agendar una cita para una experiencia personalizada.`,
        `Esa es una gran eleccion! Te recomiendo visitar nuestra coleccion POSITANO Summer '25, tiene piezas increibles.`,
      ];

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 1200);
  }

  if (!chatbotConfig.enabled) return null;

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[70] w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          style={{ height: '500px', maxHeight: 'calc(100vh - 140px)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 text-white" style={{ backgroundColor: '#0a0a0a' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: accentColor }}
            >
              {chatbotConfig.avatar_emoji}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{botName}</p>
              <p className="text-[11px] text-white/60">Asistente de {maisonName}</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    {chatbotConfig.avatar_emoji}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0a0a0a] text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  {chatbotConfig.avatar_emoji}
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Escribe a ${botName}...`}
                className="flex-1 px-3.5 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl text-white transition-opacity disabled:opacity-30"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by Ramona AI
            </p>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 sm:right-6 z-[70] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}
      </button>
    </>
  );
}
