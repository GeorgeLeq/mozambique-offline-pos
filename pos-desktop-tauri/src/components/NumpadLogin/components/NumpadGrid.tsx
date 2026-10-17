import React from 'react';
import { Delete } from 'lucide-react';

interface NumpadGridProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

export function NumpadGrid({ onNumberClick, onClear, onDelete }: NumpadGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-[280px]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num.toString())}
          className="aspect-square rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-slate-100/80 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-200 dark:hover:border-white/10 hover:-translate-y-1 text-slate-800 dark:text-zinc-100 text-3xl font-medium flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/10 active:shadow-inner relative overflow-hidden group cursor-pointer"
        >
          <span className="relative z-10">{num}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
      <button
        onClick={onClear}
        className="aspect-square rounded-[2rem] bg-transparent hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 text-lg font-medium flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer"
      >
        Limpar
      </button>
      <button
        onClick={() => onNumberClick('0')}
        className="aspect-square rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-slate-100/80 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-200 dark:hover:border-white/10 hover:-translate-y-1 text-slate-800 dark:text-zinc-100 text-3xl font-medium flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/10 active:shadow-inner relative overflow-hidden group cursor-pointer"
      >
        <span className="relative z-10">0</span>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        onClick={onDelete}
        className="aspect-square rounded-[2rem] bg-transparent hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <Delete size={28} strokeWidth={1.5} />
      </button>
    </div>
  );
}
