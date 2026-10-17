import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { Wallet, Clock, UserCircle2, ShoppingBag, X, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { useCustomersI18n } from '../../i18n';
import { PaymentHistoryGuideModal } from './PaymentHistoryGuideModal';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtRecord | null;
}

export function PaymentHistoryModal({ isOpen, onClose, debt }: PaymentHistoryModalProps) {
  const t = useCustomersI18n();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const getMethodLabel = (method?: string) => {
    if (!method) return t.cashMethod || 'Dinheiro';
    const m = method.toLowerCase();
    if (m === 'cash' || m === 'dinheiro') return t.cashMethod || 'Dinheiro';
    if (m === 'mpesa' || m === 'm-pesa') return t.mpesaMethod || 'M-Pesa';
    if (m === 'emola' || m === 'e-mola') return t.emolaMethod || 'eMola';
    if (m === 'mkesh' || m === 'm-kesh') return t.mkeshMethod || 'mKesh';
    if (m === 'card' || m === 'pos' || m === 'cartao') return t.cardMethod || 'Cartão / POS';
    return method;
  };

  let itemsFiado: Array<{ quantity?: number; name?: string; description?: string; total?: number; amount?: number }> = [];
  if (debt?.items_json) {
    try {
      const parsed = typeof debt.items_json === 'string' ? JSON.parse(debt.items_json) : debt.items_json;
      if (Array.isArray(parsed)) {
        itemsFiado = parsed;
      }
    } catch(e) {}
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && debt && (
        <div key="payment-history-modal-container" className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
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
            className={`relative ${isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[500px] md:w-[580px] lg:w-[620px]'} bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 text-slate-900 dark:text-white transition-colors`}
          >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-indigo-500/20">
                {t.customerHistoryTitle || 'HISTÓRICO DO CLIENTE'}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {t.accountDetails || 'Detalhes da Conta'}
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
          <div className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-700 dark:text-zinc-300">
            <motion.div 
              layout 
              transition={{ type: 'spring', stiffness: 300, damping: 28 }} 
              className={`grid grid-cols-1 ${isFullScreen ? 'md:grid-cols-2' : ''} gap-6 items-start`}
            >
              
              {/* LEFT COLUMN: Customer Info & Items */}
              <motion.div 
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 }}
                className="space-y-6"
              >
                <div className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 p-5 rounded-2xl flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">{t.client || 'Cliente'}</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{debt.customer_name}</span>
                    {debt.phone_number && (
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono block mt-1">{debt.phone_number}</span>
                    )}
                    {debt.address && (
                      <span className="text-xs text-slate-400 dark:text-zinc-500 block mt-0.5">{debt.address}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">{t.debtBalance || 'Saldo Devedor'}</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(debt.amount_mt)}</span>
                  </div>
                </div>

                {itemsFiado.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                      <ShoppingBag size={14} className="stroke-[2.5]" /> {t.debtItemsTitle || 'Artigos do Fiado'}
                    </h4>
                    <div className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 shadow-xs">
                      {itemsFiado.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700 dark:text-zinc-300 font-medium">{item.quantity || 1}x {item.name || item.description || 'Artigo'}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-200">{formatCurrency(item.total || item.amount || 0)}</span>
                        </div>
                      ))}
                      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center font-black text-slate-900 dark:text-zinc-100 text-sm">
                        <span>{t.totalOriginal || 'Total Original'}</span>
                        <span className="font-mono text-base">{formatCurrency(debt.original_amount || debt.amount_mt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* RIGHT COLUMN: Payment History Timeline */}
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.1 }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                  <Clock size={14} className="stroke-[2.5]" /> {t.paymentHistoryTitle || 'Histórico de Pagamentos'}
                </h4>
                <div className="space-y-3">
                  {debt.payment_history && debt.payment_history.length > 0 ? (
                    debt.payment_history.map((payment) => (
                      <div key={payment.id} className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xs">
                        <div className="flex items-start gap-3.5 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            <Wallet size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 dark:text-zinc-100 text-base font-mono leading-none">
                              {formatCurrency(payment.amount_mt)}
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <span className="text-xs text-slate-600 dark:text-zinc-400 font-bold flex items-center gap-1.5 capitalize">
                                <Wallet size={12} className="text-slate-400 dark:text-zinc-500" /> {getMethodLabel(payment.payment_method)}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-400 dark:text-zinc-600" /> {new Date(payment.created_at).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1.5">
                                <UserCircle2 size={12} className="text-slate-400 dark:text-zinc-600" /> {payment.cashier_name || (t.cashierDefault || 'Caixa')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-700 select-none font-bold">
                          #{payment.id.split('-')[0].toUpperCase()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm bg-slate-50/80 dark:bg-zinc-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                      {t.noPaymentsYet || 'Nenhum pagamento registado ainda.'}
                    </div>
                  )}
                </div>
              </motion.div>

            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {t.closeBtn || 'Fechar'}
            </motion.button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

