import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useI18n } from '../../i18n';

interface ChangeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  onConfirm: (receivedAmount: number) => void;
}

export function ChangeCalculatorModal({ isOpen, onClose, totalDue, onConfirm }: ChangeCalculatorModalProps) {
  const { pos: t } = useI18n();
  const [receivedAmount, setReceivedAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReceivedAmount('');
    }
  }, [isOpen]);

  const change = Math.max(0, (parseFloat(receivedAmount) || 0) - totalDue);
  const isValid = (parseFloat(receivedAmount) || 0) >= totalDue;

  const quickAmounts = [
    totalDue,
    Math.ceil(totalDue / 50) * 50,
    Math.ceil(totalDue / 100) * 100,
    Math.ceil(totalDue / 500) * 500,
    Math.ceil(totalDue / 1000) * 1000
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalDue);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 "
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{t.changeCalculatorTitle || 'Calculadora de Trocos'}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800/80">
                <span className="text-slate-600 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">{t.totalToPay || 'Total a Pagar'}</span>
                <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">{formatCurrency(totalDue)} MT</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">{t.amountReceivedMt || 'Valor Recebido (MT)'}</label>
                <input
                  type="number"
                  autoFocus
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full text-center text-4xl font-black font-mono p-4 bg-white dark:bg-zinc-950 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-2xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setReceivedAmount(amt.toString())}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold font-mono text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-500/20"
                  >
                    {formatCurrency(amt)} MT
                  </button>
                ))}
              </div>

              <div className={`flex justify-between items-center p-5 rounded-2xl border transition-colors ${isValid ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 border-slate-200 dark:bg-zinc-950/50 dark:border-zinc-800'}`}>
                <span className={`font-bold text-xs uppercase tracking-wider ${isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}`}>{t.changeToReturn || 'Troco a Devolver'}</span>
                <span className={`text-3xl font-black font-mono ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-600'}`}>{formatCurrency(change)} MT</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-zinc-800">
              <button
                disabled={!isValid}
                onClick={() => onConfirm(parseFloat(receivedAmount) || 0)}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                  isValid
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Check size={20} />
                {t.confirmPayment || 'Confirmar Pagamento'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
