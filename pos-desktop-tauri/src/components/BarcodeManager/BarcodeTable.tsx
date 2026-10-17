import React from 'react';
import { Barcode, Eye, Download, Bookmark, Edit2, Trash2, CheckSquare, Square, Tag, Store, DollarSign, Activity, SlidersHorizontal, Calendar, Search, X } from 'lucide-react';
import { BarcodeRecord } from './types';
import { downloadPNG } from './utils';
import { useI18n } from '../../i18n';

interface BarcodeTableProps {
  isLoading: boolean;
  filteredBarcodes: BarcodeRecord[];
  paginatedBarcodes: BarcodeRecord[];
  selectedBarcodes: Set<string>;
  highlightedBarcode: string | null;
  setHighlightedBarcode: (barcode: string | null) => void;
  toggleSelectAll: () => void;
  toggleSelection: (barcode: string) => void;
  setSelectedBarcodeForDetails: (b: BarcodeRecord) => void;
  handleSaveBarcode: (barcode: string) => void;
  setEditingBarcode: (b: BarcodeRecord) => void;
  setEditShopName: (val: string) => void;
  setEditItemName: (val: string) => void;
  setEditPrice: (val: string) => void;
  setEditAttributes: (val: string) => void;
  handleDeleteBarcode: (barcode: string) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  filter: 'all' | 'available' | 'used';
  setFilter: (filter: 'all' | 'available' | 'used') => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  totalBarcodesCount: number;
  availableBarcodesCount: number;
  usedBarcodesCount: number;
  handleBulkDownload: () => void;
  handleBulkDelete: () => void;
}

export function BarcodeTable({
  isLoading,
  filteredBarcodes,
  paginatedBarcodes,
  selectedBarcodes,
  highlightedBarcode,
  setHighlightedBarcode,
  toggleSelectAll,
  toggleSelection,
  setSelectedBarcodeForDetails,
  handleSaveBarcode,
  setEditingBarcode,
  setEditShopName,
  setEditItemName,
  setEditPrice,
  setEditAttributes,
  handleDeleteBarcode,
  currentPage,
  pageSize,
  totalPages,
  setCurrentPage,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  totalBarcodesCount,
  availableBarcodesCount,
  usedBarcodesCount,
  handleBulkDownload,
  handleBulkDelete
}: BarcodeTableProps) {
  const t = useI18n();

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Integrated Unified Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex bg-slate-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.allBarcodes}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {totalBarcodesCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'available'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.availableBarcodes}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {availableBarcodesCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('used')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'used'
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.usedBarcodes}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {usedBarcodesCount}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchBarcodesPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                title={t.cancel}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Bulk actions and selection controls */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedBarcodes.size > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 px-2.5 py-1 rounded-xl shadow-2xs">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                {selectedBarcodes.size} {t.selectedCount}
              </span>
              <button
                onClick={handleBulkDownload}
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer"
                title={t.downloadPNGs}
              >
                <Download size={14} className="stroke-[2.5]" />
              </button>
              <button
                onClick={handleBulkDelete}
                className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                title={t.deleteSelected}
              >
                <Trash2 size={14} className="stroke-[2.5]" />
              </button>
            </div>
          )}

          <button
            onClick={toggleSelectAll}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            {selectedBarcodes.size === filteredBarcodes.length && filteredBarcodes.length > 0 ? t.deselectAll : t.selectAll}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400 dark:text-zinc-500">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs font-bold">{t.generating}</p>
          </div>
        ) : filteredBarcodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5">
              <Barcode size={32} className="text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.noBarcodesFound}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.noBarcodesHint}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title={t.selectAll}
                  >
                    {selectedBarcodes.size === filteredBarcodes.length && filteredBarcodes.length > 0 ? (
                      <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <Barcode size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{t.tableBarcode}</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t.tableProductItem}</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>{t.tableShop}</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-purple-600 dark:text-purple-400" />
                    <span>{t.tablePrice} (MT)</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-600 dark:text-cyan-400" />
                    <span>{t.tableStatus}</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>{t.createdDate || 'Criado em'}</span>
                  </div>
                </th>
                <th className="py-3.5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <SlidersHorizontal size={14} className="text-slate-400 dark:text-zinc-400" />
                    <span>{t.tableActions}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-zinc-300">
              {paginatedBarcodes.map(b => {
                const isSelected = selectedBarcodes.has(b.barcode);
                const isHighlighted = highlightedBarcode === b.barcode;
                const isSaved = b.expires_at.startsWith('2099');
                return (
                  <tr 
                    key={b.barcode}
                    onClick={() => setHighlightedBarcode(isHighlighted ? null : b.barcode)}
                    className={`transition-all cursor-pointer ${
                      isHighlighted 
                        ? 'bg-indigo-100/90 dark:bg-indigo-950/70 border-l-4 border-indigo-500 shadow-md' 
                        : isSelected 
                        ? 'bg-indigo-50/40 dark:bg-indigo-500/10' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleSelection(b.barcode)}
                        className="cursor-pointer text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={isSelected ? t.deselectAll : t.selectAll}
                      >
                        {isSelected ? <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-zinc-100">
                      {b.barcode}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span>{b.item_name || '—'}</span>
                        {b.linked_product_id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-bold border border-indigo-500/20 shrink-0">
                            {t.linkedToProduct}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-zinc-400">
                      {b.shop_name || '—'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-zinc-100">
                      {b.price_mt ? `${b.price_mt} MT` : '—'}
                    </td>
                    <td className="py-3.5 px-6">
                      {isSaved ? (
                        <span className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-500/20">
                          {t.permanent}
                        </span>
                      ) : b.status === 'available' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                          {t.statusAvailable}
                        </span>
                      ) : b.status === 'used' ? (
                        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                          {t.statusUsed}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      <span>
                        {new Date(b.created_at).toLocaleString('pt-MZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBarcodeForDetails(b)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-800 shadow-2xs"
                          title={t.viewDetails}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => downloadPNG(b.barcode, b)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-800 shadow-2xs"
                          title={t.downloadPNG}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingBarcode(b);
                            setEditShopName(b.shop_name || '');
                            setEditItemName(b.item_name || '');
                            setEditPrice(b.price_mt?.toString() || '');
                            setEditAttributes(b.attributes || '');
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-800 shadow-2xs"
                          title={t.editData}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBarcode(b.barcode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-slate-200/60 dark:border-zinc-800 shadow-2xs"
                          title={t.deleteBarcode}
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
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredBarcodes.length > 0 && (
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div>
            {t.pageOf} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, filteredBarcodes.length)}</span> {t.ofTotal} <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredBarcodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-2xs text-slate-700 dark:text-zinc-300"
            >
              {t.previous}
            </button>
            <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-2xs text-slate-700 dark:text-zinc-300"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


