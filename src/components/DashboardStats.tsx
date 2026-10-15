import React from 'react';
import { UserMinus, CheckCircle2, Clock } from 'lucide-react';
import { ImportAuditReport, InstagramAccount } from '../types/instagram';

interface DashboardStatsProps {
  accounts: InstagramAccount[];
  report: ImportAuditReport | null;
  onFilterByStatus: (status: 'all' | 'pending' | 'completed' | 'kept') => void;
  activeStatusFilter: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  accounts,
  report,
  onFilterByStatus,
  activeStatusFilter,
}) => {
  const totalNonFollowers = accounts.length;
  const completedCount = accounts.filter((a) => a.status === 'completed').length;
  const keptCount = accounts.filter((a) => a.status === 'kept').length;
  const pendingCount = accounts.filter((a) => a.status === 'pending').length;
  const reviewedCount = completedCount + keptCount;

  const progressPercent = totalNonFollowers > 0 ? Math.round((reviewedCount / totalNonFollowers) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Não Seguem de Volta (Dominant Metric) */}
        <button
          onClick={() => onFilterByStatus('all')}
          className={`bg-white dark:bg-neutral-900 border text-left rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer ${
            activeStatusFilter === 'all'
              ? 'border-rose-500 ring-2 ring-rose-500/10 dark:ring-rose-500/20 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold">Não Seguem de Volta</span>
            <UserMinus className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {totalNonFollowers}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Identificados no ZIP
          </div>
        </button>

        {/* Pendentes */}
        <button
          onClick={() => onFilterByStatus('pending')}
          className={`bg-white dark:bg-neutral-900 border text-left rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer ${
            activeStatusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-medium">Pendentes</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            Aguardando análise
          </div>
        </button>

        {/* Unfollowed / Concluídos */}
        <button
          onClick={() => onFilterByStatus('completed')}
          className={`bg-white dark:bg-neutral-900 border text-left rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer ${
            activeStatusFilter === 'completed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-medium">Deixou de Seguir</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {completedCount}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            Confirmados por você
          </div>
        </button>
      </div>

      {/* Progress Bar & Review Summary */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
            Progresso da Revisão
          </span>
          <span className="text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
            {progressPercent}% concluído
          </span>
        </div>

        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${totalNonFollowers > 0 ? (completedCount / totalNonFollowers) * 100 : 0}%` }}
            title={`Deixou de seguir: ${completedCount}`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${totalNonFollowers > 0 ? (keptCount / totalNonFollowers) * 100 : 0}%` }}
            title={`Mantidos: ${keptCount}`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {completedCount} unfollows confirmados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {keptCount} mantidos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {pendingCount} restantes
            </span>
          </div>
          {report?.importedAt && (
            <span className="text-[11px] text-neutral-400">
              Importado em: {new Date(report.importedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
