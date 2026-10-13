import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SafetyNotice: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-950 dark:text-amber-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
              Segurança e Limites do Instagram
              <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                100% Local & Seguro
              </span>
            </div>
            <p className="mt-1 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              O InstaClean <strong>nunca</strong> solicita sua senha, não armazena cookies e não realiza unfollows automáticos em massa. Cada ação é confirmada manualmente por você no Instagram oficial para proteger sua conta contra bloqueios.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 flex items-center gap-1 font-medium shrink-0 pt-0.5"
        >
          {isExpanded ? 'Recolher' : 'Diretrizes de Limites'}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-amber-900 dark:text-amber-200">
          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-amber-500/20">
            <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Limite por Hora
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-normal">
              Recomendamos deixar de seguir no máximo <strong>15 a 20 contas por hora</strong>. O algoritmo do Instagram sinaliza atividades rápidas e repetitivas.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-amber-500/20">
            <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Limite Diário
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-normal">
              Para contas com mais de 6 meses, mantenha o total abaixo de <strong>100 a 150 unfollows por dia</strong>. Contas recentes devem limitar-se a 50/dia.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-amber-500/20">
            <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Retrato Estático
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-normal">
              Os dados representam exatamente o momento em que a exportação oficial foi gerada pelo Instagram. Caso alguém tenha te seguido após o download, confira o perfil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
