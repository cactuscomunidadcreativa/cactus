// Ramona Social Module
// This module is self-contained and can be extracted for use in other projects.
// Dependencies: Supabase client, Auth context, next-intl

export const MODULE_ID = 'ramona';
export const MODULE_NAME = 'Ramona Social';
export const MODULE_ICON = '🌵';
export const MODULE_COLOR = '#9A4E9A';

// Main app component
export { RamonaApp } from './components/ramona-app';

// Individual components (for custom layouts)
export { BrandOnboarding } from './components/brand-onboarding';
export { BrandSelector } from './components/brand-selector';
export { ContentStudio } from './components/content-studio';
export { ContentCard } from './components/content-card';
export { ContentEditor } from './components/content-editor';
export { KanbanView } from './components/kanban-view';
export { KanbanColumn } from './components/kanban-column';
export { CalendarView } from './components/calendar-view';
export { CalendarDay } from './components/calendar-day';
export { PlatformBadge } from './components/platform-badge';
export { AIStatus } from './components/ai-status';
export { UsageMeter } from './components/usage-meter';

// Chat components (conversational Ramona)
export { ChatInterface } from './components/chat/chat-interface';
export { ChatMessage } from './components/chat/chat-message';
export { ChatInput } from './components/chat/chat-input';
export { ChatSidebar } from './components/chat/chat-sidebar';
export { ConversationList } from './components/chat/conversation-list';

// Hooks
export { useRamona } from './hooks/use-ramona';
export { useBrandOnboarding } from './hooks/use-brand-onboarding';
export { useContentGenerator } from './hooks/use-content-generator';
export { useCalendar } from './hooks/use-calendar';
export { useConversation } from './hooks/use-conversation';

// Utils & types
export * from './types';
export { buildSystemPrompt, buildUserPrompt } from './lib/prompts';
export { buildRamonaSystemPrompt, extractReadyContent } from './lib/ramona-personality';
export { PLATFORMS, CONTENT_TYPES, INDUSTRIES, TONE_OPTIONS } from './lib/platforms';
export { STATUS_COLORS, STATUS_ORDER, getMonthKey, truncateText, formatScheduledDate } from './lib/utils';
