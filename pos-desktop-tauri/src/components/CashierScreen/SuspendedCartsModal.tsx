import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Play, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { CartItem } from './hooks/useCart';
import { useI18n } from '../../i18n';

export interface SuspendedCart {
  id: string;
  name: string;
  timestamp: number;
  cart: CartItem[];
  total: number;
}

interface SuspendedCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspendedCarts: SuspendedCart[];
  onResume: (cart: SuspendedCart) => void;
  onDelete: (id: string) => void;
}

export function SuspendedCartsModal({ isOpen, onClose, suspendedCarts, onResume, onDelete }: SuspendedCartsModalProps) {
  const { pos: t } = useI18n();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 "
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{t.suspendedCartsTitle || 'Carrinhos Suspensos'}</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{t.suspendedCartsSubtitle || 'Vendas pausadas aguardando recuperação'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {suspendedCarts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-zinc-500 font-medium text-sm">
                  {t.noSuspendedCarts || 'Nenhum carrinho suspenso no momento.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {suspendedCarts.map((c) => (
                    <div key={c.id} className="border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-zinc-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Clock size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-zinc-100">{c.name}</h3>
                            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{new Date(c.timestamp).toLocaleTimeString('pt-MZ')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg text-slate-900 dark:text-zinc-100">{formatCurrency(c.total)} MT</div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{c.cart.length} artigo{c.cart.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end gap-3">
                        <div className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-1 flex-1">
                          {c.cart.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <button
                            onClick={() => onDelete(c.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                            title={t.deleteSuspendedCart || "Eliminar Carrinho Suspenso"}
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => onResume(c)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
                          >
                            <Play size={14} />
                            {t.recoverCart || 'Recuperar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
