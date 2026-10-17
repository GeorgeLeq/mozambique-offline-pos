import React, { useState } from 'react';
import { Package, Calculator, Check, ArrowRight, Info, Layers } from 'lucide-react';
import { RESTOCK_PACK_TYPES } from '../../RestockManager/NewOrder/packagingTypes';

export interface VisualStockCalculatorProps {
  productName?: string;
  initialPacks?: number;
  initialUnitsPerPack?: number;
  initialPackType?: 'box' | 'pack' | 'bundle' | 'crate' | 'other';
  unitName?: string;
  sellingPriceMt?: number;
  onApplyTotalUnits: (totalUnits: number, metadata: { packs: number; unitsPerPack: number; packType: string; sellMode: 'units' | 'boxes' }) => void;
  currentStock?: number;
  buttonLabel?: string;
}

export function VisualStockCalculator({
  productName = '',
  initialPacks = 1,
  initialUnitsPerPack = 24,
  initialPackType = 'box',
  unitName = 'unidades',
  sellingPriceMt = 0,
  onApplyTotalUnits,
  buttonLabel = 'Aplicar Unidades ao Stock',
}: VisualStockCalculatorProps) {
  const [packs, setPacks] = useState<string>(String(initialPacks > 0 ? initialPacks : 1));
  const [packType, setPackType] = useState<'box' | 'pack' | 'bundle' | 'crate' | 'other'>(initialPackType);
  const [unitsPerPack, setUnitsPerPack] = useState<string>(String(initialUnitsPerPack > 0 ? initialUnitsPerPack : 24));
  const [sellMode, setSellMode] = useState<'units' | 'boxes'>('units');

  const numPacks = Math.max(0, parseFloat(packs) || 0);
  const numUnitsPerPack = Math.max(0, parseFloat(unitsPerPack) || 0);
  const calculatedTotalUnits = Math.round(numPacks * numUnitsPerPack * 100) / 100;

  const currentPackTypeObj = RESTOCK_PACK_TYPES.find(t => t.id === packType) || RESTOCK_PACK_TYPES[0];
  const packLabel = currentPackTypeObj.label;
  const pluralPackLabel = numPacks === 1 ? packLabel : `${packLabel}s`;

  // Calculated stock based on selected selling mode
  const finalStock = sellMode === 'units' ? calculatedTotalUnits : numPacks;
  const totalGrossValue = finalStock * (sellingPriceMt > 0 ? sellingPriceMt : 0);

  const displayName = productName.trim() || 'Este item';

  const handleApply = () => {
    onApplyTotalUnits(finalStock, {
      packs: numPacks,
      unitsPerPack: numUnitsPerPack,
      packType,
      sellMode,
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-zinc-900/80 dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Title & Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Calculator size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              Calculadora Visual de Entrada de Stock
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Defina a quantidade recebida e como o item será vendido no balcão
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-200 dark:border-indigo-800 shrink-0">
          Cálculo Automático
        </span>
      </div>

      {/* Selling Mode Toggle Switch */}
      <div className="space-y-1.5 bg-slate-50/80 dark:bg-zinc-950/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Modo de Venda no Balcão:
          </label>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {sellMode === 'units' ? 'Venda fracionada/individual' : 'Venda da embalagem inteira'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSellMode('units')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sellMode === 'units'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers size={14} />
            <span>Vender Avulso ({calculatedTotalUnits} un)</span>
          </button>

          <button
            type="button"
            onClick={() => setSellMode('boxes')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sellMode === 'boxes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <Package size={14} />
            <span>Vender em {pluralPackLabel} ({numPacks})</span>
          </button>
        </div>
      </div>

      {/* Step Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Step 1: Number of Boxes */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            1. Quantas embalagens recebeu?
          </label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step="any"
                value={packs}
                onChange={(e) => setPacks(e.target.value)}
                placeholder="Ex: 2"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-sm font-bold shadow-2xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={packType}
              onChange={(e) => setPackType(e.target.value as any)}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-extrabold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {RESTOCK_PACK_TYPES.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Quick pack count pills */}
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Atalhos:</span>
            {[1, 2, 5, 10, 20].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPacks(String(val))}
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                  parseFloat(packs) === val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Units per Box */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            2. Unidades dentro de cada {packLabel}
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="any"
              value={unitsPerPack}
              onChange={(e) => setUnitsPerPack(e.target.value)}
              placeholder="Ex: 24"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-sm font-bold shadow-2xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
              {unitName}/cada
            </span>
          </div>
          {/* Quick unit count presets */}
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Padrão:</span>
            {[6, 12, 20, 24, 48].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setUnitsPerPack(String(val))}
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer ${
                  parseFloat(unitsPerPack) === val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700'
                }`}
              >
                x{val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Visual Multiplication Formula & Clarity Guidance */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Resultado que vai entrar no Stock do Balcão
          </span>
          <span className="text-[10.5px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {sellMode === 'units' ? 'Venda Avulsa (Unidades)' : `Venda em ${pluralPackLabel} Fechadas`}
          </span>
        </div>

        {/* Visual Formula Display */}
        {sellMode === 'units' ? (
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-100 py-1">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
              {numPacks} {pluralPackLabel}
            </span>
            <span className="text-slate-400 font-bold">×</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
              {numUnitsPerPack} {unitName}
            </span>
            <span className="text-slate-400 font-bold">=</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-white font-mono font-black text-base sm:text-lg shadow-sm">
              <ArrowRight size={16} />
              <span>{calculatedTotalUnits} {unitName}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-100 py-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-white font-mono font-black text-base sm:text-lg shadow-sm">
              <Package size={17} />
              <span>{numPacks} {pluralPackLabel} Fechadas</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              (contendo {calculatedTotalUnits} unidades no total)
            </span>
          </div>
        )}

        {/* Explanatory Clarity Note */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400 gap-1.5">
          <div className="flex items-start gap-1.5">
            <Info size={14} className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              {sellMode === 'units' ? (
                <>
                  O produto <strong className="text-slate-900 dark:text-zinc-100">"{displayName}"</strong> será vendido <strong className="text-indigo-600 dark:text-indigo-400">separadamente/avulso</strong> no balcão a <strong className="text-emerald-600 dark:text-emerald-400">{calculatedTotalUnits} {unitName}</strong>.
                </>
              ) : (
                <>
                  O produto <strong className="text-slate-900 dark:text-zinc-100">"{displayName}"</strong> será vendido como <strong className="text-indigo-600 dark:text-indigo-400">{numPacks} {pluralPackLabel} fechadas</strong> no balcão.
                </>
              )}
            </span>
          </div>
          {sellingPriceMt > 0 && finalStock > 0 && (
            <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 shrink-0">
              Valor bruto: {(totalGrossValue).toFixed(2)} MT
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={finalStock <= 0}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Check size={16} />
        <span>
          {buttonLabel} ({sellMode === 'units' ? `${calculatedTotalUnits} ${unitName}` : `${numPacks} ${pluralPackLabel}`})
        </span>
      </button>
    </div>
  );
}
