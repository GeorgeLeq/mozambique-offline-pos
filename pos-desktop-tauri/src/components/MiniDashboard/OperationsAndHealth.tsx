import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, Activity, Cloud, CloudOff, RefreshCw, Lock } from 'lucide-react';
import { useI18n } from '../../i18n';

interface OperationsAndHealthProps {
  voidCount: number;
  totalVoidAmount?: number;
  manualDiscounts?: number;
  cashierName: string;
  pendingSync: number;
  onNavigateToOperator?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function OperationsAndHealth({
  voidCount,
  totalVoidAmount = 0,
  manualDiscounts = 0,
  cashierName,
  pendingSync,
  onNavigateToOperator
}: OperationsAndHealthProps) {
  const t = useI18n();
  const actualVoids = voidCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Operations & Security Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-white/5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200/60 dark:border-rose-500/20">
                <ShieldAlert size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {t.opsAndSecurity}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  {t.opsAndSecuritySub}
                </p>
              </div>
            </div>

            {onNavigateToOperator && (
              <button
                onClick={onNavigateToOperator}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer border border-indigo-200/50 dark:border-indigo-500/20"
              >
                {t.manageOperators}
              </button>
            )}
          </div>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100/60 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">{t.voidsTitle}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.totalLabel}: <span className="text-rose-600 font-mono font-bold">{totalVoidAmount.toLocaleString('pt-MZ')} MT</span></p>
                </div>
              </div>
              <div className="text-xs font-black text-rose-600 font-mono bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-200/60 dark:border-rose-500/20">
                {actualVoids} {t.itemsUnit}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100/60 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Activity size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">{t.manualDiscountsTitle}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.appliedInPayments}</p>
                </div>
              </div>
              <div className="text-xs font-black text-amber-600 font-mono bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-500/20">
                {manualDiscounts.toLocaleString('pt-MZ')} MT
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                {cashierName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.activeSession}</span>
              <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-0.5">{cashierName}</p>
            </div>
          </div>
          <div className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20">
            {t.activeOperator}
          </div>
        </div>
      </motion.div>

      {/* Cloud & Backup Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-white/5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-3 pb-3.5 mb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200/60 dark:border-sky-500/20">
              <Cloud size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                {t.backupAndCloud}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                {t.backupAndCloudSub}
              </p>
            </div>
          </div>

          <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${
            pendingSync === 0 
              ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/15' 
              : 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/15'
          }`}>
            {pendingSync === 0 ? (
              <div className="text-center">
                <div className="inline-flex p-3 bg-emerald-100/60 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl mb-2">
                  <Cloud size={22} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                  {t.dataProtected}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  {t.dataProtectedDesc}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex p-3 bg-amber-100/60 dark:bg-amber-500/10 text-amber-600 rounded-2xl mb-2">
                  <CloudOff size={22} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                  {t.offlineWork}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  {t.offlineRecordsDesc.replace('{{count}}', pendingSync.toString())}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed font-bold flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5">
            <RefreshCw size={11} className="animate-spin text-indigo-500" />
            <span>{t.backgroundSyncActive}</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
            <Lock size={10} />
            <span>{t.secureBadge}</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
