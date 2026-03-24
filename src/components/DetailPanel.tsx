'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/store';
import {
  PRIORITIES,
  FEATURE_STATES,
  ERROR_STATES,
  PRIORITY_COLORS,
  FEATURE_STATE_COLORS,
  ERROR_STATE_COLORS,
  type Priority,
  type FeatureState,
  type ErrorState,
} from '@/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DetailPanel() {
  const {
    detailCard,
    setDetailCard,
    updateFeature,
    updateError,
    deleteFeature,
    deleteError,
    projects,
    activeProjectId,
  } = useStore();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = detailCard !== null;

  useEffect(() => {
    setConfirmDelete(false);
    setCopied(false);
  }, [detailCard?.card.id]);

  const close = useCallback(() => {
    setDetailCard(null);
  }, [setDetailCard]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen, close]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId],
  );

  const handleDelete = useCallback(async () => {
    if (!detailCard) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (detailCard.type === 'feature') {
      await deleteFeature(detailCard.card.id);
    } else {
      await deleteError(detailCard.card.id);
    }
  }, [detailCard, confirmDelete, deleteFeature, deleteError]);

  const handleMockupFile = useCallback(
    async (file: File) => {
      if (!detailCard || detailCard.type !== 'feature') return;
      if (!file.name.endsWith('.html')) return;
      const text = await file.text();
      const base64 = btoa(unescape(encodeURIComponent(text)));
      await updateFeature(detailCard.card.id, { mockupHtml: base64 });
    },
    [detailCard, updateFeature],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleMockupFile(file);
      e.target.value = '';
    },
    [handleMockupFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleMockupFile(file);
    },
    [handleMockupFile],
  );

  const mockupBlobUrl = useMemo(() => {
    if (detailCard?.type !== 'feature' || !detailCard.card.mockupHtml) return null;
    try {
      const decoded = decodeURIComponent(escape(atob(detailCard.card.mockupHtml)));
      const blob = new Blob([decoded], { type: 'text/html' });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [detailCard?.type === 'feature' ? detailCard.card.mockupHtml : null]);

  useEffect(() => {
    return () => {
      if (mockupBlobUrl) URL.revokeObjectURL(mockupBlobUrl);
    };
  }, [mockupBlobUrl]);

  const copyPrompt = useCallback(async () => {
    if (detailCard?.type !== 'error') return;
    await navigator.clipboard.writeText(detailCard.card.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [detailCard]);

  const labelClass = 'block text-xs font-semibold text-muted mb-1 uppercase tracking-wide';
  const inputClass = 'w-full bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition';
  const selectClass = inputClass + ' appearance-none cursor-pointer';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detail panel"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[450px] bg-card shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {detailCard && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h2 className="text-lg font-semibold text-foreground">
                {detailCard.type === 'feature' ? 'Feature Details' : 'Error / Change Details'}
              </h2>
              <button
                onClick={close}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition duration-150"
                aria-label="Close detail panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {detailCard.type === 'feature' ? (
                <FeatureForm card={detailCard.card} labelClass={labelClass} inputClass={inputClass} selectClass={selectClass} updateFeature={updateFeature} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop} onFileChange={onFileChange} fileInputRef={fileInputRef} mockupBlobUrl={mockupBlobUrl} />
              ) : (
                <ErrorForm card={detailCard.card} labelClass={labelClass} inputClass={inputClass} selectClass={selectClass} updateError={updateError} pages={activeProject?.pages ?? []} copied={copied} copyPrompt={copyPrompt} />
              )}

              {/* Timestamps */}
              <div className="pt-3 border-t border-card-border space-y-1">
                <p className="text-xs text-muted">
                  <span className="font-medium">Created:</span> {formatDate(detailCard.card.createdAt)}
                </p>
                <p className="text-xs text-muted">
                  <span className="font-medium">Updated:</span> {formatDate(detailCard.card.updatedAt)}
                </p>
              </div>
            </div>

            {/* Footer - Delete */}
            <div className="px-5 py-4 border-t border-card-border">
              <button
                onClick={handleDelete}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition duration-150 ${
                  confirmDelete
                    ? 'bg-danger text-white hover:opacity-90'
                    : 'bg-danger/10 text-danger hover:bg-danger/20'
                }`}
              >
                {confirmDelete ? 'Are you sure? Click again to delete' : 'Delete'}
              </button>
              {confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-full mt-2 py-2 rounded-lg text-sm text-muted hover:text-foreground transition duration-150"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Feature Form ----------

interface FeatureFormProps {
  card: { id: string; title: string; description: string; priority: Priority; state: FeatureState; mockupHtml: string | null };
  labelClass: string;
  inputClass: string;
  selectClass: string;
  updateFeature: (id: string, updates: Record<string, unknown>) => Promise<void>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  mockupBlobUrl: string | null;
}

function FeatureForm({ card, labelClass, inputClass, selectClass, updateFeature, dragOver, setDragOver, onDrop, onFileChange, fileInputRef, mockupBlobUrl }: FeatureFormProps) {
  return (
    <>
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          className={inputClass}
          defaultValue={card.title}
          key={card.id + '-title'}
          onBlur={(e) => {
            if (e.target.value !== card.title) updateFeature(card.id, { title: e.target.value });
          }}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={inputClass + ' min-h-[100px] resize-y'}
          defaultValue={card.description}
          key={card.id + '-desc'}
          onBlur={(e) => {
            if (e.target.value !== card.description) updateFeature(card.id, { description: e.target.value });
          }}
        />
      </div>

      <div>
        <label className={labelClass}>Priority</label>
        <div className="relative">
          <select
            className={selectClass}
            value={card.priority}
            onChange={(e) => updateFeature(card.id, { priority: e.target.value as Priority })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
            style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>State</label>
        <div className="relative">
          <select
            className={selectClass}
            value={card.state}
            onChange={(e) => updateFeature(card.id, { state: e.target.value as FeatureState })}
          >
            {FEATURE_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
            style={{ backgroundColor: FEATURE_STATE_COLORS[card.state] }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mockup (.html)</label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition duration-150 ${
            dragOver
              ? 'border-accent bg-accent/10'
              : 'border-card-border hover:border-muted'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className="text-sm text-muted">
            {dragOver ? 'Drop .html file here' : 'Click or drag & drop an .html file'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {mockupBlobUrl && (
        <div>
          <label className={labelClass}>Mockup Preview</label>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <iframe
              src={mockupBlobUrl}
              sandbox="allow-scripts"
              className="w-full h-64 bg-background"
              title="Mockup preview"
            />
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Error Form ----------

interface ErrorFormProps {
  card: { id: string; page: string; prompt: string; priority: Priority; state: ErrorState };
  labelClass: string;
  inputClass: string;
  selectClass: string;
  updateError: (id: string, updates: Record<string, unknown>) => Promise<void>;
  pages: string[];
  copied: boolean;
  copyPrompt: () => void;
}

function ErrorForm({ card, labelClass, inputClass, selectClass, updateError, pages, copied, copyPrompt }: ErrorFormProps) {
  return (
    <>
      <div>
        <label className={labelClass}>Page</label>
        <select
          className={selectClass}
          value={card.page}
          onChange={(e) => updateError(card.id, { page: e.target.value })}
        >
          {pages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          {!pages.includes(card.page) && (
            <option value={card.page}>{card.page}</option>
          )}
        </select>
      </div>

      <div>
        <label className={labelClass}>Prompt</label>
        <textarea
          className={inputClass + ' min-h-[200px] resize-y font-mono text-xs leading-relaxed'}
          defaultValue={card.prompt}
          key={card.id + '-prompt'}
          onBlur={(e) => {
            if (e.target.value !== card.prompt) updateError(card.id, { prompt: e.target.value });
          }}
        />
      </div>

      <button
        onClick={copyPrompt}
        aria-label="Copy prompt to clipboard"
        className={`w-full py-2 rounded-lg text-sm font-medium transition duration-150 ${
          copied
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'text-muted bg-muted-bg hover:bg-card-border'
        }`}
      >
        {copied ? 'Copied!' : 'Copy Prompt'}
      </button>

      <div>
        <label className={labelClass}>Priority</label>
        <div className="relative">
          <select
            className={selectClass}
            value={card.priority}
            onChange={(e) => updateError(card.id, { priority: e.target.value as Priority })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
            style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>State</label>
        <div className="relative">
          <select
            className={selectClass}
            value={card.state}
            onChange={(e) => updateError(card.id, { state: e.target.value as ErrorState })}
          >
            {ERROR_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
            style={{ backgroundColor: ERROR_STATE_COLORS[card.state] }}
          />
        </div>
      </div>
    </>
  );
}

export default DetailPanel;
