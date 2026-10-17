import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useI18n } from '../../i18n';

interface MixedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  onConfirm: (details: { cash: number; mpesa: number; emola: number }) => void;
}

export function MixedPaymentModal({ isOpen, onClose, totalDue, onConfirm }: MixedPaymentModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const [cashAmount, setCashAmount] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [emolaAmount, setEmolaAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCashAmount('');
      setMpesaAmount('');
      setEmolaAmount('');
    }
  }, [isOpen]);

  const cash = parseFloat(cashAmount) || 0;
  const mpesa = parseFloat(mpesaAmount) || 0;
  const emola = parseFloat(emolaAmount) || 0;
  
  const totalEntered = cash + mpesa + emola;
  const remaining = Math.max(0, totalDue - totalEntered);
  const isValid = totalEntered >= totalDue;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 "
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t.mixedPaymentTitle || 'Pagamento Misto'}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-2">
                <span className="text-slate-500 dark:text-zinc-400 font-semibold text-sm">{t.totalToPay || 'Total a Pagar'}</span>
                <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 font-mono">{formatCurrency(totalDue)} MT</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.cashAmount || 'Cash (Dinheiro)'}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white font-mono"
                    placeholder="0"
                  />
                  <button onClick={() => setCashAmount((cash + remaining).toString())} className="absolute right-2 top-2 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md font-bold cursor-pointer">Max</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">M-Pesa</label>
                <div className="relative">
                  <input
                    type="number"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-red-500 focus:outline-none text-slate-900 dark:text-white font-mono"
                    placeholder="0"
                  />
                  <button onClick={() => setMpesaAmount((mpesa + remaining).toString())} className="absolute right-2 top-2 text-xs bg-red-50 dark:bg-rose-900/40 text-red-600 dark:text-rose-400 px-2 py-1 rounded-md font-bold cursor-pointer">Max</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">e-Mola</label>
                <div className="relative">
                  <input
                    type="number"
                    value={emolaAmount}
                    onChange={(e) => setEmolaAmount(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white font-mono"
                    placeholder="0"
                  />
                  <button onClick={() => setEmolaAmount((emola + remaining).toString())} className="absolute right-2 top-2 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-bold cursor-pointer">Max</button>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="font-bold text-slate-500 dark:text-zinc-400 text-sm">{t.remainingToPay || 'Falta Pagar'}</span>
                <span className={`text-xl font-black font-mono ${remaining > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{formatCurrency(remaining)} MT</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-zinc-800">
              <button
                disabled={!isValid}
                onClick={() => onConfirm({ cash, mpesa, emola })}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all ${
                  isValid
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 cursor-pointer'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Check size={24} />
                {commonT.confirm || 'Confirmar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
