import React from 'react';
import { X, CheckCircle2, AlertTriangle, FileText, Download, Users, UserMinus, ShieldCheck } from 'lucide-react';
import { ImportAuditReport } from '../types/instagram';

interface ImportReportModalProps {
  report: ImportAuditReport | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToReview: () => void;
}

export const ImportReportModal: React.FC<ImportReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onProceedToReview,
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Relatório de Auditoria da Importação
              </h3>
              <p className="text-[11px] text-neutral-400">
                {report.fileName} · {new Date(report.importedAt).toLocaleTimeString('pt-BR')}
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Main Comparison Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-neutral-50 dark:bg-neutral-850 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">Contas Seguidas</div>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {report.totalFollowing}
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-850 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">Seus Seguidores</div>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {report.totalFollowers}
              </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900">
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">Não Seguem de Volta</div>
              <div className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {report.notFollowingBackCount}
              </div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Seguidores mútuos (seguem você e você os segue):</span>
              <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">{report.mutualCount}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Seguidores que você não segue de volta:</span>
              <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">{report.followersNotFollowedBackCount}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Entradas duplicadas ignoradas com segurança:</span>
              <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">{report.duplicateCount}</span>
            </div>
          </div>

          {/* Files scanned */}
          <div className="space-y-1.5">
            <h5 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Arquivos Localizados e Processados ({report.filesScanned.length}):
            </h5>
            <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-lg text-neutral-700 dark:text-neutral-300">
              {report.filesScanned.map((file, idx) => (
                <div key={idx} className="truncate">✓ {file}</div>
              ))}
            </div>
          </div>

          {/* Warnings if any */}
          {report.warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Observações da Análise:
              </div>
              {report.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={onProceedToReview}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Ver Perfis Identificados ({report.notFollowingBackCount})
          </button>
        </div>
      </div>
    </div>
  );
};
