import React, { useState } from 'react';
import { METRIC_SHORT_LABELS, PACK_TYPE_LABELS } from '../../../lib/utils/productMetric';
import { Info, Sparkles, TrendingUp, Calculator, AlertTriangle, Layers, Check } from 'lucide-react';
import { VisualStockCalculator } from './VisualStockCalculator';
import { ExpectedDeliveryProductInfo } from '../utils/deliveryInfo';

interface PricingStockSectionProps {
  priceMt: string;
  setPriceMt: (val: string) => void;
  costPriceMt: string;
  setCostPriceMt: (val: string) => void;
  stockQuantity: string;
  setStockQuantity: (val: string) => void;
  minStockAlert: string;
  setMinStockAlert: (val: string) => void;
  isFractional: boolean;
  unitMetric: string;
  packageTotalQty: string;
  productFormType?: 'unit' | 'pack' | 'bulk';
  packUnitsCount?: string;
  packType?: 'pack' | 'box' | 'bundle' | 'other';
  parentProductId?: string;
  parentProductName?: string;
  expectedDeliveryInfo?: ExpectedDeliveryProductInfo | null;
  hideCostPrice?: boolean;
  productName?: string;
}

export const PricingStockSection = React.memo(function PricingStockSection({
  priceMt,
  setPriceMt,
  costPriceMt,
  setCostPriceMt,
  stockQuantity,
  setStockQuantity,
  minStockAlert,
  setMinStockAlert,
  isFractional,
  unitMetric,
  packageTotalQty,
  productFormType = 'unit',
  packUnitsCount = '6',
  packType = 'pack',
  parentProductId = '',
  parentProductName = '',
  expectedDeliveryInfo = null,
  hideCostPrice = false,
  productName = '',
}: PricingStockSectionProps) {
  const shortMetric = METRIC_SHORT_LABELS[unitMetric] || unitMetric;
  const isPack = productFormType === 'pack';
  const packLabel = PACK_TYPE_LABELS[packType] || 'Pack';
  const unitsCountNum = Number(packUnitsCount) > 0 ? Number(packUnitsCount) : 6;

  // Decide initial mode: if product came from expected delivery with packaging or is pack, offer calculator
  const hasExpectedDeliveryPackaging = Boolean(
    expectedDeliveryInfo?.packaging?.unitsPerPack || 
    expectedDeliveryInfo?.packaging?.totalPacks ||
    (expectedDeliveryInfo && expectedDeliveryInfo.expectedQuantity > 0)
  );

  const [stockInputMode, setStockInputMode] = useState<'direct' | 'calculator'>(
    hasExpectedDeliveryPackaging ? 'calculator' : 'direct'
  );

  const priceNum = Number(priceMt) || 0;
  const costNum = Number(costPriceMt) || 0;
  const stockNum = Number(stockQuantity) || 0;

  // Profit margin calculation
  const profitMt = priceNum - costNum;
  const marginPct = priceNum > 0 ? (profitMt / priceNum) * 100 : 0;

  // Mozambique Tax (IVA 16%) breakdown
  const basePrice = priceNum > 0 ? priceNum / 1.16 : 0;
  const ivaAmount = priceNum > 0 ? priceNum - basePrice : 0;

  // Unit equivalents if pack
  const unitPrice = isPack && unitsCountNum > 0 && priceNum > 0 ? priceNum / unitsCountNum : null;
  const unitCost = isPack && unitsCountNum > 0 && costNum > 0 ? costNum / unitsCountNum : null;

  // Potential box vs unit confusion detector
  const potentialConfusionRatio = expectedDeliveryInfo?.packaging?.unitsPerPack || (isPack ? unitsCountNum : 0);
  const isSuspiciousSmallStock = stockNum > 0 && stockNum <= 5 && potentialConfusionRatio >= 6;
  const suggestedMultipliedStock = stockNum * potentialConfusionRatio;

  return (
    <div className="space-y-4">
      {/* Pricing Fields */}
      <div className={hideCostPrice ? 'grid grid-cols-1' : 'grid-cols-2 gap-3'}>
        <div>
          <label className="block text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
            {isPack 
              ? `Preço Venda do ${packLabel} (PVP) (MT)`
              : isFractional 
              ? `Preço Venda por 1${shortMetric} (MT)` 
              : 'Preço Venda ao Balcão (PVP) (MT)'} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={priceMt}
              onChange={(e) => setPriceMt(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs font-bold shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 font-mono">
              MT
            </span>
          </div>
          {hideCostPrice && (
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
              Defina o preço de venda para o balcão. O preço de custo é confidencial e gerido pela Administração.
            </p>
          )}
        </div>

        {!hideCostPrice && (
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              {isPack 
                ? `Preço Custo do ${packLabel} (MT)`
                : isFractional 
                ? `Preço Custo por 1${shortMetric} (MT)` 
                : 'Preço Custo (MT)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={costPriceMt}
                onChange={(e) => setCostPriceMt(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs font-bold shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 font-mono">
                MT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tax & Margin Financial Summary Badge */}
      {priceNum > 0 && !hideCostPrice && (
        <div className="p-2.5 bg-slate-100/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-zinc-300">
            <span className="flex items-center gap-1">
              <TrendingUp size={13} className="text-emerald-500" />
              Margem Bruta: <span className="text-emerald-600 dark:text-emerald-400">{marginPct.toFixed(1)}%</span>
              {profitMt > 0 && <span className="text-slate-400 font-normal">({profitMt.toFixed(2)} MT lucro)</span>}
            </span>
            <span className="text-slate-500 dark:text-zinc-400 font-mono text-[10px]">
              IVA 16%: <strong className="text-indigo-600 dark:text-indigo-400">{ivaAmount.toFixed(2)} MT</strong> (Base: {basePrice.toFixed(2)} MT)
            </span>
          </div>

          {/* Unit price indicator for packs */}
          {isPack && unitPrice !== null && (
            <div className="pt-1 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-indigo-900 dark:text-indigo-200 text-[10px]">
              <span>💡 Preço individual por lata/unidade: <strong>{unitPrice.toFixed(2)} MT</strong></span>
              {unitCost !== null && <span>Custo unitário: <strong>{unitCost.toFixed(2)} MT</strong></span>}
            </div>
          )}
        </div>
      )}

      {priceNum > 0 && hideCostPrice && (
        <div className="p-2.5 bg-slate-100/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
          <span>Preço Balcão (PVP): <strong className="text-emerald-600 dark:text-emerald-400">{priceNum.toFixed(2)} MT</strong></span>
          <span className="text-slate-500 dark:text-zinc-400 font-mono text-[10px]">
            IVA 16%: <strong className="text-indigo-600 dark:text-indigo-400">{ivaAmount.toFixed(2)} MT</strong> (Base: {basePrice.toFixed(2)} MT)
          </span>
        </div>
      )}

      {/* Stock Input Navigation Tabs */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>Registo de Stock para Balcão</span>
          </label>
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setStockInputMode('direct')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                stockInputMode === 'direct'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Unidades Avulsas
            </button>
            <button
              type="button"
              onClick={() => setStockInputMode('calculator')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                stockInputMode === 'calculator'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Calculator size={11} />
              <span>Calculadora de Caixas</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Direct Unit / Metric Stock Entry */}
        {stockInputMode === 'direct' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                    {isPack
                      ? `Stock Total em Balcão (un)`
                      : isFractional 
                      ? `Stock Inicial (${shortMetric})` 
                      : 'Stock Inicial (un)'}
                  </label>
                  {isFractional && packageTotalQty && Number(packageTotalQty) > 0 && (
                    <button
                      type="button"
                      onClick={() => setStockQuantity(packageTotalQty)}
                      className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      ⚡ Usar {packageTotalQty}{shortMetric}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder={isFractional ? `Ex: 25 (${shortMetric})` : 'Ex: 48'}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs font-bold shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {isFractional ? `Alerta Mín. (${shortMetric})` : 'Alerta Stock Mín.'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono text-xs font-bold shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Smart Confusion Guard Banner */}
            {isSuspiciousSmallStock && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-extrabold">Atenção ao registo de caixas:</span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Digitou apenas <strong>{stockNum} unidades</strong>. Se recebeu <strong>{stockNum} caixas de {potentialConfusionRatio} un</strong>, o stock correto de venda é <strong>{suggestedMultipliedStock} unidades</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStockQuantity(String(suggestedMultipliedStock))}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  Corrigir para {suggestedMultipliedStock} un
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Visual Multiplication Calculator */
          <div className="space-y-3">
            <VisualStockCalculator
              productName={productName}
              initialPacks={expectedDeliveryInfo?.packaging?.totalPacks || 2}
              initialUnitsPerPack={expectedDeliveryInfo?.packaging?.unitsPerPack || (isPack ? unitsCountNum : 24)}
              initialPackType={(expectedDeliveryInfo?.packaging?.packType as any) || (isPack ? (packType as any) : 'box')}
              unitName={isFractional ? shortMetric : 'unidades'}
              sellingPriceMt={priceNum}
              onApplyTotalUnits={(totalUnits) => {
                setStockQuantity(String(totalUnits));
                setStockInputMode('direct');
              }}
              currentStock={stockNum}
              buttonLabel="Aplicar Quantidade Calculada ao Stock"
            />
          </div>
        )}
      </div>

      {/* Dynamic Stock Helper Explanation (Item 3) */}
      {isPack && (
        <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/30 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-300">
          {parentProductId ? (
            <div className="flex items-start gap-1.5">
              <Info size={14} className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <p>
                <strong>Stock Vinculado:</strong> O stock deste pack é gerido diretamente pelo produto base <strong>{parentProductName || 'selecionado'}</strong>. Cada venda de 1 {packLabel} descontará <strong>{unitsCountNum} unidades</strong> no inventário central.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-1.5">
              <Sparkles size={14} className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <p>
                {stockNum > 0 ? (
                  <span>
                    A registar <strong>{stockNum} unidades de venda</strong> no balcão (Equivale a <strong>{Math.round((stockNum / unitsCountNum) * 10) / 10} caixas de {unitsCountNum} un</strong>).
                  </span>
                ) : (
                  <span>
                    A vender unidades fechadas de <strong>{packLabel} x{unitsCountNum}</strong> (Defina a quantidade de caixas ou unidades em stock).
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

