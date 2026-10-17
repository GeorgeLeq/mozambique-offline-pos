import React, { useRef } from 'react';
import { Product } from '../../../lib/api';
import { Package, Edit2, Trash2, Check, X, Printer, Tags, Tag, CheckSquare, Square, Eye, Edit3, Lock, Plus, Minus, Info, Link as LinkIcon, Barcode, Calculator } from 'lucide-react';
import { parseProductMetric, METRIC_SHORT_LABELS, getProductDisplayPackaging } from '../../../lib/utils/productMetric';
import { useProductsI18n, useCommonI18n } from '../../../i18n';

export function SyncDot({ status }: { status?: number }) {
  const t = useProductsI18n();
  if (status === 0) {
    return (
      <span
        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block shadow-xs"
        title={t.syncPending || "Alteração pendente / a sincronizar"}
      />
    );
  }
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0 inline-block opacity-60"
      title={t.syncCloud || "Sincronizado na nuvem"}
    />
  );
}

function InlineNameEditor({
  product,
  onSave,
  onCancel
}: {
  product: Product;
  onSave: (product: Product, newName: string) => void;
  onCancel: () => void;
}) {
  const commonT = useCommonI18n();
  const [value, setValue] = React.useState(product.name);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(product, value);
          if (e.key === 'Escape') onCancel();
        }}
        className="px-2 py-1 text-xs font-bold rounded-lg border border-indigo-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none"
      />
      <button onClick={() => onSave(product, value)} className="p-1 bg-indigo-600 text-white rounded-md cursor-pointer" title={commonT.save}>
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="p-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md cursor-pointer" title={commonT.cancel}>
        <X size={13} />
      </button>
    </div>
  );
}

interface ProductTableProps {
  products: Product[];
  paginatedProducts: Product[];
  isLoading: boolean;
  readOnly: boolean;
  isAdminUnlocked: boolean;
  selectedProductIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelectProduct: (id: string) => void;
  highlightedProductIds: Set<string>;
  toggleHighlightProduct: (id: string) => void;
  inlineEditingProductId: string | null;
  setInlineEditingProductId: (id: string | null) => void;
  handleSaveInlineName: (product: Product, newName: string) => void;
  quickStockId: string | null;
  setQuickStockId: (id: string | null) => void;
  quickStockValue: string;
  setQuickStockValue: (val: string) => void;
  quickStockInputRef: React.RefObject<HTMLInputElement | null>;
  submitQuickStock: (product: Product) => void;
  globalLowStockThreshold: number;
  onPromptAdminPin?: (onSuccess: () => void) => void;
  setInfoModalProduct: (p: Product | null) => void;
  setAliasModalProduct: (p: Product | null) => void;
  setPrintModalProducts: (ps: Product[]) => void;
  onOpenBreakdown: (p: Product) => void;
  onStartEdit: (p: Product) => void;
  handleDelete: (p: Product) => void;
  onGenerateBarcode?: (product: Product) => void;
}

export function ProductTable({
  products,
  paginatedProducts,
  isLoading,
  readOnly,
  isAdminUnlocked,
  selectedProductIds,
  toggleSelectAll,
  toggleSelectProduct,
  highlightedProductIds,
  toggleHighlightProduct,
  inlineEditingProductId,
  setInlineEditingProductId,
  handleSaveInlineName,
  quickStockId,
  setQuickStockId,
  quickStockValue,
  setQuickStockValue,
  quickStockInputRef,
  submitQuickStock,
  globalLowStockThreshold,
  onPromptAdminPin,
  setInfoModalProduct,
  setAliasModalProduct,
  setPrintModalProducts,
  onOpenBreakdown,
  onStartEdit,
  handleDelete,
  onGenerateBarcode
}: ProductTableProps) {
  const t = useProductsI18n();
  const commonT = useCommonI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold">{t.loadingProducts}</p>
      </div>
    );
  }

  if (paginatedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5">
          <Package size={32} className="text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.noProductsFound}</p>
        <p className="text-xs text-slate-400 mt-0.5">{t.noProductsFoundSub}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 w-full h-full relative overflow-y-auto overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-zinc-900 shadow-xs">
          <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <th className="py-2.5 px-3 w-10 text-center">
              {!readOnly && isAdminUnlocked && (
                <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-600">
                  {selectedProductIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              )}
            </th>
            <th className="py-2.5 px-1 w-7 text-center">
              <span className="sr-only">Sync</span>
            </th>
            <th className="py-2.5 px-4 font-bold">{t.tableProductName}</th>
            <th className="py-2.5 px-4 font-bold">{t.tableCategory}</th>
            <th className="py-2.5 px-4 font-bold">{t.tablePrice}</th>
            <th className="py-2.5 px-4 font-bold">{t.tableSellUnit}</th>
            <th className="py-2.5 px-4 font-bold">{t.tableCostMargin}</th>
            <th className="py-2.5 px-4 font-bold">{t.tableStock}</th>
            <th className="py-2.5 px-4 font-bold text-right">{t.tableActions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
          {paginatedProducts.map((product) => {
            if (!product) return null;
            const isLowStock = !product.is_fractional && (product.stock_quantity === undefined || product.stock_quantity === null || product.stock_quantity <= (product.min_stock_alert ?? globalLowStockThreshold));
            const selling = product.price_mt;
            const cost = product.cost_price_mt ?? 0;
            const marginPct = selling > 0 ? ((selling - cost) / selling) * 100 : 0;
            const isSelected = selectedProductIds.has(product.id);
            const isHighlighted = highlightedProductIds.has(product.id);
            const isLocked = Boolean(product.requires_verification);
            const imageUrl = (product as any).image_url;

            const handleRowClick = () => {
              const nextHighlighted = !isHighlighted;
              toggleHighlightProduct(product.id);
              
              // Automatically checkmark/select the product when highlighted if unlocked, unless already selected
              if (!readOnly && isAdminUnlocked) {
                if (nextHighlighted && !isSelected) {
                  toggleSelectProduct(product.id);
                }
              }
            };

            return (
              <tr 
                key={product.id}
                onClick={handleRowClick}
                className={`transition-all cursor-pointer group ${
                  isHighlighted 
                    ? 'bg-indigo-100/90 dark:bg-indigo-950/70 ring-2 ring-indigo-500 shadow-md scale-[1.01]' 
                    : isSelected 
                    ? 'bg-indigo-50/40 dark:bg-indigo-500/10' 
                    : isLocked
                    ? 'bg-amber-50/35 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/30'
                    : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/40'
                }`}
              >
                {/* Checkbox */}
                <td className="py-2 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                  {!readOnly && isAdminUnlocked && (
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className="cursor-pointer text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                    </button>
                  )}
                </td>

                {/* Sync Status Dot (Far Left) */}
                <td className="py-2 px-1 text-center w-7" onClick={(e) => e.stopPropagation()}>
                  <SyncDot status={product.sync_status} />
                </td>

                {/* Product Name & Thumbnail */}
                <td className="py-2 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={15} className="text-slate-400 dark:text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate flex items-center gap-2">
                        {inlineEditingProductId === product.id ? (
                          <InlineNameEditor
                            product={product}
                            onSave={handleSaveInlineName}
                            onCancel={() => setInlineEditingProductId(null)}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 group/name">
                            <span className="truncate">{product.name}</span>
                            {!readOnly && isAdminUnlocked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineEditingProductId(product.id);
                                }}
                                className="opacity-0 group-hover/name:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer"
                                title={commonT.edit}
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                        {(() => {
                          const pkg = getProductDisplayPackaging(product.attributes, product.is_fractional);
                          if (pkg.isPack) {
                            return (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/20 shrink-0">
                                📦 {pkg.badgeLabel}
                              </span>
                            );
                          }
                          if (Boolean(product.is_fractional)) {
                            return (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold uppercase border border-amber-500/20 shrink-0">
                                {t.fractionalTag} ({METRIC_SHORT_LABELS[parseProductMetric(product.attributes, product.is_fractional).unitMetric] || 'kg'})
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {(Boolean(product.requires_verification)) && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/20 shrink-0 flex items-center gap-1" title="Venda POS Bloqueada: Aguarda verificação de stock pelo Gestor">
                            🔒 {t.lockedOnly}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 font-mono">
                        {product.barcode && product.barcode.trim() !== '' ? (
                          <span>{product.barcode}</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!readOnly && isAdminUnlocked) {
                                onGenerateBarcode?.(product);
                              } else if (onPromptAdminPin) {
                                onPromptAdminPin(() => onGenerateBarcode?.(product));
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition-all cursor-pointer"
                            title={t.generateBarcode}
                          >
                            <Barcode size={11} />
                            <span>+ {t.generateBarcode}</span>
                          </button>
                        )}
                        {(() => {
                          const pkg = getProductDisplayPackaging(product.attributes, product.is_fractional);
                          if (pkg.parentProductName) {
                            return (
                              <>
                                <span>•</span>
                                <span className="text-purple-600 dark:text-purple-400 font-sans font-medium flex items-center gap-0.5" title={`Dedução inteligente: Deduz ${pkg.unitsCount}x de ${pkg.parentProductName}`}>
                                  <LinkIcon size={10} />
                                  ↳ {pkg.parentProductName}
                                </span>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Categoria / Tag Dedicated Section */}
                <td className="py-2.5 px-4">
                  {product.category ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 shadow-2xs">
                      <Tag size={11} className="text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[130px]">{product.category}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                      <Tag size={10} className="text-slate-400" />
                      <span>{t.unclassified || "Geral"}</span>
                    </span>
                  )}
                </td>

                {/* Pricing */}
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {product.promo_active && product.promo_price_mt !== undefined && product.promo_price_mt !== null ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] line-through text-slate-400 font-normal">{product.price_mt.toFixed(2)} MT</span>
                      <span className="text-amber-600 dark:text-amber-400">{product.promo_price_mt.toFixed(2)} MT</span>
                    </div>
                  ) : (
                    <span>{product.price_mt.toFixed(2)} MT</span>
                  )}
                </td>

                {/* Sell Unit */}
                <td className="py-2.5 px-4 text-slate-600 dark:text-zinc-400 font-semibold">
                  {getProductDisplayPackaging(product.attributes, product.is_fractional).label}
                </td>

                {/* Cost / Margin */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    {isAdminUnlocked ? (
                      <div className="flex flex-col font-mono">
                        <span className="text-slate-700 dark:text-zinc-300 font-bold">{cost.toFixed(2)} MT</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+{marginPct.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onPromptAdminPin?.(() => {})}
                        className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <Lock size={12} />
                        <span className="blur-[3px] select-none font-mono">00.00 MT</span>
                      </button>
                    )}
                  </div>
                </td>

                {/* Stock */}
                <td className="py-2.5 px-4">
                  {quickStockId === product.id ? (
                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={quickStockInputRef}
                          type="number"
                          autoFocus
                          value={quickStockValue}
                          onChange={(e) => setQuickStockValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitQuickStock(product);
                            if (e.key === 'Escape') setQuickStockId(null);
                          }}
                          placeholder="+ Qt"
                          className="w-20 px-2 py-1 text-xs font-mono rounded-lg border border-indigo-500 bg-white dark:bg-zinc-900 outline-none"
                        />
                        <button onClick={() => submitQuickStock(product)} className="p-1 bg-indigo-600 text-white rounded-md">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setQuickStockId(null)} className="p-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md">
                          <X size={13} />
                        </button>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 leading-tight">
                        Atual: <span className="font-bold text-slate-700 dark:text-zinc-300">{product.stock_quantity || 0}</span> 
                        {' \u2192 '} 
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {((product.stock_quantity || 0) + (parseFloat(quickStockValue) || 0))}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          (product.stock_quantity || 0) <= 0 
                            ? 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse' 
                            : isLowStock 
                            ? 'bg-amber-500 ring-2 ring-amber-500/20' 
                            : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                        }`} 
                      />
                      <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs ${
                        (product.stock_quantity || 0) <= 0
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : isLowStock 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200'
                      }`}>
                        {product.stock_quantity || 0} {METRIC_SHORT_LABELS[parseProductMetric(product.attributes, product.is_fractional).unitMetric] || (product.is_fractional ? 'kg' : 'un')}
                      </span>
                    </div>
                  )}
                </td>

                {/* Action */}
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setInfoModalProduct(product); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                      title={t.productDetails}
                    >
                      <Info size={16} />
                    </button>
                    
                    {!readOnly && isAdminUnlocked && (
                      <>
                        <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-800 mr-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuickStockId(product.id); setQuickStockValue(''); setTimeout(() => quickStockInputRef.current?.focus(), 100); }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                            title={`${t.quickStock} (+)`}
                          >
                            <Plus size={14} />
                          </button>
                          <div className="w-px h-3 bg-slate-200 dark:bg-zinc-700"></div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuickStockId(product.id); setQuickStockValue('-'); setTimeout(() => quickStockInputRef.current?.focus(), 100); }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title={`${t.quickStock} (-)`}
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAliasModalProduct(product); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                          title="Aliases"
                        >
                          <Tags size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPrintModalProducts([product]); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                          title={t.printBarcode}
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenBreakdown(product); }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                          title="Dividir Caixa/Fardo"
                        >
                          <Package size={16} />
                        </button>
                        {(!product.barcode || product.barcode.trim() === '') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onGenerateBarcode?.(product);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
                            title={t.generateBarcode}
                          >
                            <Barcode size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartEdit(product); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                          title={t.editProduct || commonT.edit}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          className={`p-1.5 rounded-lg transition-all ${
                            (product.requires_verification === 1 || product.requires_verification === true)
                              ? 'text-slate-300 dark:text-zinc-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-900'
                          }`}
                          title={(product.requires_verification === 1 || product.requires_verification === true) ? (t.lockedOnly || "Bloqueado") : (t.deleteProduct || commonT.delete)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
