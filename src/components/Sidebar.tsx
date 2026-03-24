'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@/store';
import { ContextMenu, DeleteConfirmModal } from '@/components/ContextMenu';
import type { Project } from '@/types';

/* ------------------------------------------------------------------ */
/*  Color presets for the new-project form                            */
/* ------------------------------------------------------------------ */
const COLOR_PRESETS = [
  '#3B82F6', '#22C55E', '#8B5CF6', '#F97316',
  '#EF4444', '#EC4899', '#14B8A6', '#EAB308',
];

/* ------------------------------------------------------------------ */
/*  Context menu state                                                */
/* ------------------------------------------------------------------ */
interface ContextMenuState {
  x: number;
  y: number;
  projectId: string;
}

/* ------------------------------------------------------------------ */
/*  SortableProjectItem                                               */
/* ------------------------------------------------------------------ */
interface SortableItemProps {
  project: Project;
  isActive: boolean;
  activeView: 'features' | 'errors';
  onSelect: (id: string) => void;
  onViewChange: (view: 'features' | 'errors') => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

function SortableProjectItem({
  project, isActive, activeView, onSelect, onViewChange, onContextMenu,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <button
        {...listeners}
        onClick={() => onSelect(project.id)}
        onContextMenu={(e) => onContextMenu(e, project.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer select-none ${
          isActive ? 'bg-accent/10' : 'hover:bg-muted-bg'
        }`}
      >
        <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <span className="shrink-0 text-base leading-none">{project.icon}</span>
        <span className="truncate text-sm font-medium text-foreground">{project.name}</span>
      </button>
      {isActive && (
        <ul className="ml-9 mt-1 mb-1 flex flex-col gap-0.5">
          {(['features', 'errors'] as const).map((view) => (
            <li key={view}>
              <button
                onClick={() => onViewChange(view)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-[13px] transition-colors duration-150 cursor-pointer ${
                  activeView === view
                    ? 'text-accent bg-accent/10 font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-muted-bg'
                }`}
              >
                {view === 'features' ? 'Features' : 'Errors & Changes'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  NewProjectForm                                                     */
/* ------------------------------------------------------------------ */
interface NewProjectFormProps {
  onSubmit: (name: string, color: string, icon: string) => void;
  onCancel: () => void;
}

function NewProjectForm({ onSubmit, onCancel }: NewProjectFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [icon, setIcon] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color, icon || '📁');
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-3 space-y-3">
      <input
        ref={nameRef}
        type="text"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Project name"
        className="w-full bg-muted-bg border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition"
      />
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={2}
          aria-label="Project icon emoji"
          className="w-16 bg-muted-bg border border-card-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition"
        />
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
              className={`w-5 h-5 rounded-full transition-transform duration-150 ${
                color === c ? 'ring-2 ring-offset-1 ring-accent scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition cursor-pointer"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:bg-muted-bg rounded-lg px-3 py-2 text-sm transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar (main export)                                              */
/* ------------------------------------------------------------------ */
export function Sidebar() {
  const {
    projects, activeProjectId, activeView, darkMode,
    setActiveProject, setActiveView, setSidebarOpen, setDarkMode,
    createProject, updateProject, deleteProject, reorderProjects,
    exportData, importData,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [colorPicking, setColorPicking] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);
  const projectIds = sortedProjects.map((p) => p.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => { renameRef.current?.focus(); renameRef.current?.select(); }, [renaming]);

  const handleSelect = useCallback((id: string) => {
    setActiveProject(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [setActiveProject, setSidebarOpen]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projectIds.indexOf(active.id as string);
    const newIndex = projectIds.indexOf(over.id as string);
    reorderProjects(arrayMove(projectIds, oldIndex, newIndex));
  }, [projectIds, reorderProjects]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, projectId: id });
  }, []);

  const startRename = useCallback((id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setRenameValue(project.name);
    setRenaming(id);
    setCtxMenu(null);
  }, [projects]);

  const commitRename = useCallback(() => {
    if (renaming && renameValue.trim()) updateProject(renaming, { name: renameValue.trim() });
    setRenaming(null);
  }, [renaming, renameValue, updateProject]);

  const startColorChange = useCallback((id: string) => { setColorPicking(id); setCtxMenu(null); }, []);
  const handleDelete = useCallback((id: string) => { setConfirmDelete(id); setCtxMenu(null); }, []);
  const confirmDeleteProject = useCallback(() => {
    if (confirmDelete) deleteProject(confirmDelete);
    setConfirmDelete(null);
  }, [confirmDelete, deleteProject]);

  const handleNewProject = useCallback(async (name: string, color: string, icon: string) => {
    await createProject(name, color, icon);
    setShowForm(false);
  }, [createProject]);

  const handleExport = useCallback(async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmelater-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [importData]);

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <span className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <span role="img" aria-label="clipboard">📋</span> TaskMeLater
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-md text-muted hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
        >
          {darkMode ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Project list */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Projects
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-0.5">
              {sortedProjects.map((project) =>
                renaming === project.id ? (
                  <li key={project.id} className="px-3 py-2">
                    <input
                      ref={renameRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      aria-label="Rename project"
                      className="w-full bg-muted-bg border border-accent rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition"
                    />
                  </li>
                ) : colorPicking === project.id ? (
                  <li key={project.id} className="px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { updateProject(project.id, { color: c }); setColorPicking(null); }}
                          aria-label={`Pick color ${c}`}
                          className={`w-6 h-6 rounded-full transition-transform duration-150 cursor-pointer ${
                            project.color === c ? 'ring-2 ring-offset-1 ring-accent scale-110' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <button
                        onClick={() => setColorPicking(null)}
                        className="text-xs text-muted hover:text-foreground cursor-pointer transition-colors duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                ) : (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    isActive={activeProjectId === project.id}
                    activeView={activeView}
                    onSelect={handleSelect}
                    onViewChange={setActiveView}
                    onContextMenu={handleContextMenu}
                  />
                ),
              )}
            </ul>
          </SortableContext>
        </DndContext>

        {showForm ? (
          <NewProjectForm onSubmit={handleNewProject} onCancel={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            aria-label="New project"
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </nav>

      {/* Footer: Export / Import */}
      <div className="px-3 py-3 border-t border-sidebar-border flex gap-2">
        <button
          onClick={handleExport}
          aria-label="Export data"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg text-muted hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import data"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg text-muted hover:bg-muted-bg transition-colors duration-150 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Import
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* Context menu (portal-like, rendered at body level via fixed positioning) */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onRename={() => startRename(ctxMenu.projectId)}
          onChangeColor={() => startColorChange(ctxMenu.projectId)}
          onDelete={() => handleDelete(ctxMenu.projectId)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <DeleteConfirmModal
          onConfirm={confirmDeleteProject}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </aside>
  );
}
