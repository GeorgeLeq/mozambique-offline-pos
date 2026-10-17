import React from 'react';
import { ArrowLeft, Wallet, CheckCircle2, History, HelpCircle, AlertTriangle, Users, Lock, Sparkles } from 'lucide-react';
import { InternetStatusBadge } from '../../InternetStatusBadge';
import { UserUsageSummary } from '../../employee/services/userLimitService';
import { useCashierControlI18n } from '../../../i18n';

interface StatsHeaderProps {
  onBack: () => void;
  activeOperatorsCount: number;
  exemptOperatorsCount: number;
  usage?: UserUsageSummary | null;
  onOpenUpgradeModal?: () => void;
  onOpenGuide?: () => void;
  onOpenSessionHistory?: () => void;
}

export default function StatsHeader({
  onBack,
  activeOperatorsCount,
  exemptOperatorsCount,
  usage,
  onOpenUpgradeModal,
  onOpenGuide,
  onOpenSessionHistory
}: StatsHeaderProps) {
  const t = useCashierControlI18n();

  return (
    <header className="relative z-20 px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs shrink-0 w-full">
      {/* Left side: Back, Title, Online Status & Quota */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onBack}
          className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs shrink-0"
          title={t.backToMenu || 'Voltar ao Menu'}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 truncate">
              {t.title || 'Controlo de Caixa'}
            </h1>
            <InternetStatusBadge />
          </div>

          {/* Operator Quota / Capacity Badge */}
          {usage && (
            <div className="hidden md:flex items-center ml-1">
              {usage.isUnlimited ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-2xs">
                  <Users size={13} />
                  {(t.operatorsQuotaUnlimited || '{0} Operadores (Ilimitado)').replace('{0}', String(usage.current))}
                </span>
              ) : usage.isAtLimit ? (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-extrabold transition-all cursor-pointer shadow-xs animate-pulse"
                  title={t.limitReachedTooltip || 'Limite de operadores atingido! Clique para desbloquear operadores ilimitados'}
                >
                  <Lock size={12} />
                  <span>
                    {(t.operatorsQuotaLimit || '{0}/{1} Limite')
                      .replace('{0}', String(usage.current))
                      .replace('{1}', String(usage.limit))}
                  </span>
                  <Sparkles size={12} className="text-amber-500" />
                </button>
              ) : usage.percentage >= 80 ? (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                  title={t.nearCapacityTooltip || 'Capacidade quase cheia! Clique para ver planos'}
                >
                  <Users size={13} />
                  <span>{usage.current}/{usage.limit}</span>
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase">
                    {(t.operatorsQuotaRemaining || '({0} restam)').replace('{0}', String(usage.limit - usage.current))}
                  </span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 text-xs font-medium">
                  <Users size={13} />
                  <span>
                    {(t.operatorsQuotaBadge || '{0}/{1} Operadores')
                      .replace('{0}', String(usage.current))
                      .replace('{1}', String(usage.limit))}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Limit Info Alert, Quick Metrics & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Prominent Info Alert in Stats Header when Limit is Reached */}
        {usage?.isAtLimit && (
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-xs animate-pulse"
            title={t.limitReachedTooltip || 'Capacidade máxima de operadores atingida!'}
          >
            <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden sm:inline font-bold">{t.limitReachedBadge || 'Limite de Operadores Atingido:'}</span>
            <span className="font-mono">{usage.current}/{usage.limit}</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
              {t.upgradeBtn || 'Upgrade'}
            </span>
          </button>
        )}

        {/* Quick Shift Stats Pills */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Wallet size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{(t.activeCountBadge || '{0} Ativos').replace('{0}', String(activeOperatorsCount))}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{(t.exemptCountBadge || '{0} Isentos').replace('{0}', String(exemptOperatorsCount))}</span>
          </div>
        </div>

        {/* Guide Button */}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title={t.guideTooltip || 'Guia Informativo de Controlo de Caixa'}
          >
            <HelpCircle size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{t.guideBtn || 'Guia'}</span>
          </button>
        )}

        {/* Session History Button */}
        {onOpenSessionHistory && (
          <button
            type="button"
            onClick={onOpenSessionHistory}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title={t.sessionHistoryTooltip || 'Abrir Histórico de Sessões'}
          >
            <History size={14} />
            <span className="hidden sm:inline">{t.sessionHistoryBtn || 'Histórico de Sessões'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
