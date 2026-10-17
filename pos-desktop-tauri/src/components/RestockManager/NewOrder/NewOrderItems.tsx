import React, { useState } from 'react';
import { Search, Plus, Trash2, Download, Upload, Package, Scale, Layers } from 'lucide-react';
import { Product } from '../../../lib/api';
import { POItem } from './useNewOrder';
import { useI18n } from '../../../i18n';
import { OrderItemPackaging, RESTOCK_PACK_TYPES, RESTOCK_BULK_METRICS, formatOrderItemPackaging } from './packagingTypes';
import { parseProductMetric } from '../../../lib/utils/productMetric';

interface NewOrderItemsProps {
  searchTerm: string;
  handleSearch: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchResults: Product[];
  handleAddProduct: (product: Product) => void;
  handleDownloadTemplate: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  directName: string;
  setDirectName: (val: string) => void;
  directQty: string;
  setDirectQty: (val: string) => void;
  directMode: 'unit' | 'pack' | 'bulk';
  setDirectMode: (val: 'unit' | 'pack' | 'bulk') => void;
  directPackType: 'pack' | 'box' | 'bundle' | 'crate' | 'other';
  setDirectPackType: (val: 'pack' | 'box' | 'bundle' | 'crate' | 'other') => void;
  directUnitsPerPack: string;
  setDirectUnitsPerPack: (val: string) => void;
  directTotalPacks: string;
  setDirectTotalPacks: (val: string) => void;
  directBulkMetric: 'kg' | 'g' | 'l' | 'ml';
  setDirectBulkMetric: (val: 'kg' | 'g' | 'l' | 'ml') => void;
  directBulkSize: string;
  setDirectBulkSize: (val: string) => void;
  directBulkPkgs: string;
  setDirectBulkPkgs: (val: string) => void;
  handleAddDirect: () => void;
  updateItemPackaging: (itemId: string, updatedPackaging: OrderItemPackaging) => void;
  items: POItem[];
  setItems: React.Dispatch<React.SetStateAction<POItem[]>>;
  globalRequiresVerification: boolean;
}

export function NewOrderItems({
  searchTerm,
  handleSearch,
  searchInputRef,
  searchResults,
  handleAddProduct,
  handleDownloadTemplate,
  fileInputRef,
  handleFileUpload,
  directName,
  setDirectName,
  directQty,
  setDirectQty,
  directMode,
  setDirectMode,
  directPackType,
  setDirectPackType,
  directUnitsPerPack,
  setDirectUnitsPerPack,
  directTotalPacks,
  setDirectTotalPacks,
  directBulkMetric,
  setDirectBulkMetric,
  directBulkSize,
  setDirectBulkSize,
  directBulkPkgs,
  setDirectBulkPkgs,
  handleAddDirect,
  updateItemPackaging,
  items,
  setItems,
  globalRequiresVerification,
}: NewOrderItemsProps) {
  const t = useI18n();

  // Compute calculated direct quantities for preview
  const directPacksCount = parseInt(directTotalPacks, 10) || 1;
  const directUnitsPer = parseInt(directUnitsPerPack, 10) || 24;
  const computedPackTotalUnits = directPacksCount * directUnitsPer;

  const directBulkCount = parseFloat(directBulkPkgs) || 1;
  const directBulkKgSize = parseFloat(directBulkSize) || 25;
  const computedBulkTotalUnits = directBulkCount * directBulkKgSize;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-hidden">
      {/* LEFT COLUMN: Search & Add Controls (5 cols) */}
      <div className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
        {/* Search Catalog Input */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t.productSearchPrompt || "Pesquisar no Catálogo"}</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title={t.downloadTemplate || 'Modelo CSV'}
              >
                <Download size={10} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title={t.importCSV || 'Importar CSV'}
              >
                <Upload size={10} />
                <span>{t.importCSV ? t.importCSV.replace(' CSV', '') : 'Importar'}</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              placeholder={t.searchProductPlaceholder || 'Nome ou passar código de barras...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs text-slate-900 dark:text-zinc-100 shadow-2xs font-bold"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto p-1">
              {searchResults.map(product => {
                const metricInfo = parseProductMetric(product.attributes, product.is_fractional);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between items-center cursor-pointer text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{product.name}</span>
                        {metricInfo.productType === 'pack' && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded text-[9px] font-black uppercase">
                            Pack x{metricInfo.packUnitsCount || 24}
                          </span>
                        )}
                        {metricInfo.productType === 'bulk' && (
                          <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded text-[9px] font-black uppercase">
                            Granel {metricInfo.unitMetric || 'kg'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{product.barcode || 'Sem código'}</div>
                    </div>
                    <Plus size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mode Selector Tabs (Avulso, Pack/Caixa, Granel) */}
        <div className="bg-slate-50/80 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              {t.addPackagingItem || 'Adicionar Item / Embalagem'}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setDirectMode('unit')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                directMode === 'unit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Layers size={12} />
              <span>{t.unitsTab || 'Unidades'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectMode('pack')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                directMode === 'pack'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Package size={12} />
              <span>{t.packBoxTab || 'Pack / Caixa'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectMode('bulk')}
              className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                directMode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Scale size={12} />
              <span>{t.bulkTab || 'Granel'}</span>
            </button>
          </div>

          {/* Input Fields for Add */}
          <div className="space-y-2">
            <div>
              <label className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                {t.productName || 'Nome do Produto'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={directName}
                onChange={e => setDirectName(e.target.value)}
                placeholder={t.productNamePlaceholder || "Ex: Cerveja 2M 330ml, Arroz 25kg..."}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Mode 1: Individual Units */}
            {directMode === 'unit' && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={directQty}
                    onChange={e => setDirectQty(e.target.value)}
                    placeholder={t.looseQtyPlaceholder || "Qtd. Unidades (Ex: 50)"}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDirect}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all border-0 shadow-xs shrink-0"
                >
                  <Plus size={13} />
                  <span>{t.add || 'Adicionar'}</span>
                </button>
              </div>
            )}

            {/* Mode 2: Multi-Packaging (Pack / Caixa / Fardo) */}
            {directMode === 'pack' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.type || 'Tipo'}
                    </label>
                    <select
                      value={directPackType}
                      onChange={e => {
                        const newType = e.target.value as any;
                        setDirectPackType(newType);
                        const defaultUnits = RESTOCK_PACK_TYPES.find(t => t.id === newType)?.defaultUnits || 24;
                        setDirectUnitsPerPack(defaultUnits.toString());
                      }}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-slate-800 dark:text-zinc-100"
                    >
                      {RESTOCK_PACK_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.unitsPerPack || 'Un/Emb.'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={directUnitsPerPack}
                      onChange={e => setDirectUnitsPerPack(e.target.value)}
                      placeholder="24"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.packsQty || 'Qtd. Emb.'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={directTotalPacks}
                      onChange={e => setDirectTotalPacks(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 rounded-xl">
                  <div className="text-[10px] text-indigo-900 dark:text-indigo-300 font-bold flex items-center gap-1 truncate">
                    <Package size={12} className="text-indigo-600 shrink-0" />
                    <span className="truncate">
                      Total: <strong className="text-emerald-600 dark:text-emerald-400">{computedPackTotalUnits} un</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDirect}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border-0 shrink-0"
                  >
                    <Plus size={11} />
                    <span>{t.add || 'Adicionar'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Bulk / Sacks (Granel e Métricas) */}
            {directMode === 'bulk' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.metric || 'Métrica'}
                    </label>
                    <select
                      value={directBulkMetric}
                      onChange={e => {
                        const newMetric = e.target.value as any;
                        setDirectBulkMetric(newMetric);
                        const defaultSize = RESTOCK_BULK_METRICS.find(m => m.id === newMetric)?.defaultPackage || 25;
                        setDirectBulkSize(defaultSize.toString());
                      }}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-slate-800 dark:text-zinc-100"
                    >
                      {RESTOCK_BULK_METRICS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.packageSize || 'Tam.'} ({directBulkMetric})
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={directBulkSize}
                      onChange={e => setDirectBulkSize(e.target.value)}
                      placeholder="25"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      {t.sacksQty || 'Qtd. Sacos'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={directBulkPkgs}
                      onChange={e => setDirectBulkPkgs(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 rounded-xl">
                  <div className="text-[10px] text-indigo-900 dark:text-indigo-300 font-bold flex items-center gap-1 truncate">
                    <Scale size={12} className="text-indigo-600 shrink-0" />
                    <span className="truncate">
                      Total: <strong className="text-emerald-600 dark:text-emerald-400">{computedBulkTotalUnits} {directBulkMetric}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDirect}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border-0 shrink-0"
                  >
                    <Plus size={11} />
                    <span>{t.add || 'Adicionar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Order Items List (7 cols, full height, internal scroll) */}
      <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-3 shadow-2xs overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              {t.productsInOrder || 'Produtos na Encomenda'} ({items.length})
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} {t.totalUnits || 'un. totais'}
          </span>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 pr-1 scrollbar-thin">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold py-10 gap-1.5">
              <Package size={24} className="text-slate-300 dark:text-zinc-700" />
              <span>{t.noProductsInOrder || 'Nenhum produto adicionado à encomenda'}</span>
              <p className="text-[10.5px] font-normal text-slate-400 max-w-xs text-center">
                {t.searchOrAddManual || 'Pesquise no catálogo ao lado ou adicione manualmente por unidades, caixas ou granel.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map(item => {
                const packagingLabel = formatOrderItemPackaging(item.packaging, item.quantity);

                return (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span className="truncate">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">{item.barcode || 'Manual'}</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
                            {packagingLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {globalRequiresVerification && (
                          <button
                            type="button"
                            onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, requiresVerification: i.requiresVerification === false } : i))}
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors border cursor-pointer ${
                              item.requiresVerification !== false 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                            }`}
                            title={item.requiresVerification !== false ? (t.locksInPosUntilVerified || "Requer Verificação ao Receber") : (t.freeSaleInPos || "Verificação Desativada")}
                          >
                            <span>{item.requiresVerification !== false ? (t.requiresVerification || '🔒 Verificar') : (t.freeSale || '🔓 Sem Verif.')}</span>
                          </button>
                        )}

                        {/* Quick Adjust Total Quantity */}
                        <div className="flex items-center gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">{t.qtyOrdered ? t.qtyOrdered.split(' ')[0] : 'Qtd'}:</label>
                          <input 
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseFloat(e.target.value) || 0;
                              setItems(items.map(i => i.id === item.id ? {...i, quantity: newQty} : i));
                            }}
                            className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-right font-mono font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-zinc-100"
                          />
                        </div>

                        <button 
                          type="button"
                          onClick={() => setItems(items.filter(i => i.id !== item.id))}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title={t.removeItem || "Remover produto"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
