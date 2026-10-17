import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2, Printer, Download, Bookmark, Tag, Store, DollarSign, Calendar } from 'lucide-react';
import { BarcodeRecord } from './types';
import { downloadPNG, printBarcodeSheet } from './utils';
import JsBarcode from 'jsbarcode';
import { useI18n } from '../../i18n';

interface DetailsModalProps {
  barcodeRecord: BarcodeRecord | null;
  onClose: () => void;
  onSave: (barcode: string) => void;
  onEdit: (barcode: BarcodeRecord) => void;
}

export function DetailsModal({
  barcodeRecord,
  onClose,
  onSave,
  onEdit
}: DetailsModalProps) {
  const t = useI18n();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (barcodeRecord) {
      try {
        JsBarcode(`#modal-barcode-svg-${barcodeRecord.barcode}`, barcodeRecord.barcode, {
          format: "EAN13",
          width: 2.2,
          height: 80,
          displayValue: true,
          font: "monospace",
          fontSize: 14,
          margin: 10
        });
      } catch (e) {
        console.error("Failed to render barcode svg:", e);
      }
    }
  }, [barcodeRecord]);

  if (!barcodeRecord) return null;

  const isSaved = barcodeRecord.expires_at.startsWith('2099');

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
                {t.detailsModalBadge}
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-zinc-50 font-mono">
                {barcodeRecord.barcode}
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
            {/* Barcode Visual Preview Box */}
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center">
              {barcodeRecord.shop_name && (
                <div className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                  {barcodeRecord.shop_name}
                </div>
              )}
              {barcodeRecord.item_name && (
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1 text-center">
                  {barcodeRecord.item_name} {barcodeRecord.attributes ? `(${barcodeRecord.attributes})` : ''}
                </div>
              )}
              {barcodeRecord.price_mt && (
                <div className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-4 font-mono">
                  {barcodeRecord.price_mt} MT
                </div>
              )}
              
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                <svg id={`modal-barcode-svg-${barcodeRecord.barcode}`} className="max-w-full h-auto"></svg>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Store size={14} />
                  <span>{t.detailsShop}</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {barcodeRecord.shop_name || '—'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Tag size={14} />
                  <span>{t.detailsProduct}</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                  {barcodeRecord.item_name || '—'} {barcodeRecord.attributes ? `[${barcodeRecord.attributes}]` : ''}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <DollarSign size={14} />
                  <span>{t.detailsPrice}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 font-mono">
                  {barcodeRecord.price_mt ? `${barcodeRecord.price_mt} MT` : '—'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Calendar size={14} />
                  <span>{t.detailsStatusValidity}</span>
                </div>
                <div className="flex items-center gap-2">
                  {barcodeRecord.status === 'available' ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {t.statusAvailable}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {t.statusUsed}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {t.permanent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPNG(barcodeRecord.barcode, barcodeRecord)}
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Download size={14} />
                <span>{t.downloadPNG}</span>
              </button>
              <button
                onClick={() => printBarcodeSheet([barcodeRecord])}
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer size={14} />
                <span>{t.print}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(barcodeRecord);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{t.editDetails}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
