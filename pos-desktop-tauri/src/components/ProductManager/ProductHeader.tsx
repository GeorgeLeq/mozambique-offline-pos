import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Layers, ClipboardList, Lock, Unlock, Plus, Download, Upload, FileText, FileDown, Package, Sparkles, Truck, Globe } from 'lucide-react';
import { useI18n, getLanguage, LanguageCode } from '../../i18n';
import { InternetStatusBadge } from '../InternetStatusBadge';
import { ProductUsageSummary } from './services/productLimitService';
import { DeliveryUsageSummary } from '../RestockManager/services/deliveryLimitService';

interface ProductHeaderProps {
  onBack: () => void;
  activeTab: 'checker' | 'inventory' | 'orders';
  setActiveTab: (tab: 'checker' | 'inventory' | 'orders') => void;
  setIsAdding: (val: boolean) => void;
  isAdminUnlocked?: boolean;
  onLockSession?: () => void;
  onPromptAdminPin?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onImportCSV?: () => void;
  onDownloadTemplate?: () => void;
  usage?: ProductUsageSummary | null;
  deliveryUsage?: DeliveryUsageSummary | null;
  onOpenUpgradeModal?: () => void;
  onOpenDeliveryUpgradeModal?: () => void;
}

export function ProductHeader({ 
  onBack, 
  activeTab, 
  setActiveTab, 
  setIsAdding,
  isAdminUnlocked = false,
  onLockSession,
  onPromptAdminPin,
  onExportPDF,
  onExportCSV,
  onImportCSV,
  onDownloadTemplate,
  usage,
  deliveryUsage,
  onOpenUpgradeModal,
  onOpenDeliveryUpgradeModal
}: ProductHeaderProps) {
  const [lang, setLang] = useState<LanguageCode>(getLanguage());
  const t = useI18n(lang);

  useEffect(() => {
    const handleLocaleChange = () => setLang(getLanguage());
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  const handleAddNewProductClick = () => {
    if (usage && usage.isAtLimit) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      }
      return;
    }
    setIsAdding(true);
  };

  const handleImportCSVClick = () => {
    if (usage && usage.isAtLimit) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      }
      return;
    }
    if (onImportCSV) onImportCSV();
  };

  return (
    <div className="relative z-10 px-4 py-2 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 flex items-center justify-between gap-4 shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          id="back-to-menu-btn"
          className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center justify-center shrink-0"
          title={t.backToMenu}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-zinc-800 pr-3 mr-1 shrink-0 hidden sm:flex">
          <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-zinc-50">
            {activeTab === 'checker' ? t.stockCheckerTitle : activeTab === 'inventory' ? t.catalogTitle : t.ordersTitle}
          </h1>
          
          <InternetStatusBadge />
        </div>
        
        {/* Apple Segmented Control for Tabs */}
        <div className="bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-white/10 flex gap-0.5 shadow-inner overflow-x-auto hide-scrollbar">
          <button
            onClick={() => { setActiveTab('checker'); setIsAdding(false); }}
            className={`px-3 py-1 rounded-md font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checker'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Eye size={12} />
            {t.stockCheckerTab}
          </button>
          <button
            onClick={() => { setActiveTab('inventory'); setIsAdding(false); }}
            className={`px-3 py-1 rounded-md font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers size={12} />
            {t.productListTab}
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setIsAdding(false); }}
            className={`px-3 py-1 rounded-md font-bold text-[11px] tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={12} />
            {t.ordersTab}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Product Catalog Quota / Capacity Badge (Visible in inventory tab) */}
        {activeTab === 'inventory' && usage && (
          <div className="hidden sm:flex items-center">
            {usage.isUnlimited ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <Package size={11} />
                {usage.current} Produtos (Ilimitado)
              </span>
            ) : usage.isAtLimit ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-extrabold transition-all cursor-pointer shadow-xs animate-pulse"
                title="Limite do catálogo atingido! Clique para desbloquear produtos ilimitados no Plano Pro"
              >
                <Lock size={11} />
                <span>{usage.current}/{usage.limit} Limite</span>
                <Sparkles size={11} className="text-amber-500" />
              </button>
            ) : usage.percentage >= 80 ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold transition-all cursor-pointer"
                title="Quase a atingir a capacidade máxima de produtos do Plano Grátis"
              >
                <Package size={11} />
                <span>{usage.current}/{usage.limit}</span>
                <span className="text-[9px] text-amber-500 font-extrabold uppercase">({usage.limit - usage.current} restam)</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 text-[10px] font-medium">
                <Package size={11} />
                <span>{usage.current}/{usage.limit}</span>
              </span>
            )}
          </div>
        )}

        {/* Expected Deliveries Quota / Capacity Badge (Visible in orders tab) */}
        {activeTab === 'orders' && deliveryUsage && (
          <div className="hidden sm:flex items-center">
            {deliveryUsage.isUnlimited ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                <Truck size={11} />
                {deliveryUsage.current} Encomendas (Ilimitado)
              </span>
            ) : deliveryUsage.isAtLimit ? (
              <button
                type="button"
                onClick={onOpenDeliveryUpgradeModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-extrabold transition-all cursor-pointer shadow-xs animate-pulse"
                title="Limite de encomendas atingido! Clique para desbloquear encomendas ilimitadas no Plano Pro"
              >
                <Lock size={11} />
                <span>{deliveryUsage.current}/{deliveryUsage.limit} Limite</span>
                <Sparkles size={11} className="text-amber-500" />
              </button>
            ) : deliveryUsage.percentage >= 80 ? (
              <button
                type="button"
                onClick={onOpenDeliveryUpgradeModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold transition-all cursor-pointer"
                title="Quase a atingir a capacidade máxima de encomendas do Plano Grátis"
              >
                <Truck size={11} />
                <span>{deliveryUsage.current}/{deliveryUsage.limit}</span>
                <span className="text-[9px] text-amber-500 font-extrabold uppercase">({deliveryUsage.limit - deliveryUsage.current} restam)</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 text-[10px] font-medium">
                <Truck size={11} />
                <span>{deliveryUsage.current}/{deliveryUsage.limit}</span>
              </span>
            )}
          </div>
        )}

        {/* Action Buttons (Only visible in Orders tab) */}
        {activeTab === 'orders' && (
          <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('export-expected-pdf'))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              title={t.exportPDF || "Exportar PDF"}
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('export-expected-csv'))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              title={t.exportCSV || "Exportar CSV"}
            >
              <Download size={14} />
            </button>
            {isAdminUnlocked && (
              <>
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('download-expected-template'))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                  title={t.downloadTemplate || "Modelo CSV"}
                >
                  <FileDown size={14} />
                </button>
                <button
                  onClick={() => {
                    if (deliveryUsage?.isAtLimit && onOpenDeliveryUpgradeModal) {
                      onOpenDeliveryUpgradeModal();
                    } else {
                      document.dispatchEvent(new CustomEvent('import-expected-csv'));
                    }
                  }}
                  className={`p-1.5 rounded-md transition-colors ${
                    deliveryUsage?.isAtLimit 
                      ? 'text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer'
                  }`}
                  title={t.importCSV || "Importar CSV"}
                >
                  <Upload size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Admin Lock/Unlock Pill */}
        {isAdminUnlocked ? (
          <button
            onClick={onLockSession}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-500/20"
            title={t.unlockedSession || "Sessão Desbloqueada"}
          >
            <Unlock size={12} />
            Admin
          </button>
        ) : (
          <button
            onClick={onPromptAdminPin}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 border border-amber-200/50 dark:border-amber-500/20"
            title={t.lockSession || "Sessão Bloqueada"}
          >
            <Lock size={12} />
            Operador
          </button>
        )}

        {/* Action Buttons (Only visible in Inventory tab) */}
        {activeTab === 'inventory' && (
          <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200 dark:border-zinc-800">
            <button
              onClick={onExportPDF}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title={t.exportPDF || "Exportar PDF"}
            >
              <FileText size={14} />
            </button>
            <button
              onClick={onExportCSV}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title={t.exportCSV || "Exportar CSV"}
            >
              <Download size={14} />
            </button>

            {isAdminUnlocked && (
              <>
                <button
                  onClick={onDownloadTemplate}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title={t.downloadTemplate || "Modelo CSV"}
                >
                  <FileDown size={14} />
                </button>
                <button
                  onClick={handleImportCSVClick}
                  className={`p-1.5 rounded-md transition-colors ${
                    usage?.isAtLimit 
                      ? 'text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                  title={t.importCSV || "Importar CSV"}
                >
                  <Upload size={14} />
                </button>
                <button
                  onClick={handleAddNewProductClick}
                  className={`${
                    usage?.isAtLimit
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ml-1 shadow-sm`}
                >
                  {usage?.isAtLimit ? <Lock size={13} /> : <Plus size={13} />}
                  {t.newProduct || 'Novo Produto'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

