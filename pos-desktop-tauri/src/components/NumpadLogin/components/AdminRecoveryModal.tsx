import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, RefreshCw, X } from 'lucide-react';

interface AdminRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopCode: string;
  onShopCodeChange: (val: string) => void;
  isRecovering: boolean;
  onRecover: () => void;
}

export function AdminRecoveryModal({
  isOpen,
  onClose,
  shopCode,
  onShopCodeChange,
  isRecovering,
  onRecover
}: AdminRecoveryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-2xl space-y-4 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                <Key size={20} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">Recuperar PIN de Admin</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium leading-relaxed">
                Para sincronizar o PIN local do Administrador com o PIN Master cadastrado na nuvem, introduza o seu Código da Loja.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">
                  Código da Loja
                </label>
                <input
                  type="text"
                  value={shopCode}
                  onChange={(e) => onShopCodeChange(e.target.value)}
                  placeholder="Ex: SHOP-XPT123"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold uppercase"
                />
              </div>

              <button
                onClick={onRecover}
                disabled={isRecovering}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98] text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Recuperando...
                  </>
                ) : (
                  'Sincronizar PIN da Nuvem'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
