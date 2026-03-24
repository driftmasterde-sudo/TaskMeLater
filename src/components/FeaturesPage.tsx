'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import type { FeatureCard, Priority, FeatureState } from '@/types';
import {
  PRIORITY_COLORS,
  FEATURE_STATE_COLORS,
  PRIORITIES,
  FEATURE_STATES,
} from '@/types';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const PRIORITY_ORDER: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const STATE_ORDER: Record<FeatureState, number> = {
  Proposed: 0,
  Planned: 1,
  Implementing: 2,
  Integrated: 3,
};

function relativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* -------------------------------------------------------------------------- */
/*  Sort type                                                                  */
/* -------------------------------------------------------------------------- */

type SortKey = 'priority' | 'date' | 'state';

/* -------------------------------------------------------------------------- */
/*  AddFeatureModal                                                            */
/* -------------------------------------------------------------------------- */

function AddFeatureModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(trimmedTitle, description.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card border border-card-border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Add Feature
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="feature-title"
              className="mb-1 block text-sm font-medium text-muted"
            >
              Title
            </label>
            <input
              id="feature-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Feature title..."
              autoFocus
              className="w-full bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>
          <div>
            <label
              htmlFor="feature-desc"
              className="mb-1 block text-sm font-medium text-muted"
            >
              Description
            </label>
            <textarea
              id="feature-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature..."
              rows={3}
              className="w-full resize-none bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:bg-muted-bg rounded-lg px-3 py-2 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FeatureCardItem                                                            */
/* -------------------------------------------------------------------------- */

function FeatureCardItem({
  card,
  onClick,
}: {
  card: FeatureCard;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-hover flex w-full cursor-pointer flex-col gap-3 rounded-xl bg-card border border-card-border p-5 text-left shadow-sm"
    >
      {/* Top row: priority + state */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
        >
          {card.priority}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: FEATURE_STATE_COLORS[card.state] }}
        >
          {card.state}
        </span>
        {card.mockupHtml != null && (
          <span className="ml-auto text-muted" title="Has mockup">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="truncate text-sm font-semibold text-foreground">
        {card.title}
      </h3>

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-muted">
        {card.description || 'No description'}
      </p>

      {/* Footer: date */}
      <span className="mt-auto text-[11px] text-muted">
        {relativeDate(card.createdAt)}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  FeaturesPage                                                               */
/* -------------------------------------------------------------------------- */

export function FeaturesPage() {
  const features = useStore((s) => s.features);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const projects = useStore((s) => s.projects);
  const createFeature = useStore((s) => s.createFeature);
  const setDetailCard = useStore((s) => s.setDetailCard);

  const [showModal, setShowModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [stateFilter, setStateFilter] = useState<FeatureState | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');

  const activeProject = projects.find((p) => p.id === activeProjectId);

  /* Filter + sort features */
  const filtered = useMemo(() => {
    let list = features.filter((f) => f.projectId === activeProjectId);

    if (priorityFilter !== 'All') {
      list = list.filter((f) => f.priority === priorityFilter);
    }
    if (stateFilter !== 'All') {
      list = list.filter((f) => f.state === stateFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    switch (sortKey) {
      case 'priority':
        sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        break;
      case 'date':
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'state':
        sorted.sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]);
        break;
    }

    return sorted;
  }, [features, activeProjectId, priorityFilter, stateFilter, search, sortKey]);

  const handleAddFeature = useCallback(
    async (title: string, description: string) => {
      if (!activeProjectId) return;
      await createFeature(activeProjectId, title, description);
    },
    [activeProjectId, createFeature],
  );

  const handleCardClick = useCallback(
    (card: FeatureCard) => {
      setDetailCard({ type: 'feature', card });
    },
    [setDetailCard],
  );

  /* ---- Render ---- */

  const inputClass = 'bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {activeProject?.name ?? 'Project'}
        </h1>
        <span className="rounded-md bg-muted-bg px-2 py-0.5 text-xs font-medium text-muted">
          Features
        </span>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
          {filtered.length}
        </span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="ml-auto bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Add Feature
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | 'All')}
          aria-label="Filter by priority"
          className={inputClass}
        >
          <option value="All">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as FeatureState | 'All')}
          aria-label="Filter by state"
          className={inputClass}
        >
          <option value="All">All States</option>
          {FEATURE_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features..."
          aria-label="Search features"
          className={`min-w-[180px] flex-1 sm:max-w-xs ${inputClass}`}
        />

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort features"
          className={`ml-auto ${inputClass}`}
        >
          <option value="priority">Sort by Priority</option>
          <option value="date">Sort by Date</option>
          <option value="state">Sort by State</option>
        </select>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-card-border py-16">
          <p className="text-sm text-muted">
            No features found.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-sm font-medium text-accent transition hover:opacity-80"
          >
            Add your first feature
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => (
            <FeatureCardItem
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddFeatureModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddFeature}
        />
      )}
    </div>
  );
}
