import React from 'react';
import { Search, X } from 'lucide-react';
import { PaymentFilterType, TimeFilterType, PruneOptionType } from '../types';
import { RecentSalesTimeSection } from './RecentSalesTimeSection';
import { RecentSalesPruneSection } from './RecentSalesPruneSection';

interface RecentSalesToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  paymentFilter: PaymentFilterType;
  setPaymentFilter: (val: PaymentFilterType) => void;
  timeFilter: TimeFilterType;
  setTimeFilter: (val: TimeFilterType) => void;
  pruneOption: PruneOptionType;
  setPruneOption: (val: PruneOptionType) => void;
  onPrune: () => void;
}

const PAYMENT_FILTERS: { id: PaymentFilterType; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cash', label: 'DIN' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'emola', label: 'e-Mola' },
  { id: 'fiado', label: 'Fiado' }
];

export function RecentSalesToolbar({
  searchQuery,
  setSearchQuery,
  paymentFilter,
  setPaymentFilter,
  timeFilter,
  setTimeFilter,
  pruneOption,
  setPruneOption,
  onPrune,
}: RecentSalesToolbarProps) {
  return (
    <div className="p-4 bg-slate-50/80 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 transition-colors">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por ID recibo, artigo, código de barras..."
          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Payment Method Filter */}
        <div className="flex p-0.5 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-[11px]">
          {PAYMENT_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setPaymentFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                paymentFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Time Triangulation Selection */}
        <div className="min-w-[150px]">
          <RecentSalesTimeSection timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
        </div>

        {/* Clean History Button */}
        <RecentSalesPruneSection
          pruneOption={pruneOption}
          setPruneOption={setPruneOption}
          onPrune={onPrune}
        />
      </div>
    </div>
  );
}
