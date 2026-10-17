import React, { useRef } from 'react';
import { 
  History, 
  Trash2, 
  Search, 
  Clock, 
  FileSpreadsheet, 
  Printer, 
  HelpCircle, 
  Lock,
  Layers,
  PackageCheck,
  Tag,
  Sliders,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Truck,
  Eye,
  ClipboardList,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { RestockTabType, RestockLog, DeletedProductItem } from '../types';
import { HistoryCategoryFilter } from '../hooks/useRestockHistory';
import { exportHistoryCSV, exportHistoryPDF } from '../../utils/historyExport';
import { OvershadowSearchPill } from '../../../common/OvershadowSearchPill';
import { useI18n } from '../../../../i18n';

interface RestockHistoryHeaderProps {
  activeTab: RestockTabType;
  setActiveTab: (tab: RestockTabType) => void;
  orderSubTab?: 'pending' | 'history';
  onSelectOrderSubTab?: (tab: 'pending' | 'history') => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  activeMainTab?: 'checker' | 'inventory' | 'orders';
  onSelectMainTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
  logsCount: number;
  trashCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  trashSearchTerm: string;
  setTrashSearchTerm: (term: string) => void;
  categoryFilter: HistoryCategoryFilter;
  setCategoryFilter: (filter: HistoryCategoryFilter) => void;
  retentionDays: number;
  onSetRetentionDays: (days: number) => void;
  onOpenGuide: () => void;
  isAccessAllowed: boolean;
  onPromptAdminPin?: (onSuccess: () => void, scope: 'products' | 'orders' | 'history') => void;
  filteredLogs: RestockLog[];
  filteredTrash: DeletedProductItem[];
}

export function RestockHistoryHeader({
  activeTab,
  setActiveTab,
  logsCount,
  trashCount,
  searchTerm,
  setSearchTerm,
  trashSearchTerm,
  setTrashSearchTerm,
  categoryFilter,
  setCategoryFilter,
  retentionDays,
  onSetRetentionDays,
  onOpenGuide,
  isAccessAllowed,
  onPromptAdminPin,
  filteredLogs,
  filteredTrash,
  orderSubTab = 'history',
  onSelectOrderSubTab,
  isFocusMode = false,
  onToggleFocusMode,
  activeMainTab = 'orders',
  onSelectMainTab
}: RestockHistoryHeaderProps) {
  const t = useI18n();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategory = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === 'left' ? -180 : 180,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`flex flex-col shrink-0 ${
      isFocusMode ? 'bg-white dark:bg-zinc-950 border-b border-slate-200/60 dark:border-white/10' : 'gap-3'
    }`}>
      
      {/* Top Main Toolbar */}
      <div className={`flex items-center justify-between gap-3 shrink-0 relative ${
        isFocusMode 
          ? 'px-4 py-2 w-full flex-row' 
          : 'flex-col lg:flex-row p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-white/10 shadow-xs'
      }`}>
        
        {/* Left: Navigation and SubTabs */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* If in Focus/Expansion Mode: show main app tabs navigation */}
          {isFocusMode && onSelectMainTab && (
            <div className="bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 flex gap-0.5 shadow-inner shrink-0">
              <button
                onClick={() => onSelectMainTab('checker')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMainTab === 'checker'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Eye size={12} />
                <span>{t.priceChecker || 'Consulta Rápida'}</span>
              </button>
              <button
                onClick={() => onSelectMainTab('inventory')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMainTab === 'inventory'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Layers size={12} />
                <span>{t.inventory || 'Inventário'}</span>
              </button>
              <button
                onClick={() => onSelectMainTab('orders')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMainTab === 'orders'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <ClipboardList size={12} />
                <span>{t.orders || 'Encomendas'}</span>
              </button>
            </div>
          )}

          {/* SubTab Switcher: In Historic Tab view in Expansion Mode, ONLY show the 'Encomendas Planeadas' pill */}
          {onSelectOrderSubTab && (
            isFocusMode ? (
              <button
                onClick={() => onSelectOrderSubTab('pending')}
                className="px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs active:scale-95 shrink-0"
                title={t.expectedDeliveriesTitle || "Ir para Encomendas Planeadas"}
              >
                <Truck size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t.expectedDeliveriesTitle || 'Encomendas Planeadas'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner">
                <button
                  onClick={() => onSelectOrderSubTab('pending')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer border-0 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                  title={t.expectedDeliveriesTitle || "Ir para Encomendas Planeadas"}
                >
                  <Truck size={13} />
                  <span>{t.expectedDeliveriesTitle || 'Encomendas Planeadas'}</span>
                </button>
                <button
                  onClick={() => onSelectOrderSubTab('history')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer border-0 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                >
                  <History size={13} />
                  <span>{t.history || 'Histórico'}</span>
                </button>
              </div>
            )
          )}

          {/* Main Tab Switcher: Histórico vs Lixeira */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <History size={13} />
              <span>{t.restockHistoryTab || 'Histórico'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black font-mono">
                {logsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('trash')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                activeTab === 'trash'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Trash2 size={13} />
              <span>{t.trashBinTab || 'Lixeira'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black font-mono">
                {trashCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Overshadowing Search Pill + Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          {/* Overshadowing Search Pill */}
          <OvershadowSearchPill
            value={activeTab === 'history' ? searchTerm : trashSearchTerm}
            onChange={(val) => activeTab === 'history' ? setSearchTerm(val) : setTrashSearchTerm(val)}
            placeholder={activeTab === 'history' ? (t.searchHistoryPlaceholder || "Pesquisar no histórico...") : (t.searchTrashPlaceholder || "Pesquisar produtos na lixeira...")}
            isFocusMode={Boolean(isFocusMode)}
            resultsCount={activeTab === 'history' ? filteredLogs.length : filteredTrash.length}
          />
          
          {/* Retention Policy Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200/50 dark:border-zinc-800">
            <Clock size={13} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase hidden sm:inline">{t.autoCleanRetention || 'Retenção'}:</span>
            <select
              value={retentionDays}
              onChange={(e) => onSetRetentionDays(parseInt(e.target.value, 10))}
              className="bg-transparent text-[11px] font-black text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value={30} className="dark:bg-zinc-900">30 {t.days || 'Dias'}</option>
              <option value={60} className="dark:bg-zinc-900">60 {t.days || 'Dias'}</option>
              <option value={90} className="dark:bg-zinc-900">90 {t.days || 'Dias'}</option>
              <option value={-1} className="dark:bg-zinc-900">Nunca (Sem Expiração)</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() => exportHistoryCSV(activeTab, filteredLogs, filteredTrash, retentionDays)}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title={t.exportCSV || "Exportar dados para folha de cálculo CSV"}
          >
            <FileSpreadsheet size={13} className="text-emerald-500" />
            <span className="hidden md:inline text-xs">CSV</span>
          </button>

          {/* Export PDF / Print Button */}
          <button
            onClick={() => exportHistoryPDF(activeTab, filteredLogs, filteredTrash, retentionDays)}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title={t.exportPDF || "Gerar relatório impresso / PDF de backup"}
          >
            <Printer size={13} className="text-indigo-500" />
            <span className="hidden md:inline text-xs">PDF</span>
          </button>

          {/* Info Guide Modal Trigger Button */}
          <button
            onClick={onOpenGuide}
            className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/60 hover:bg-slate-50 dark:hover:bg-zinc-750 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all cursor-pointer shadow-2xs"
            title={t.historyGuide || "Abrir Guia do Histórico & Lixeira"}
          >
            <HelpCircle size={15} />
          </button>

          {/* Focus Mode Toggle */}
          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 p-1.5 ${
                isFocusMode
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                  : 'bg-slate-100/80 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-400'
              }`}
              title={isFocusMode ? (t.exitFocusMode || "Sair do Modo Expansão") : (t.enterFocusMode || "Ativar Modo Expansão")}
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Unlock with PIN button if locked */}
          {!isAccessAllowed && onPromptAdminPin && (
            <button
              onClick={() => onPromptAdminPin(() => {}, 'history')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-0"
            >
              <Lock size={13} />
              <span>{t.unlockAdmin || 'Desbloquear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Carousel Pills Bar (Visible when in 'history' tab) */}
      {activeTab === 'history' && (
        <div className="flex items-center gap-1 bg-white/60 dark:bg-zinc-900/60 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
          <button
            onClick={() => scrollCategory('left')}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
            title="Deslizar categorias à esquerda"
          >
            <ChevronLeft size={15} />
          </button>

          <div ref={categoryScrollRef} className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers size={13} />
              <span>{t.allEntries || 'Todos os Registos'} ({logsCount})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('restock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                categoryFilter === 'restock'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <PackageCheck size={13} />
              <span>{t.expectedDeliveriesTitle || 'Acolhimento & Encomendas'}</span>
            </button>

            <button
              onClick={() => setCategoryFilter('products')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                categoryFilter === 'products'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Tag size={13} />
              <span>{t.productsCategory || 'Produtos, Códigos & Preços'}</span>
            </button>

            <button
              onClick={() => setCategoryFilter('stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                categoryFilter === 'stock'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Sliders size={13} />
              <span>{t.stockAdjustment || 'Ajustes Rápidos de Stock'}</span>
            </button>
          </div>

          <button
            onClick={() => scrollCategory('right')}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
            title="Deslizar categorias à direita"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

    </div>
  );
}
