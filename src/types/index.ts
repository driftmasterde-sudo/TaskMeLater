export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type FeatureState = 'Proposed' | 'Planned' | 'Implementing' | 'Integrated';
export type ErrorState = 'Not Started' | 'Implementing' | 'Fixed';

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  pages: string[]; // user-defined page names for error/change cards
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureCard {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  state: FeatureState;
  mockupHtml: string | null; // stored as base64 string
  createdAt: string;
  updatedAt: string;
}

export interface ErrorCard {
  id: string;
  projectId: string;
  page: string;
  prompt: string;
  priority: Priority;
  state: ErrorState;
  createdAt: string;
  updatedAt: string;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#9CA3AF',
};

export const FEATURE_STATE_COLORS: Record<FeatureState, string> = {
  Proposed: '#9CA3AF',
  Planned: '#3B82F6',
  Implementing: '#EAB308',
  Integrated: '#22C55E',
};

export const ERROR_STATE_COLORS: Record<ErrorState, string> = {
  'Not Started': '#9CA3AF',
  Implementing: '#EAB308',
  Fixed: '#22C55E',
};

export const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
export const FEATURE_STATES: FeatureState[] = ['Proposed', 'Planned', 'Implementing', 'Integrated'];
export const ERROR_STATES: ErrorState[] = ['Not Started', 'Implementing', 'Fixed'];
