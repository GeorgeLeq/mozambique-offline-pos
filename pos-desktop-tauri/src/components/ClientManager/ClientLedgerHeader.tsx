import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  UserPlus, 
  ArrowLeft, 
  RefreshCw, 
  FileSpreadsheet, 
  Users, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { InternetStatusBadge } from '../InternetStatusBadge';
import { getFiadosUsage } from './services/debtService';
import { useCustomersI18n } from '../../i18n';

interface ClientLedgerHeaderProps {
  totalPending: number;
  totalClients: number;
  onExportExcel: () => void;
  onRefresh: () => void;
  isExporting: boolean;
  selectedGroupClient?: string | null;
  onBackToGroups?: () => void;
  onBack?: () => void;
  onOpenGuide?: () => void;
}

export const ClientLedgerHeader = React.memo(function ClientLedgerHeader({
  totalPending,
  totalClients,
  onExportExcel,
  onRefresh,
  isExporting,
  selectedGroupClient,
  onBackToGroups,
  onBack,
  onOpenGuide,
}: ClientLedgerHeaderProps) {
  const t = useCustomersI18n();
  const [usage, setUsage] = useState<{ current: number, limit: number, isAtLimit: boolean, isUnlimited: boolean } | null>(null);

  useEffect(() => {
    const checkLimits = async () => {
      const u = await getFiadosUsage();
      setUsage(u);
    };
    checkLimits();
    
    const handleSubsUpdate = () => checkLimits();
    window.addEventListener('subscription-entitlements-updated', handleSubsUpdate);
    window.addEventListener('subscription-plans-updated', handleSubsUpdate);
    return () => {
      window.removeEventListener('subscription-entitlements-updated', handleSubsUpdate);
      window.removeEventListener('subscription-plans-updated', handleSubsUpdate);
    };
  }, [totalClients]); // re-check when totalClients updates

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-zinc-900/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/5 backdrop-blur-xl shadow-xs transition-colors duration-300 shrink-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Navigation, Title & Internet Status beside Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          {selectedGroupClient ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToGroups}
              className="p-2.5 sm:p-3 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-2xl transition-all cursor-pointer border border-slate-200/60 dark:border-white/5 shrink-0"
              title={t.backToGroups || 'Voltar aos Grupos'}
            >
              <ArrowLeft size={18} className="stroke-[2.5]" />
            </motion.button>
          ) : onBack ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2.5 sm:p-3 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-2xl transition-all cursor-pointer border border-slate-200/60 dark:border-white/5 shrink-0"
              title={t.back || 'Voltar'}
            >
              <ArrowLeft size={18} className="stroke-[2.5]" />
            </motion.button>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <BookOpen size={20} className="stroke-[2.5]" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight truncate">
                {selectedGroupClient ? `${t.clientViewing || 'Fiados de'} ${selectedGroupClient}` : (t.title || 'Livro de Fiados & Clientes')}
              </h1>
              <InternetStatusBadge />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              {selectedGroupClient 
                ? (t.debtHistory || 'Histórico completo de compras a crédito e amortizações')
                : (t.debtSubtitle || 'Gestão de crédito, liquidações, amortizações e cobranças')}
            </p>
          </div>
        </div>

        {/* Center/Right: Quick Metrics & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* Quick Metrics */}
          {!selectedGroupClient && (
            <div className="flex items-center gap-2 mr-1">
              <div className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 ${
                usage?.isAtLimit 
                  ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" 
                  : "bg-slate-50 border-slate-200/60 dark:bg-zinc-950/60 dark:border-white/5"
              }`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  usage?.isAtLimit
                    ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                }`}>
                  <Users size={14} />
                </div>
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider block leading-tight ${
                    usage?.isAtLimit ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-zinc-500"
                  }`}>
                    {usage?.isAtLimit ? (t.toastDebtLimitReached ? t.toastDebtLimitReached.split(' ')[0] : 'Limite') : (t.activeClients || 'Clientes')}
                  </span>
                  <span className={`text-xs font-black font-mono ${
                    usage?.isAtLimit ? "text-rose-700 dark:text-rose-300" : "text-slate-800 dark:text-zinc-200"
                  }`}>
                    {usage?.isUnlimited ? (
                      <>{usage?.current} / <span className="text-indigo-500 text-[10px] ml-0.5 tracking-tighter">∞</span></>
                    ) : (
                      <>{usage?.current} / {usage?.limit}</>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950/60 px-3 py-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <TrendingDown size={14} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block leading-tight">
                    {t.openBalance || 'Saldo Aberto'}
                  </span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatCurrency(totalPending)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Guide Modal Button */}
          {onOpenGuide && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenGuide}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-all border border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={t.fullAuditGuide || 'Guia do Livro de Fiados'}
            >
              <HelpCircle size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t.guideModalTitle ? t.guideModalTitle.split(' ')[0] : 'Guia'}</span>
            </motion.button>
          )}

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRefresh}
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-all border border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={t.syncData || 'Atualizar Registos'}
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">{t.syncTitle || 'Atualizar'}</span>
          </motion.button>

          {/* Export Excel Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isExporting}
            onClick={onExportExcel}
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-all border border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title={t.exportStatement || 'Exportar Relatório'}
          >
            <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{isExporting ? (t.savingBtn || 'A exportar...') : (t.exportTitle || 'Exportar')}</span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
});

