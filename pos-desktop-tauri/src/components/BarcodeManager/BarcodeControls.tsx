import React from 'react';
import { Download, Trash2, LayoutGrid, CheckCircle2, Clock } from 'lucide-react';
import { BarcodeRecord } from './types';
import { BarcodeUsageSummary } from './services/barcodeLimitService';
import { useI18n } from '../../i18n';

interface BarcodeControlsProps {
  filter: 'all' | 'available' | 'used';
  setFilter: (filter: 'all' | 'available' | 'used') => void;
  barcodes: BarcodeRecord[];
  filteredBarcodes: BarcodeRecord[];
  selectedBarcodes: Set<string>;
  toggleSelectAll: () => void;
  handleBulkSave?: () => void;
  handleBulkDownload: () => void;
  handleBulkDelete: () => void;
  usage?: BarcodeUsageSummary | null;
}

export const BarcodeControls: React.FC<BarcodeControlsProps> = ({
  filter,
  setFilter,
  barcodes,
  filteredBarcodes,
  selectedBarcodes,
  toggleSelectAll,
  handleBulkDownload,
  handleBulkDelete,
  usage,
}) => {
  const t = useI18n();

  return (
    <div className="bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4 md:p-6 flex flex-col gap-4 relative overflow-hidden">
      {/* Soft color highlights on background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 relative z-10">
        {/* iOS/macOS styled segment pill controller with icons */}
        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-x-auto hide-scrollbar w-full xl:w-auto gap-1">
          {([
            { value: 'all', label: t.allBarcodes, icon: LayoutGrid },
            { value: 'available', label: t.availableBarcodes, icon: CheckCircle2 },
            { value: 'used', label: t.usedBarcodes, icon: Clock },
          ] as const).map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-850'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Info panel & key action buttons */}
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto hide-scrollbar justify-between sm:justify-end">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs whitespace-nowrap">
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t.allCount || 'Total'}</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                {barcodes.length}
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t.availableBarcodes}</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                {barcodes.filter(b => b.status === 'available').length}
              </span>
            </div>
            {usage && (
              <>
                <div className="w-px h-7 bg-slate-200 dark:bg-zinc-800" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{t.proPlan || 'Plano'}</span>
                  <span className={`text-lg font-black font-mono tracking-tight ${usage.isAtLimit ? 'text-rose-500' : 'text-slate-700 dark:text-zinc-300'}`}>
                    {usage.isUnlimited ? t.unlimitedPro : `${usage.current}/${usage.limit}`}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-zinc-800 pl-2">
            <button
              onClick={toggleSelectAll}
              className="px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-750 rounded-xl shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {selectedBarcodes.size === filteredBarcodes.length && filteredBarcodes.length > 0 ? t.deselectAll : t.selectAll}
            </button>

            {selectedBarcodes.size > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-xl shadow-inner ml-1">
                <span className="text-xs font-black text-slate-500 dark:text-zinc-400 font-mono mr-1">
                  {selectedBarcodes.size}
                </span>
                <button
                  onClick={handleBulkDownload}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-90 cursor-pointer"
                  title={t.downloadPNGs}
                >
                  <Download size={15} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all active:scale-90 cursor-pointer"
                  title={t.deleteSelected}
                >
                  <Trash2 size={15} className="stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
