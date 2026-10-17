import React from 'react';
import { motion } from 'motion/react';
import { Delete } from 'lucide-react';
import { ThemeToggle } from '../../ThemeToggle';
import { AmbientBackground } from '../../AmbientBackground';
import { PendingCashUser } from '../types';

interface CashShiftModalProps {
  pendingUser: PendingCashUser;
  cashInputValue: string;
  onCashInputChange: (val: string) => void;
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CashShiftModal({
  pendingUser,
  cashInputValue,
  onCashInputChange,
  onNumberClick,
  onClear,
  onDelete,
  onConfirm,
  onCancel
}: CashShiftModalProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans select-none transition-colors duration-500 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <AmbientBackground />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col items-center relative z-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl p-10 sm:p-12 rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10"
      >
        <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="w-20 h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-slate-100/50 dark:border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl dark:shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 relative">
          <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-[2rem] blur-xl" />
          <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 relative z-10">MT</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-1 tracking-tight text-slate-800 dark:text-zinc-100 text-center">Fundo de Caixa Inicial</h1>
        <p className="text-slate-500 dark:text-zinc-400 mb-6 font-medium text-center text-xs leading-relaxed px-2">
          Olá <span className="font-bold text-indigo-600 dark:text-indigo-400">{pendingUser.name}</span>, insira o valor real em dinheiro que está no seu gavetão para abrir o turno.
        </p>

        <div className="w-full mb-6">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 dark:text-zinc-500 text-lg">MT</span>
            <input
              type="number"
              step="any"
              value={cashInputValue}
              onChange={(e) => onCashInputChange(e.target.value)}
              className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-mono font-black text-2xl text-slate-800 dark:text-zinc-100 text-center shadow-inner"
              placeholder="0"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => onNumberClick(num.toString())}
              className="aspect-square rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-200 text-slate-800 dark:text-zinc-100 text-xl font-bold flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClear}
            className="aspect-square rounded-2xl bg-transparent hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 text-xs font-black flex items-center justify-center transition-all cursor-pointer"
          >
            LIMPAR
          </button>
          <button
            onClick={() => onNumberClick('0')}
            className="aspect-square rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-200 text-slate-800 dark:text-zinc-100 text-xl font-bold flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            onClick={onDelete}
            className="aspect-square rounded-2xl bg-transparent hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <Delete size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onConfirm}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 dark:shadow-indigo-500/10 active:scale-98 text-xs tracking-wider uppercase cursor-pointer"
          >
            Confirmar e Iniciar Turno
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold py-3.5 rounded-2xl transition-all active:scale-98 text-xs tracking-wider uppercase cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
