import React from 'react';
import { 
  X, 
  Package, 
  Tag, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  AlertTriangle, 
  Lock, 
  CheckCircle, 
  ShieldCheck, 
  Scale, 
  Info,
  Barcode as BarcodeIcon,
  Percent
} from 'lucide-react';
import { Product } from '../../lib/api';
import { parseProductMetric, METRIC_SHORT_LABELS, getProductDisplayPackaging } from '../../lib/utils/productMetric';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isAdminUnlocked?: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  isAdminUnlocked = false,
  onPromptAdminPin
}: ProductDetailsModalProps) {
  const t = useProductsI18n();
  const tCommon = useCommonI18n();

  if (!isOpen || !product) return null;

  const selling = product.price_mt || 0;
  const cost = product.cost_price_mt ?? 0;
  const unitProfit = selling - cost;
  const margin = selling > 0 ? ((selling - cost) / selling) * 100 : 0;
  const markup = cost > 0 ? ((selling - cost) / cost) * 100 : 0;
  const stockQty = product.stock_quantity ?? 0;
  const totalStockCost = stockQty * cost;
  const totalStockVal = stockQty * selling;
  const totalPotentialProfit = stockQty * unitProfit;
  const isLowStock = !product.is_fractional && (product.stock_quantity === undefined || product.stock_quantity === null || product.stock_quantity <= (product.min_stock_alert ?? 5));
  const metricInfo = parseProductMetric(product.attributes, product.is_fractional);
  const metricLabel = METRIC_SHORT_LABELS[metricInfo.unitMetric] || metricInfo.unitMetric;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Package size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                {product.name}
              </h3>
              {product.sync_status === 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title={t.syncPending} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 opacity-60" title={tCommon.synced} />
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
              <BarcodeIcon size={13} />
              <span>{product.barcode || t.noBarcode}</span>
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Status Banners */}
          <div className="flex flex-wrap gap-2">
            {(() => {
              const pkg = getProductDisplayPackaging(product.attributes, product.is_fractional);
              if (pkg.isPack) {
                return (
                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-black uppercase text-[10px] border border-purple-500/20 flex items-center gap-1.5">
                    <Package size={12} />
                    {t.multiPackBadge}: {pkg.badgeLabel}
                  </span>
                );
              }
              if (Boolean(product.is_fractional)) {
                return (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] border border-amber-500/20 flex items-center gap-1.5">
                    <Scale size={12} />
                    {t.fractionalBadge} ({metricLabel})
                  </span>
                );
              }
              return null;
            })()}
            {Boolean(product.requires_verification) && (
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] border border-indigo-500/20 flex items-center gap-1.5">
                <Lock size={12} />
                {t.posLockedBadge}
              </span>
            )}
            {product.promo_active && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black uppercase text-[10px] border border-emerald-500/20 flex items-center gap-1.5">
                <Percent size={12} />
                {t.promoActiveBadge}
              </span>
            )}
          </div>

          {/* Multi-Pack details card if pack */}
          {(() => {
            const pkg = getProductDisplayPackaging(product.attributes, product.is_fractional);
            if (!pkg.isPack) return null;
            const unitEq = pkg.unitsCount && pkg.unitsCount > 0 && selling > 0 ? (selling / pkg.unitsCount).toFixed(2) : null;
            return (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 dark:text-purple-200 text-xs flex items-center gap-1.5">
                    <Package size={13} className="text-purple-600 dark:text-purple-400" />
                    {t.packagingDetails}: {pkg.label}
                  </span>
                  {unitEq && (
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                      ≈ {unitEq} MT / un
                    </span>
                  )}
                </div>
                {pkg.parentProductName && (
                  <p className="text-[11px] text-purple-700 dark:text-purple-400">
                    ↳ <strong>{t.smartDeduction}:</strong> {t.linkedToStockOf} <strong>{pkg.parentProductName}</strong> ({pkg.unitsCount}x {t.perSale}).
                  </p>
                )}
              </div>
            );
          })()}

          {/* Core Info Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Category */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-1">
                <Tag size={13} />
                <span className="font-semibold">{t.category}</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm truncate">
                {product.category || t.noCategory}
              </p>
            </div>

            {/* Sale Price */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-1">
                <DollarSign size={13} />
                <span className="font-semibold">{t.retailPrice}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {product.promo_active && product.promo_price_mt !== undefined && product.promo_price_mt !== null
                    ? `${product.promo_price_mt.toFixed(2)} MT`
                    : `${selling.toFixed(2)} MT`}
                </p>
                {product.promo_active && product.promo_price_mt !== undefined && (
                  <span className="text-[10px] line-through text-slate-400 font-mono">
                    {selling.toFixed(2)} MT
                  </span>
                )}
              </div>
            </div>

            {/* Current Stock */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-1">
                <Layers size={13} />
                <span className="font-semibold">{t.availableStock}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-sm ${
                  (product.stock_quantity || 0) <= 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : isLowStock 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-slate-800 dark:text-zinc-200'
                }`}>
                  {product.stock_quantity ?? 0} {product.is_fractional ? metricLabel : 'un'}
                </span>
                {isLowStock && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                    {t.lowStock}
                  </span>
                )}
              </div>
            </div>

            {/* Min Alert Threshold */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-1">
                <AlertTriangle size={13} />
                <span className="font-semibold">{t.minStockAlert}</span>
              </div>
              <p className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-sm">
                {product.min_stock_alert ?? 5} {product.is_fractional ? metricLabel : 'un'}
              </p>
            </div>
          </div>

          {/* Admin Protected Cost & Margin Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
                <TrendingUp size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t.profitabilityAndCost}</span>
              </div>
              {!isAdminUnlocked && onPromptAdminPin && (
                <button
                  onClick={() => onPromptAdminPin(() => {})}
                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Lock size={11} />
                  {t.unlockCost}
                </button>
              )}
            </div>

            {isAdminUnlocked ? (
              <div className="space-y-2.5 pt-1">
                {/* Unitary Financials */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{t.costPriceLabel}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-100 text-xs">
                      {cost.toFixed(2)} MT
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{t.retailPrice}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-100 text-xs">
                      {selling.toFixed(2)} MT
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{t.grossProfit}</span>
                    <span className={`font-mono font-bold text-xs ${unitProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {unitProfit >= 0 ? '+' : ''}{unitProfit.toFixed(2)} MT
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{t.margin}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      +{margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{t.markup}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      +{markup.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Stock Valuation Breakdown */}
                {stockQty > 0 && (
                  <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-300">
                      <span>{t.tableStock} ({stockQty} un):</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {t.totalCostValue}: <strong className="text-slate-800 dark:text-zinc-200">{totalStockCost.toFixed(2)} MT</strong>
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {t.totalSaleValue}: <strong className="text-slate-800 dark:text-zinc-200">{totalStockVal.toFixed(2)} MT</strong>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t.projectedProfit}: +{totalPotentialProfit.toFixed(2)} MT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-zinc-500 text-[11px] italic">
                {t.adminCostRestricted}
              </p>
            )}
          </div>

          {/* Technical Product Identifier */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            <span>{t.productId}: {product.id}</span>
            <span className="text-[10px] font-sans bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
              SQLite Local
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
          >
            {t.closeDetails}
          </button>
        </div>
      </div>
    </div>
  );
}
