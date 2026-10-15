import React from 'react';
import { AlertTriangle, Clock, Calendar, X } from 'lucide-react';
import { InstagramAccount, ReviewSession } from '../types/instagram';

interface SafetyLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  account: InstagramAccount | null;
  session: ReviewSession;
}

export const SafetyLimitDialog: React.FC<SafetyLimitDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  account,
  session,
}) => {
  if (!isOpen || !account) return null;

  const hourlyExceeded = session.unfollowsThisHour >= session.hourlySafetyLimit;
  const dailyExceeded = session.unfollowsToday >= session.dailySafetyLimit;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg">
              Limite de Segurança Atingido
            </h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              Para proteger sua conta do Instagram contra bloqueios, os unfollows devem respeitar limites de frequência.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Hourly Limit */}
          <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${
            hourlyExceeded
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-750'
          }`}>
            <div className={`p-1.5 rounded-lg ${
              hourlyExceeded
                ? 'bg-amber-100 dark:bg-amber-900/40'
                : 'bg-neutral-200 dark:bg-neutral-800'
            }`}>
              <Clock className={`w-4 h-4 ${
                hourlyExceeded
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Limite por Hora
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {session.unfollowsThisHour} de {session.hourlySafetyLimit} unfollows esta hora
              </div>
            </div>
          </div>

          {/* Daily Limit */}
          <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${
            dailyExceeded
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-750'
          }`}>
            <div className={`p-1.5 rounded-lg ${
              dailyExceeded
                ? 'bg-amber-100 dark:bg-amber-900/40'
                : 'bg-neutral-200 dark:bg-neutral-800'
            }`}>
              <Calendar className={`w-4 h-4 ${
                dailyExceeded
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Limite Diário
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {session.unfollowsToday} de {session.dailySafetyLimit} unfollows hoje
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
            <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
              Você atingiu o limite de <strong>{hourlyExceeded ? 'hora' : 'dia'}
              </strong>. O Instagram pode sinalizar atividades repetitivas. 
              Recomendamos aguardar antes de continuar.
            </p>
          </div>

          {/* Account to unfollow */}
          <div className="flex items-center gap-2.5 p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-750">
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-xs">
              {account.username.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                @{account.username}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                Esta ação será registrada como "Verificado"
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Continuar Mesmo Assim
          </button>
        </div>
      </div>
    </div>
  );
};
