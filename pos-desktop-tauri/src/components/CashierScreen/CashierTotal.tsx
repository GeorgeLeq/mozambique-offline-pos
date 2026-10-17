import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Banknote, LogOut, Settings, SplitSquareHorizontal } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { useI18n } from '../../i18n';

interface CashierTotalProps {
  totalDue: number;
  cartLength: number;
  currentUser: any;
  onOpenBackoffice: () => void;
  onCloseShift: () => void;
  onCheckoutCash: () => void;
  onCheckoutFiado: () => void;
  onCheckoutMPesa: () => void;
  onCheckoutEMola: () => void;
  onCheckoutMixed: () => void;
}

export function CashierTotal({
  totalDue,
  cartLength,
  currentUser,
  onOpenBackoffice,
  onCloseShift,
  onCheckoutCash,
  onCheckoutFiado,
  onCheckoutMPesa,
  onCheckoutEMola,
  onCheckoutMixed
}: CashierTotalProps) {
  const t = useI18n();
  // Localization-aware Tax Rate state
  const [taxRate, setTaxRate] = useState(16);

  useEffect(() => {
    // Load setting instantly
    const rate = localStorage.getItem('tax_rate');
    if (rate !== null) {
      setTaxRate(parseFloat(rate) || 0);
    }
  }, []);

  // Tax calculations
  const subtotal = useMemo(() => {
    if (taxRate <= 0) return totalDue;
    return totalDue / (1 + taxRate / 100);
  }, [totalDue, taxRate]);

  const taxAmount = useMemo(() => {
    return totalDue - subtotal;
  }, [totalDue, subtotal]);

  const hasBackofficeAccess = useMemo(() => {
    if (currentUser?.role === 'Admin') return true;
    try {
      const perms = currentUser?.permissions_json ? JSON.parse(currentUser.permissions_json) : [];
      return perms && perms.length > 0;
    } catch {
      return false;
    }
  }, [currentUser]);

  const handleFiadoCheckoutClick = () => {
    onCheckoutFiado();
  };

  return (
    <div 
      className="w-full lg:w-[420px] xl:w-[460px] bg-white/80 dark:bg-zinc-950/90 3xl p-6 lg:p-7 flex flex-col justify-between relative z-10 select-none overflow-y-auto shrink-0 border-l border-slate-200/80 dark:border-zinc-900 transition-colors duration-500"
    >
      <div className="space-y-5">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">{t.saleSummary || 'Resumo da Venda'}</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1">
            <ThemeToggle />
            {hasBackofficeAccess && (
              <button 
                onClick={onOpenBackoffice}
                className="p-2 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                title={t.accessBackoffice || 'Aceder ao Backoffice de Gestão'}
              >
                <Settings size={18} />
              </button>
            )}
            <button 
              onClick={onCloseShift}
              className="p-2 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
              title={t.closeShift || 'Fechar Turno'}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* Dynamic Tax Breakdown */}
        <div className="space-y-2 bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-4 text-xs font-medium">
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span>{t.subtotalNoVat || 'Subtotal (Sem IVA)'}</span>
            <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
            <span>{t.vatLabel || 'IVA'} ({taxRate}%)</span>
            <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{formatCurrency(taxAmount)}</span>
          </div>
        </div>

        {/* Total Due Display */}
        <div className="space-y-1.5 bg-slate-900 dark:bg-zinc-900/60 border border-slate-800 dark:border-zinc-800 rounded-2xl p-5 shadow-lg dark:shadow-none">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.totalToPay || 'Total a Pagar'}</div>
          <motion.div 
            key={totalDue}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-black font-mono tracking-tight text-white leading-none flex items-baseline gap-2"
          >
            <span>{formatCurrency(totalDue)}</span>
            <span className="text-sm font-bold text-slate-400 dark:text-zinc-500">MT</span>
          </motion.div>
        </div>
      </div>

      {/* Payment Methods Grid CTA */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-900">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          {t.paymentMethods || 'Formas de Pagamento'}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Numerário / Cash */}
          <button
            onClick={onCheckoutCash}
            disabled={cartLength === 0}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 dark:bg-emerald-600/10 hover:bg-emerald-100 dark:hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40 rounded-2xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group shadow-xs"
          >
            <Banknote size={22} className="group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-black uppercase tracking-wider">{t.cash || 'Numerário'}</span>
            <span className="text-[9px] text-emerald-600/70 dark:text-emerald-500/70 font-mono">F1</span>
          </button>

          {/* M-Pesa */}
          <button
            onClick={onCheckoutMPesa}
            disabled={cartLength === 0}
            className="flex flex-col items-center justify-center p-3.5 bg-rose-50 dark:bg-rose-600/10 hover:bg-rose-100 dark:hover:bg-rose-600/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/40 rounded-2xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group shadow-xs"
          >
            <span className="text-lg font-black tracking-tighter mb-0.5">M-PESA</span>
            <span className="text-xs font-black uppercase tracking-wider">M-Pesa</span>
            <span className="text-[9px] text-rose-600/70 dark:text-rose-500/70 font-mono">F2</span>
          </button>

          {/* e-Mola */}
          <button
            onClick={onCheckoutEMola}
            disabled={cartLength === 0}
            className="flex flex-col items-center justify-center p-3.5 bg-amber-50 dark:bg-amber-600/10 hover:bg-amber-100 dark:hover:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40 rounded-2xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group shadow-xs"
          >
            <span className="text-lg font-black tracking-tighter mb-0.5">e-MOLA</span>
            <span className="text-xs font-black uppercase tracking-wider">e-Mola</span>
            <span className="text-[9px] text-amber-600/70 dark:text-amber-500/70 font-mono">F3</span>
          </button>

          {/* Fiado / Crédito */}
          <button
            onClick={handleFiadoCheckoutClick}
            disabled={cartLength === 0}
            className="flex flex-col items-center justify-center p-3.5 bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40 rounded-2xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group shadow-xs relative"
          >
            <span className="text-lg font-black tracking-tighter mb-0.5">FIADO</span>
            <span className="text-xs font-black uppercase tracking-wider">{t.fiadoCredit || 'Fiado'}</span>
            <span className="text-[9px] text-purple-600/70 dark:text-purple-500/70 font-mono">F4</span>
          </button>
        </div>

        {/* Pagamento Misto */}
        <button
          onClick={onCheckoutMixed}
          disabled={cartLength === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-850 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
        >
          <SplitSquareHorizontal size={15} />
          <span>{t.splitPayment || 'Pagamento Dividido / Misto (F5)'}</span>
        </button>
      </div>
    </div>
  );
}
