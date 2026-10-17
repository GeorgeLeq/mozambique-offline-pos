import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldAlert, Wifi, CreditCard, Keyboard } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useI18n } from '../../i18n';

interface MobileMoneyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDue: number;
  provider: 'm-pesa' | 'e-mola';
  onConfirm: (transactionId: string) => void;
}

export default function MobileMoneyConfirmModal({
  isOpen,
  onClose,
  totalDue,
  provider,
  onConfirm,
}: MobileMoneyConfirmModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const [transactionId, setTransactionId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Clear input when opened
  useEffect(() => {
    if (isOpen) {
      setTransactionId('');
      setIsVerifying(false);
    }
  }, [isOpen]);

  // Support hotkeys inside the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && transactionId.trim() && !isVerifying) {
        e.preventDefault();
        handleLocalConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, transactionId, isVerifying]);

  if (!isOpen) return null;

  const handleLocalConfirm = () => {
    setIsVerifying(true);
    // Simulate a brief, ultra-premium 500ms network verification indicator
    setTimeout(() => {
      onConfirm(transactionId.trim());
      setIsVerifying(false);
    }, 500);
  };

  const isMpesa = provider === 'm-pesa';
  const providerColor = isMpesa ? 'from-rose-500 to-red-600' : 'from-amber-500 to-orange-600';
  const providerBgLight = isMpesa ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-amber-50 dark:bg-amber-950/20';
  const providerBorder = isMpesa ? 'border-rose-100 dark:border-rose-900/30' : 'border-amber-100 dark:border-amber-900/30';
  const providerText = isMpesa ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 "
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl dark:shadow-black/75 max-w-md w-full overflow-hidden relative z-10"
        >
          {/* Top Decorative Provider Bar */}
          <div className={`h-2.5 bg-gradient-to-r ${providerColor}`} />

          {/* Header */}
          <div className="p-6 pb-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${providerBgLight} border ${providerBorder} ${providerText}`}>
                <CreditCard size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                  {t.confirmMobileMoney || 'Confirmar'} {isMpesa ? 'M-Pesa' : 'e-Mola'}
                </h3>
                <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold tracking-wide uppercase mt-0.5">
                  {t.integratedMobilePayment || 'Pagamento Móvel Integrado'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Amount Banner */}
            <div className={`p-5 rounded-2xl ${providerBgLight} border ${providerBorder} text-center`}>
              <span className="text-slate-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider block">
                {t.totalAmountToReceive || 'Valor Total a Receber'}
              </span>
              <span className={`text-3xl font-black ${providerText} font-mono mt-1 block`}>
                {formatCurrency(totalDue)} MT
              </span>
            </div>

            {/* Instruction Checklist */}
            <div className="bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wifi size={14} className="text-indigo-500 animate-pulse" />
                {t.operatorSecurityInstructions || 'Instruções de Segurança do Operador'}
              </div>
              
              <ul className="space-y-2 text-sm text-slate-600 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <span>{t.requestClientSendStoreNumber || 'Solicite ao cliente que faça o envio para o número da loja.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <span>
                    {t.waitConfirmationSms || 'Aguarde o SMS de confirmação de depósito no telemóvel da loja.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert size={16} className={`${providerText} shrink-0 mt-0.5`} />
                  <span>
                    {t.neverCompleteWithoutSms || 'NUNCA conclua a venda sem verificar o SMS recebido ou o saldo.'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                <span>{t.referenceCodeTransactionId || 'Código de Referência (ID de Transação)'}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-normal normal-case">{t.optional || 'Opcional'}</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="Ex: PP260710.1234.F5678"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-zinc-700 text-slate-800 dark:text-zinc-100 placeholder-slate-400 font-mono tracking-wider shadow-inner"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/80 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-xl font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors text-sm"
            >
              {commonT.cancel || 'Cancelar'}
            </button>
            <button
              onClick={handleLocalConfirm}
              disabled={isVerifying}
              className={`flex-1 px-4 py-3 bg-gradient-to-r ${providerColor} hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 text-sm`}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t.verifying || 'Verificando...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{t.confirmReceipt || 'Confirmar Recebimento'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
