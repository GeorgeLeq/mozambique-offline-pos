import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Percent, ShieldCheck, Scale, Info, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { parseProductMetric, METRIC_SHORT_LABELS, getProductDisplayPackaging } from '../../lib/utils/productMetric';
import { CartItem } from './hooks/useCart';
import { useI18n } from '../../i18n';

interface ProductGridProps {
  cart: CartItem[];
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  applyDiscount: (id: string) => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onShowInfo?: (item: CartItem) => void;
}

interface CartRowProps {
  item: CartItem;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  onOpenDiscountModal: (item: CartItem) => void;
  onShowInfo?: (item: CartItem) => void;
}

const CartRow = memo(function CartRow({ item, updateQuantity, removeItem, onOpenDiscountModal, onShowInfo }: CartRowProps) {
  const t = useI18n();
  const hasPromo = item.promo_active === 1 || item.promo_active === true;
  const hasManualDiscount = item.discount_type && item.discount_type !== 'none';
  const basePrice = item.original_price_mt || item.price_mt;
  const hasAnyDiscount = basePrice !== item.price_mt;

  const metricInfo = parseProductMetric(item.attributes, item.is_fractional);
  const shortMetric = METRIC_SHORT_LABELS[metricInfo.unitMetric] || metricInfo.unitMetric || 'un';

  return (
    <motion.tr 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors group"
    >
      {/* Product Info */}
      <td className="py-5 px-8">
        <div className="font-semibold text-slate-800 dark:text-zinc-100 text-lg flex items-center gap-2">
          {item.name}
        </div>
        
        {/* Sub-labels / Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono tracking-tight">{item.barcode}</span>
          
          {(() => {
            const pkg = getProductDisplayPackaging(item.attributes, item.is_fractional);
            if (pkg.isPack) {
              return (
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Package size={10} />
                  {pkg.label}
                </span>
              );
            }
            if (item.is_fractional) {
              return (
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Scale size={10} />
                  1 {shortMetric} {metricInfo.packageTotalQty ? `(Saco de ${metricInfo.packageTotalQty}${shortMetric})` : ''}
                </span>
              );
            }
            return null;
          })()}

          {hasPromo && (
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              {t.promotional || 'Promocional'}
            </span>
          )}

          {hasManualDiscount && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              {t.discountLabel || 'Desconto'} {item.discount_type === 'percent' ? `-${item.discount_value}%` : `-${item.discount_value} MT`}
              {item.authorized_by && (
                <span className="text-[8px] font-bold text-slate-500 dark:text-zinc-450 flex items-center gap-0.5 ml-1 border-l border-amber-500/20 pl-1.5">
                  <ShieldCheck size={9} /> {item.authorized_by}
                </span>
              )}
            </span>
          )}
        </div>
      </td>

      {/* Quantity Controls */}
      <td className="py-5 px-8">
        <div className="flex items-center justify-center bg-slate-50 dark:bg-zinc-950/50 shadow-inner border border-slate-200 dark:border-white/5 rounded-xl p-1 w-32 mx-auto">
          <button 
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 active:bg-slate-100 dark:active:bg-zinc-900 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 shadow-sm font-bold cursor-pointer"
          >-</button>
          <span className="flex-1 text-center font-bold text-slate-700 dark:text-zinc-100 text-xs font-mono">
            {item.quantity} {item.is_fractional ? shortMetric : ''}
          </span>
          <button 
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 active:bg-slate-100 dark:active:bg-zinc-900 transition-all text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 shadow-sm font-bold cursor-pointer"
          >+</button>
        </div>
      </td>

      {/* Unit Price */}
      <td className="py-5 px-8 text-right font-mono text-sm">
        {hasAnyDiscount && (
          <span className="block text-[11px] line-through text-slate-400 dark:text-zinc-650 mb-0.5">
            {formatCurrency(basePrice)}
          </span>
        )}
        <span className={`font-semibold ${hasAnyDiscount ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-zinc-400'}`}>
          {formatCurrency(item.price_mt)}
        </span>
      </td>

      {/* Total Item Price */}
      <td className="py-5 px-8 text-right font-mono">
        {hasAnyDiscount && (
          <span className="block text-[11px] line-through text-slate-400 dark:text-zinc-650 mb-0.5">
            {formatCurrency(basePrice * item.quantity)}
          </span>
        )}
        <span className={`text-base font-black ${hasAnyDiscount ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-100'}`}>
          {formatCurrency(item.price_mt * item.quantity)}
        </span>
      </td>

      {/* Actions */}
      <td className="py-5 px-8 text-right">
        <div className="flex items-center justify-end gap-1.5 transition-all duration-150">
          {onShowInfo && (
            <button 
              onClick={() => onShowInfo(item)}
              className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title={t.viewProductDetails || 'Ver detalhes do produto'}
            >
              <Info size={17} />
            </button>
          )}
          <button 
            onClick={() => onOpenDiscountModal(item)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              hasManualDiscount 
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                : 'text-slate-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            }`}
            title={hasManualDiscount ? (t.adjustManualDiscount || 'Ajustar Desconto Manual') : (t.applyDiscount || 'Aplicar Desconto')}
          >
            <Percent size={17} />
          </button>
          <button 
            onClick={() => removeItem(item.id)}
            className="text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
            title={t.removeItem || 'Remover Item'}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

export function ProductGrid({ cart, updateQuantity, removeItem, applyDiscount, onOpenDiscountModal, onShowInfo }: ProductGridProps) {
  const t = useI18n();
  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-white/90 dark:bg-zinc-950/90 sticky top-0 z-10 border-b border-slate-200/80 dark:border-zinc-900 transition-colors duration-500">
        <tr>
          <th className="py-3.5 px-8 font-black text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest">{t.tableArticleProduct || 'Artigo / Produto'}</th>
          <th className="py-3.5 px-8 font-black text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest w-36 text-center">{t.tableQuantity || 'Quantidade'}</th>
          <th className="py-3.5 px-8 font-black text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest text-right">{t.tableUnitPrice || 'Preço Unitário'}</th>
          <th className="py-3.5 px-8 font-black text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest text-right">{t.tableTotalMt || 'Total (MT)'}</th>
          <th className="py-3.5 px-8 w-24 text-right"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-zinc-900/80 bg-white/40 dark:bg-zinc-950/40">
        <AnimatePresence>
          {cart.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              onOpenDiscountModal={onOpenDiscountModal}
              onShowInfo={onShowInfo}
            />
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
}
