import type { WASession } from './types';

export type IntentResult = {
  module: 'router' | 'weekflow' | 'ramona';
  action?: string;
  data?: string;
};

/**
 * Detects user intent from a WhatsApp message and routes to the correct module.
 * Uses simple pattern matching — can be replaced with NLP later.
 */
export function detectIntent(message: string, session: WASession | null): IntentResult {
  const lower = message.toLowerCase().trim();

  // Menu / reset
  if (['menu', 'menú', 'inicio', 'home', 'start', 'help', 'ayuda'].includes(lower)) {
    return { module: 'router', action: 'menu' };
  }

  // Numeric selection from menu
  if (lower === '1' || lower === '1️⃣') {
    return { module: 'weekflow', action: 'activate' };
  }
  if (lower === '2' || lower === '2️⃣') {
    return { module: 'ramona', action: 'activate' };
  }
  if (lower === '3' || lower === '3️⃣') {
    return { module: 'router', action: 'help' };
  }

  // WeekFlow patterns
  if (lower.startsWith('tarea ') || lower.startsWith('task ')) {
    return { module: 'weekflow', action: 'create_task', data: message.slice(6).trim() };
  }
  if (['tareas', 'tasks', 'mis tareas', 'my tasks'].includes(lower)) {
    return { module: 'weekflow', action: 'list_tasks' };
  }

  // Ramona patterns
  if (lower.startsWith('post ') || lower.startsWith('contenido ') || lower.startsWith('content ')) {
    const data = message.replace(/^(post|contenido|content)\s+/i, '').trim();
    return { module: 'ramona', action: 'generate', data };
  }

  // If user has active session in a module, route there
  if (session && session.active_module !== 'router') {
    return { module: session.active_module, action: 'message', data: message };
  }

  // Default: show menu
  return { module: 'router', action: 'menu' };
}
