import React from 'react';
import { Trash2 } from 'lucide-react';
import { PruneOptionType } from '../types';

interface RecentSalesPruneSectionProps {
  pruneOption: PruneOptionType;
  setPruneOption: (value: PruneOptionType) => void;
  onPrune: () => void;
}

export function RecentSalesPruneSection({
  pruneOption,
  setPruneOption,
  onPrune,
}: RecentSalesPruneSectionProps) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-0.5 rounded-xl">
      <select
        value={pruneOption}
        onChange={(e) => setPruneOption(e.target.value as PruneOptionType)}
        className="px-2 py-1 bg-transparent text-slate-600 dark:text-zinc-400 focus:text-slate-900 dark:focus:text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
        id="prune-option-select"
        title="Opção de Preservação de Histórico"
      >
        <option value="24h" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Manter 24h</option>
        <option value="3d" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Manter 3 dias</option>
        <option value="7d" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Manter 7 dias</option>
        <option value="all" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Limpar Tudo</option>
      </select>
      
      <button
        onClick={onPrune}
        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        id="prune-action-btn"
        title="Executar limpeza de histórico local"
      >
        <Trash2 size={12} />
        Limpar
      </button>
    </div>
  );
}
