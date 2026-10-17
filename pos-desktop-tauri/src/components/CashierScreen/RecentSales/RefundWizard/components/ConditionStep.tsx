import React from 'react';
import { Archive, Trash2 } from 'lucide-react';

interface ConditionStepProps {
  authorizedManager: any;
  refundItem: any;
  setItemCondition: (condition: 'shelf' | 'damaged') => void;
  setWizardStep: (step: 'pin' | 'condition' | 'reversal') => void;
}

export const ConditionStep: React.FC<ConditionStepProps> = ({
  authorizedManager,
  refundItem,
  setItemCondition,
  setWizardStep,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1 text-center">
        <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg font-mono">
          🔓 Autorizado por: {authorizedManager?.name}
        </span>
        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 pt-3">
          Estado do Artigo?
        </h4>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          O que acontecerá fisicamente com o produto retornado?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 pt-2">
        <button
          onClick={() => {
            setItemCondition('shelf');
            setWizardStep('reversal');
          }}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-850 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-emerald-50/10 dark:hover:bg-emerald-500/5 text-left transition-all group cursor-pointer"
          id="condition-btn-shelf"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100/30 dark:border-emerald-900/20 shrink-0 group-hover:scale-105 transition-transform">
            <Archive size={22} />
          </div>
          <div className="flex-1">
            <span className="block text-sm font-black text-slate-800 dark:text-zinc-200">
              🔄 Voltar ao Stock
            </span>
            <span className="block text-[11px] text-slate-400 dark:text-zinc-505 font-semibold mt-0.5 leading-normal">
              O artigo está em perfeitas condições. Será recolocado na prateleira (+{refundItem?.quantity} stock).
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            setItemCondition('damaged');
            setWizardStep('reversal');
          }}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-850 hover:border-rose-500 dark:hover:border-rose-500 bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-rose-50/10 dark:hover:bg-rose-500/5 text-left transition-all group cursor-pointer"
          id="condition-btn-damaged"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100/30 dark:border-rose-900/20 shrink-0 group-hover:scale-105 transition-transform">
            <Trash2 size={22} />
          </div>
          <div className="flex-1">
            <span className="block text-sm font-black text-slate-800 dark:text-zinc-200">
              🗑️ Quebra / Danificado
            </span>
            <span className="block text-[11px] text-slate-400 dark:text-zinc-505 font-semibold mt-0.5 leading-normal">
              O artigo está estragado. Será registado como quebra e descartado (não altera quantidade de stock).
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
