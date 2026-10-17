import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2, Loader2, Info, Package, Scale, Percent, Sliders, Tag, Sparkles, Check } from 'lucide-react';
import { useProductForm } from './hooks/useProductForm';
import { ProductTypeTabs } from './ProductForm/ProductTypeTabs';
import { BasicInfoSection } from './ProductForm/BasicInfoSection';
import { PricingStockSection } from './ProductForm/PricingStockSection';
import { PackPackagingSection } from './ProductForm/PackPackagingSection';
import { BulkMetricSection } from './ProductForm/BulkMetricSection';
import { PromoSection } from './ProductForm/PromoSection';
import { CustomAttributesSection } from './ProductForm/CustomAttributesSection';
import { ProductGuideModal } from './ProductGuideModal';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface ProductFormProps {
  editingProduct: Product | null;
  availableBarcodes: string[];
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({ editingProduct, availableBarcodes, onSave, onCancel }: ProductFormProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideInitialPage, setGuideInitialPage] = useState(2);
  const [rightSubTab, setRightSubTab] = useState<'config' | 'promo'>('config');

  const {
    productFormType,
    handleChangeProductType,
    barcode,
    name,
    setName,
    category,
    setCategory,
    priceMt,
    setPriceMt,
    costPriceMt,
    setCostPriceMt,
    stockQuantity,
    setStockQuantity,
    minStockAlert,
    setMinStockAlert,
    promoActive,
    setPromoActive,
    promoPriceMt,
    setPromoPriceMt,
    attributes,
    setAttributes,
    isFractional,
    setIsFractional,
    unitMetric,
    setUnitMetric,
    packageTotalQty,
    setPackageTotalQty,
    packageCostPrice,
    setPackageCostPrice,
    packagePrice,
    setPackagePrice,
    packType,
    setPackType,
    packUnitsCount,
    setPackUnitsCount,
    parentProductId,
    setParentProductId,
    parentProductName,
    setParentProductName,
    availableProducts,
    existingCategories,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    categoryDropdownRef,
    error,
    isSaving,
    autofillBarcode,
    handleBarcodeKeyDown,
    handleAutoCalculateUnitPrices,
    handleFormSubmit,
    expectedDeliveryInfo,
    isExpectedDelivery,
  } = useProductForm({ editingProduct, availableBarcodes, onSave });

  const totalSecondaryBadges = (promoActive ? 1 : 0) + attributes.length;

  return createPortal(
    <AnimatePresence>
      <div key="product-form-slide-over" className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Backdrop (Smooth Fade) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
        />

        {/* Slide-over Drawer Panel (Instant Open, No Slide Translation) */}
        <div
          className={`relative ${
            isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[580px] md:w-[680px] lg:w-[720px]'
          } bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full z-10 text-slate-900 dark:text-white transition-all overflow-hidden`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isExpectedDelivery
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              }`}>
                {isExpectedDelivery ? 'Recepção de Mercadoria' : (editingProduct ? 'Editar Registo' : 'Novo Registo')}
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                  {isExpectedDelivery 
                    ? `Dar Entrada: ${name || editingProduct?.name || 'Produto da Encomenda'}` 
                    : (editingProduct ? `Editar: ${editingProduct.name}` : 'Adicionar Novo Produto')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isExpectedDelivery
                    ? 'Conferência cega: escaneie o código de barras, confirme preço de venda e calcule o stock recebido.'
                    : 'Preencha os detalhes e parâmetros de stock do produto'}
                </p>
              </div>
            </div>

            {/* Action buttons (Info Guide, Fullscreen, Close) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setGuideInitialPage(2);
                  setIsGuideOpen(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Abrir Guia Informativo dos Tipos de Produto & Ações"
              >
                <Info size={15} />
                <span className="hidden sm:inline">Guia</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={isFullScreen ? "Restaurar Painel Lateral" : "Expandir Ecrã Inteiro"}
              >
                {isFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form Body - Stacked Mode by Default vs 2-Grid Mode in Expanded */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto text-slate-700 dark:text-zinc-300">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl text-xs font-bold mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} id="product-form-elem" className="space-y-4">
              {isExpectedDelivery ? (
                /* DOUBLE-EDGED SWORD: Blind Receiving & Commercial Secrecy Mode */
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Security & Commercial Secrecy Notice */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold">Recepção de Mercadoria às Cegas</p>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                        Digitalize o código de barras, valide o nome e categoria, confirme o preço de venda e calcule o total de unidades recebidas por caixas. O preço de custo é confidencial e o produto será automaticamente desbloqueado no catálogo do POS.
                      </p>
                    </div>
                  </div>

                  {/* 1. Basic Info (Barcode, Name, Category) */}
                  <div className="p-4 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
                    <h3 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={13} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Identificação do Produto</span>
                    </h3>
                    <BasicInfoSection 
                      barcode={barcode}
                      name={name}
                      setName={setName}
                      category={category}
                      setCategory={setCategory}
                      autofillBarcode={autofillBarcode}
                      handleBarcodeKeyDown={handleBarcodeKeyDown}
                      existingCategories={existingCategories}
                      isCategoryDropdownOpen={isCategoryDropdownOpen}
                      setIsCategoryDropdownOpen={setIsCategoryDropdownOpen}
                      categoryDropdownRef={categoryDropdownRef}
                    />
                  </div>

                  {/* 2. Pricing (PVP only - Cost Price Hidden!) & Visual Stock Entry */}
                  <div className="p-4 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
                    <h3 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Preço de Venda ao Balcão & Entrada de Stock</span>
                    </h3>
                    <PricingStockSection 
                      priceMt={priceMt}
                      setPriceMt={setPriceMt}
                      costPriceMt={costPriceMt}
                      setCostPriceMt={setCostPriceMt}
                      stockQuantity={stockQuantity}
                      setStockQuantity={setStockQuantity}
                      minStockAlert={minStockAlert}
                      setMinStockAlert={setMinStockAlert}
                      isFractional={false}
                      unitMetric={unitMetric}
                      packageTotalQty={packageTotalQty}
                      productFormType="unit"
                      expectedDeliveryInfo={expectedDeliveryInfo}
                      hideCostPrice={true}
                      productName={name || editingProduct?.name}
                    />
                  </div>
                </div>
              ) : (
                /* NORMAL MODE: Regular Product Creation & Configuration */
                <>
                  {/* Product Type Selector Tabs */}
                  <ProductTypeTabs 
                    activeType={productFormType}
                    onChangeType={(type) => {
                      handleChangeProductType(type);
                      // Keep sub-tab logical
                      if (type === 'unit') {
                        setRightSubTab('config');
                      }
                    }}
                  />

                  {/* Responsive Layout: Stacked (1-column) in Side Drawer, 2-column Grid in Expanded Fullscreen */}
                  <div className={`grid ${isFullScreen ? 'grid-cols-1 lg:grid-cols-2 gap-5' : 'grid-cols-1 gap-4'} items-start`}>
                {/* SECTION 1: Identificação & Preços / Stock Base */}
                <div className="space-y-3.5">
                  {/* Basic Info (Barcode, Name, Category) */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl shadow-2xs">
                    <BasicInfoSection 
                      barcode={barcode}
                      name={name}
                      setName={setName}
                      category={category}
                      setCategory={setCategory}
                      autofillBarcode={autofillBarcode}
                      handleBarcodeKeyDown={handleBarcodeKeyDown}
                      existingCategories={existingCategories}
                      isCategoryDropdownOpen={isCategoryDropdownOpen}
                      setIsCategoryDropdownOpen={setIsCategoryDropdownOpen}
                      categoryDropdownRef={categoryDropdownRef}
                    />
                  </div>

                  {/* Pricing & Stock Fields */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 rounded-2xl shadow-2xs">
                    <PricingStockSection 
                      priceMt={priceMt}
                      setPriceMt={setPriceMt}
                      costPriceMt={costPriceMt}
                      setCostPriceMt={setCostPriceMt}
                      stockQuantity={stockQuantity}
                      setStockQuantity={setStockQuantity}
                      minStockAlert={minStockAlert}
                      setMinStockAlert={setMinStockAlert}
                      isFractional={isFractional || productFormType === 'bulk'}
                      unitMetric={unitMetric}
                      packageTotalQty={packageTotalQty}
                      productFormType={productFormType}
                      packUnitsCount={packUnitsCount}
                      packType={packType}
                      parentProductId={parentProductId}
                      parentProductName={parentProductName}
                      expectedDeliveryInfo={expectedDeliveryInfo}
                      productName={name || editingProduct?.name}
                    />
                  </div>
                </div>

                {/* SECTION 2: Configuração Contextual / Sub-Tabs */}
                <div className="space-y-3">
                  {/* Sub-Tab Navigation Header */}
                  <div className="flex items-center p-1 bg-slate-100/90 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setRightSubTab('config')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        rightSubTab === 'config'
                          ? 'bg-white dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {productFormType === 'pack' ? (
                        <>
                          <Package size={14} />
                          <span>Embalagem & Cálculo</span>
                        </>
                      ) : productFormType === 'bulk' ? (
                        <>
                          <Scale size={14} />
                          <span>Granel & Métricas</span>
                        </>
                      ) : (
                        <>
                          <Tag size={14} />
                          <span>Promoções & Descontos</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRightSubTab('promo')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        rightSubTab === 'promo'
                          ? 'bg-white dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {productFormType === 'unit' ? (
                        <>
                          <Sliders size={14} />
                          <span>Atributos & Variações</span>
                          {attributes.length > 0 && (
                            <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black font-mono">
                              {attributes.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Percent size={14} />
                          <span>Promoções & Atributos</span>
                          {totalSecondaryBadges > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-black font-mono">
                              {totalSecondaryBadges}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sub-Tab 1: Configuração Contextual Principal */}
                  {rightSubTab === 'config' && (
                    <motion.div
                      key="tab-config"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      transition={{ duration: 0.12 }}
                      className="space-y-3"
                    >
                      {productFormType === 'pack' && (
                        <PackPackagingSection 
                          packType={packType}
                          setPackType={setPackType}
                          packUnitsCount={packUnitsCount}
                          setPackUnitsCount={setPackUnitsCount}
                          parentProductId={parentProductId}
                          setParentProductId={setParentProductId}
                          parentProductName={parentProductName}
                          setParentProductName={setParentProductName}
                          availableProducts={availableProducts}
                          priceMt={priceMt}
                          setPriceMt={setPriceMt}
                          costPriceMt={costPriceMt}
                          setCostPriceMt={setCostPriceMt}
                          name={name}
                          setName={setName}
                        />
                      )}

                      {productFormType === 'bulk' && (
                        <BulkMetricSection 
                          isFractional={isFractional}
                          setIsFractional={setIsFractional}
                          unitMetric={unitMetric}
                          setUnitMetric={setUnitMetric}
                          packageTotalQty={packageTotalQty}
                          setPackageTotalQty={setPackageTotalQty}
                          packageCostPrice={packageCostPrice}
                          setPackageCostPrice={setPackageCostPrice}
                          packagePrice={packagePrice}
                          setPackagePrice={setPackagePrice}
                          handleAutoCalculateUnitPrices={handleAutoCalculateUnitPrices}
                        />
                      )}

                      {productFormType === 'unit' && (
                        <div className="space-y-3">
                          <PromoSection 
                            promoActive={promoActive}
                            setPromoActive={setPromoActive}
                            promoPriceMt={promoPriceMt}
                            setPromoPriceMt={setPromoPriceMt}
                          />

                          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30 rounded-2xl text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-600 shrink-0" />
                            <span>
                              Para adicionar atributos extras (cor, tamanho, marca), alterne para a aba <strong>Atributos & Variações</strong> acima.
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Sub-Tab 2: Promoções & Atributos Extras */}
                  {rightSubTab === 'promo' && (
                    <motion.div
                      key="tab-promo"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      transition={{ duration: 0.12 }}
                      className="space-y-3"
                    >
                      {/* For Packs and Bulk, show Promo Section */}
                      {productFormType !== 'unit' && (
                        <PromoSection 
                          promoActive={promoActive}
                          setPromoActive={setPromoActive}
                          promoPriceMt={promoPriceMt}
                          setPromoPriceMt={setPromoPriceMt}
                        />
                      )}

                      {/* Unlimited Custom Attributes Section */}
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-zinc-950/40 p-3.5 shadow-2xs">
                        <CustomAttributesSection 
                          attributes={attributes}
                          setAttributes={setAttributes}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
          Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-mono text-[10px] text-slate-700 dark:text-zinc-300">Enter</kbd> para salvar
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form-elem"
            disabled={isSaving}
            className={`px-6 py-2.5 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border-0 flex items-center gap-1.5 active:scale-95 ${
              isExpectedDelivery
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isExpectedDelivery && !isSaving && <Check size={14} />}
            <span>
              {isSaving 
                ? 'A guardar...' 
                : isExpectedDelivery 
                ? 'Confirmar Entrada & Desbloquear' 
                : 'Salvar Registo'}
            </span>
          </button>
        </div>
          </div>
        </div>

        {/* Embedded Product Guide Modal */}
        <ProductGuideModal 
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          initialPage={guideInitialPage}
        />
      </div>
    </AnimatePresence>,
    document.body
  );
}
