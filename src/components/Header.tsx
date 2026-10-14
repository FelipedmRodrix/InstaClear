import React from 'react';
import { Moon, Sun, Download, Trash2, ShieldCheck, History } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'import';
  onSelectTab: (tab: 'dashboard' | 'import') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportData: () => void;
  onOpenHistory: () => void;
  onClearData: () => void;
  hasData: boolean;
  pendingCount: number;
  onStartReview: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onExportData,
  onOpenHistory,
  onClearData,
  hasData,
  pendingCount,
  onStartReview,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 group text-left cursor-pointer"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-base shadow-sm">
                ✦
              </span>
              <span className="whitespace-nowrap">InstaClean</span>
            </button>
            <span className="hidden sm:inline-block text-xs text-neutral-400 dark:text-neutral-500">
              · Unfollow Assistido
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-neutral-900 dark:text-white border-rose-500 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Dashboard & Contas
            </button>
            <button
              onClick={() => onSelectTab('import')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                currentTab === 'import'
                  ? 'text-neutral-900 dark:text-white border-rose-500 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Importar Exportação
            </button>
          </nav>

          {/* Zone 3: Primary Action and Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {hasData && (
              <>
                <button
                  onClick={onOpenHistory}
                  title="Histórico de alterações e desfazer"
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={onExportData}
                  title="Exportar relatórios (CSV/JSON)"
                  className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {hasData && pendingCount > 0 ? (
              <button
                onClick={onStartReview}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>Revisar ({pendingCount})</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </button>
            ) : hasData ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                <ShieldCheck className="w-4 h-4" /> Tudo revisado
              </span>
            ) : null}

            {hasData && (
              <button
                onClick={onClearData}
                title="Limpar todos os dados locais"
                className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
