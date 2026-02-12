// WeekFlow Module
// This module is self-contained and can be extracted for use in other projects.
// Dependencies: Supabase client, Auth context

export const MODULE_ID = 'weekflow';
export const MODULE_NAME = 'WeekFlow';
export const MODULE_ICON = '🌊';
export const MODULE_COLOR = '#6366F1';

// Main app component
export { WeekFlowApp } from './components/weekflow-app';

// Individual components (for custom integrations)
export { BoardView } from './components/board-view';
export { SectionPanel } from './components/section-panel';
export { TaskItem } from './components/task-item';
export { TaskInput } from './components/task-input';
export { MoodPicker } from './components/mood-picker';
export { PlutchikWheel } from './components/plutchik-wheel';
export { SixSecondsWheel } from './components/six-seconds-wheel';
export { TeamPulseView } from './components/team-pulse';
export { TeamMembers } from './components/team-members';
export { TeamSetup } from './components/team-setup';
export { PresenterMode } from './components/presenter-mode';

// Hooks
export { useWeekFlow } from './hooks/use-weekflow';

// Utils
export { getWeekStart, generateTeamCode, formatWeekLabel, moodEmoji } from './lib/utils';

// Types
export type { WFTeam, WFMember, WFTask, WFMood, EmotionData, TeamPulse, Section, Priority } from './types';
