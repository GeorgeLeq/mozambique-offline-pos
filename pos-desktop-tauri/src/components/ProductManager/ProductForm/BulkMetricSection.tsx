import React from 'react';
import { Scale, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { METRIC_OPTIONS } from '../../../lib/utils/productMetric';

interface BulkMetricSectionProps {
  isFractional: boolean;
  setIsFractional: (val: boolean) => void;
  unitMetric: string;
  setUnitMetric: (val: string) => void;
  packageTotalQty: string;
  setPackageTotalQty: (val: string) => void;
  packageCostPrice: string;
  setPackageCostPrice: (val: string) => void;
  packagePrice: string;
  setPackagePrice: (val: string) => void;
  handleAutoCalculateUnitPrices: () => void;
}

export const BulkMetricSection = React.memo(function BulkMetricSection({
  isFractional,
  setIsFractional,
  unitMetric,
  setUnitMetric,
  packageTotalQty,
  setPackageTotalQty,
  packageCostPrice,
  setPackageCostPrice,
  packagePrice,
  setPackagePrice,
  handleAutoCalculateUnitPrices
}: BulkMetricSectionProps) {
  return (
    <div className="border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 bg-amber-50/40 dark:bg-amber-500/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Venda a Granel / Medida Fracionada
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="isFractionalCheck"
            checked={isFractional}
            onChange={(e) => setIsFractional(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {isFractional && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 pt-2 border-t border-amber-200/60 dark:border-amber-500/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Unidade de Medida
              </label>
              <select
                value={unitMetric}
                onChange={(e) => setUnitMetric(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Tamanho Total do Saco / Pacote ({unitMetric})
              </label>
              <input
                type="number"
                step="any"
                value={packageTotalQty}
                onChange={(e) => setPackageTotalQty(e.target.value)}
                placeholder="Ex: 25"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Custo Total do Pacote (MT)
              </label>
              <input
                type="number"
                step="0.01"
                value={packageCostPrice}
                onChange={(e) => setPackageCostPrice(e.target.value)}
                placeholder="Ex: 2500"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Preço Venda Total do Pacote (MT)
              </label>
              <input
                type="number"
                step="0.01"
                value={packagePrice}
                onChange={(e) => setPackagePrice(e.target.value)}
                placeholder="Ex: 3000"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
              {packageTotalQty && packagePrice ? (
                <span>
                  Saco de <strong>{packageTotalQty}{unitMetric}</strong> a <strong>{packagePrice} MT</strong> ➔ Estimativa: <strong>{(Number(packagePrice) / Number(packageTotalQty)).toFixed(2)} MT/{unitMetric}</strong>
                </span>
              ) : (
                <span>Introduza o total do pacote para calcular preços unitários.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAutoCalculateUnitPrices}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Zap size={14} /> ⚡ Auto-calcular Preços por Unidade (1{unitMetric})
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
});
