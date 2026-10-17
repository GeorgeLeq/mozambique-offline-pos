import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import { User } from '../../types';
import { useEmployeesI18n } from '../../i18n';

interface DeleteConfirmModalProps {
  deleteConfirmTarget: User | null;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => void;
}

export function DeleteConfirmModal({ deleteConfirmTarget, onClose, onConfirm }: DeleteConfirmModalProps) {
  const t = useEmployeesI18n();
  const [selectedReason, setSelectedReason] = useState<string>('resignation');
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (deleteConfirmTarget) {
      setSelectedReason('resignation');
      setCustomReason('');
    }
  }, [deleteConfirmTarget]);

  const reasons = [
    { value: 'resignation', label: t.reasonResignation || 'Demissão Voluntária' },
    { value: 'end_of_contract', label: t.reasonEndOfContract || 'Término de Contrato' },
    { value: 'misconduct', label: t.reasonMisconduct || 'Infração / Falha de Conduta' },
    { value: 'duplicate', label: t.reasonDuplicate || 'Registo Duplicado' },
    { value: 'other', label: t.reasonOther || 'Outro Motivo' },
  ];

  const handleConfirm = () => {
    const reasonObj = reasons.find(r => r.value === selectedReason);
    const reasonLabel = reasonObj ? reasonObj.label : selectedReason;
    onConfirm(reasonLabel, customReason.trim() ? customReason.trim() : undefined);
  };

  return (
    <AnimatePresence>
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {t.confirmRevocationTitle || 'Mover para a Lixeira'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  {t.binSubtitle || 'O operador será arquivado na lixeira com possibilidade de restauro.'}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-zinc-950/80 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 mb-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm block">
                  {deleteConfirmTarget.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {deleteConfirmTarget.role === 'Admin' ? (t.adminRole || 'Administrador') : (t.cashierLongRole || 'Operador de Caixa')}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {t.tabBin || 'Lixeira'}
              </span>
            </div>

            {/* Deletion Reason Selector */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  {t.deletionReasonLabel || 'Motivo da Revogação / Saída'}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all cursor-pointer pr-9"
                  >
                    {reasons.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t.customReasonPlaceholder || 'Descreva detalhadamente o motivo (opcional)...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {t.cancel || t.cancelBtn || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 dark:shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                {t.yesRevoke || 'Mover para Lixeira'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
