'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { PageComboInput } from '@/components/PageComboInput';
import {
  PRIORITY_COLORS,
  ERROR_STATE_COLORS,
  PRIORITIES,
  ERROR_STATES,
  type Priority,
  type ErrorState,
  type ErrorCard,
} from '@/types';

type SortKey = 'priority' | 'date' | 'state';

const PRIORITY_ORDER: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const STATE_ORDER: Record<ErrorState, number> = {
  'Not Started': 0,
  Implementing: 1,
  Fixed: 2,
};

export function ErrorsPage() {
  const errors = useStore((s) => s.errors);
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const createError = useStore((s) => s.createError);
  const updateProject = useStore((s) => s.updateProject);
  const setDetailCard = useStore((s) => s.setDetailCard);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const projectErrors = useMemo(
    () => (activeProjectId ? errors.filter((e) => e.projectId === activeProjectId) : []),
    [errors, activeProjectId],
  );

  // Filters
  const [pageFilter, setPageFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newPage, setNewPage] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPageGroup, setCopiedPageGroup] = useState<string | null>(null);
  const [openPageMenu, setOpenPageMenu] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...projectErrors];

    if (pageFilter !== 'All') {
      result = result.filter((e) => e.page === pageFilter);
    }
    if (priorityFilter !== 'All') {
      result = result.filter((e) => e.priority === priorityFilter);
    }
    if (stateFilter !== 'All') {
      result = result.filter((e) => e.state === stateFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) => e.prompt.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case 'priority':
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case 'state':
          return STATE_ORDER[a.state] - STATE_ORDER[b.state];
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [projectErrors, pageFilter, priorityFilter, stateFilter, search, sortKey]);

  // Group by page
  const groupedByPage = useMemo(() => {
    const groups: { page: string; cards: ErrorCard[] }[] = [];
    const map = new Map<string, ErrorCard[]>();
    for (const card of filteredAndSorted) {
      const key = card.page || '(No page)';
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ page: key, cards: map.get(key)! });
      }
      map.get(key)!.push(card);
    }
    return groups;
  }, [filteredAndSorted]);

  const handleCopyAllPrompts = useCallback(async (pageName: string, cards: ErrorCard[]) => {
    const unfixed = cards.filter((c) => c.state !== 'Fixed');
    if (unfixed.length === 0) return;
    const text = `page "${pageName}":\n${unfixed.map((c) => `- ${c.prompt}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedPageGroup(pageName);
    setOpenPageMenu(null);
    setTimeout(() => setCopiedPageGroup(null), 2000);
  }, []);

  const handleCopy = useCallback(async (card: ErrorCard) => {
    try {
      await navigator.clipboard.writeText(card.prompt);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = card.prompt;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleCreateError = useCallback(async () => {
    if (!activeProjectId || !newPage.trim() || !newPrompt.trim()) return;
    await createError(activeProjectId, newPage.trim(), newPrompt.trim());
    setNewPage('');
    setNewPrompt('');
    setModalOpen(false);
  }, [activeProjectId, newPage, newPrompt, createError]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const inputClass = 'bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition';

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        Select a project to view errors and changes.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-foreground">
            {activeProject.name}
          </h1>
          <span className="text-sm font-medium text-muted">
            Errors &amp; Changes
          </span>
          <span className="inline-flex items-center justify-center rounded-full bg-muted-bg px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {filteredAndSorted.length}
          </span>
        </div>
        <button
          onClick={() => {
            setNewPage(activeProject.pages[0] ?? '');
            setNewPrompt('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add Error/Change
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <select
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
          aria-label="Filter by page"
          className={inputClass}
        >
          <option value="All">All Pages</option>
          {activeProject.pages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
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
          onChange={(e) => setStateFilter(e.target.value)}
          aria-label="Filter by state"
          className={inputClass}
        >
          <option value="All">All States</option>
          {ERROR_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort errors"
          className={inputClass}
        >
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="state">Sort by State</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search error prompts"
            className={`w-full pl-9 pr-3 ${inputClass}`}
          />
        </div>
      </div>

      {/* Grouped by page */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-card-border h-48">
          <p className="text-sm text-muted">
            {projectErrors.length === 0
              ? 'No errors or changes yet.'
              : 'No results match your filters.'}
          </p>
          {projectErrors.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setNewPage(activeProject.pages[0] ?? '');
                setNewPrompt('');
                setModalOpen(true);
              }}
              className="text-sm font-medium text-accent transition hover:opacity-80"
            >
              Add your first error or change
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupedByPage.map(({ page, cards }) => {
            const unfixedCount = cards.filter((c) => c.state !== 'Fixed').length;
            return (
              <section key={page}>
                {/* Page group header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-foreground">{page}</h2>
                  <span className="text-xs text-muted">({cards.length})</span>

                  {/* Page menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenPageMenu(openPageMenu === page ? null : page)}
                      aria-label={`Menu for page ${page}`}
                      className="rounded-md p-1 text-muted hover:bg-muted-bg transition cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm5.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                      </svg>
                    </button>
                    {openPageMenu === page && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenPageMenu(null)} />
                        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg bg-card border border-card-border shadow-lg py-1">
                          <button
                            onClick={() => handleCopyAllPrompts(page, cards)}
                            disabled={unfixedCount === 0}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted-bg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                              <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.44A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                            </svg>
                            Copy all Prompts ({unfixedCount})
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {copiedPageGroup === page && (
                    <span className="text-xs text-green-500 font-medium">Copied!</span>
                  )}
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => setDetailCard({ type: 'error', card })}
                      className="card-hover flex flex-col gap-3 rounded-xl bg-card border border-card-border p-5 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
                        >
                          {card.priority}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: ERROR_STATE_COLORS[card.state] }}
                        >
                          {card.state}
                        </span>
                      </div>

                      <p className="font-mono text-sm text-foreground line-clamp-2 leading-relaxed">
                        {card.prompt}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-muted">
                          {formatDate(card.createdAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(card); }}
                          aria-label="Copy prompt to clipboard"
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted bg-muted-bg hover:bg-card-border transition-colors duration-150 cursor-pointer"
                        >
                          {copiedId === card.id ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.44A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add Error/Change Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-card border border-card-border p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Add Error / Change
            </h2>

            <label htmlFor="error-page" className="block text-sm font-medium text-muted mb-1">
              Page
            </label>
            <div className="mb-4">
              <PageComboInput
                pages={activeProject.pages}
                value={newPage}
                onChange={setNewPage}
                onAddPage={(page) => {
                  if (activeProjectId) {
                    updateProject(activeProjectId, { pages: [...activeProject.pages, page] });
                  }
                }}
                className={`w-full ${inputClass}`}
                placeholder="Select or type a new page name..."
              />
            </div>

            <label htmlFor="error-prompt" className="block text-sm font-medium text-muted mb-1">
              Prompt
            </label>
            <textarea
              id="error-prompt"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              rows={5}
              placeholder="Describe the error or change..."
              className={`w-full font-mono resize-none mb-4 ${inputClass}`}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:bg-muted-bg rounded-lg px-3 py-2 text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateError}
                disabled={!newPrompt.trim()}
                className="bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
