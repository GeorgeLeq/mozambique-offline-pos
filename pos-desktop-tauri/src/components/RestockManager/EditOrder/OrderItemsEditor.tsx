import React from 'react';
import { ExpectedItemsTable } from '../common/ExpectedItemsTable';
import { Search, Plus, Trash2, Package, Scale, Layers } from 'lucide-react';
import { Product } from '../../../lib/api';
import { RESTOCK_PACK_TYPES, RESTOCK_BULK_METRICS } from '../NewOrder/packagingTypes';
import { useI18n } from '../../../i18n';

interface OrderItemsEditorProps {
  items: any[];
  itemStateMap: Record<string, any>;
  setItemStateMap: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  editingNameMap: Record<string, boolean>;
  setEditingNameMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  editingExpectedMap: Record<string, boolean>;
  setEditingExpectedMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchTerm: string;
  handleSearch: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchResults: Product[];
  handleAddProduct: (product: Product) => void;
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
  handleRemoveItem: (itemId: string) => void;
}

export function OrderItemsEditor({
  items,
  itemStateMap,
  setItemStateMap,
  editingNameMap,
  setEditingNameMap,
  editingExpectedMap,
  setEditingExpectedMap,
  searchTerm,
  handleSearch,
  searchInputRef,
  searchResults,
  handleAddProduct,
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
  handleRemoveItem,
}: OrderItemsEditorProps) {
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
      {/* LEFT COLUMN: Search & Quick Add Controls (5 cols) */}
      <div className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
        {/* SEARCH PRODUCT FROM CATALOG */}
        <div className="relative">
          <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Search size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t.searchProduct || 'Adicionar do Catálogo'}</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t.searchProductPlaceholder || 'Nome ou passar código de barras...'}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Live Search dropdown results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1">
              {searchResults.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAddProduct(prod)}
                  className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 last:border-0 cursor-pointer rounded-lg text-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{prod.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{prod.barcode || 'Sem código'}</div>
                  </div>
                  <Plus size={14} className="text-indigo-600 dark:text-indigo-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MANUAL ENTRY WITH PACK/BULK/UNIT SELECTOR */}
        <div className="bg-slate-50/80 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              {t.addPackagingItem || 'Adicionar Item / Embalagem'}
            </span>
          </div>

          {/* Packaging mode toggle pills */}
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

          {/* Inputs row */}
          <div className="space-y-2">
            <div>
              <label className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                {t.productName || 'Nome do Produto'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t.productNamePlaceholder || "Ex: Cerveja 2M 330ml, Arroz 25kg..."}
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-zinc-200"
              />
            </div>

            {/* Conditional format details */}
            {directMode === 'unit' && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder={t.looseQtyPlaceholder || "Qtd. Unidades (Ex: 50)"}
                    value={directQty}
                    onChange={(e) => setDirectQty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDirect}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0"
                >
                  <Plus size={13} />
                  <span>{t.add || 'Adicionar'}</span>
                </button>
              </div>
            )}

            {directMode === 'pack' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.type || 'Tipo'}</label>
                    <select
                      value={directPackType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setDirectPackType(newType);
                        const defUnits = RESTOCK_PACK_TYPES.find(t => t.id === newType)?.defaultUnits || 24;
                        setDirectUnitsPerPack(String(defUnits));
                      }}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-slate-800 dark:text-zinc-200"
                    >
                      {RESTOCK_PACK_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.unitsPerPack || 'Un/Emb.'}</label>
                    <input
                      type="number"
                      min="1"
                      value={directUnitsPerPack}
                      onChange={(e) => setDirectUnitsPerPack(e.target.value)}
                      placeholder="24"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.packsQty || 'Qtd. Emb.'}</label>
                    <input
                      type="number"
                      min="1"
                      value={directTotalPacks}
                      onChange={(e) => setDirectTotalPacks(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-200"
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

            {directMode === 'bulk' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.metric || 'Métrica'}</label>
                    <select
                      value={directBulkMetric}
                      onChange={(e) => {
                        const newM = e.target.value as any;
                        setDirectBulkMetric(newM);
                        const defSize = RESTOCK_BULK_METRICS.find(m => m.id === newM)?.defaultPackage || 25;
                        setDirectBulkSize(String(defSize));
                      }}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-slate-800 dark:text-zinc-200"
                    >
                      {RESTOCK_BULK_METRICS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.packageSize || 'Tam.'} ({directBulkMetric})</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={directBulkSize}
                      onChange={(e) => setDirectBulkSize(e.target.value)}
                      placeholder="25"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t.sacksQty || 'Qtd. Sacos'}</label>
                    <input
                      type="number"
                      min="1"
                      value={directBulkPkgs}
                      onChange={(e) => setDirectBulkPkgs(e.target.value)}
                      placeholder="10"
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-200"
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

      {/* RIGHT COLUMN: Live Expected Items Table (7 cols, full height, internal scroll) */}
      <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-3 shadow-2xs overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
          <ExpectedItemsTable
            items={items}
            mode="edit"
            itemStateMap={itemStateMap}
            setItemStateMap={setItemStateMap}
            editingNameMap={editingNameMap}
            setEditingNameMap={setEditingNameMap}
            editingExpectedMap={editingExpectedMap}
            setEditingExpectedMap={setEditingExpectedMap}
            handleRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  );
}
