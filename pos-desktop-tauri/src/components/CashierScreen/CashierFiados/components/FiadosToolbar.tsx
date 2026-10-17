import React from 'react';
import { Search, X } from 'lucide-react';
import { FiadoStatusFilter } from '../types';

interface FiadosToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: FiadoStatusFilter;
  setStatusFilter: (filter: FiadoStatusFilter) => void;
}

export function FiadosToolbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: FiadosToolbarProps) {
  return (
    <div className="p-4 bg-slate-50/80 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 transition-colors">
      {/* Search input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por cliente, telefone, endereço..."
          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          id="fiados-search-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex p-0.5 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-[11px]">
        <button
          onClick={() => setStatusFilter('unpaid')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            statusFilter === 'unpaid'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          id="filter-unpaid-btn"
        >
          Em Falta (Ativos)
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            statusFilter === 'paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          id="filter-paid-btn"
        >
          Pagos (Histórico)
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          id="filter-all-btn"
        >
          Todos
        </button>
      </div>
    </div>
  );
}
