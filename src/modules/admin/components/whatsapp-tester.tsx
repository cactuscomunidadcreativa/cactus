'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Phone, ArrowDown, ArrowUp } from 'lucide-react';

interface Message {
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
}

export function WhatsAppTester() {
  const t = useTranslations('whatsapp.tester');
  const [phone, setPhone] = useState('+521234567890');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);

    const userMsg: Message = {
      direction: 'inbound',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageText = input.trim();
    setInput('');

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, content: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          direction: 'outbound',
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const error = await res.json();
        const errorMsg: Message = {
          direction: 'outbound',
          content: `Error: ${error.error || 'Unknown error'}`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: Message = {
        direction: 'outbound',
        content: 'Error: Could not connect to webhook',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-3">{t('description')}</p>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3 py-1.5 bg-background border border-input rounded-md text-sm w-48"
            placeholder={t('phone')}
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-[#e5ddd5] dark:bg-[#0b141a] rounded-xl border border-border overflow-hidden">
        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">{t('noMessages')}</p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                  msg.direction === 'inbound'
                    ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-foreground'
                    : 'bg-white dark:bg-[#202c33] text-foreground'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {msg.direction === 'inbound' ? (
                    <ArrowUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-blue-500" />
                  )}
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {msg.direction === 'inbound' ? t('inbound') : t('outbound')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 border-t border-border">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('message')}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-background border border-input rounded-full text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 bg-[#25d366] text-white rounded-full hover:bg-[#20bd5a] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
