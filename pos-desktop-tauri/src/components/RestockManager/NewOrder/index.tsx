import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNewOrder } from './useNewOrder';
import { NewOrderHeader } from './NewOrderHeader';
import { NewOrderMetadata } from './NewOrderMetadata';
import { NewOrderItems } from './NewOrderItems';
import { NewOrderFooter } from './NewOrderFooter';

interface NewPurchaseOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPurchaseOrderModal({ onClose, onSuccess }: NewPurchaseOrderModalProps) {
  const { currentUser } = useAuth();
  const {
    supplier,
    setSupplier,
    invoiceNumber,
    setInvoiceNumber,
    expectedDate,
    setExpectedDate,
    globalRequiresVerification,
    setGlobalRequiresVerification,
    isSaving,
    searchTerm,
    searchResults,
    items,
    setItems,
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
    updateItemPackaging,
    isFullScreen,
    setIsFullScreen,
    searchInputRef,
    fileInputRef,
    handleSearch,
    handleAddProduct,
    handleAddDirect,
    handleDownloadTemplate,
    handleFileUpload,
    handleSave,
  } = useNewOrder(currentUser, onClose, onSuccess);

  return createPortal(
    <div key="new-order-modal" className="fixed inset-0 z-50 overflow-hidden">
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
        <NewOrderHeader 
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          onClose={onClose}
        />

        {/* Modal Body - Fixed layout: Top Metadata Strip + Side-by-Side Workspace */}
        <form onSubmit={handleSave} id="po-form-elem" className="flex-1 min-h-0 flex flex-col p-3.5 sm:p-4 gap-3.5 overflow-hidden text-slate-700 dark:text-zinc-300">
          {/* 1. TOP METADATA STRIP */}
          <div className="shrink-0 bg-slate-50/90 dark:bg-zinc-950/60 p-3 sm:p-3.5 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
            <NewOrderMetadata 
              supplier={supplier}
              setSupplier={setSupplier}
              invoiceNumber={invoiceNumber}
              setInvoiceNumber={setInvoiceNumber}
              expectedDate={expectedDate}
              setExpectedDate={setExpectedDate}
              globalRequiresVerification={globalRequiresVerification}
              setGlobalRequiresVerification={setGlobalRequiresVerification}
            />
          </div>

          {/* 2. SPLIT WORKSPACE: LEFT (Search & Add) + RIGHT (Live Table) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <NewOrderItems 
              searchTerm={searchTerm}
              handleSearch={handleSearch}
              searchInputRef={searchInputRef}
              searchResults={searchResults}
              handleAddProduct={handleAddProduct}
              handleDownloadTemplate={handleDownloadTemplate}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
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
              updateItemPackaging={updateItemPackaging}
              items={items}
              setItems={setItems}
              globalRequiresVerification={globalRequiresVerification}
            />
          </div>
        </form>

        <NewOrderFooter onClose={onClose} isSaving={isSaving} />
      </div>
    </div>,
    document.body
  );
}

