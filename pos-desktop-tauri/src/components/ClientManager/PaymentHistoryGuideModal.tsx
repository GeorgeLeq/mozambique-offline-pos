import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  HelpCircle,
  Receipt,
  MessageCircle,
  Wallet,
  History
} from 'lucide-react';
import { useCustomersI18n } from '../../i18n';

interface PaymentHistoryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentHistoryGuideModal: React.FC<PaymentHistoryGuideModalProps> = ({ isOpen, onClose }) => {
  const t = useCustomersI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const hidden = localStorage.getItem('payment_history_guide_hidden') === 'true';
      setDontShowAgain(hidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('payment_history_guide_hidden', 'true');
    } else {
      localStorage.removeItem('payment_history_guide_hidden');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.paymentGuideTitle || 'Guia de Pagamentos & Histórico'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.paymentGuideSubtitle || 'Aprenda a amortizar dívidas, emitir recibos e enviar cobranças via WhatsApp'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
            <AnimatePresence mode="wait">
              {currentPage === 1 && (
                <motion.div
                  key="pay-page-1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <Wallet size={16} />
                    <span>{t.payGuideStep1Title || '1. Liquidações & Amortizações Particiais'}</span>
                  </div>

                  <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed">
                    {t.payGuideStep1Desc || 'Registe pagamentos parciais ou totais. O sistema calcula automaticamente o valor restante e atualiza o estado para "Parcial" ou "Pago".'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Wallet size={14} />
                        <span>{t.payGuideMethodsTitle || 'Métodos de Pagamento'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.payGuideMethodsDesc || 'Escolha entre Dinheiro, M-Pesa, eMola, mKesh ou Cartão POS. Cada parcela fica auditada com operador e hora.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <History size={14} />
                        <span>{t.payGuideAuditTitle || 'Histórico Detalhado'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.payGuideAuditDesc || 'Consulte cada prestação paga anteriormente no modal de histórico de pagamento com linha temporal completa.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 2 && (
                <motion.div
                  key="pay-page-2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <Receipt size={16} />
                    <span>{t.payGuideStep2Title || '2. Recibos Térmicos & Cobrança WhatsApp'}</span>
                  </div>

                  <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed">
                    {t.payGuideStep2Desc || 'Emita comprovativos de pagamento profissionais impressos na impressora térmica de 80mm ou partilhe resumos diretos via WhatsApp.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Receipt size={14} />
                        <span>{t.payGuideThermalTitle || 'Recibo Térmico 80mm'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.payGuideThermalDesc || 'Imprima o recibo físico com lista de artigos, valor pago, saldo restante e linha de assinatura para o cliente.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <MessageCircle size={14} />
                        <span>{t.payGuideWhatsAppTitle || 'Lembrete WhatsApp'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.payGuideWhatsAppDesc || 'Envie a mensagem de cobrança formatada diretamente ao WhatsApp do cliente com dados M-Pesa da loja.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {t.guideDontShowAgain || 'Não mostrar novamente'}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>{t.guidePrev || 'Anterior'}</span>
                </button>
              )}

              {currentPage < 2 ? (
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>{t.guideNext || 'Seguinte'}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Check size={14} />
                  <span>{t.guideUnderstood || 'Entendido'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
