import React from 'react';
import { ExternalLink, Shield, CheckCircle2, Clock, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { InstagramAccount, ReviewStatus } from '../types/instagram';

interface AccountTableProps {
  accounts: InstagramAccount[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenReview: (account: InstagramAccount) => void;
  onQuickToggleKeep: (account: InstagramAccount) => void;
  onOpenInstagramTab: (url: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  selectedIds,
  onToggleSelect,
  onOpenReview,
  onQuickToggleKeep,
  onOpenInstagramTab,
}) => {
  const renderStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deixou de seguir
          </span>
        );
      case 'kept':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Shield className="w-3.5 h-3.5" /> Mantido
          </span>
        );
      case 'ignored':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
            <EyeOff className="w-3.5 h-3.5" /> Ignorado
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-500">
            <AlertTriangle className="w-3.5 h-3.5" /> Erro
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase font-medium tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10">
                <span className="sr-only">Seleção</span>
              </th>
              <th className="py-3 px-4">Conta Instagram</th>
              <th className="py-3 px-4">Nome de Exibição</th>
              <th className="py-3 px-4">Seguindo Desde</th>
              <th className="py-3 px-4">Situação</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {accounts.map((account) => {
              const isSelected = selectedIds.has(account.id);
              return (
                <tr
                  key={account.id}
                  className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-850/50 transition-colors ${
                    isSelected ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(account.id)}
                      className="w-4 h-4 text-rose-600 rounded border-neutral-300 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-neutral-600 dark:text-neutral-300 shrink-0">
                        {account.username.charAt(0).toUpperCase()}
                      </span>
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-rose-600 dark:hover:text-rose-400 font-semibold inline-flex items-center gap-1 group"
                      >
                        @{account.username}
                        <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    {account.displayName || '—'}
                  </td>
                  <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {account.followedAt ? new Date(account.followedAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {renderStatusBadge(account.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onQuickToggleKeep(account)}
                        title={account.status === 'kept' ? 'Remover da proteção' : 'Manter seguindo'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          account.status === 'kept'
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                            : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenInstagramTab(account.profileUrl)}
                        title="Abrir no Instagram"
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenReview(account)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Revisar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
