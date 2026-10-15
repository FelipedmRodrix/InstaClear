import React from 'react';
import { X, RotateCcw, Clock, History as HistoryIcon, Trash2 } from 'lucide-react';
import { ActionHistoryEntry } from '../types/instagram';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ActionHistoryEntry[];
  onUndo: (entry: ActionHistoryEntry) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onUndo,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center">
              <HistoryIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Histórico de Ações e Auditoria
              </h3>
              <p className="text-[11px] text-neutral-400">
                {history.length} ações registradas localmente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Nenhuma ação foi registrada ainda. À medida que você revisar os perfis, o histórico aparecerá aqui.
            </div>
          ) : (
            history.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <span>@{entry.username}</span>
                    <span className="text-neutral-400 font-normal">·</span>
                    <span className="text-[11px] font-normal text-neutral-500">
                      {entry.actionDescription}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                    {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>

                <button
                  onClick={() => onUndo(entry)}
                  className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Desfazer esta alteração"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Desfazer</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="text-xs text-neutral-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar histórico</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
