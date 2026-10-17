import React, { useRef } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, Maximize2, Minimize2, Info, Eye, Layers, ClipboardList } from 'lucide-react';
import { useI18n, useProductsI18n } from '../../../i18n';
import { OvershadowSearchPill } from '../../common/OvershadowSearchPill';

interface ProductToolbarProps {
  productsCount: number;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (show: boolean) => void;
  showLockedOnly?: boolean;
  setShowLockedOnly?: (show: boolean) => void;
  categories: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: 'name' | 'stockDesc' | 'stockAsc' | 'priceDesc' | 'priceAsc') => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenGuide?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  activeTab?: 'checker' | 'inventory' | 'orders';
  onSelectTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
}

export function ProductToolbar({
  productsCount,
  selectedCategory,
  setSelectedCategory,
  showLowStockOnly,
  setShowLowStockOnly,
  showLockedOnly = false,
  setShowLockedOnly,
  categories,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  isLoading,
  onRefresh,
  onOpenGuide,
  searchInputRef,
  isFocusMode = false,
  onToggleFocusMode,
  activeTab = 'inventory',
  onSelectTab
}: ProductToolbarProps) {
  const t = useProductsI18n();
  const legacyT = useI18n();

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0 relative ${
      isFocusMode
        ? 'px-4 py-2 w-full flex-row'
        : 'px-6 py-4 flex-col md:flex-row gap-4'
    }`}>
      {/* In Focus/Expansion mode: inline tab switcher for instant navigation */}
      {isFocusMode && onSelectTab && (
        <div className="bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 flex gap-0.5 shadow-inner shrink-0">
          <button
            onClick={() => onSelectTab('checker')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checker'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Eye size={12} />
            {t.stockCheckerTab || 'Consulta Rápida'}
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers size={12} />
            {t.productListTab || 'Inventário'}
          </button>
          <button
            onClick={() => onSelectTab('orders')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={12} />
            {t.ordersTab || 'Encomendas'}
          </button>
        </div>
      )}

      {/* Status / Category Pills with Arrow Navigation */}
      <div className={`relative flex items-center gap-1.5 overflow-hidden ${
        isFocusMode ? 'flex-1 max-w-xl' : 'w-full md:w-auto'
      }`}>
        <button
          onClick={() => scrollCategories('left')}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 shrink-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          title={t.previous || "Ver categorias anteriores"}
        >
          <ChevronLeft size={14} />
        </button>

        <div 
          ref={categoryScrollRef}
          className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-0.5 hide-scrollbar scroll-smooth"
        >
          <button
            onClick={() => { setSelectedCategory('All'); setShowLowStockOnly(false); setShowLockedOnly?.(false); }}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              selectedCategory === 'All' && !showLowStockOnly && !showLockedOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            {t.allCategories} ({productsCount})
          </button>
          
          <button
            onClick={() => {
              setShowLowStockOnly(!showLowStockOnly);
              if (!showLowStockOnly) setShowLockedOnly?.(false);
            }}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              showLowStockOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showLowStockOnly ? 'bg-white' : 'bg-rose-500'}`} />
            {t.lowStockOnly}
          </button>

          {setShowLockedOnly && (
            <button
              onClick={() => {
                setShowLockedOnly(!showLockedOnly);
                if (!showLockedOnly) setShowLowStockOnly(false);
              }}
              className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
              } ${
                showLockedOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span>🔒</span>
              <span>{t.lockedOnly}</span>
            </button>
          )}

          {categories.filter(c => c !== 'All').map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
              } ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollCategories('right')}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-950 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          title={t.next || "Ver mais categorias"}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className={`flex items-center gap-2 justify-end shrink-0 ${
        isFocusMode ? 'w-auto' : 'w-full md:w-auto'
      }`}>
        {/* Overshadowing Search Pill */}
        <OvershadowSearchPill
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.searchPlaceholder || legacyT.searchProductPlaceholder}
          isFocusMode={isFocusMode}
          resultsCount={productsCount}
        />

        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/10 rounded-xl text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
              isFocusMode ? 'p-1.5' : 'p-2'
            }`}
            title={t.refresh || legacyT.refreshList || "Atualizar"}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-indigo-600" : ""} />
          </button>
        )}

          {/* Info Guide button right next to Refresh */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className={`bg-slate-100/80 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-white/10 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                isFocusMode ? 'p-1.5' : 'p-2'
              }`}
              title={t.guide}
            >
              <Info size={14} />
            </button>
          )}

          {/* Foco Toggle Button placed next to the search box */}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isFocusMode ? 'p-1.5' : 'p-2'
              } ${
                isFocusMode
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                  : 'bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-400'
              }`}
              title={isFocusMode ? "Sair do Modo Foco" : t.focusMode}
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>

        {/* Category Dropdown (hide on focus mode to keep it extremely streamlined) */}
        {!isFocusMode && (
          <div className="relative shrink-0 hidden sm:block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="All">{t.allCategories}</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className={`appearance-none bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer ${
              isFocusMode ? 'px-2 py-1 pr-6' : 'px-3.5 py-2 pr-8'
            }`}
          >
            <option value="name">{t.sortName || legacyT.nameAsc}</option>
            <option value="stockDesc">{t.sortStockDesc || legacyT.stockDesc}</option>
            <option value="stockAsc">{t.sortStockAsc || legacyT.stockAsc}</option>
            <option value="priceDesc">{t.sortPriceDesc || legacyT.priceDesc}</option>
            <option value="priceAsc">{t.sortPriceAsc || legacyT.priceAsc}</option>
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
        </div>
      </div>
    );
  }
