import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Shield,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  EyeOff,
  CameraOff,
  Sparkles,
  Info
} from 'lucide-react';
import { InstagramAccount, ReviewSession } from '../types/instagram';

interface AssistedReviewModalProps {
  account: InstagramAccount | null;
  currentIndex: number;
  totalPendingCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnfollow: (account: InstagramAccount) => void;
  onKeepFollowing: (account: InstagramAccount) => void;
  onSkip: () => void;
  onIgnore: (account: InstagramAccount) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  session: ReviewSession;
}

export const AssistedReviewModal: React.FC<AssistedReviewModalProps> = ({
  account,
  currentIndex,
  totalPendingCount,
  isOpen,
  onClose,
  onConfirmUnfollow,
  onKeepFollowing,
  onSkip,
  onIgnore,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  session,
}) => {
  const [profileOpened, setProfileOpened] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  useEffect(() => {
    // Reset opened state when account changes
    setProfileOpened(false);
  }, [account?.id]);

  useEffect(() => {
    if (session.completedThisSession >= session.hourlySafetyLimit) {
      setShowLimitWarning(true);
    }
  }, [session.completedThisSession, session.hourlySafetyLimit]);

  const handleOpenInstagram = useCallback(() => {
    if (!account) return;
    setProfileOpened(true);
    window.open(account.profileUrl, '_blank', 'noopener,noreferrer');
  }, [account]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Progress & Close */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Revisão Assistida Passo a Passo
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Perfil {currentIndex + 1} de {totalPendingCount} para revisar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Safety counter pill */}
            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 ${
                session.completedThisSession >= session.hourlySafetyLimit
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
              title="Quantidade de unfollows confirmados nesta hora"
            >
              <span className="tabular-nums font-semibold">{session.completedThisSession}</span> / {session.hourlySafetyLimit} hora
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Limit Warning banner if hourly limit exceeded */}
          {showLimitWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Atenção ao limite do Instagram:</strong> Você já confirmou {session.completedThisSession} unfollows nesta sessão. Para a segurança da sua conta, sugerimos pausar alguns minutos antes de continuar.
              </div>
            </div>
          )}

          {/* Account Profile Card Highlight */}
          <div className="bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-750 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            {/* Real Avatar or Explicit Placeholder */}
            <div className="relative shrink-0">
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt={`Foto de ${account.username}`}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 border-2 border-white dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-300">
                  <span className="text-2xl font-bold">
                    {account.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-neutral-500 mt-1">
                    <CameraOff className="w-3 h-3" />
                    <span>indisponível</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
                  @{account.username}
                </h4>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 self-center sm:self-auto">
                  Não te segue de volta
                </span>
              </div>

              {account.displayName && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                  {account.displayName}
                </p>
              )}

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {account.followedAt ? (
                  <>Você segue esta conta desde <strong>{new Date(account.followedAt).toLocaleDateString('pt-BR')}</strong></>
                ) : (
                  'Identificada na sua lista de contas seguidas'
                )}
              </p>

              {/* Status explanation */}
              <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-center sm:justify-start gap-1">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <span>Esta conta não aparece na lista de seguidores da sua exportação oficial.</span>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="space-y-4">
            {/* Step 1: Open profile button */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[11px]">1</span>
                  Abrir perfil no Instagram
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Visualizar a foto atual, publicações e confirmar a identidade da conta.
                </p>
              </div>

              <button
                onClick={handleOpenInstagram}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{profileOpened ? 'Reabrir no Instagram' : 'Abrir Perfil no Instagram'}</span>
              </button>
            </div>

            {/* Step 2: Instructions and manual confirmation */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">2</span>
                Ação no Instagram & Confirmação Manual
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <p>Na aba do Instagram que acabou de abrir:</p>
                <ol className="list-decimal pl-5 space-y-1 text-neutral-500 dark:text-neutral-400">
                  <li>Clique no botão <strong className="text-neutral-800 dark:text-neutral-200">"Seguindo"</strong> no topo do perfil.</li>
                  <li>Selecione <strong className="text-neutral-800 dark:text-neutral-200">"Deixar de seguir"</strong>.</li>
                  <li>Volte aqui e clique no botão abaixo para registrar a conclusão.</li>
                </ol>
              </div>

              {/* Confirmation Button */}
              <button
                onClick={() => onConfirmUnfollow(account)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmo que Deixei de Seguir @{account.username}</span>
              </button>
            </div>
          </div>

          {/* Alternative Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onKeepFollowing(account)}
              className="py-2.5 px-3 bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Não deixar de seguir e salvar na lista de favoritos/protegidos"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Manter Seguindo</span>
            </button>

            <button
              onClick={onSkip}
              className="py-2.5 px-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Deixar pendente e revisar mais tarde"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Pular por Enquanto</span>
            </button>

            <button
              onClick={() => onIgnore(account)}
              className="py-2.5 px-3 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Ocultar da lista de pendentes"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ignorar Perfil</span>
            </button>
          </div>
        </div>

        {/* Modal Footer with Previous / Next */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
              hasPrev
                ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Perfil Anterior</span>
          </button>

          <span className="text-[11px] text-neutral-400 hidden sm:inline-block">
            Dica: Use as setas do teclado ← e → para navegar
          </span>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
              hasNext
                ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
            }`}
          >
            <span>Próximo Perfil</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
