import React from 'react';
import { ExternalLink, CheckCircle2, Clock, Shield, CameraOff, UserX, Trash2 } from 'lucide-react';
import { InstagramAccount, ReviewStatus } from '../types/instagram';

interface AccountCardProps {
  account: InstagramAccount;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleStatus: (account: InstagramAccount) => void;
  onQuickToggleKeep: (account: InstagramAccount) => void;
  onOpenInstagramTab: (url: string) => void;
  onToggleDeactivated?: (account: InstagramAccount) => void;
  onRemoveAccount?: (id: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  onToggleSelect,
  onToggleStatus,
  onQuickToggleKeep,
  onOpenInstagramTab,
  onToggleDeactivated,
  onRemoveAccount,
}) => {
  const isExcluded = account.status === 'completed';

  const initialLetter = account.username.charAt(0).toUpperCase();

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-sm'
          : isExcluded
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Top Header: Checkbox & Status */}
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(account.id)}
            className="w-4 h-4 text-rose-600 rounded border-neutral-300 focus:ring-rose-500 cursor-pointer"
          />
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Selecionar</span>
        </label>

        {account.status === 'deactivated' || account.isDeactivated ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <UserX className="w-3 h-3" /> Desativada
          </span>
        ) : account.status === 'kept' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Shield className="w-3 h-3" /> Mantido (VIP)
          </span>
        ) : isExcluded ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Verificado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        )}
      </div>

      {/* Middle: Profile Identity and Photo Fallback */}
      <div className="mt-4 flex items-start gap-3.5">
        {/* Avatar or Photo Placeholder */}
        <div className="relative shrink-0">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={`Foto de ${account.username}`}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-750"
            />
          ) : (
            <div
              title="A exportação do Instagram não inclui fotos de terceiros por privacidade. Abra o perfil para conferir a foto atual."
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-750 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400"
            >
              <span className="text-base font-bold text-neutral-700 dark:text-neutral-300 leading-none">
                {initialLetter}
              </span>
              <div className="flex items-center gap-0.5 text-[8px] text-neutral-400 dark:text-neutral-500 mt-1">
                <CameraOff className="w-2.5 h-2.5" />
                <span>local</span>
              </div>
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-neutral-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 text-sm truncate max-w-[160px] inline-flex items-center gap-1 group"
              title={`Ver @${account.username} no Instagram`}
            >
              <span className={isExcluded ? 'line-through opacity-70' : ''}>@{account.username}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {account.displayName && account.displayName !== account.username && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {account.displayName}
            </div>
          )}

          {account.bio && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-1 break-words">
              {account.bio}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            <span>Não te segue de volta</span>
          </div>

          {account.followedAt && (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 tabular-nums">
              Seguindo desde: {new Date(account.followedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions: Open link and Direct "Pendente / Verificado" button */}
      <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuickToggleKeep(account)}
            title={account.status === 'kept' ? 'Remover da proteção' : 'Manter seguindo (Não deixar de seguir)'}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              account.status === 'kept'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{account.status === 'kept' ? 'Mantido' : 'Manter'}</span>
          </button>

          <button
            onClick={() => onOpenInstagramTab(account.profileUrl)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Abrir no Instagram em nova guia"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {onToggleDeactivated && (
            <button
              onClick={() => onToggleDeactivated(account)}
              title={account.status === 'deactivated' ? 'Retornar a Pendente' : 'Marcar como Conta Desativada'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                account.status === 'deactivated'
                  ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60'
                  : 'text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800'
              }`}
            >
              <UserX className="w-4 h-4" />
            </button>
          )}

          {onRemoveAccount && (
            <button
              onClick={() => onRemoveAccount(account.id)}
              title="Remover definitivamente da lista"
              className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* SOLICITADO: No lugar de revisar, troque apenas por um botão Pendente ou Verificado */}
        <button
          onClick={() => onToggleStatus(account)}
          title={isExcluded ? 'Clique para retornar a Pendente' : 'Clique para marcar como Verificado'}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
            isExcluded
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30'
          }`}
        >
          {isExcluded ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verificado</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>Pendente</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
