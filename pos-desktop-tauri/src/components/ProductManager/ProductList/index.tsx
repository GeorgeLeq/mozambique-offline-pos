import React from 'react';
import { Product } from '../../../lib/api';
import { CheckSquare, Edit3, Printer, FileText, Trash2 } from 'lucide-react';
import { useProductList } from '../hooks/useProductList';
import { getDB } from '../../../lib/db';
import toast from 'react-hot-toast';
import { ProductToolbar } from './ProductToolbar';
import { ProductTable } from './ProductTable';
import { ProductAliasesModal } from '../ProductAliasesModal';
import { PrintLabelModal } from '../PrintLabelModal';
import { BulkEditModal } from '../BulkEditModal';
import { ProductDetailsModal } from '../ProductDetailsModal';
import { DeleteConfirmModal } from '../../RestockManager/DeleteConfirmModal';
import { ProductGuideModal } from '../ProductGuideModal';
import { generateEAN13 } from '../../BarcodeManager/utils';
import { useProductsI18n, useCommonI18n } from '../../../i18n';

interface ProductListProps {
  products: Product[];
  isAdding: boolean;
  onOpenBreakdown: (product: Product) => void;
  onStartEdit: (product: Product) => void;
  onDeleteSuccess: () => void;
  readOnly?: boolean;
  isAdminUnlocked?: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  activeTab?: 'checker' | 'inventory' | 'orders';
  onSelectTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
}

export const ProductList = React.memo(function ProductList({ 
  products, 
  isAdding, 
  onOpenBreakdown, 
  onStartEdit, 
  onDeleteSuccess, 
  readOnly = false,
  isAdminUnlocked = false,
  onPromptAdminPin,
  isLoading = false,
  onRefresh,
  isFocusMode = false,
  onToggleFocusMode,
  activeTab = 'inventory',
  onSelectTab
}: ProductListProps) {
  const t = useProductsI18n();
  const commonT = useCommonI18n();

  const [highlightedProductIds, setHighlightedProductIds] = React.useState<Set<string>>(new Set());
  const [inlineEditingProductId, setInlineEditingProductId] = React.useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);

  const toggleHighlightProduct = (id: string) => {
    setHighlightedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveInlineName = async (product: Product, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error(t.nameRequired);
      return;
    }
    try {
      const db = await getDB();
      await db.execute('UPDATE products SET name = ?, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?', [trimmed, product.id]);
      try {
        const { syncProductsToCloud } = await import('../../../lib/syncEngine/products');
        await syncProductsToCloud();
      } catch (e) {
        console.warn('Sync failed:', e);
      }
      toast.success(t.productUpdatedSuccess);
      setInlineEditingProductId(null);
      onDeleteSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t.errorUpdatingProduct);
    }
  };

  const handleGenerateBarcodeForProduct = async (product: Product) => {
    try {
      const db = await getDB();
      let newBarcode = generateEAN13();
      let attempts = 0;
      while (attempts < 25) {
        const existingProd = await db.select('SELECT id FROM products WHERE barcode = ?', [newBarcode]) as any[];
        const existingBc = await db.select('SELECT barcode FROM barcodes WHERE barcode = ?', [newBarcode]) as any[];
        if ((!existingProd || existingProd.length === 0) && (!existingBc || existingBc.length === 0)) {
          break;
        }
        newBarcode = generateEAN13();
        attempts++;
      }

      // 1. Update products table
      await db.execute(
        'UPDATE products SET barcode = ?, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?',
        [newBarcode, product.id]
      );

      // 2. Insert into barcodes table
      const shopName = localStorage.getItem('receipt_header_title') || '';
      await db.execute(
        `INSERT INTO barcodes (barcode, status, expires_at, shop_name, item_name, price_mt, attributes, linked_product_id)
         VALUES (?, 'used', '2099-12-31T23:59:59.000Z', ?, ?, ?, ?, ?)`,
        [newBarcode, shopName || null, product.name, product.price_mt, product.attributes || null, product.id]
      );

      // 3. Trigger cloud sync
      try {
        const { syncProductsToCloud } = await import('../../../lib/syncEngine/products');
        await syncProductsToCloud();
      } catch (e) {
        console.warn('Product sync failed:', e);
      }

      toast.success(`${t.barcodeGenerated}: ${newBarcode} (${product.name})`);
      onDeleteSuccess();
    } catch (err) {
      console.error('Failed to generate product barcode:', err);
      toast.error(t.errorUpdatingProduct);
    }
  };

  const {
    searchTerm,
    setSearchTerm,
    showLowStockOnly,
    setShowLowStockOnly,
    showLockedOnly,
    setShowLockedOnly,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    selectedProductIds,
    setSelectedProductIds,
    isBulkEditModalOpen,
    setIsBulkEditModalOpen,
    quickStockId,
    setQuickStockId,
    quickStockValue,
    setQuickStockValue,
    quickStockInputRef,
    globalLowStockThreshold,
    aliasModalProduct,
    setAliasModalProduct,
    printModalProducts,
    setPrintModalProducts,
    infoModalProduct,
    setInfoModalProduct,
    categories,
    filteredProducts,
    paginatedProducts,
    currentPage,
    setCurrentPage,
    totalPages,
    handleDelete,
    productToDelete,
    setProductToDelete,
    confirmDeleteProduct,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    submitQuickStock,
    toggleSelectAll,
    toggleSelectProduct,
    exportSelectedPDF,
    exportSelectedCSV,
    deleteSelectedProducts,
    confirmBulkDeleteProducts
  } = useProductList({ products, onDeleteSuccess, isFocusMode });

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Handle physical laptop keypad / numpad inputs and barcode scanning
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      // Helper to identify numpad / digit keys
      let keyChar: string | null = null;
      if (e.key >= '0' && e.key <= '9') {
        keyChar = e.key;
      } else if (e.code >= 'Numpad0' && e.code <= 'Numpad9') {
        keyChar = e.code.replace('Numpad', '');
      } else if (e.key === '.' || e.code === 'NumpadDecimal') {
        keyChar = '.';
      } else if (e.key === '-' || e.code === 'NumpadSubtract') {
        keyChar = '-';
      }

      const isEnter = e.key === 'Enter' || e.code === 'NumpadEnter';
      const isEscape = e.key === 'Escape';
      const isBackspace = e.key === 'Backspace' || e.key === 'Delete';

      // Case A: Quick stock inline input is active
      if (quickStockId) {
        const targetProduct = paginatedProducts.find(p => p.id === quickStockId);
        if (!targetProduct) return;

        if (isEscape) {
          e.preventDefault();
          setQuickStockId(null);
          return;
        }

        if (isEnter) {
          e.preventDefault();
          submitQuickStock(targetProduct);
          return;
        }

        if (activeEl !== quickStockInputRef.current) {
          if (keyChar !== null) {
            e.preventDefault();
            setQuickStockValue(prev => prev + keyChar);
            quickStockInputRef.current?.focus();
          } else if (isBackspace) {
            e.preventDefault();
            setQuickStockValue(prev => prev.slice(0, -1));
          }
        }
        return;
      }

      // Case B: No modal / inline input active -> focus search input when typing on physical keypad
      if (!isInputActive && keyChar !== null) {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickStockId, quickStockValue, paginatedProducts, submitQuickStock]);

  return (
    <>
      <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden ${
        isFocusMode
          ? 'h-full w-full rounded-none border-0'
          : `h-full ${isAdding ? 'hidden md:flex border-r border-slate-200/60 dark:border-white/10' : 'flex'}`
      }`}>
      
      {/* Top Filter Bar */}
      <ProductToolbar 
        productsCount={products.length}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showLowStockOnly={showLowStockOnly}
        setShowLowStockOnly={setShowLowStockOnly}
        showLockedOnly={showLockedOnly}
        setShowLockedOnly={setShowLockedOnly}
        categories={categories}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        isLoading={isLoading}
        onRefresh={onRefresh}
        onOpenGuide={() => setIsGuideOpen(true)}
        searchInputRef={searchInputRef}
        isFocusMode={isFocusMode}
        onToggleFocusMode={onToggleFocusMode}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />

      {/* Bulk Action Bar (when items selected) */}
      {!readOnly && selectedProductIds.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/30 px-6 py-2.5 flex items-center justify-between text-xs animate-fadeIn shrink-0">
          <button
            onClick={() => setSelectedProductIds(new Set())}
            className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 px-2 py-1 -ml-2 rounded-lg transition-all cursor-pointer"
            title={t.unselectAll}
          >
            <CheckSquare size={16} />
            <span>{selectedProductIds.size} {t.bulkSelected}</span>
            <span className="text-[10px] opacity-60 font-normal underline ml-1">({t.unselectAll})</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={13} /> {t.bulkEdit}
            </button>
            <button
              onClick={() => setPrintModalProducts(products.filter(p => selectedProductIds.has(p.id)))}
              className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={13} /> {t.bulkLabels}
            </button>
            <button
              onClick={exportSelectedPDF}
              className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText size={13} /> PDF
            </button>
            <button
              onClick={deleteSelectedProducts}
              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} /> {t.bulkDelete}
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ProductTable 
          products={products}
          paginatedProducts={paginatedProducts}
          isLoading={isLoading}
          readOnly={readOnly}
          isAdminUnlocked={isAdminUnlocked}
          selectedProductIds={selectedProductIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelectProduct={toggleSelectProduct}
          highlightedProductIds={highlightedProductIds}
          toggleHighlightProduct={toggleHighlightProduct}
          inlineEditingProductId={inlineEditingProductId}
          setInlineEditingProductId={setInlineEditingProductId}
          handleSaveInlineName={handleSaveInlineName}
          quickStockId={quickStockId}
          setQuickStockId={setQuickStockId}
          quickStockValue={quickStockValue}
          setQuickStockValue={setQuickStockValue}
          quickStockInputRef={quickStockInputRef}
          submitQuickStock={submitQuickStock}
          globalLowStockThreshold={globalLowStockThreshold}
          onPromptAdminPin={onPromptAdminPin}
          setInfoModalProduct={setInfoModalProduct}
          setAliasModalProduct={setAliasModalProduct}
          setPrintModalProducts={setPrintModalProducts}
          onOpenBreakdown={onOpenBreakdown}
          onStartEdit={onStartEdit}
          handleDelete={handleDelete}
          onGenerateBarcode={handleGenerateBarcodeForProduct}
        />
      </div>

      {/* Pagination Footer */}
      {(totalPages > 1 || products.length > 0) && (
        <div className="px-6 py-3 border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            {t.showingPage} <strong className="text-slate-900 dark:text-zinc-100">{currentPage}</strong> {t.of} {totalPages} ({filteredProducts.length} {t.products})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold"
            >
              {t.previous}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductAliasesModal 
        isOpen={!!aliasModalProduct} 
        onClose={() => setAliasModalProduct(null)} 
        product={aliasModalProduct} 
      />

      <ProductGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <ProductDetailsModal
        isOpen={!!infoModalProduct}
        onClose={() => setInfoModalProduct(null)}
        product={infoModalProduct}
        isAdminUnlocked={isAdminUnlocked}
        onPromptAdminPin={onPromptAdminPin}
      />

      <PrintLabelModal 
        isOpen={printModalProducts.length > 0} 
        onClose={() => setPrintModalProducts([])} 
        products={printModalProducts} 
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        products={products.filter(p => selectedProductIds.has(p.id))}
        onSuccess={() => {
          setSelectedProductIds(new Set());
          onDeleteSuccess();
        }}
      />

      {productToDelete && (
        <DeleteConfirmModal
          title={t.deleteConfirmTitle}
          message={t.deleteConfirmMsg.replace('{name}', productToDelete.name)}
          onConfirm={(justification) => confirmDeleteProduct(justification)}
          onClose={() => setProductToDelete(null)}
          justificationPlaceholder={t.justificationPlaceholder}
        />
      )}

      {isBulkDeleteConfirmOpen && (
        <DeleteConfirmModal
          title={t.bulkDeleteConfirmTitle}
          message={t.bulkDeleteConfirmMsg.replace('{count}', String(selectedProductIds.size))}
          onConfirm={(justification) => confirmBulkDeleteProducts(justification)}
          onClose={() => setIsBulkDeleteConfirmOpen(false)}
          justificationPlaceholder={t.justificationPlaceholder}
        />
      )}
      </div>
    </>
  );
});
