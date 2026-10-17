import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface NumpadDisplayProps {
  pin: string;
  error: boolean;
}

export function NumpadDisplay({ pin, error }: NumpadDisplayProps) {
  return (
    <>
      <div className="w-20 h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-slate-100/50 dark:border-white/5 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl dark:shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 relative">
        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-[2rem] blur-xl" />
        <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400 relative z-10" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-800 dark:text-zinc-100">Registo de Acesso</h1>
      <p className="text-slate-500 dark:text-zinc-400 mb-10 font-medium">Insira o seu PIN de 6 dígitos</p>

      <div className="flex justify-center gap-4 mb-12">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${
              pin.length > i 
                ? 'bg-indigo-600 dark:bg-indigo-500 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.4)] dark:shadow-[0_0_15px_rgba(99,102,241,0.6)]' 
                : error 
                  ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] dark:shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                  : 'bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-white/5'
            } ${error ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          />
        ))}
      </div>
    </>
  );
}
