import React, { useState, useMemo } from 'react';
import {
  UserX,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { InstagramAccount } from '../types/instagram';
import { isSuspectedDeactivated } from '../services/zipParser';

interface DeactivatedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: InstagramAccount[];
  onRemoveAccounts: (accountIds: string[], reason?: string) => void;
  onMarkDeactivated: (accountIds: string[]) => void;
}

export const DeactivatedAccountsModal: React.FC<DeactivatedAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onRemoveAccounts,
  onMarkDeactivated,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'paste' | 'list'>('auto');
  const [pasteText, setPasteText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Auto-detect suspected accounts (placeholders like instagram_user, broken urls, etc)
  const suspectedAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      return (
        acc.isDeactivated ||
        acc.status === 'deactivated' ||
        isSuspectedDeactivated(acc)
      );
    });
  }, [accounts]);

  // Accounts marked as deactivated currently
  const markedDeactivatedAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.status === 'deactivated' || acc.isDeactivated);
  }, [accounts]);

  // Find accounts matching pasted usernames
  const matchedPastedAccounts = useMemo(() => {
    if (!pasteText.trim()) return [];
    const tokens = pasteText
      .split(/[\n,;\s]+/)
      .map((t) => t.trim().toLowerCase().replace(/^@/, ''))
      .filter((t) => t.length > 0);

    const tokenSet = new Set(tokens);
    return accounts.filter((acc) => {
      const u = acc.username.toLowerCase();
      const id = acc.id.toLowerCase();
      return tokenSet.has(u) || tokenSet.has(id);
    });
  }, [pasteText, accounts]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleRemoveAllSuspected = () => {
    if (suspectedAccounts.length === 0) return;
    const ids = suspectedAccounts.map((a) => a.id);
    onRemoveAccounts(ids, 'Contas desativadas removidas automaticamente');
    showFeedback(`${ids.length} conta(s) desativada(s) foram removidas da lista.`);
  };

  const handleMarkAllSuspected = () => {
    if (suspectedAccounts.length === 0) return;
    const ids = suspectedAccounts.map((a) => a.id);
    onMarkDeactivated(ids);
    showFeedback(`${ids.length} conta(s) foram marcadas como Desativadas.`);
  };

  const handleRemovePasted = () => {
    if (matchedPastedAccounts.length === 0) return;
    const ids = matchedPastedAccounts.map((a) => a.id);
    onRemoveAccounts(ids, 'Contas desativadas informadas manualmente');
    setPasteText('');
    showFeedback(`${ids.length} conta(s) desativada(s) foram localizadas e removidas.`);
  };

  const handleMarkPastedDeactivated = () => {
    if (matchedPastedAccounts.length === 0) return;
    const ids = matchedPastedAccounts.map((a) => a.id);
    onMarkDeactivated(ids);
    setPasteText('');
    showFeedback(`${ids.length} conta(s) foram marcadas como Desativadas.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Identificar & Remover Contas Desativadas
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Remova perfis excluídos ou que não existem mais para não poluir sua lista
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-5 pt-2 gap-2 text-xs font-medium bg-white dark:bg-neutral-900">
          <button
            onClick={() => setActiveTab('auto')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'auto'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Detecção Automática ({suspectedAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'paste'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Informar Usuários Vistos</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'list'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Desativadas Atuais ({markedDeactivatedAccounts.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: Auto Detection */}
          {activeTab === 'auto' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Como o Instagram exporta contas excluídas/desativadas
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                    No arquivo de exportação, o Instagram frequentemente substitui perfis excluídos por nomes como <strong>instagram_user</strong>, links sem nome de usuário ou textos como <strong>Usuário do Instagram</strong>. O sistema varreu sua lista e detectou as contas abaixo.
                  </p>
                </div>
              </div>

              {suspectedAccounts.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Nenhum perfil com placeholder óbvio detectado no arquivo
                  </p>
                  <p className="text-neutral-500 text-[11px] max-w-md mx-auto">
                    Contas que foram desativadas recentemente ainda podem ter o nome antigo no arquivo. Se você abrir um perfil no Instagram e ver "Esta página não está disponível", use a aba <strong>Informar Usuários Vistos</strong> ou clique no botão de lixeira no próprio card do perfil!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {suspectedAccounts.length} conta(s) identificada(s) como desativada(s):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMarkAllSuspected}
                        className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                      >
                        Marcar como Desativadas
                      </button>
                      <button
                        onClick={handleRemoveAllSuspected}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Todas da Lista</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-200 dark:divide-neutral-800 max-h-60 overflow-y-auto">
                    {suspectedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 dark:text-white truncate">
                              @{acc.username}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              Desativada/Inexistente
                            </span>
                          </div>
                          {acc.displayName && acc.displayName !== acc.username && (
                            <div className="text-[11px] text-neutral-500 truncate">
                              {acc.displayName}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={acc.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                            title="Testar no Instagram"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onRemoveAccounts([acc.id], 'Removida conta desativada')}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Paste Usernames Found While Browsing */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-start gap-2.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Viu contas que deram "Página não disponível" ao abrir guias?
                  </p>
                  <p className="mt-0.5">
                    Cole os nomes de usuário abaixo (separados por vírgula, espaço ou um por linha). O sistema vai encontrá-los na sua lista para remoção imediata.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nomes de usuário desativados:
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Ex: @usuario1, usuario2, usuario3&#10;ou cole a lista aqui..."
                  rows={4}
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {matchedPastedAccounts.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      {matchedPastedAccounts.length} conta(s) localizada(s) na sua lista
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkPastedDeactivated}
                      className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer font-medium"
                    >
                      Marcar como Desativadas
                    </button>
                    <button
                      onClick={handleRemovePasted}
                      className="px-3 py-1 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover da Lista Agora</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Currently Marked Deactivated */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Total de contas marcadas como desativadas: {markedDeactivatedAccounts.length}
                </span>
                {markedDeactivatedAccounts.length > 0 && (
                  <button
                    onClick={() => {
                      const ids = markedDeactivatedAccounts.map((a) => a.id);
                      onRemoveAccounts(ids, 'Excluídas contas desativadas');
                      showFeedback(`${ids.length} contas foram permanentemente removidas.`);
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Todas Definitivamente</span>
                  </button>
                )}
              </div>

              {markedDeactivatedAccounts.length === 0 ? (
                <div className="py-8 text-center text-neutral-400">
                  Nenhuma conta marcada como desativada no momento.
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-200 dark:divide-neutral-800 max-h-60 overflow-y-auto">
                  {markedDeactivatedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          @{acc.username}
                        </span>
                        {acc.displayName && acc.displayName !== acc.username && (
                          <span className="ml-2 text-neutral-500 text-[11px]">
                            ({acc.displayName})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveAccounts([acc.id], 'Removida da lista')}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-500">
            Dica: No card de cada perfil você também pode clicar no ícone <strong>Desativada / Lixeira</strong> para remover na hora.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:bg-neutral-800 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
