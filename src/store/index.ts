'use client';

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Project, FeatureCard, ErrorCard } from '@/types';

// API helpers
async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

interface AppState {
  // Data
  projects: Project[];
  features: FeatureCard[];
  errors: ErrorCard[];

  // UI state
  activeProjectId: string | null;
  activeView: 'features' | 'errors';
  detailCard: { type: 'feature'; card: FeatureCard } | { type: 'error'; card: ErrorCard } | null;
  sidebarOpen: boolean;
  darkMode: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSidebarOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setActiveProject: (id: string | null) => void;
  setActiveView: (view: 'features' | 'errors') => void;
  setDetailCard: (card: AppState['detailCard']) => void;

  // Project CRUD
  createProject: (name: string, color: string, icon: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'icon' | 'pages'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  reorderProjects: (ids: string[]) => Promise<void>;

  // Feature CRUD
  createFeature: (projectId: string, title: string, description: string) => Promise<void>;
  updateFeature: (id: string, updates: Partial<Pick<FeatureCard, 'title' | 'description' | 'priority' | 'state' | 'mockupHtml'>>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;

  // Error CRUD
  createError: (projectId: string, page: string, prompt: string) => Promise<void>;
  updateError: (id: string, updates: Partial<Pick<ErrorCard, 'page' | 'prompt' | 'followUpPrompts' | 'priority' | 'state'>>) => Promise<void>;
  bulkUpdateErrorState: (ids: string[], state: ErrorCard['state']) => Promise<void>;
  deleteError: (id: string) => Promise<void>;

  // Data management
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;

  // Real-time sync
  _pollTimer: ReturnType<typeof setInterval> | null;
  startPolling: () => void;
  stopPolling: () => void;
  syncFromServer: () => Promise<void>;
}

const DEMO_PROJECTS = [
  { name: 'Oriido', color: '#3B82F6', icon: '🧠' },
  { name: 'MoveMaster', color: '#22C55E', icon: '🚚' },
  { name: 'TaskMeLater', color: '#8B5CF6', icon: '📋' },
  { name: 'Sharaaty', color: '#F97316', icon: '🤝' },
];

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  features: [],
  errors: [],
  activeProjectId: null,
  activeView: 'features',
  detailCard: null,
  sidebarOpen: true,
  darkMode: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    let projects = await api<Project[]>('/api/projects');

    // Seed demo data if empty
    if (projects.length === 0) {
      for (let i = 0; i < DEMO_PROJECTS.length; i++) {
        const p = {
          id: uuid(),
          ...DEMO_PROJECTS[i],
          pages: [],
          order: i,
        };
        await api('/api/projects', { method: 'POST', body: JSON.stringify(p) });
      }
      projects = await api<Project[]>('/api/projects');
    }

    // Load all features and errors
    const [allFeatures, allErrors] = await Promise.all([
      api<FeatureCard[]>('/api/features'),
      api<ErrorCard[]>('/api/errors'),
    ]);

    const darkMode = typeof window !== 'undefined'
      ? localStorage.getItem('taskmelater-dark') === 'true' ||
        (!localStorage.getItem('taskmelater-dark') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false;

    set({
      projects,
      features: allFeatures,
      errors: allErrors,
      activeProjectId: projects[0]?.id ?? null,
      initialized: true,
      darkMode,
    });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDarkMode: (dark) => {
    if (typeof window !== 'undefined') localStorage.setItem('taskmelater-dark', String(dark));
    set({ darkMode: dark });
  },
  setActiveProject: (id) => set({ activeProjectId: id, detailCard: null }),
  setActiveView: (view) => set({ activeView: view, detailCard: null }),
  setDetailCard: (card) => set({ detailCard: card }),

  // Projects
  createProject: async (name, color, icon) => {
    const project: Project = {
      id: uuid(),
      name,
      color,
      icon,
      pages: [],
      order: get().projects.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await api<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    set((s) => ({ projects: [...s.projects, created], activeProjectId: created.id }));
  },

  updateProject: async (id, updates) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const updated = await api<Project>('/api/projects', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }));
  },

  deleteProject: async (id) => {
    await api('/api/projects', { method: 'DELETE', body: JSON.stringify({ id }) });
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      return {
        projects,
        features: s.features.filter((f) => f.projectId !== id),
        errors: s.errors.filter((e) => e.projectId !== id),
        activeProjectId: s.activeProjectId === id ? (projects[0]?.id ?? null) : s.activeProjectId,
      };
    });
  },

  reorderProjects: async (ids) => {
    const projects = ids.map((id, i) => {
      const p = get().projects.find((p) => p.id === id)!;
      return { ...p, order: i };
    });
    // Update all in parallel
    await Promise.all(
      projects.map((p) =>
        api('/api/projects', { method: 'PUT', body: JSON.stringify({ id: p.id, order: p.order }) })
      )
    );
    set({ projects });
  },

  // Features
  createFeature: async (projectId, title, description) => {
    const feature = {
      id: uuid(),
      projectId,
      title,
      description,
      priority: 'Medium' as const,
      state: 'Proposed' as const,
      mockupHtml: null,
    };
    const created = await api<FeatureCard>('/api/features', {
      method: 'POST',
      body: JSON.stringify(feature),
    });
    set((s) => ({ features: [...s.features, created] }));
  },

  updateFeature: async (id, updates) => {
    const feature = get().features.find((f) => f.id === id);
    if (!feature) return;
    const updated = await api<FeatureCard>('/api/features', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    set((s) => ({
      features: s.features.map((f) => (f.id === id ? updated : f)),
      detailCard: s.detailCard?.type === 'feature' && s.detailCard.card.id === id
        ? { type: 'feature', card: updated }
        : s.detailCard,
    }));
  },

  deleteFeature: async (id) => {
    await api('/api/features', { method: 'DELETE', body: JSON.stringify({ id }) });
    set((s) => ({
      features: s.features.filter((f) => f.id !== id),
      detailCard: s.detailCard?.type === 'feature' && s.detailCard.card.id === id ? null : s.detailCard,
    }));
  },

  // Errors
  createError: async (projectId, page, prompt) => {
    // Auto-add page to project if it's new
    const project = get().projects.find((p) => p.id === projectId);
    if (project && !project.pages.includes(page)) {
      const updatedPages = [...project.pages, page];
      await api('/api/projects', {
        method: 'PUT',
        body: JSON.stringify({ id: projectId, pages: updatedPages }),
      });
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, pages: updatedPages } : p
        ),
      }));
    }

    const error = {
      id: uuid(),
      projectId,
      page,
      prompt,
      followUpPrompts: [] as string[],
      priority: 'Medium' as const,
      state: 'Not Started' as const,
    };
    const created = await api<ErrorCard>('/api/errors', {
      method: 'POST',
      body: JSON.stringify(error),
    });
    set((s) => ({ errors: [...s.errors, created] }));
  },

  updateError: async (id, updates) => {
    const error = get().errors.find((e) => e.id === id);
    if (!error) return;
    const updated = await api<ErrorCard>('/api/errors', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    set((s) => ({
      errors: s.errors.map((e) => (e.id === id ? updated : e)),
      detailCard: s.detailCard?.type === 'error' && s.detailCard.card.id === id
        ? { type: 'error', card: updated }
        : s.detailCard,
    }));
  },

  bulkUpdateErrorState: async (ids, state) => {
    const updated = await api<ErrorCard[]>('/api/errors', {
      method: 'PATCH',
      body: JSON.stringify({ ids, state }),
    });
    set((s) => {
      const updatedMap = new Map(updated.map((e) => [e.id, e]));
      return {
        errors: s.errors.map((e) => updatedMap.get(e.id) ?? e),
        detailCard:
          s.detailCard?.type === 'error' && updatedMap.has(s.detailCard.card.id)
            ? { type: 'error', card: updatedMap.get(s.detailCard.card.id)! }
            : s.detailCard,
      };
    });
  },

  deleteError: async (id) => {
    await api('/api/errors', { method: 'DELETE', body: JSON.stringify({ id }) });
    set((s) => ({
      errors: s.errors.filter((e) => e.id !== id),
      detailCard: s.detailCard?.type === 'error' && s.detailCard.card.id === id ? null : s.detailCard,
    }));
  },

  exportData: async () => {
    const data = await api('/api/data');
    return JSON.stringify(data, null, 2);
  },

  importData: async (json) => {
    const data = JSON.parse(json);
    await api('/api/data', { method: 'POST', body: JSON.stringify(data) });
    const [projects, features, errors] = await Promise.all([
      api<Project[]>('/api/projects'),
      api<FeatureCard[]>('/api/features'),
      api<ErrorCard[]>('/api/errors'),
    ]);
    set({ projects, features, errors });
  },

  // Real-time sync via polling
  _pollTimer: null,

  syncFromServer: async () => {
    try {
      const [projects, features, errors] = await Promise.all([
        api<Project[]>('/api/projects'),
        api<FeatureCard[]>('/api/features'),
        api<ErrorCard[]>('/api/errors'),
      ]);

      const s = get();
      // Only update if data actually changed (compare by updatedAt timestamps)
      const projChanged = JSON.stringify(projects.map((p) => p.updatedAt)) !== JSON.stringify(s.projects.map((p) => p.updatedAt));
      const featChanged = JSON.stringify(features.map((f) => f.updatedAt)) !== JSON.stringify(s.features.map((f) => f.updatedAt));
      const errChanged = JSON.stringify(errors.map((e) => e.updatedAt)) !== JSON.stringify(s.errors.map((e) => e.updatedAt));

      if (projChanged || featChanged || errChanged) {
        const updates: Partial<AppState> = {};
        if (projChanged) updates.projects = projects;
        if (featChanged) updates.features = features;
        if (errChanged) updates.errors = errors;

        // Update detailCard if it was changed on the server
        if (s.detailCard) {
          if (s.detailCard.type === 'feature' && featChanged) {
            const fresh = features.find((f) => f.id === s.detailCard!.card.id);
            updates.detailCard = fresh ? { type: 'feature', card: fresh } : null;
          } else if (s.detailCard.type === 'error' && errChanged) {
            const fresh = errors.find((e) => e.id === s.detailCard!.card.id);
            updates.detailCard = fresh ? { type: 'error', card: fresh } : null;
          }
        }

        set(updates);
      }
    } catch {
      // Silently ignore polling failures (e.g. network blip)
    }
  },

  startPolling: () => {
    const existing = get()._pollTimer;
    if (existing) return;
    const timer = setInterval(() => {
      get().syncFromServer();
    }, 3000); // Poll every 3 seconds
    set({ _pollTimer: timer });
  },

  stopPolling: () => {
    const timer = get()._pollTimer;
    if (timer) {
      clearInterval(timer);
      set({ _pollTimer: null });
    }
  },
}));
