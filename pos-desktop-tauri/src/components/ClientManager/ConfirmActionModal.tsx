import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { DebtRecord } from './types';
import { formatCurrency } from '../../lib/utils';
import { useCustomersI18n } from '../../i18n';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  debt: DebtRecord | null;
  actionType: 'delete' | 'restore' | 'hard_delete' | null;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  debt,
  actionType,
}: ConfirmActionModalProps) {
  const t = useCustomersI18n();

  const formattedItems = React.useMemo(() => {
    if (!debt?.items_json) return null;
    try {
      const parsed = typeof debt.items_json === 'string' ? JSON.parse(debt.items_json) : debt.items_json;
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => `${item.quantity || item.qty || 1}x ${item.name || item.description || item.title || (t.itemsCountUnit || 'Artigo')}`).join(', ');
      }
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.name || parsed.description) {
          return `${parsed.quantity || 1}x ${parsed.name || parsed.description}`;
        }
        return JSON.stringify(parsed);
      }
      return String(parsed);
    } catch {
      return String(debt.items_json);
    }
  }, [debt, t]);

  if (!isOpen || !debt || !actionType) return null;

  const getConfig = () => {
    switch (actionType) {
      case 'delete':
        return {
          title: t.cancelDebtTitle || 'Cancelar Dívida',
          icon: <Trash2 className="text-amber-500 dark:text-amber-400" size={24} />,
          iconBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
          warning: t.cancelDebtWarning || 'Esta ação moverá esta dívida para a aba de Cancelados e registará a anulação permanentemente na auditoria do sistema.',
          confirmText: t.confirmCancelDebt || 'Sim, Cancelar',
          confirmBtnClass: 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500/50',
        };
      case 'restore':
        return {
          title: t.restoreDebtTitle || 'Restaurar Dívida',
          icon: <RotateCcw className="text-emerald-500 dark:text-emerald-400" size={24} />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
          warning: t.restoreDebtWarning || 'Esta ação irá restaurar esta dívida de volta ao estado ativo do cliente, permitindo liquidações ou pagamentos parciais.',
          confirmText: t.confirmRestoreDebt || 'Sim, Restaurar',
          confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500/50',
        };
      case 'hard_delete':
        return {
          title: t.hardDeleteTitle || 'Eliminar Permanentemente',
          icon: <AlertTriangle className="text-rose-500 dark:text-rose-400" size={24} />,
          iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
          warning: t.hardDeleteWarning || 'AVISO DE EXCLUSÃO PERMANENTE: Esta ação é irreversível e apagará permanentemente esta dívida do banco de dados local e da nuvem. O registo de auditoria histórico não será apagado.',
          confirmText: t.confirmHardDelete || 'Sim, Apagar Permanentemente',
          confirmBtnClass: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/50',
        };
      default:
        return {
          title: t.confirmActionTitle || 'Confirmar Ação',
          icon: <AlertTriangle className="text-slate-400 dark:text-zinc-400" size={24} />,
          iconBg: 'bg-slate-100 dark:bg-zinc-500/10 border-slate-200 dark:border-zinc-500/20',
          warning: t.confirmActionWarning || 'Tem certeza que deseja continuar?',
          confirmText: t.confirm || 'Confirmar',
          confirmBtnClass: 'bg-slate-600 hover:bg-slate-500 text-white',
        };
    }
  };

  const config = getConfig();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col transition-colors"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${config.iconBg} flex items-center justify-center`}>
                {config.icon}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {config.title}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mt-0.5">
                  Ref: #{debt.id.substring(0, 8)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-4">
            {/* Debt Preview Box */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-850 rounded-2xl p-4 flex flex-col gap-2 font-sans shadow-xs">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-zinc-400">
                <span>{t.client || 'Cliente'}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{debt.customer_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-zinc-400">
                <span>{t.registeredAmount || 'Valor Registado'}:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm font-mono">
                  {formatCurrency(debt.amount_mt)} MT
                </span>
              </div>
              {formattedItems && (
                <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 border-t border-slate-200/60 dark:border-zinc-850 pt-2">
                  <span className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">{t.articlesLabel || 'Artigos:'}</span>
                  <p className="line-clamp-3 font-medium text-slate-800 dark:text-zinc-200">
                    {formattedItems}
                  </p>
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/10 rounded-2xl p-3.5 flex gap-3">
              <AlertTriangle className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                {config.warning}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-900 rounded-xl transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
            >
              {t.cancelBtn || 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 cursor-pointer ${config.confirmBtnClass}`}
            >
              {config.confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

