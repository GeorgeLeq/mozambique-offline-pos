import React from 'react';
import { ArrowLeft, Printer, Plus, RefreshCw, HelpCircle, Lock, Sparkles, Barcode } from 'lucide-react';
import { motion } from 'motion/react';
import { BarcodeRecord } from './types';
import { InternetStatusBadge } from '../InternetStatusBadge';
import { BarcodeUsageSummary } from './services/barcodeLimitService';
import { useI18n } from '../../i18n';

interface BarcodeHeaderProps {
  onBack: () => void;
  filteredBarcodes: BarcodeRecord[];
  isGenerating: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  onPrintSheet: () => void;
  onOpenGenerateModal: () => void;
  onOpenGuideModal?: () => void;
  usage?: BarcodeUsageSummary | null;
  onOpenUpgradeModal?: () => void;
}

export const BarcodeHeader: React.FC<BarcodeHeaderProps> = ({
  onBack,
  filteredBarcodes,
  isGenerating,
  isLoading,
  onRefresh,
  onPrintSheet,
  onOpenGenerateModal,
  onOpenGuideModal,
  usage,
  onOpenUpgradeModal,
}) => {
  const t = useI18n();

  return (
    <header className="relative z-20 px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs shrink-0 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onBack}
          className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs shrink-0"
          title={t.backToHome}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 truncate">
              {t.barcodeManagerTitle}
            </h1>
            <InternetStatusBadge />
          </div>
          
          {/* Barcode Quota / Capacity Badge */}
          {usage && (
            <div className="hidden md:flex items-center ml-1">
              {usage.isUnlimited ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-2xs">
                  <Barcode size={13} />
                  {usage.current} {t.barcodesQuota} ({t.unlimitedPro})
                </span>
              ) : usage.isAtLimit ? (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-extrabold transition-all cursor-pointer shadow-xs animate-pulse"
                  title="Upgrade Pro"
                >
                  <Lock size={12} />
                  <span>{usage.current}/{usage.limit}</span>
                  <Sparkles size={12} className="text-amber-500" />
                </button>
              ) : usage.percentage >= 80 ? (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                  title="Upgrade Pro"
                >
                  <Barcode size={13} />
                  <span>{usage.current}/{usage.limit}</span>
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase">({usage.limit - usage.current})</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 text-xs font-medium">
                  <Barcode size={13} />
                  <span>{usage.current}/{usage.limit} {t.barcodesQuota}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {onOpenGuideModal && (
          <button
            onClick={onOpenGuideModal}
            className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title={t.guideAndHelp}
          >
            <HelpCircle size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{t.guideAndHelp}</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50"
            title={t.reloadList}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
          </button>
        )}

        <button
          onClick={onPrintSheet}
          className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Printer size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{t.printSheet}</span>
        </button>

        <button
          onClick={onOpenGenerateModal}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
          <span>{isGenerating ? t.generating : t.generateBarcodes}</span>
        </button>
      </div>
    </header>
  );
};
