import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Package, 
  Eye, 
  TrendingUp, 
  Barcode, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Tags, 
  Printer, 
  Boxes,
  Scale
} from 'lucide-react';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface ProductGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export function ProductGuideModal({ isOpen, onClose, initialPage = 1 }: ProductGuideModalProps) {
  const t = useProductsI18n();
  const tCommon = useCommonI18n();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalPages = 3;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage);
      const isHidden = localStorage.getItem('hide_product_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen, initialPage]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_product_guide', 'true');
    } else {
      localStorage.removeItem('hide_product_guide');
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Zero-Scroll Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Package size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {t.guideModalTitle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                    {t.guidePageXofY.replace('{0}', currentPage.toString()).replace('{1}', totalPages.toString())}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.guideSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={t.guideClose}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Zero-Scroll Paged Presentation */}
          <div className="p-6 text-slate-700 dark:text-zinc-300 text-xs min-h-[310px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {currentPage === 1 && (
                <motion.div
                  key="page-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Eye size={16} />
                    <span>{t.guideSec1Title}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec1Desc}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        {t.guideStockCheckerTitle}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideStockCheckerSubtitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        {t.guideStockCheckerDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        {t.guideProfitMarginTitle}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideProfitMarginSubtitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        {t.guideProfitMarginDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-0.5">
                        {t.guideMinStockTitle}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideMinStockSubtitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                        {t.guideMinStockDesc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 2 && (
                <motion.div
                  key="page-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <TrendingUp size={16} />
                    <span>{t.guideSec2Title}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec2Desc}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Plus size={13} />
                        <span>{t.guideQuickStockTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideQuickStockDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Tags size={13} />
                        <span>{t.guideAliasesTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideAliasesDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        <Printer size={13} />
                        <span>{t.guideThermalLabelsTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideThermalLabelsDesc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 3 && (
                <motion.div
                  key="page-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Boxes size={16} />
                    <span>{t.guideSec3Title}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec3Desc}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Barcode size={13} />
                        <span>{t.guideSimpleUnitTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideSimpleUnitDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Boxes size={13} />
                        <span>{t.guidePackBoxTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePackBoxDesc}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Scale size={13} />
                        <span>{t.guideBulkMeasureTitle}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideBulkMeasureDesc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Indicators */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentPage === idx + 1 
                      ? 'w-6 bg-indigo-600' 
                      : 'w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700'
                  }`}
                  title={`${t.guidePageXofY.replace('{0}', (idx + 1).toString()).replace('{1}', totalPages.toString())}`}
                />
              ))}
            </div>
          </div>

          {/* Footer with "Don't show again" and Slide Controls */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {t.guideDontShowAgain}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft size={14} />
                  <span>{t.guidePrev}</span>
                </button>
              )}

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideNext}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideUnderstood}</span>
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
