import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  ArrowUpDown,
  Shield,
  EyeOff,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  CopyCheck,
  ChevronLeft,
  ChevronRight,
  UserX,
  Trash2
} from 'lucide-react';
import { FilterOptions, ReviewStatus, ViewMode } from '../types/instagram';

interface FilterToolbarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  currentPageCount?: number;
  isPageSelected?: boolean;
  onSelectAllPage?: () => void;
  selectedPageCount?: number;
  onDeselectAll: () => void;
  onOpenSelectedTabs?: () => void;
  onBatchAction: (action: 'complete' | 'reset_pending' | 'keep' | 'ignore' | 'deactivated' | 'remove') => void;
  statusCounts: Record<ReviewStatus | 'all', number>;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onOpenDeactivatedModal?: () => void;
  suspectedDeactivatedCount?: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  currentPageCount,
  isPageSelected,
  onSelectAllPage,
  selectedPageCount,
  onDeselectAll,
  onOpenSelectedTabs,
  onBatchAction,
  statusCounts,
  currentPage,
  totalPages,
  onPageChange,
  onOpenDeactivatedModal,
  suspectedDeactivatedCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Search and Primary Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Buscar por nome de usuário ou exibição..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <select
              value={`${filters.sortField}_${filters.sortDirection}`}
              onChange={(e) => {
                const [sortField, sortDirection] = e.target.value.split('_') as [any, any];
                onFilterChange({ sortField, sortDirection });
              }}
              className="pl-8 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer appearance-none"
            >
              <option value="username_asc">Nome de usuário (A-Z)</option>
              <option value="username_desc">Nome de usuário (Z-A)</option>
              <option value="followedAt_desc">Mais recentes primeiro</option>
              <option value="followedAt_asc">Mais antigos primeiro</option>
              <option value="status_asc">Por situação</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => onViewModeChange('cards')}
              title="Visualização em cartões"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              title="Visualização em lista compacta"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onFilterChange({ status: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'all'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            Todos ({statusCounts.all})
          </button>

          <button
            onClick={() => onFilterChange({ status: 'pending' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            Pendentes ({statusCounts.pending})
          </button>

          <button
            onClick={() => onFilterChange({ status: 'completed' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            Verificados ({statusCounts.completed})
          </button>

          <button
            onClick={() => onFilterChange({ status: 'kept' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'kept'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            Mantidos ({statusCounts.kept})
          </button>

          <button
            onClick={() => onFilterChange({ status: 'ignored' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filters.status === 'ignored'
                ? 'bg-neutral-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            Ignorados ({statusCounts.ignored})
          </button>

          <button
            onClick={() => onFilterChange({ status: 'deactivated' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filters.status === 'deactivated'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Desativadas ({statusCounts.deactivated || 0})</span>
          </button>

          {onOpenDeactivatedModal && (
            <button
              onClick={onOpenDeactivatedModal}
              title="Abrir ferramenta para identificar e limpar contas desativadas ou que não existem mais"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs"
            >
              <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Limpar Desativadas</span>
              {(suspectedDeactivatedCount || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          )}
        </div>

        {/* Selection Tools & Page Select */}
        <div className="flex flex-col sm:items-end items-start gap-1.5">
          {/* Select all on current page button */}
          <button
            onClick={isPageSelected ? onDeselectAll : onSelectAllPage}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isPageSelected
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
            title="Selecionar todas as contas visíveis nesta página"
          >
            {isPageSelected ? <CheckSquare className="w-3.5 h-3.5 text-rose-600" /> : <CopyCheck className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{isPageSelected ? 'Desmarcar todos' : `Selecionar todos (${currentPageCount})`}</span>
          </button>

          {/* Atalho de trocar de página logo abaixo de selecionar todos */}
          {totalPages && totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-0.5 shadow-xs">
              <button
                onClick={() => onPageChange(Math.max(1, (currentPage || 1) - 1))}
                disabled={(currentPage || 1) <= 1}
                className={`p-1 rounded-md text-xs transition-colors ${
                  (currentPage || 1) <= 1
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 cursor-pointer'
                }`}
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 px-1.5 tabular-nums whitespace-nowrap">
                Pág. {currentPage || 1} de {totalPages}
              </span>

              <button
                onClick={() => onPageChange(Math.min(totalPages, (currentPage || 1) + 1))}
                disabled={(currentPage || 1) >= totalPages}
                className={`p-1 rounded-md text-xs transition-colors ${
                  (currentPage || 1) >= totalPages
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 cursor-pointer'
                }`}
                title="Próxima página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Action Bar: Open in Tabs + Batch status buttons */}
      {selectedCount > 0 && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 tabular-nums">
              {selectedCount} perfil(is) selecionado(s)
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Prontos para abrir ou marcar
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* O BOTÃO MAIS IMPORTANTE: Abrir guias para cada perfil da página atual */}
            <button
              onClick={onOpenSelectedTabs}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Abre uma nova guia no navegador para cada perfil selecionado nesta página"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir {selectedPageCount ?? 0} selecionados da página</span>
            </button>

            {/* Batch toggle buttons */}
            <button
              onClick={() => onBatchAction('complete')}
              title="Marcar selecionados como Verificado (Deixou de seguir)"
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar como Verificado</span>
            </button>

            <button
              onClick={() => onBatchAction('reset_pending')}
              title="Retornar selecionados para Pendente"
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Marcar como Pendente</span>
            </button>

            <button
              onClick={() => onBatchAction('keep')}
              title="Manter seguindo (Favorito/Protegido)"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Shield className="w-3 h-3" /> Manter
            </button>

            <button
              onClick={() => onBatchAction('deactivated')}
              title="Marcar selecionados como Conta Desativada"
              className="px-2.5 py-1.5 text-xs font-semibold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Desativada</span>
            </button>

            <button
              onClick={() => onBatchAction('remove')}
              title="Remover permanentemente os selecionados da lista"
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-300 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover da Lista</span>
            </button>

            {/* Atalho de navegação rápida de página também na barra de selecionados */}
            {totalPages && totalPages > 1 && onPageChange && (
              <div className="flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2 py-1 shadow-2xs">
                <button
                  onClick={() => onPageChange(Math.max(1, (currentPage || 1) - 1))}
                  disabled={(currentPage || 1) <= 1}
                  className={`p-1 rounded text-xs transition-colors ${
                    (currentPage || 1) <= 1
                      ? 'opacity-30 cursor-not-allowed text-neutral-400'
                      : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer'
                  }`}
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 px-1 tabular-nums whitespace-nowrap">
                  Pág. {currentPage || 1}/{totalPages}
                </span>
                <button
                  onClick={() => onPageChange(Math.min(totalPages, (currentPage || 1) + 1))}
                  disabled={(currentPage || 1) >= totalPages}
                  className={`p-1 rounded text-xs transition-colors ${
                    (currentPage || 1) >= totalPages
                      ? 'opacity-30 cursor-not-allowed text-neutral-400'
                      : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer'
                  }`}
                  title="Próxima página"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
