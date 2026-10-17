import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: (justification?: string) => Promise<void> | void;
  onClose: () => void;
  showJustification?: boolean;
  justificationPlaceholder?: string;
}

export function DeleteConfirmModal({ 
  title, 
  message, 
  onConfirm, 
  onClose,
  showJustification = true,
  justificationPlaceholder
}: DeleteConfirmModalProps) {
  const t = useI18n();
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justification, setJustification] = useState('');

  const handleClose = () => {
    if (isDeleting) return;
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(justification.trim() || undefined);
      setIsClosing(true);
      setTimeout(onClose, 250);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {!isClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          />

          <div 
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 z-10 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-zinc-50">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{message}</p>
            </div>

            {showJustification && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>{t.justificationReason || 'Justificativa da remoção'}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">{t.optional || 'opcional'}</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder={justificationPlaceholder || t.justificationPlaceholder || "Indique o motivo da eliminação..."}
                  disabled={isDeleting}
                  rows={2}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none transition-all font-sans"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
              >
                {t.cancel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-70 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-rose-500/20 transition-all cursor-pointer border-0 flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? (t.deleting || 'A eliminar...') : (t.delete || 'Eliminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
