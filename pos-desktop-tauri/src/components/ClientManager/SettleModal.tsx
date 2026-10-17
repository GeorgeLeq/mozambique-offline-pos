import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { useCustomersI18n } from '../../i18n';
import { PaymentHistoryGuideModal } from './PaymentHistoryGuideModal';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebt: DebtRecord | null;
  onConfirm: (amountPaid: string, paymentMethod: string) => void;
}

export function SettleModal({
  isOpen,
  onClose,
  selectedDebt,
  onConfirm
}: SettleModalProps) {
  const t = useCustomersI18n();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [localAmountPaid, setLocalAmountPaid] = useState('');
  const [localPaymentMethod, setLocalPaymentMethod] = useState('cash');

  useEffect(() => {
    if (selectedDebt) {
      setLocalAmountPaid(selectedDebt.amount_mt.toString());
      setLocalPaymentMethod('cash');
    }
  }, [selectedDebt, isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onConfirm(localAmountPaid, localPaymentMethod);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && selectedDebt && (
        <div key="settle-modal-container" className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            layout
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ 
              x: { type: 'spring', stiffness: 350, damping: 32, mass: 0.8 },
              layout: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },
              opacity: { duration: 0.2 }
            }}
            className={`relative ${isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[480px] md:w-[540px] lg:w-[580px]'} bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 text-slate-900 dark:text-white transition-colors`}
          >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950 shrink-0">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-emerald-500/20">
                {t.settleTitle || 'LIQUIDAR FIADO'}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {t.registerPayment || 'Registar Pagamento'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                title={t.paymentGuideBtn || 'Guia de Pagamentos'}
              >
                <HelpCircle size={17} />
                <span className="hidden sm:inline">{t.guideBtn || 'Guia'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={isFullScreen ? (t.restoreSize || 'Restaurar Tamanho') : (t.expandTwoColumns || 'Expandir e Ver em 2 Colunas')}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={t.closeBtn || 'Fechar'}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          <PaymentHistoryGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-700 dark:text-zinc-300">
            <motion.div 
              layout 
              transition={{ type: 'spring', stiffness: 300, damping: 28 }} 
              className={`grid grid-cols-1 ${isFullScreen ? 'md:grid-cols-2' : ''} gap-6 items-start`}
            >
              
              {/* LEFT COLUMN: Summary */}
              <motion.div 
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 }}
                className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl space-y-3"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    {t.debtRemaining || 'Dívida em Falta'}
                  </span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-none block">
                    {formatCurrency(selectedDebt.amount_mt)}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <p className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">
                    {t.client || 'Cliente'}: <span className="text-slate-900 dark:text-zinc-100 font-bold">{selectedDebt.customer_name}</span>
                  </p>
                  {selectedDebt.phone_number && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      {t.contact || 'Contacto'}: {selectedDebt.phone_number}
                    </p>
                  )}
                  {selectedDebt.address && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {t.address || 'Morada'}: {selectedDebt.address}
                    </p>
                  )}
                  {selectedDebt.original_amount && selectedDebt.original_amount > selectedDebt.amount_mt && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-1">
                      {t.originalAmount || 'Valor Original'}: {formatCurrency(selectedDebt.original_amount)}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* RIGHT COLUMN: Payment Inputs */}
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.1 }}
                className="space-y-5 bg-slate-50/80 dark:bg-zinc-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.amountPaidLabel || 'VALOR PAGO (MT) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      autoFocus
                      value={localAmountPaid}
                      onChange={(e) => setLocalAmountPaid(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-4 pr-11 py-3 text-base text-slate-900 dark:text-zinc-100 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-xs"
                      placeholder={t.enterAmountPlaceholder || "Introduza o valor"}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold text-xs">MT</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.paymentMethodLabel || 'MÉTODO DE PAGAMENTO *'}
                  </label>
                  <select
                    value={localPaymentMethod}
                    onChange={(e) => setLocalPaymentMethod(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-zinc-100 font-bold uppercase tracking-wider outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  >
                    <option value="cash">{t.cashMethod || 'Dinheiro (Cash)'}</option>
                    <option value="mpesa">{t.mpesaMethod || 'M-Pesa'}</option>
                    <option value="emola">{t.emolaMethod || 'eMola'}</option>
                    <option value="mkesh">{t.mkeshMethod || 'mKesh'}</option>
                    <option value="card">{t.cardMethod || 'Cartão / POS'}</option>
                  </select>
                </div>
              </motion.div>

            </motion.div>
          </form>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              {t.cancelBtn || 'Cancelar'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleSubmit()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>{t.confirmPaymentBtn || 'Confirmar Pagamento'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

