import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2, Save } from 'lucide-react';
import { BarcodeRecord } from './types';
import { useI18n } from '../../i18n';

interface EditModalProps {
  editingBarcode: BarcodeRecord | null;
  onClose: () => void;
  onSave: () => void;
  editShopName: string;
  setEditShopName: (val: string) => void;
  editItemName: string;
  setEditItemName: (val: string) => void;
  editPrice: string;
  setEditPrice: (val: string) => void;
  editAttributes: string;
  setEditAttributes: (val: string) => void;
}

export function EditModal({
  editingBarcode,
  onClose,
  onSave,
  editShopName,
  setEditShopName,
  editItemName,
  setEditItemName,
  editPrice,
  setEditPrice,
  editAttributes,
  setEditAttributes
}: EditModalProps) {
  const t = useI18n();
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!editingBarcode) return null;

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
                {editingBarcode.barcode}
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-50">
                {t.editModalTitle}
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
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t.editShopNameLabel}
                </label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.shopNamePlaceholder}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t.editItemNameLabel}
                </label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.itemNamePlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.editAttributesLabel}
                  </label>
                  <input
                    type="text"
                    value={editAttributes}
                    onChange={(e) => setEditAttributes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.attributesPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t.editPriceLabel}
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="0.00"
                    step="0.01"
                  />
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
              onClick={onSave}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{t.saveChanges}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
