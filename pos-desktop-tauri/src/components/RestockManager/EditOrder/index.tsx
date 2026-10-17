import React from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useEditOrder } from './useEditOrder';
import { OrderMetadataForm } from './OrderMetadataForm';
import { OrderItemsEditor } from './OrderItemsEditor';
import { EditFooter } from './EditFooter';
import { useI18n } from '../../../i18n';

interface EditPurchaseOrderModalProps {
  deliveryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPurchaseOrderModal({ deliveryId, onClose, onSuccess }: EditPurchaseOrderModalProps) {
  const t = useI18n();
  const {
    supplierName,
    setSupplierName,
    expectedDate,
    setExpectedDate,
    status,
    setStatus,
    items,
    itemStateMap,
    setItemStateMap,
    editingNameMap,
    setEditingNameMap,
    editingExpectedMap,
    setEditingExpectedMap,
    isLoading,
    isSaving,
    isFullScreen,
    setIsFullScreen,
    searchTerm,
    searchResults,
    searchInputRef,
    handleSearch,
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
    handleSave,
  } = useEditOrder(deliveryId, onClose, onSuccess);

  return createPortal(
    <div key="edit-order-modal" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop (instant, no slide animation) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs"
      />

      {/* Right Drawer Shell - Full height, right-aligned, zero outer scrolling, instant opening */}
      <div 
        className={`absolute top-0 right-0 bottom-0 ${
          isFullScreen 
            ? 'w-full max-w-full rounded-none' 
            : 'w-full max-w-6xl md:rounded-l-3xl'
        } h-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 text-slate-900 dark:text-white overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
              {t.editOrderTitle || 'Editar Encomenda'}
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-50 truncate max-w-md">
              {t.editOrderSubtitle || 'Gestão de PO, Produtos & Formatos'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              title={isFullScreen ? (t.collapseFullscreen || "Restaurar janela") : (t.expandFullscreen || "Ecrã inteiro")}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body - Fixed layout: Top Metadata Strip + Side-by-Side Workspace */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-48 gap-2 font-bold text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>{t.loadingData || 'A carregar dados da encomenda...'}</span>
          </div>
        ) : (
          <form onSubmit={handleSave} id="edit-po-form" className="flex-1 min-h-0 flex flex-col p-3.5 sm:p-4 gap-3.5 overflow-hidden text-slate-700 dark:text-zinc-300">
            {/* 1. TOP METADATA STRIP */}
            <div className="shrink-0 bg-slate-50/90 dark:bg-zinc-950/60 p-3 sm:p-3.5 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
              <OrderMetadataForm 
                supplierName={supplierName}
                setSupplierName={setSupplierName}
                expectedDate={expectedDate}
                setExpectedDate={setExpectedDate}
                status={status}
                setStatus={setStatus}
              />
            </div>

            {/* 2. SPLIT WORKSPACE: LEFT (Search & Add) + RIGHT (Live Table) */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <OrderItemsEditor 
                items={items}
                itemStateMap={itemStateMap}
                setItemStateMap={setItemStateMap}
                editingNameMap={editingNameMap}
                setEditingNameMap={setEditingNameMap}
                editingExpectedMap={editingExpectedMap}
                setEditingExpectedMap={setEditingExpectedMap}
                searchTerm={searchTerm}
                handleSearch={handleSearch}
                searchInputRef={searchInputRef}
                searchResults={searchResults}
                handleAddProduct={handleAddProduct}
                directName={directName}
                setDirectName={setDirectName}
                directQty={directQty}
                setDirectQty={setDirectQty}
                directMode={directMode}
                setDirectMode={setDirectMode}
                directPackType={directPackType}
                setDirectPackType={setDirectPackType}
                directUnitsPerPack={directUnitsPerPack}
                setDirectUnitsPerPack={setDirectUnitsPerPack}
                directTotalPacks={directTotalPacks}
                setDirectTotalPacks={setDirectTotalPacks}
                directBulkMetric={directBulkMetric}
                setDirectBulkMetric={setDirectBulkMetric}
                directBulkSize={directBulkSize}
                setDirectBulkSize={setDirectBulkSize}
                directBulkPkgs={directBulkPkgs}
                setDirectBulkPkgs={setDirectBulkPkgs}
                handleAddDirect={handleAddDirect}
                handleRemoveItem={handleRemoveItem}
              />
            </div>
          </form>
        )}

        <EditFooter onClose={onClose} isSaving={isSaving} />
      </div>
    </div>,
    document.body
  );
}

