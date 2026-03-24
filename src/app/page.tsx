'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { Sidebar } from '@/components/Sidebar';
import { FeaturesPage } from '@/components/FeaturesPage';
import { ErrorsPage } from '@/components/ErrorsPage';
import { DetailPanel } from '@/components/DetailPanel';

export default function Home() {
  const initialize = useStore((s) => s.initialize);
  const initialized = useStore((s) => s.initialized);
  const activeView = useStore((s) => s.activeView);
  const detailCard = useStore((s) => s.detailCard);
  const darkMode = useStore((s) => s.darkMode);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Loading TaskMeLater...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-enter lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 flex-shrink-0 border-r border-sidebar-border bg-sidebar
          transition-transform duration-200
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header with hamburger */}
        <div className="flex items-center gap-3 border-b border-card-border p-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-muted-bg"
            aria-label="Open sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold">TaskMeLater</span>
        </div>

        {activeView === 'features' ? <FeaturesPage /> : <ErrorsPage />}
      </main>

      {/* Detail panel */}
      {detailCard && <DetailPanel />}
    </div>
  );
}
