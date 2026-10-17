import React from 'react';
import { Percent } from 'lucide-react';

interface PromoSectionProps {
  promoActive: boolean;
  setPromoActive: (val: boolean) => void;
  promoPriceMt: string;
  setPromoPriceMt: (val: string) => void;
}

export const PromoSection = React.memo(function PromoSection({
  promoActive,
  setPromoActive,
  promoPriceMt,
  setPromoPriceMt
}: PromoSectionProps) {
  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-950/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent size={15} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Promoção / Desconto
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={promoActive}
            onChange={(e) => setPromoActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {promoActive && (
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Preço Promocional (MT)
          </label>
          <input
            type="number"
            step="0.01"
            value={promoPriceMt}
            onChange={(e) => setPromoPriceMt(e.target.value)}
            placeholder="Ex: 85.00"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 font-mono text-xs outline-none"
          />
        </div>
      )}
    </div>
  );
});
