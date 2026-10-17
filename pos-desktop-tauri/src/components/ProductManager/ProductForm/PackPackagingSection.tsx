import React, { useMemo } from 'react';
import { Package, Link as LinkIcon, Sparkles, Check, Info, ArrowRightLeft, Calculator, TrendingDown } from 'lucide-react';
import { PACK_TYPE_LABELS } from '../../../lib/utils/productMetric';
import { Product } from '../../../lib/api';

interface PackPackagingSectionProps {
  packType: 'pack' | 'box' | 'bundle' | 'other';
  setPackType: (val: 'pack' | 'box' | 'bundle' | 'other') => void;
  packUnitsCount: string;
  setPackUnitsCount: (val: string) => void;
  parentProductId: string;
  setParentProductId: (val: string) => void;
  parentProductName: string;
  setParentProductName: (val: string) => void;
  availableProducts: Product[];
  priceMt: string;
  setPriceMt?: (val: string) => void;
  costPriceMt: string;
  setCostPriceMt?: (val: string) => void;
  name: string;
  setName: (val: string) => void;
}

const PRESETS = [
  { type: 'pack' as const, count: 6, label: 'Pack x6' },
  { type: 'box' as const, count: 12, label: 'Caixa x12' },
  { type: 'box' as const, count: 24, label: 'Caixa x24' },
  { type: 'bundle' as const, count: 20, label: 'Fardo x20' },
];

/**
 * Utility to replace any existing packaging suffix in the product name
 * E.g., "Cerveja 2M (Pack x6)" -> "Cerveja 2M (Caixa x24)"
 */
function updateNameWithPackagingSuffix(
  currentName: string,
  type: 'pack' | 'box' | 'bundle' | 'other',
  count: number | string
): string {
  const typeLabel = PACK_TYPE_LABELS[type] || 'Pack';
  const suffix = `(${typeLabel} x${count})`;

  if (!currentName || currentName.trim() === '') {
    return suffix;
  }

  // Remove existing packaging tag patterns like (Pack x6), (Caixa x12), (Fardo x20), (Pacote x...), etc.
  const cleaned = currentName.replace(/\s*\((?:Pack|Caixa|Fardo|Pacote|Outro|Bundle|Box)\s*x\s*\d+\)/gi, '').trim();
  return `${cleaned} ${suffix}`;
}

export const PackPackagingSection = React.memo(function PackPackagingSection({
  packType,
  setPackType,
  packUnitsCount,
  setPackUnitsCount,
  parentProductId,
  setParentProductId,
  parentProductName,
  setParentProductName,
  availableProducts,
  priceMt,
  setPriceMt,
  costPriceMt,
  setCostPriceMt,
  name,
  setName,
}: PackPackagingSectionProps) {
  const unitsCountNum = Number(packUnitsCount) > 0 ? Number(packUnitsCount) : 6;
  const priceNum = Number(priceMt) || 0;
  const costNum = Number(costPriceMt) || 0;

  // Individual unit equivalent calculations
  const unitEquivalentPrice = unitsCountNum > 0 && priceNum > 0 ? priceNum / unitsCountNum : null;
  const unitEquivalentCost = unitsCountNum > 0 && costNum > 0 ? costNum / unitsCountNum : null;

  // Mozambique Tax (IVA 16%) calculations
  // In MZ, prices are tax-inclusive: Base = Price / 1.16, Tax = Price - Base
  const totalPackBasePrice = priceNum > 0 ? priceNum / 1.16 : 0;
  const totalPackIvaAmount = priceNum > 0 ? priceNum - totalPackBasePrice : 0;
  const unitBasePrice = unitEquivalentPrice ? unitEquivalentPrice / 1.16 : 0;
  const unitIvaAmount = unitEquivalentPrice ? unitEquivalentPrice - unitBasePrice : 0;

  const candidateProducts = useMemo(() => {
    return availableProducts.filter(p => !p.is_fractional);
  }, [availableProducts]);

  const selectedParentProduct = useMemo(() => {
    return availableProducts.find(p => p.id === parentProductId) || null;
  }, [availableProducts, parentProductId]);

  // Dynamic theoretical standard price (sum of single unit prices)
  const theoreticalStandardPrice = selectedParentProduct && selectedParentProduct.price_mt > 0 
    ? selectedParentProduct.price_mt * unitsCountNum 
    : null;

  const theoreticalCostPrice = selectedParentProduct && selectedParentProduct.cost_price_mt && selectedParentProduct.cost_price_mt > 0
    ? selectedParentProduct.cost_price_mt * unitsCountNum
    : null;

  const volumeDiscountMt = theoreticalStandardPrice !== null && priceNum > 0 && theoreticalStandardPrice > priceNum
    ? theoreticalStandardPrice - priceNum
    : 0;

  const volumeDiscountPct = theoreticalStandardPrice && volumeDiscountMt > 0 
    ? (volumeDiscountMt / theoreticalStandardPrice) * 100 
    : 0;

  const isPriceDifferentFromParent = theoreticalStandardPrice !== null && priceNum > 0 && Math.abs(theoreticalStandardPrice - priceNum) > 0.01;

  const handleApplyPreset = (preset: { type: 'pack' | 'box' | 'bundle' | 'other'; count: number; label: string }) => {
    setPackType(preset.type);
    setPackUnitsCount(preset.count.toString());

    // Update product name seamlessly replacing previous packaging tag
    const newName = updateNameWithPackagingSuffix(name || parentProductName, preset.type, preset.count);
    setName(newName);

    // If parent product exists and has a price, auto-calculate pack price
    if (selectedParentProduct && setPriceMt) {
      const parentPrice = selectedParentProduct.price_mt || 0;
      const parentCost = selectedParentProduct.cost_price_mt || 0;
      if (parentPrice > 0) {
        setPriceMt((parentPrice * preset.count).toFixed(2));
      }
      if (parentCost > 0 && setCostPriceMt) {
        setCostPriceMt((parentCost * preset.count).toFixed(2));
      }
    }
  };

  const handleTypeChange = (newType: 'pack' | 'box' | 'bundle' | 'other') => {
    setPackType(newType);
    if (name) {
      setName(updateNameWithPackagingSuffix(name, newType, packUnitsCount || 6));
    }
  };

  const handleUnitsChange = (newUnits: string) => {
    setPackUnitsCount(newUnits);
    if (name && Number(newUnits) > 0) {
      setName(updateNameWithPackagingSuffix(name, packType, newUnits));
    }
  };

  const handleSelectParentProduct = (productId: string) => {
    setParentProductId(productId);
    const found = availableProducts.find(p => p.id === productId);
    if (found) {
      setParentProductName(found.name);
      // Auto-suggest name with clean packaging suffix
      const updatedName = updateNameWithPackagingSuffix(found.name, packType, packUnitsCount || 6);
      setName(updatedName);

      // Auto-calculate pack price based on parent unit price
      const units = Number(packUnitsCount) || 6;
      if (setPriceMt && found.price_mt > 0) {
        setPriceMt((found.price_mt * units).toFixed(2));
      }
      if (setCostPriceMt && found.cost_price_mt && found.cost_price_mt > 0) {
        setCostPriceMt((found.cost_price_mt * units).toFixed(2));
      }
    } else {
      setParentProductName('');
    }
  };

  const handleSyncPriceFromParent = (discountPercentage: number = 0) => {
    if (!selectedParentProduct) return;
    const units = Number(packUnitsCount) || 6;
    const baseTotal = selectedParentProduct.price_mt * units;
    const finalPrice = discountPercentage > 0 ? baseTotal * (1 - discountPercentage / 100) : baseTotal;

    if (setPriceMt && selectedParentProduct.price_mt > 0) {
      setPriceMt(finalPrice.toFixed(2));
    }
    if (setCostPriceMt && selectedParentProduct.cost_price_mt && selectedParentProduct.cost_price_mt > 0) {
      setCostPriceMt((selectedParentProduct.cost_price_mt * units).toFixed(2));
    }
  };

  return (
    <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-500/20 rounded-2xl space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Package size={15} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              Configuração Pack / Caixa / Fardo
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase">
                Multi-Embalagem
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Venda conjuntos fechados e calcule o valor exato de cada lata/unidade com IVA (16%).
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div>
        <label className="block text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Formatos Mais Populares em Moçambique:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESETS.map((p) => {
            const isSelected = packType === p.type && Number(packUnitsCount) === p.count;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-400'
                }`}
              >
                {isSelected && <Check size={12} />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Type & Units Count Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Tipo de Embalagem <span className="text-rose-500">*</span>
          </label>
          <select
            value={packType}
            onChange={(e) => handleTypeChange(e.target.value as any)}
            className="w-full px-2.5 py-2 bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="pack">Pack (ex: 6 latas / garrafas)</option>
            <option value="box">Caixa (ex: 12 ou 24 unidades)</option>
            <option value="bundle">Fardo (ex: 20 pacotes)</option>
            <option value="other">Outro Pacote Especial</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Unidades no Pacote <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="2"
              step="1"
              value={packUnitsCount}
              onChange={(e) => handleUnitsChange(e.target.value)}
              placeholder="Ex: 6, 12, 24"
              className="w-full px-2.5 py-2 bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400">
              unidades
            </span>
          </div>
        </div>
      </div>

      {/* Linked Parent Product for Stock Deductions */}
      <div className="pt-1.5 border-t border-indigo-100 dark:border-white/5 space-y-1.5">
        <label className="block text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
          <LinkIcon size={11} className="text-indigo-600" />
          Vincular a Produto Unitário Base (Dedução Inteligente):
        </label>

        <select
          value={parentProductId}
          onChange={(e) => handleSelectParentProduct(e.target.value)}
          className="w-full px-2.5 py-2 bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">-- Não vincular (Este Pack terá stock independente no armazém) --</option>
          {candidateProducts.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.name} (Stock: {prod.stock_quantity ?? 0} un | PVP: {prod.price_mt.toFixed(2)} MT)
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Pricing Engine & Dynamic Auto-Calculation */}
      <div className="p-3 bg-white/90 dark:bg-zinc-900/90 border border-indigo-200/90 dark:border-indigo-500/30 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
            <Calculator size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-extrabold">Dinâmica de Preços & Comparativo de Venda:</span>
          </div>

          {selectedParentProduct && (
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              Preço Unitário Base: <strong>{selectedParentProduct.price_mt.toFixed(2)} MT</strong>
            </span>
          )}
        </div>

        {/* 1-Tap Quick Discount & Sync Presets */}
        {selectedParentProduct && (
          <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-zinc-400 font-bold">
              <span>⚡ Aplicação Rápida de Preço:</span>
              <span className="text-[9px] font-normal">Base: {unitsCountNum} latas × {selectedParentProduct.price_mt.toFixed(2)} MT</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => handleSyncPriceFromParent(0)}
                className="px-1.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                title="Preço Cheio Proporcional"
              >
                <span>Cheio</span>
                <span className="text-[9px] font-mono">{(selectedParentProduct.price_mt * unitsCountNum).toFixed(0)} MT</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyncPriceFromParent(5)}
                className="px-1.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                title="Desconto de 5% de volume"
              >
                <span>-5% Desc.</span>
                <span className="text-[9px] font-mono">{(selectedParentProduct.price_mt * unitsCountNum * 0.95).toFixed(0)} MT</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyncPriceFromParent(10)}
                className="px-1.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                title="Desconto de 10% de volume"
              >
                <span>-10% Desc.</span>
                <span className="text-[9px] font-mono">{(selectedParentProduct.price_mt * unitsCountNum * 0.9).toFixed(0)} MT</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyncPriceFromParent(15)}
                className="px-1.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                title="Desconto de 15% de volume"
              >
                <span>-15% Desc.</span>
                <span className="text-[9px] font-mono">{(selectedParentProduct.price_mt * unitsCountNum * 0.85).toFixed(0)} MT</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Card: Preço Pack Completo */}
          <div className="p-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-0.5 font-mono">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              Preço PVP do {PACK_TYPE_LABELS[packType] || 'Pack'}:
            </div>
            <div className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
              {priceNum > 0 ? `${priceNum.toFixed(2)} MT` : '0.00 MT'}
            </div>
            {priceNum > 0 && (
              <div className="text-[9px] text-slate-500 dark:text-zinc-400 pt-0.5 border-t border-slate-200 dark:border-zinc-800">
                IVA (16%): <strong className="text-slate-700 dark:text-zinc-200">{totalPackIvaAmount.toFixed(2)} MT</strong> (Base: {totalPackBasePrice.toFixed(2)} MT)
              </div>
            )}
          </div>

          {/* Card: Equivalente Unitário */}
          <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-800/40 space-y-0.5 font-mono">
            <div className="text-[9px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider font-sans flex items-center justify-between">
              <span>Valor por Lata/Unidade:</span>
              <span className="text-[9px] text-indigo-600 font-extrabold">(÷ {unitsCountNum})</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
              {unitEquivalentPrice !== null ? `${unitEquivalentPrice.toFixed(2)} MT / un` : '0.00 MT / un'}
            </div>
            {unitEquivalentPrice !== null && (
              <div className="text-[9px] text-indigo-900/80 dark:text-indigo-300 pt-0.5 border-t border-indigo-200/80 dark:border-indigo-900/40">
                IVA Unitário (16%): <strong className="text-slate-700 dark:text-zinc-200">{unitIvaAmount.toFixed(2)} MT</strong>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Volume Discount Status or Discrepancy Note */}
        {volumeDiscountMt > 0 ? (
          <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
            <TrendingDown size={13} className="shrink-0 text-emerald-600" />
            <span>
              Desconto de Volume: Poupança de <strong>{volumeDiscountMt.toFixed(2)} MT</strong> ({volumeDiscountPct.toFixed(1)}%) vs {unitsCountNum} avulsas.
            </span>
          </div>
        ) : theoreticalStandardPrice !== null && priceNum > theoreticalStandardPrice ? (
          <div className="flex items-center justify-between gap-1 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 font-bold">
            <div className="flex items-center gap-1">
              <Info size={13} className="shrink-0 text-amber-600" />
              <span>Pack configurado {priceNum.toFixed(2)} MT vs avulsas {theoreticalStandardPrice.toFixed(2)} MT</span>
            </div>
            <button
              type="button"
              onClick={() => handleSyncPriceFromParent(0)}
              className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-[9px] text-amber-900 dark:text-amber-100 font-bold cursor-pointer"
            >
              Sincronizar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
});
