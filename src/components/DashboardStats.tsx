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
      {/* Official File Audit Comparison Bar */}
      {report && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                Cruzamento Realizado: {report.fileName}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              Arquivo processado no seu navegador
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500">Contas Seguidas</div>
              <div className="text-base font-bold text-neutral-900 dark:text-white tabular-nums mt-0.5">
                {report.totalFollowing}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500">Seguidores do Perfil</div>
              <div className="text-base font-bold text-neutral-900 dark:text-white tabular-nums mt-0.5">
                {report.totalFollowers}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Seguem de Volta (Mútuos)</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                {report.mutualCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Não Seguem de Volta</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                {report.notFollowingBackCount}
              </div>
            </div>
          </div>

          {/* Warnings (e.g. date-range filter detected) */}
          {report.warnings && report.warnings.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              {report.warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">⚠️ Nota:</span>
                  <span className="leading-relaxed">{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
