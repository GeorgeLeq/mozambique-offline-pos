import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Check, X, Maximize2, Minimize2, Barcode } from 'lucide-react';
import { BarcodeUsageSummary } from './services/barcodeLimitService';
import { useI18n } from '../../i18n';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  generateCount: string;
  setGenerateCount: (count: string) => void;
  shopName: string;
  setShopName: (val: string) => void;
  itemName: string;
  setItemName: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  attributes: string;
  setAttributes: (val: string) => void;
  products: any[];
  linkedProductId: string;
  setLinkedProductId: (val: string) => void;
  encodeVariablePrice: boolean;
  setEncodeVariablePrice: (val: boolean) => void;
  usage?: BarcodeUsageSummary | null;
}

export function GenerateModal({
  isOpen,
  onClose,
  onGenerate,
  generateCount,
  setGenerateCount,
  shopName,
  setShopName,
  itemName,
  setItemName,
  price,
  setPrice,
  attributes,
  setAttributes,
  products,
  linkedProductId,
  setLinkedProductId,
  encodeVariablePrice,
  setEncodeVariablePrice,
  usage,
}: GenerateModalProps) {
  const t = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 50);
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(term) || 
      p.barcode?.toLowerCase().includes(term)
    ).slice(0, 50);
  }, [products, searchTerm]);

  const handleProductSelect = (pId: string) => {
    setLinkedProductId(pId);
    if (pId) {
      const p = products.find(prod => prod.id === pId);
      if (p) {
        setItemName(p.name);
        setPrice(p.price_mt.toString());
      }
    }
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const selectedProduct = products.find(p => p.id === linkedProductId);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative ${isFullScreen ? 'w-full max-w-full' : 'w-full sm:w-[585px] md:w-[680px] lg:w-[780px]'} bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-full z-10`}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                {t.generateModalBadge}
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-50">
                {t.generateModalTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-zinc-300">
            <div className="space-y-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t.linkToProductLabel}
                </label>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:border-indigo-500/50"
                >
                  <span className={`truncate font-medium ${selectedProduct ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {selectedProduct ? `${selectedProduct.name} - ${selectedProduct.price_mt} MT` : t.standaloneLabel}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={t.searchProductsPlaceholder}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border-none rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto hide-scrollbar p-1">
                        <div 
                          onClick={() => handleProductSelect('')}
                          className={`px-3 py-2.5 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${!linkedProductId ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                        >
                          <span>{t.standaloneLabel}</span>
                          {!linkedProductId && <Check size={16} />}
                        </div>
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-zinc-500">
                            {t.noProductsFound}
                          </div>
                        ) : (
                          filteredProducts.map(p => (
                            <div
                              key={p.id}
                              onClick={() => handleProductSelect(p.id)}
                              className={`px-3 py-2.5 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${linkedProductId === p.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                            >
                              <div className="flex flex-col truncate">
                                <span className="truncate">{p.name}</span>
                                <span className="text-xs text-slate-400 dark:text-zinc-500">{p.barcode || t.noCode} • {p.price_mt} MT</span>
                              </div>
                              {linkedProductId === p.id && <Check size={16} className="shrink-0 ml-2" />}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t.quantityToGenerate}
                  </label>
                  {usage && !usage.isUnlimited && (
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                      {t.availableQuota} <strong className={usage.remaining <= 5 ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}>{usage.remaining}</strong> / {usage.limit}
                    </span>
                  )}
                  {usage && usage.isUnlimited && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {t.unlimitedProBadge}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="ex. 10"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t.shopNameOptional}
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.shopNamePlaceholder}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t.itemNameOptional}
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.itemNamePlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.attributesOptional}
                  </label>
                  <input
                    type="text"
                    value={attributes}
                    onChange={(e) => setAttributes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.attributesPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.priceOptional}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="0.00"
                    step="0.01"
                  />
                  {price && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={encodeVariablePrice}
                        onChange={(e) => setEncodeVariablePrice(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-600 dark:text-zinc-400">
                        {t.encodePriceCheckbox}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={onGenerate}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              <Barcode size={14} />
              <span>{t.generateButton}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
