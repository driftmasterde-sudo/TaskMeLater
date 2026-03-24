'use client';

import { useRef, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Context Menu                                                       */
/* ------------------------------------------------------------------ */

interface ContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onRename, onChangeColor, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="
        fixed z-50 min-w-[140px] py-1 rounded-lg shadow-lg
        bg-card border border-card-border
      "
      style={{ left: x, top: y }}
    >
      <button
        onClick={onRename}
        className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
      >
        Rename
      </button>
      <button
        onClick={onChangeColor}
        className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
      >
        Change Color
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
      >
        Delete
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                          */
/* ------------------------------------------------------------------ */

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-80 p-5 rounded-xl bg-card border border-card-border shadow-xl">
        <p className="text-sm font-semibold text-foreground mb-1">
          Delete project?
        </p>
        <p className="text-xs text-muted mb-4">
          This will permanently delete the project and all its features and errors.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-muted hover:bg-muted-bg rounded-lg px-3 py-2 text-sm transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
