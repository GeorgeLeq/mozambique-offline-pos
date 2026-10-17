import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ArrowRight, MessageSquare } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface PendingDebtsCardProps {
  pendingDebts: number;
  recentDebtors: { id: string; customer_name: string; phone_number: string; amount_mt: number; created_at: string }[];
  onNavigate: (tab: string) => void;
  formatCurrency: (val: number) => string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const PendingDebtsCard: React.FC<PendingDebtsCardProps> = React.memo(({
  pendingDebts,
  recentDebtors,
  onNavigate,
  formatCurrency,
}) => {
  const t = useI18n();
  // Tabs: general info vs recent list with reminders
  const [debtTab, setDebtTab] = useState<'general' | 'recent'>('general');

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/20 dark:hover:border-amber-500/10 transition-all min-h-[340px]"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
            <CreditCard size={20} className="stroke-[2.5]" />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setDebtTab('general')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                debtTab === 'general' 
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.general}
            </button>
            <button
              onClick={() => setDebtTab('recent')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                debtTab === 'recent' 
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.debtors}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {debtTab === 'general' ? (
            <motion.div
              key="debt-general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h3 className="text-slate-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">
                {t.pendingDebtsTitle}
              </h3>
              <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatCurrency(pendingDebts)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed font-semibold mt-4">
                {t.borrowedMoneyDesc}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="debt-recent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-2.5"
            >
              <h3 className="text-slate-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest mb-1">
                {t.recentDebtorsTitle}
              </h3>
              {recentDebtors.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-5 text-center">
                  {t.noPendingDebtors}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[142px] overflow-y-auto pr-1">
                  {recentDebtors.map((debtor) => {
                    const reminderText = encodeURIComponent(`Olá ${debtor.customer_name}, gostaríamos de lembrar gentilmente sobre o valor pendente de ${formatCurrency(debtor.amount_mt)} na nossa loja. Muito obrigado!`);
                    const waUrl = debtor.phone_number 
                      ? `https://wa.me/${debtor.phone_number.replace(/\D/g, '')}?text=${reminderText}` 
                      : `https://wa.me/?text=${reminderText}`;
                    
                    return (
                      <div key={debtor.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800/40">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">
                            {debtor.customer_name}
                          </p>
                          {debtor.phone_number && (
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {debtor.phone_number}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 pl-2 shrink-0">
                          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 font-mono">
                            {formatCurrency(debtor.amount_mt)}
                          </span>
                          <button
                            onClick={() => window.open(waUrl, '_blank')}
                            title={t.sendWhatsappReminder}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                          >
                            <MessageSquare size={12} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
        <button 
          onClick={() => onNavigate('clients')} 
          className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-black rounded-xl transition-all"
          id="financial-manage-clients-btn"
        >
          {t.manageClientsFiado}
          <ArrowRight size={12} className="stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
});

export default PendingDebtsCard;
