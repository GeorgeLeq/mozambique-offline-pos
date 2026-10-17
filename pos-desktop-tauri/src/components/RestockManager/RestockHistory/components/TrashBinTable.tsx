import React, { useRef } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Square,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DeletedProductItem } from '../types';
import { useI18n } from '../../../../i18n';

interface TrashBinTableProps {
  isLoading: boolean;
  filteredTrash: DeletedProductItem[];
  retentionDays: number;
  selectedTrashIds: string[];
  onToggleSelectTrash: (id: string) => void;
  onToggleSelectAllTrash: () => void;
  onRestoreProduct: (product: DeletedProductItem) => void;
  onRequestWipeProduct: (product: DeletedProductItem) => void;
  onOpenBulkRestoreConfirm: () => void;
  onOpenBulkWipeConfirm: () => void;
  getDaysRemaining: (product: DeletedProductItem) => number;
}

export function TrashBinTable({
  isLoading,
  filteredTrash,
  retentionDays,
  selectedTrashIds,
  onToggleSelectTrash,
  onToggleSelectAllTrash,
  onRestoreProduct,
  onRequestWipeProduct,
  onOpenBulkRestoreConfirm,
  onOpenBulkWipeConfirm,
  getDaysRemaining
}: TrashBinTableProps) {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold">{t.loadingData || 'A carregar lixeira de produtos...'}</p>
        </div>
      </div>
    );
  }

  if (filteredTrash.length === 0) {
    return (
      <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 border border-emerald-500/20 shadow-xs">
            <Trash2 size={32} />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.emptyTrash || 'Lixeira Vazia'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t.emptyTrashHint || 'Nenhum produto em período de retenção.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
      
      {/* Retention Alert Bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-700 dark:text-amber-300 text-xs shrink-0">
        <div className="flex items-center gap-2 font-bold text-[11px]">
          <Clock size={15} className="text-amber-600 shrink-0" />
          <span>
            {retentionDays <= 0 ? (
              <>Retenção: <strong className="text-emerald-600 dark:text-emerald-400">Nunca (Sem Expiração)</strong>. Produtos guardados na lixeira indefinidamente.</>
            ) : (
              <>{t.autoCleanRetention || 'Retenção'}: {retentionDays} {t.days || 'Dias'}. {t.trashBinSubtitle || 'Produtos recuperáveis a 1-Tap.'}</>
            )}
          </span>
        </div>

        {/* Bulk Action Controls */}
        {selectedTrashIds.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black bg-amber-500/20 px-2 py-0.5 rounded-md">
              {selectedTrashIds.length} {t.itemsSelected || 'selecionado(s)'}
            </span>
            <button
              onClick={onOpenBulkRestoreConfirm}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs cursor-pointer border-0"
            >
              <RotateCcw size={11} />
              <span>{t.bulkRestore || 'Restaurar Lote'}</span>
            </button>
            <button
              onClick={onOpenBulkWipeConfirm}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs cursor-pointer border-0"
            >
              <Trash2 size={11} />
              <span>{t.bulkPermanentDelete || 'Eliminar Lote'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-y-auto scrollbar-none">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-zinc-900 shadow-xs">
            <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-2.5 px-4 w-10 text-center">
                <button
                  onClick={onToggleSelectAllTrash}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  {selectedTrashIds.length === filteredTrash.length && filteredTrash.length > 0 ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-4 font-bold">{t.productName || 'Produto'} & {t.barcode || 'Código'}</th>
              <th className="py-2.5 px-4 font-bold">{t.unitCost || 'Preço de Venda'}</th>
              <th className="py-2.5 px-4 font-bold">{t.costPerUnit || 'Custo'} / Stock</th>
              <th className="py-2.5 px-4 font-bold">{t.expiresInDays || 'Expiração'}</th>
              <th className="py-2.5 px-4 font-bold text-right">{t.actions || 'Ações'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {filteredTrash.map((product) => {
              const daysLeft = getDaysRemaining(product);
              const isSelected = selectedTrashIds.includes(product.id);

              return (
                <tr
                  key={product.id}
                  onClick={() => onToggleSelectTrash(product.id)}
                  className={`transition-all cursor-pointer group ${
                    isSelected 
                      ? 'bg-indigo-50/40 dark:bg-indigo-500/10' 
                      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-2.5 px-4 text-center w-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectTrash(product.id);
                      }}
                      className="cursor-pointer text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                    </button>
                  </td>

                  {/* Product Thumbnail & Name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        <Package size={16} className="text-slate-400 dark:text-zinc-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                          {product.barcode || 'Sem código'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="py-2.5 px-4">
                    <span className="font-black text-slate-900 dark:text-zinc-100 text-xs">
                      {product.price_mt ? `${product.price_mt} MT` : '0 MT'}
                    </span>
                  </td>

                  {/* Cost / Prior Stock */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-slate-600 dark:text-zinc-400 text-xs">
                        {t.costPerUnit || 'Custo'}: {product.cost_price_mt ? `${product.cost_price_mt} MT` : '0 MT'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Stock: {product.stock_quantity ?? 0} un
                      </span>
                    </div>
                  </td>

                  {/* Retention Countdown Window */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-col gap-1 max-w-[150px]">
                      {retentionDays <= 0 || daysLeft < 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 w-fit">
                          <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Sem Expiração</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border w-fit ${
                          daysLeft === 0
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                            : daysLeft <= 3
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : daysLeft <= 7
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>
                          <Clock size={11} className={daysLeft <= 3 ? "animate-spin text-rose-600" : ""} />
                          <span>
                            {daysLeft === 0 
                              ? (t.expiringToday || 'Expira hoje') 
                              : `${daysLeft} ${t.daysRemaining || 'dias restantes'}`}
                          </span>
                        </span>
                      )}

                      {/* Visual Time Remaining Bar */}
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            retentionDays <= 0 || daysLeft < 0 ? 'bg-emerald-500' : daysLeft <= 3 ? 'bg-rose-500' : daysLeft <= 7 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ 
                            width: retentionDays <= 0 || daysLeft < 0 ? '100%' : `${Math.max(5, Math.min(100, (daysLeft / Math.max(1, retentionDays)) * 100))}%` 
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                        {retentionDays <= 0 ? 'Retido na lixeira' : `${t.autoCleanRetention || 'Purga automática'} SQLite`}
                      </span>
                    </div>
                  </td>

                  {/* 1-Tap Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreProduct(product);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-all cursor-pointer border-0 active:scale-95"
                        title={t.restoreProduct || "Restaurar produto imediatamente"}
                      >
                        <RotateCcw size={12} />
                        <span>{t.restore || 'Restaurar'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestWipeProduct(product);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title={t.permanentDelete || "Eliminar Definitivamente"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-200/60 dark:border-white/10 px-4 py-2.5 flex justify-between items-center bg-slate-50/60 dark:bg-zinc-950/30 shrink-0">
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
          {t.trashBinTab || 'Lixeira'}: {filteredTrash.length} {t.orderItems || 'itens'}
        </span>
      </div>

    </div>
  );
}
