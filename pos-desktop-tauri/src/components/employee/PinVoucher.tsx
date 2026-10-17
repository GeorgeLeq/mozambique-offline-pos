import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Printer, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmployeesI18n } from '../../i18n';

interface PinVoucherProps {
  generatedPin: string | null;
}

export function PinVoucher({ generatedPin }: PinVoucherProps) {
  const [copied, setCopied] = useState(false);
  const t = useEmployeesI18n();

  if (!generatedPin) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPin);
    setCopied(true);
    toast.success(t.pinCopiedToast || 'PIN copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, height: 0 }}
      animate={{ opacity: 1, scale: 1, height: 'auto' }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      className="relative overflow-hidden"
    >
      <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-lg relative text-center">
        {/* Tear details */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-slate-50 dark:bg-zinc-950 rounded-r-full border-r-2 border-dashed border-slate-200 dark:border-zinc-800"></div>
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-slate-50 dark:bg-zinc-950 rounded-l-full border-l-2 border-dashed border-slate-200 dark:border-zinc-800"></div>
        
        <div className="flex justify-center mb-2 text-slate-400 dark:text-zinc-600">
          <Printer size={32} />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          {t.accessVoucherTitle || 'VOUCHER DE ACESSO'}
        </h4>
        <div className="h-px bg-slate-100 dark:bg-zinc-800 my-3"></div>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          {t.newPinGenerated || 'Novo PIN gerado:'}
        </p>
        <div className="my-4 relative group">
          <p className="text-4xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest bg-indigo-50/50 dark:bg-indigo-500/5 py-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10 shadow-inner select-text">
            {generatedPin}
          </p>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all border border-slate-100 dark:border-white/5 cursor-pointer"
            title={t.copyPinBtn || 'Copiar PIN'}
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500" />}
          </button>
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold leading-relaxed px-2">
          {t.voucherInstructions || 'Anote ou partilhe este código PIN de 4 dígitos com o operador para que este possa fazer login no terminal. Ele pode ser alterado a qualquer momento.'}
        </p>
      </div>
    </motion.div>
  );
}
