import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { useI18n } from '../../i18n';

interface FiadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (info: { name: string; phone: string; address: string }) => void;
  totalDue: number;
}

export function FiadoModal({ isOpen, onClose, onConfirm, totalDue }: FiadoModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Reset state when opened/closed if needed, or we just trust parent to remount
  
  const handleConfirm = () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    onConfirm({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim()
    });
    // Reset state after confirm
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 "
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2">{t.fiadoModalTitle || 'Crédito a Cliente (Fiado)'}</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
              {t.registerDebtOf || 'Registar dívida de'} <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalDue)} MT</span> {t.forThisTransaction || 'para esta transação.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">{t.customerNameRequired || 'Nome do Cliente *'}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                  placeholder={t.customerNamePlaceholder || "Digite ou selecione um cliente..."}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">{t.customerPhone || 'Telefone do Cliente'}</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                  placeholder="Ex: +258 84 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">{t.customerAddress || 'Endereço (Opcional)'}</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
                  placeholder="Ex: Bairro Central, Rua 2"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {commonT.cancel || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!customerName.trim()}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {t.confirmFiado || 'Confirmar Fiado'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

