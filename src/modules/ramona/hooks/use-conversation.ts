'use client';

import { useState, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RMBrand } from '../types';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  brand_id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export function useConversation(userId: string | null, brand: RMBrand | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTitledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadConversations = useCallback(async () => {
    if (!userId || !brand) return;
    try {
      const { data, error: dbError } = await supabase
        .from('rm_conversations')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (dbError) throw new Error(dbError.message);
      if (data) setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  }, [userId, brand]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('rm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (dbError) throw new Error(dbError.message);
      if (data) {
        setMessages(data);
        hasTitledRef.current = data.length > 0;
      }
      setActiveConversation(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    if (!userId || !brand) return null;
    try {
      const { data, error: dbError } = await supabase
        .from('rm_conversations')
        .insert({
          brand_id: brand.id,
          user_id: userId,
          title: null,
          message_count: 0,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      if (data) {
        setActiveConversation(data.id);
        setMessages([]);
        hasTitledRef.current = false;
        setConversations((prev) => [data, ...prev]);
        return data.id;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, [userId, brand]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId || !brand || !content.trim()) return;

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSending(true);
    setError(null);

    let convId = activeConversation;
    if (!convId) {
      convId = await startNewConversation();
      if (!convId) {
        setSending(false);
        return;
      }
    }

    // Add user message locally
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message
    await supabase.from('rm_messages').insert({
      conversation_id: convId,
      role: 'user',
      content,
    });

    try {
      // Call chat API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          brandId: brand.id,
          message: content,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat request failed: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        metadata: { provider: data.provider, model: data.model },
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation title if first message (use ref to avoid stale closure)
      if (!hasTitledRef.current) {
        hasTitledRef.current = true;
        const title = content.slice(0, 60);
        await supabase
          .from('rm_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', convId);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title } : c))
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'chat_error';
      setError(errorMessage);
      // Add error message as assistant bubble
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }, [userId, brand, activeConversation, startNewConversation]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    sending,
    error,
    clearError,
    loadConversations,
    loadMessages,
    startNewConversation,
    sendMessage,
    setActiveConversation,
  };
}
