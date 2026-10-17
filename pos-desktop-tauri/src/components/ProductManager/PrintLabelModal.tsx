import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Plus, Minus, Eye, Type, Coins, Grid3X3, Barcode as BarcodeIcon } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { useProductsI18n } from '../../i18n';
// @ts-ignore
import Barcode from 'react-barcode';

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export function PrintLabelModal({ isOpen, onClose, products }: PrintLabelModalProps) {
  const t = useProductsI18n();
  const [quantity, setQuantity] = useState(1);
  
  // Customization States
  const [columns, setColumns] = useState(4);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [fontSize, setFontSize] = useState(12);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load saved preferences from localStorage
      setColumns(parseInt(localStorage.getItem('barcode_print_columns') || '4', 10));
      setShowName(localStorage.getItem('barcode_print_show_name') !== 'false');
      setShowPrice(localStorage.getItem('barcode_print_show_price') !== 'false');
      setBarcodeFormat(localStorage.getItem('barcode_print_format') || 'CODE128');
      setFontSize(parseInt(localStorage.getItem('barcode_print_font_size') || '12', 10));
      setQuantity(1); // Reset quantity
    }
  }, [isOpen]);

  const savePreference = async (key: string, value: string) => {
    localStorage.setItem(key, value);
    try {
      const db = await getDB();
      const existing = await db.select('SELECT key FROM settings WHERE key = ?', [key]);
      if (existing.length > 0) {
        await db.execute('UPDATE settings SET value = ?, sync_status = 0 WHERE key = ?', [value, key]);
      } else {
        await db.execute('INSERT INTO settings (key, value, sync_status) VALUES (?, ?, 0)', [key, value]);
      }
    } catch (err) {
      console.warn(`Failed to persist preference ${key}:`, err);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Quick reload to restore React state cleanly
    }
  };

  const increaseQuantity = () => setQuantity(q => Math.min(q + 1, 120));
  const decreaseQuantity = () => setQuantity(q => Math.max(q - 1, 1));

  const handleColumnsChange = (cols: number) => {
    setColumns(cols);
    savePreference('barcode_print_columns', cols.toString());
  };

  const handleNameToggle = (val: boolean) => {
    setShowName(val);
    savePreference('barcode_print_show_name', val.toString());
  };

  const handlePriceToggle = (val: boolean) => {
    setShowPrice(val);
    savePreference('barcode_print_show_price', val.toString());
  };

  const handleFormatChange = (fmt: string) => {
    setBarcodeFormat(fmt);
    savePreference('barcode_print_format', fmt);
  };

  const handleFontSizeChange = (sz: number) => {
    setFontSize(sz);
    savePreference('barcode_print_font_size', sz.toString());
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && products.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay without blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[92vh] z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-50">
                  {t.printLabelStudioTitle}
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  {t.printLabelSubtitle}{' '}
                  <span className="font-bold text-slate-600 dark:text-zinc-300">
                    {products.length === 1 ? products[0].name : t.printSelectedProducts.replace('{0}', products.length.toString())}
                  </span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Sidebar Customizer Controls */}
              <div className="p-5 bg-slate-50 dark:bg-zinc-950 border-r border-slate-100 dark:border-white/5 shrink-0 lg:w-80 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
                
                {/* Labels Quantity */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t.labelsQuantity}
                  </label>
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <button
                      onClick={decreaseQuantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-base text-slate-900 dark:text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Layout Columns */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Grid3X3 size={12} /> {t.gridColumns}
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                    {[2, 3, 4, 5].map((colsCount) => (
                      <button
                        key={colsCount}
                        type="button"
                        onClick={() => handleColumnsChange(colsCount)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          columns === colsCount
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {colsCount} {t.colsCount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barcode Standards Format */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BarcodeIcon size={12} /> {t.barcodeStandard}
                  </label>
                  <select
                    value={barcodeFormat}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  >
                    <option value="CODE128">CODE128 ({t.standardLabel})</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="CODE39">CODE39</option>
                    <option value="ITF14">ITF-14</option>
                  </select>
                </div>

                {/* Font Size controls */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Type size={12} /> {t.nameSize}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-xs font-bold">{fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Show/Hide Toggles */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye size={12} /> {t.visibleElements}
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-850 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.productName}</span>
                    <input
                      type="checkbox"
                      checked={showName}
                      onChange={(e) => handleNameToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-850 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.priceTag}</span>
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => handlePriceToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700"
                    />
                  </label>
                </div>

                {/* Action Button */}
                <div className="mt-auto pt-3 border-t border-slate-200/50 dark:border-zinc-800/50">
                  <button
                    onClick={handlePrint}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    <Printer size={16} />
                    {t.printLabelAction.replace('{0}', (quantity * products.length).toString())}
                  </button>
                </div>
              </div>

              {/* Print Preview Canvas Area */}
              <div className="flex-1 p-5 overflow-y-auto bg-slate-100 dark:bg-zinc-950/40 flex flex-col items-center">
                <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-center">
                  {t.a4SheetPreview}
                </div>
                
                {/* Interactive Virtual Label Page */}
                <div className="bg-white p-6 shadow-xl rounded-2xl border border-slate-200 overflow-x-auto w-full max-w-[210mm] min-h-[297mm]">
                  <div ref={printRef} className="print-label-page" style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: '5mm',
                    background: '#fff',
                  }}>
                    {products.flatMap(p => Array.from({ length: quantity }).map((_, i) => (
                      <div 
                        key={`${p.id}-${i}`} 
                        className="border border-slate-200 p-3 flex flex-col items-center justify-center bg-white rounded-lg text-black"
                        style={{ 
                          breakInside: 'avoid', 
                          width: '100%',
                          minHeight: '38mm',
                          boxSizing: 'border-box',
                          padding: '3mm'
                        }}
                      >
                        {showName && (
                          <div 
                            className="text-center font-bold truncate w-full text-black"
                            style={{ fontSize: `${fontSize}px`, lineHeight: '1.2', marginBottom: '2px' }}
                          >
                            {p.name}
                          </div>
                        )}
                        
                        <div className="scale-90 origin-center my-1 flex justify-center">
                          <Barcode 
                            value={p.barcode} 
                            format={barcodeFormat}
                            width={1.2}
                            height={35}
                            fontSize={9}
                            margin={0}
                            displayValue={true}
                          />
                        </div>

                        {showPrice && (
                          <div 
                            className="font-extrabold text-black mt-1"
                            style={{ fontSize: `${fontSize + 1}px` }}
                          >
                            {formatCurrency(p.price_mt)}
                          </div>
                        )}
                      </div>
                    )))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
