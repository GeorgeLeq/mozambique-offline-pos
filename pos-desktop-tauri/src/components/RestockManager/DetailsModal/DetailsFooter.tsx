import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface DetailsFooterProps {
  delivery: any;
  isSaving: boolean;
  handleConfirmReceipt: () => void;
  onClose: () => void;
}

export function DetailsFooter({ delivery, isSaving, handleConfirmReceipt, onClose }: DetailsFooterProps) {
  const t = useI18n();

  return (
    <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
      {delivery && delivery.status !== 'received' ? (
        <button
          type="button"
          onClick={handleConfirmReceipt}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>{isSaving ? (t.saving || 'A guardar...') : (t.confirmReceiptBtn || 'Confirmar Receção & Desbloquear Venda')}</span>
        </button>
      ) : (
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={16} />
          <span>{t.fullReceiptSuccess || 'Receção Concluída e Produtos Desbloqueados'}</span>
        </div>
      )}
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
      >
        {t.cancel || 'Fechar'}
      </button>
    </div>
  );
}
