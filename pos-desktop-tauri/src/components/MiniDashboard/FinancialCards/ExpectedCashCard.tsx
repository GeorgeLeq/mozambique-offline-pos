import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../i18n';

interface ExpectedCashCardProps {
  expectedCash: number;
  pendingDebts: number;
  baseCash: number;
  cashSalesTotal: number;
  payoutsTotal: number;
  formatCurrency: (val: number) => string;
  cashierBreakdown?: any[];
  onNavigate?: (tab: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const ExpectedCashCard: React.FC<ExpectedCashCardProps> = React.memo(({
  expectedCash,
  pendingDebts,
  baseCash,
  cashSalesTotal,
  payoutsTotal,
  formatCurrency,
  cashierBreakdown = [],
  onNavigate
}) => {
  const { currentUser } = useAuth();
  const t = useI18n();
  // Tabs: live drawer/safe cash flow vs potential forecast
  const [cashTab, setCashTab] = useState<'flow' | 'forecast'>('flow');
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  const handleCardClick = () => {
    if (currentUser?.role === 'Admin' && onNavigate) {
      onNavigate('caixas');
    } else {
      setIsBreakdownModalOpen(true);
    }
  };

  return (
    <>
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/20 dark:hover:border-sky-500/10 transition-all min-h-[340px] cursor-pointer"
        onClick={handleCardClick}
      >
        <div>
          <div className="flex justify-between items-start mb-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl">
              <Wallet size={20} className="stroke-[2.5]" />
            </div>
            
            <div className="flex bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setCashTab('flow')}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                  cashTab === 'flow' 
                    ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.till}
              </button>
              <button
                onClick={() => setCashTab('forecast')}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                  cashTab === 'forecast' 
                    ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.forecast}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {cashTab === 'flow' ? (
              <motion.div
                key="cash-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <h3 className="text-slate-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">
                  {t.cashInTill}
                </h3>
                <div className="text-3xl font-black tracking-tight text-sky-600 dark:text-sky-400 font-mono mt-1">
                  {formatCurrency(expectedCash)}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-slate-400 space-y-1.5">
                  <div className="flex justify-between">
                    <span>{t.openingFund}:</span>
                    <span className="text-slate-700 dark:text-zinc-300 font-bold">{formatCurrency(baseCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.cashInflow}:</span>
                    <span className="text-slate-700 dark:text-zinc-300 font-bold">+{formatCurrency(cashSalesTotal)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>{t.payoutsLabel}:</span>
                    <span className="font-bold">-{formatCurrency(payoutsTotal)}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cash-forecast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <h3 className="text-slate-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">
                  {t.revenueForecast}
                </h3>
                <div className="text-3xl font-black tracking-tight text-indigo-500 dark:text-indigo-400 font-mono mt-1">
                  {formatCurrency(expectedCash + pendingDebts)}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-slate-400 space-y-1.5">
                  <div className="flex justify-between">
                    <span>{t.estimatedCash}:</span>
                    <span className="text-slate-700 dark:text-zinc-300 font-bold">{formatCurrency(expectedCash)}</span>
                  </div>
                  <div className="flex justify-between text-amber-500">
                    <span>{t.debtsToCollect}:</span>
                    <span className="font-bold">+{formatCurrency(pendingDebts)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-100 dark:border-zinc-800/50 my-1 pt-1 flex justify-between text-indigo-600 dark:text-indigo-400">
                    <span>{t.potentialTotal}:</span>
                    <span className="font-black">{formatCurrency(expectedCash + pendingDebts)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed font-semibold">
            {currentUser?.role === 'Admin' ? t.manageCashAdminDesc : t.clickCardDetailsDesc}
          </p>
          <button
            onClick={handleCardClick}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 text-sky-500 dark:text-sky-400 font-black px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800/60 transition-all shadow-sm"
          >
            {currentUser?.role === 'Admin' ? t.manageCashBtn : t.viewDetailsBtn}
          </button>
        </div>
      </motion.div>

      {/* Cashier Shift Breakdown Modal */}
      <AnimatePresence>
        {isBreakdownModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBreakdownModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 p-6 max-w-lg w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsBreakdownModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 text-xl font-bold transition-all"
              >
                &times;
              </button>

              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight mb-1">
                {t.cashierControlTitle}
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mb-4">
                {t.cashierControlSub}
              </p>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {cashierBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">{t.noOperatorsRegistered}</p>
                ) : (
                  cashierBreakdown.map((item) => (
                    <div
                      key={item.userId}
                      className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                            {item.name}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md">
                            {item.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          {item.isActive ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-500">{t.activeShift}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
                              <span className="text-slate-400 dark:text-zinc-500">{t.closedShift}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-slate-100 dark:border-zinc-800/30">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">{t.openingFund}:</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{formatCurrency(item.startingCash)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">{t.cashInflow}:</span>
                          <span className="font-bold text-emerald-500">+{formatCurrency(item.cashSales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">{t.payoutsLabel}:</span>
                          <span className="font-bold text-rose-500">-{formatCurrency(item.payouts)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-zinc-800/20 pt-1">
                          <span className="text-slate-500 font-black">{t.estimatedCash}:</span>
                          <span className="font-black text-sky-500">{formatCurrency(item.expectedCash)}</span>
                        </div>
                      </div>

                      {item.isActive && item.shiftStart && (
                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">
                          {t.shiftStartedAt} {new Date(item.shiftStart).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })} ({new Date(item.shiftStart).toLocaleDateString('pt-MZ')})
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{t.totalInTill}:</span>
                <span className="text-base font-black text-sky-500 font-mono">{formatCurrency(expectedCash)}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

export default ExpectedCashCard;
