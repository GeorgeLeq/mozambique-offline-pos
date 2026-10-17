import React from 'react';
import { Phone, MapPin, Calendar, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils';
import { DebtRecord } from '../../../ClientManager/types';

export function SyncDot({ status }: { status?: number }) {
  if (status === 0) {
    return (
      <span
        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block shadow-xs"
        title="Alteração pendente / a sincronizar"
      />
    );
  }
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0 inline-block opacity-60"
      title="Sincronizado na nuvem"
    />
  );
}

interface FiadosTableProps {
  debts: DebtRecord[];
  selectedDebt: DebtRecord | null;
  onSelectDebt: (debt: DebtRecord) => void;
  onViewItems: (debt: DebtRecord) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalFilteredCount: number;
  onPageChange: (page: number) => void;
}

export function FiadosTable({
  debts,
  selectedDebt,
  onSelectDebt,
  onViewItems,
  currentPage,
  totalPages,
  pageSize,
  totalFilteredCount,
  onPageChange,
}: FiadosTableProps) {
  if (totalFilteredCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400 dark:text-zinc-500">
        <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200 dark:border-zinc-800">
          <BookOpen size={24} className="text-slate-400 dark:text-zinc-600" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Nenhum registo de fiado encontrado</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Tente ajustar a pesquisa ou o filtro de estado.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Grid Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider shrink-0 select-none">
          <div className="col-span-4">Cliente & Contacto</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Data Registo</div>
          <div className="col-span-2 text-center">Artigos</div>
          <div className="col-span-2 text-right">Saldo (MT)</div>
        </div>

        {/* Rows List (Fixed without scrollbars) */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950/40 flex-1 flex flex-col justify-start">
          {debts.map((debt) => {
            const isSelected = selectedDebt?.id === debt.id;
            const isPaid = debt.status === 'paid';
            const dateObj = new Date(debt.created_at);

            return (
              <div
                key={debt.id}
                onClick={() => onSelectDebt(debt)}
                className={`grid grid-cols-12 gap-3 items-center px-4 py-3 cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-2 border-indigo-500' 
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                {/* Customer Name & Info */}
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {debt.customer_name}
                    </span>
                    <SyncDot status={debt.sync_status} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-zinc-400">
                    {debt.phone_number && (
                      <span className="flex items-center gap-1 font-mono truncate">
                        <Phone size={10} className="text-slate-400 dark:text-zinc-500 shrink-0" /> {debt.phone_number}
                      </span>
                    )}
                    {debt.address && (
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <MapPin size={10} className="text-slate-400 dark:text-zinc-500 shrink-0" /> {debt.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                  }`}>
                    {isPaid ? 'Pago' : 'Em Falta'}
                  </span>
                </div>

                {/* Created Date */}
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1">
                    <Calendar size={10} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                    {dateObj.toLocaleDateString('pt-MZ')}
                  </span>
                </div>

                {/* View Items Trigger */}
                <div className="col-span-2 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewItems(debt);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                    title="Ver lista de artigos comprados a fiado"
                  >
                    <ShoppingBag size={11} />
                    <span>Ver Itens</span>
                  </button>
                </div>

                {/* Amount & Quick Action */}
                <div className="col-span-2 text-right flex items-center justify-end gap-1.5 font-mono">
                  <span className={`text-xs font-black ${isPaid ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {formatCurrency(debt.amount_mt)}
                  </span>
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDebt(debt);
                      }}
                      className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer"
                      title="Liquidar Dívida"
                    >
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Footer (No Scroll, strictly pages) */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
        <div>
          Fiados <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> a <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, totalFilteredCount)}</span> de <span className="font-bold text-slate-800 dark:text-zinc-200">{totalFilteredCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer text-slate-700 dark:text-zinc-300 text-xs shadow-2xs"
            id="fiados-prev-page-btn"
          >
            Anterior
          </button>
          <span className="font-bold px-1 text-slate-800 dark:text-zinc-300 text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer text-slate-700 dark:text-zinc-300 text-xs shadow-2xs"
            id="fiados-next-page-btn"
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  );
}
