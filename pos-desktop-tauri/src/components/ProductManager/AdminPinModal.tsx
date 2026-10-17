import React from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useProductsI18n } from '../../i18n';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinValue: string;
  onKeypadPress: (num: string) => void;
  onKeypadClear: () => void;
  onKeypadBackspace: () => void;
  onVerifyPin: () => void;
}

export function AdminPinModal({
  isOpen,
  onClose,
  pinValue,
  onKeypadPress,
  onKeypadClear,
  onKeypadBackspace,
  onVerifyPin,
}: AdminPinModalProps) {
  const t = useProductsI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800/60 overflow-hidden relative z-10 p-6 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-zinc-50 uppercase tracking-tight">{t.adminAuthTitle}</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
              {t.adminAuthSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Secure PIN Dots Display */}
        <div className="flex justify-center items-center gap-4 py-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const hasVal = i < pinValue.length;
            return (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  hasVal 
                    ? 'bg-red-600 border-red-600 dark:bg-red-500 dark:border-red-500 scale-110 shadow-md shadow-red-500/25' 
                    : 'border-slate-300 dark:border-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {/* Touchscreen Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => onKeypadPress(num)}
              className="h-14 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/40 rounded-2xl text-xl font-black text-slate-800 dark:text-zinc-100 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace */}
          <button
            onClick={onKeypadBackspace}
            className="h-14 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/40 rounded-2xl text-slate-500 dark:text-zinc-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title={t.deleteKey}
          >
            ←
          </button>

          {/* 0 */}
          <button
            onClick={() => onKeypadPress('0')}
            className="h-14 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/40 rounded-2xl text-xl font-black text-slate-800 dark:text-zinc-100 transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            0
          </button>

          {/* Clear */}
          <button
            onClick={onKeypadClear}
            className="h-14 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/40 rounded-2xl text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title={t.clearAll}
          >
            {t.clearAll}
          </button>
        </div>

        {/* Submit Action */}
        <button
          disabled={pinValue.length < 4}
          onClick={onVerifyPin}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-slate-100 disabled:to-slate-150 dark:disabled:from-zinc-900 dark:disabled:to-zinc-900 disabled:text-slate-400 dark:disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-sm"
        >
          <Unlock size={16} />
          {t.confirmAuth}
        </button>
      </motion.div>
    </div>
  );
}
