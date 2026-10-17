import React from 'react';
import { motion } from 'motion/react';
import { User, Phone, ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { useCustomersI18n } from '../../i18n';

interface ClientGroupCardProps {
  key?: React.Key;
  clientName: string;
  debts: DebtRecord[];
  onClick: (clientName: string) => void;
}

export const ClientGroupCard = React.memo(function ClientGroupCard({ clientName, debts, onClick }: ClientGroupCardProps) {
  const t = useCustomersI18n();
  const totalPending = debts
    .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
    .reduce((sum, d) => sum + (d.amount_mt || 0), 0);
    
  const totalOriginal = debts
    .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
    .reduce((sum, d) => sum + (d.original_amount || d.amount_mt || 0), 0);
    
  const latestDebt = debts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const unpaidCount = debts.filter(d => d.status === 'unpaid' && d.is_deleted !== 1).length;

  const initials = clientName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onClick(clientName)}
      className="bg-white dark:bg-zinc-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs flex flex-col gap-5 group hover:border-indigo-500/50 transition-all relative overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold tracking-wider text-base font-sans shadow-inner shrink-0">
            {initials || <User size={22} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 tracking-tight leading-snug truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {clientName}
            </h3>
            {latestDebt?.phone_number ? (
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 font-mono">
                <Phone size={11} className="text-slate-400 dark:text-zinc-500" />
                {latestDebt.phone_number}
              </div>
            ) : (
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 mt-1">
                {t.notInformed || 'Sem Telefone'}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 px-2.5 py-1 rounded-full w-fit">
              <AlertCircle size={11} className={unpaidCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-500'} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                {unpaidCount} {t.records || 'Registos pendentes'}
              </span>
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
          <ChevronRight size={20} />
        </div>
      </div>

      <div className="mt-1 pt-4 border-t border-slate-100 dark:border-zinc-800/80 relative z-10">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t.pendingBalance || 'Saldo Pendente'}</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight leading-none mt-1">
              {formatCurrency(totalPending)}
            </span>
          </div>
          {totalOriginal > totalPending && (
            <div className="text-right">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t.originalAmount || 'Dívida Original'}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-zinc-400 font-mono block mt-1">
                {formatCurrency(totalOriginal)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

