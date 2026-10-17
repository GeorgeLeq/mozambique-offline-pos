import React from 'react';
import { ShieldAlert, ShieldCheck, History, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { useCashierControlI18n } from '../../../i18n';

interface ControlToolbarProps {
  isLockdownActive: boolean;
  onToggleLockdown: () => void;
  onOpenSessionHistory: () => void;
  onOpenGuide?: () => void;
  onScrollToTop?: () => void;
  onScrollToTable?: () => void;
}

export default function ControlToolbar({
  isLockdownActive,
  onToggleLockdown,
  onOpenSessionHistory,
  onOpenGuide,
  onScrollToTop,
  onScrollToTable
}: ControlToolbarProps) {
  const t = useCashierControlI18n();

  return (
    <div className="w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <div className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
          {t.operationalControlBadge || 'Controlo Operacional de Caixa'}
        </div>
      </div>

      <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5 self-stretch justify-end">
        {/* Scroll To Top Button */}
        {onScrollToTop && (
          <button
            type="button"
            onClick={onScrollToTop}
            className="p-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl border border-slate-200/60 dark:border-white/10 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            title={t.scrollToTopTitle || 'Saltar para o Topo'}
          >
            <ArrowUp size={16} />
          </button>
        )}

        {/* Scroll To Table Button */}
        {onScrollToTable && (
          <button
            type="button"
            onClick={onScrollToTable}
            className="p-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-slate-200/60 dark:border-white/10 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            title={t.scrollToTableTitle || 'Descer para a Tabela'}
          >
            <ArrowDown size={16} />
          </button>
        )}

        {/* Informative Guide Modal Button */}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
            title={t.openGuideTooltip || 'Abrir Guia Informativo de Controlo de Caixa'}
          >
            <Info size={16} />
            <span>{t.guideButton || 'Guia'}</span>
          </button>
        )}

        {/* Session History Logs Button */}
        <button
          onClick={onOpenSessionHistory}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-95 cursor-pointer border bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-indigo-200 dark:hover:border-indigo-950 hover:text-indigo-600 transition-colors"
        >
          <History size={16} />
          <span>{t.sessionHistoryBtn || 'Histórico de Sessões'}</span>
        </button>

        {/* Lockdown toggle button */}
        <button
          onClick={onToggleLockdown}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-95 cursor-pointer border ${
            isLockdownActive
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50'
              : 'bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-rose-200 hover:text-rose-600 dark:hover:border-rose-950'
          }`}
        >
          {isLockdownActive ? (
            <>
              <ShieldAlert size={16} className="animate-pulse" />
              <span>{t.systemInLockdownActive || 'SISTEMA EM LOCKDOWN (Desativar)'}</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>{t.lockdownGeneralBtn || 'Bloqueio Geral (Lockdown)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
