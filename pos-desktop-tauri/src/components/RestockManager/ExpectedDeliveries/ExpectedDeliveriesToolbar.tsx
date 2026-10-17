import React, { useRef, useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus, Lock, Layers, Info, Eye, ClipboardList, Truck, Sparkles, History, FileText, Download, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n, getLanguage, LanguageCode } from '../../../i18n';
import { DeliveryUsageSummary } from '../services/deliveryLimitService';
import { OvershadowSearchPill } from '../../common/OvershadowSearchPill';

interface ExpectedDeliveriesToolbarProps {
  deliveriesCount: number;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  statusCounts: {
    all: number;
    pending: number;
    received: number;
    discrepancy: number;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  groupBySupplier: boolean;
  setGroupBySupplier: (val: boolean) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenGuide?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isAuthorized: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
  onNewOrder: () => void;
  activeTab?: 'checker' | 'inventory' | 'orders';
  onSelectTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
  orderSubTab?: 'pending' | 'history';
  onSelectOrderSubTab?: (tab: 'pending' | 'history') => void;
  deliveryUsage?: DeliveryUsageSummary | null;
  onOpenDeliveryUpgradeModal?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onImportCSV?: () => void;
  onDownloadTemplate?: () => void;
}

export function ExpectedDeliveriesToolbar({
  deliveriesCount,
  statusFilter,
  setStatusFilter,
  statusCounts,
  searchTerm,
  setSearchTerm,
  groupBySupplier,
  setGroupBySupplier,
  isLoading,
  onRefresh,
  onOpenGuide,
  searchInputRef,
  isFocusMode = false,
  onToggleFocusMode,
  isAuthorized,
  onPromptAdminPin,
  onNewOrder,
  activeTab = 'orders',
  onSelectTab,
  orderSubTab = 'pending',
  onSelectOrderSubTab,
  deliveryUsage,
  onOpenDeliveryUpgradeModal,
  onExportPDF,
  onExportCSV,
  onImportCSV,
  onDownloadTemplate
}: ExpectedDeliveriesToolbarProps) {
  const [lang, setLang] = useState<LanguageCode>(getLanguage());
  const t = useI18n(lang);

  useEffect(() => {
    const handleLocaleChange = () => setLang(getLanguage());
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  const filterScrollRef = useRef<HTMLDivElement>(null);

  const scrollFilters = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      filterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNewOrderClick = () => {
    if (deliveryUsage && deliveryUsage.isAtLimit) {
      if (onOpenDeliveryUpgradeModal) {
        onOpenDeliveryUpgradeModal();
      } else {
        toast.error(t.limitReached || 'Limite de encomendas atingido!');
      }
      return;
    }

    if (isAuthorized) {
      onNewOrder();
    } else if (onPromptAdminPin) {
      onPromptAdminPin(onNewOrder);
    } else {
      toast.error(t.adminRestricted || 'Acesso restrito ao administrador');
    }
  };

  const handleImportCSVClick = () => {
    if (deliveryUsage && deliveryUsage.isAtLimit) {
      if (onOpenDeliveryUpgradeModal) {
        onOpenDeliveryUpgradeModal();
      } else {
        toast.error(t.limitReached || 'Limite de encomendas atingido!');
      }
      return;
    }

    if (isAuthorized) {
      if (onImportCSV) onImportCSV();
    } else if (onPromptAdminPin) {
      if (onImportCSV) onPromptAdminPin(onImportCSV);
    } else {
      toast.error(t.adminRestricted || 'Acesso restrito ao administrador');
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

      {/* Sub-Tab Selector: In Encomendas view, only show the "Histórico" pill */}
      {onSelectOrderSubTab && (
        <button
          onClick={() => onSelectOrderSubTab('history')}
          className="px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs active:scale-95 shrink-0"
          title={t.history || "Ver Histórico de Receções & Lixeira"}
        >
          <History size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.history || 'Histórico'}</span>
        </button>
      )}

      {/* Status Filter Pills with Scroll Navigation (Matches ProductList category bar) */}
      <div className={`relative flex items-center gap-1.5 overflow-hidden ${
        isFocusMode ? 'flex-1 max-w-xl' : 'w-full md:w-auto'
      }`}>
        <button
          onClick={() => scrollFilters('left')}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 shrink-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          title={t.viewPreviousFilters || "Ver filtros anteriores"}
        >
          <ChevronLeft size={14} />
        </button>

        <div 
          ref={filterScrollRef}
          className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-0.5 hide-scrollbar scroll-smooth"
        >
          {/* All Statuses */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            {t.allCount || 'Todas'} ({statusCounts.all})
          </button>

          {/* Pending Status */}
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'pending' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>{t.pendingCount || 'Pendentes'} ({statusCounts.pending})</span>
          </button>

          {/* Received Status */}
          <button
            onClick={() => setStatusFilter('received')}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              statusFilter === 'received'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'received' ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>{t.receivedCount || 'Recebidas'} ({statusCounts.received})</span>
          </button>

          {/* Discrepancy Status */}
          <button
            onClick={() => setStatusFilter('discrepancy')}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              statusFilter === 'discrepancy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'discrepancy' ? 'bg-white' : 'bg-rose-500'}`} />
            <span>{t.discrepancyCount || 'Divergências'} ({statusCounts.discrepancy})</span>
          </button>

          {/* Group by supplier button */}
          <button
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            className={`rounded-full font-bold tracking-wide transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-xs'
            } ${
              groupBySupplier
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers size={13} />
            <span>{t.groupBySupplier || 'Agrupar Fornecedor'}</span>
          </button>
        </div>

        <button
          onClick={() => scrollFilters('right')}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 shrink-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          title={t.viewMoreFilters || "Ver mais filtros"}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Right Action & Search Area */}
      <div className={`flex items-center gap-2 ${
        isFocusMode ? 'shrink-0' : 'w-full md:w-auto justify-end'
      }`}>
        {/* Overshadowing Search Pill */}
        <OvershadowSearchPill
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.searchDeliveriesPlaceholder || "Pesquisar PO, fornecedor ou produto..."}
          isFocusMode={isFocusMode}
          resultsCount={deliveriesCount}
        />

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
              isFocusMode ? 'p-1.5' : 'p-2'
            }`}
            title={t.reloadDeliveries || "Recarregar Encomendas"}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-indigo-600" : ""} />
          </button>
        )}

        {/* Info Guide button */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className={`rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-500 hover:text-indigo-600 dark:text-zinc-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isFocusMode ? 'p-1.5' : 'p-2'
            }`}
            title={t.guideConsistency || "Guia & Instruções de Consistência"}
          >
            <Info size={14} />
          </button>
        )}

        {/* Quota badge in focus mode */}
        {isFocusMode && deliveryUsage && (
          <div className="hidden sm:flex items-center">
            {deliveryUsage.isUnlimited ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <Truck size={10} />
                {deliveryUsage.current} (Ilimitado)
              </span>
            ) : deliveryUsage.isAtLimit ? (
              <button
                type="button"
                onClick={onOpenDeliveryUpgradeModal}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-extrabold transition-all cursor-pointer shadow-xs animate-pulse"
                title="Limite de encomendas atingido! Clique para desbloquear encomendas ilimitadas no Plano Pro"
              >
                <Lock size={10} />
                <span>{deliveryUsage.current}/{deliveryUsage.limit}</span>
                <Sparkles size={10} className="text-amber-500" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 text-[10px] font-medium">
                <Truck size={10} />
                <span>{deliveryUsage.current}/{deliveryUsage.limit}</span>
              </span>
            )}
          </div>
        )}

        {/* New Order Button */}
        {deliveryUsage?.isAtLimit ? (
          <button
            onClick={handleNewOrderClick}
            className={`bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer border-0 shrink-0 animate-pulse ${
              isFocusMode ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'
            }`}
            title="Limite de encomendas atingido! Desbloqueie encomendas ilimitadas no Plano Pro"
          >
            <Lock size={12} />
            <span>Limite Atingido</span>
          </button>
        ) : (
          <button
            onClick={handleNewOrderClick}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer border-0 shrink-0 ${
              isFocusMode ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'
            }`}
            title="Criar Nova Encomenda"
          >
            <Lock size={12} className={isAuthorized ? "hidden" : ""} />
            <Plus size={14} className={isAuthorized ? "" : "hidden"} />
            <span>{t.newDeliveryOrder || 'Nova Encomenda'}</span>
          </button>
        )}

        {/* Toggle Focus Mode Button */}
        {onToggleFocusMode && (
          <button
            onClick={onToggleFocusMode}
            className={`rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
              isFocusMode ? 'p-1.5' : 'p-2'
            }`}
            title={isFocusMode ? (t.exitFocusMode || "Sair do modo foco") : (t.enterFocusMode || "Modo foco / ecrã inteiro")}
          >
            {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
