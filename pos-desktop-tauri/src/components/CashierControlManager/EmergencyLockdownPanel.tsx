import React from 'react';
import { ShieldAlert, Unlock } from 'lucide-react';
import { useCashierControlI18n } from '../../i18n';

interface EmergencyLockdownPanelProps {
  isLockdownActive: boolean;
  onToggleEmergencyLockdown: () => void;
}

export default function EmergencyLockdownPanel({
  isLockdownActive,
  onToggleEmergencyLockdown,
}: EmergencyLockdownPanelProps) {
  const t = useCashierControlI18n();

  return (
    <div className="p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 shadow-lg space-y-4">
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
          isLockdownActive 
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' 
            : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
        }`}>
          <ShieldAlert size={22} className={isLockdownActive ? 'animate-pulse' : ''} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <span>{t.lockdownPanelTitle || 'Lockdown de Emergência'}</span>
            {isLockdownActive && (
              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full text-[9px] font-bold">
                {t.lockdownPanelActive || 'ATIVO'}
              </span>
            )}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold leading-relaxed mt-1">
            {t.lockdownPanelDesc || 'Ative para impedir a entrada de todos os operadores comuns de caixa instantaneamente. Apenas administradores terão acesso de login.'}
          </p>
        </div>
      </div>

      <button
        onClick={onToggleEmergencyLockdown}
        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-98 cursor-pointer ${
          isLockdownActive
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50 shadow-emerald-500/10'
            : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500/50 shadow-rose-500/10'
        }`}
      >
        {isLockdownActive ? (
          <>
            <Unlock size={14} />
            <span>{t.lockdownBtnDeactivate || 'Desativar Lockdown'}</span>
          </>
        ) : (
          <>
            <ShieldAlert size={14} />
            <span>{t.lockdownBtnActivate || 'Ativar Lockdown Instantâneo'}</span>
          </>
        )}
      </button>
    </div>
  );
}
