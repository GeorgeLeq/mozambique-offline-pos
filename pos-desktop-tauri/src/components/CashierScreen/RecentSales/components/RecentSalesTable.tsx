import React from 'react';
import { 
  Receipt as ReceiptIcon, 
  Clock, 
  Copy, 
  Check, 
  Printer 
} from 'lucide-react';
import { SaleReceipt } from '../types';
import { formatCurrency } from '../../../../lib/utils';
import { PaymentMethodBadge } from './PaymentMethodBadge';

function SyncDot({ status }: { status?: number }) {
  if (status === 0) {
    return (
      <span
        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block shadow-xs"
        title="Venda pendente de sincronização"
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

interface RecentSalesTableProps {
  sales: SaleReceipt[];
  filteredCount: number;
  loading: boolean;
  selectedSale: SaleReceipt | null;
  copiedId: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onSelectSale: (sale: SaleReceipt) => void;
  onCopyId: (id: string, e: React.MouseEvent) => void;
  onPrint: (sale: SaleReceipt, e?: React.MouseEvent) => void;
  onPageChange: (page: number) => void;
}

export function RecentSalesTable({
  sales,
  filteredCount,
  loading,
  selectedSale,
  copiedId,
  currentPage,
  pageSize,
  totalPages,
  onSelectSale,
  onCopyId,
  onPrint,
  onPageChange
}: RecentSalesTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-zinc-500 gap-3">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 rounded-full border-t-transparent" />
        <span className="text-xs font-bold">A carregar talões de venda...</span>
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400 dark:text-zinc-500">
        <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200 dark:border-zinc-800">
          <ReceiptIcon size={24} className="text-slate-400 dark:text-zinc-600" />
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-zinc-300">Nenhum talão encontrado</p>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">Tente ajustar a pesquisa ou o período de tempo.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 transition-colors">
      {/* Grid Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 select-none">
        <div className="col-span-4">ID Recibo & Hora</div>
        <div className="col-span-3">Pagamento</div>
        <div className="col-span-2 text-center">Itens</div>
        <div className="col-span-2 text-right">Total (MT)</div>
        <div className="col-span-1 text-right">Ações</div>
      </div>

      {/* Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950/40">
        {sales.map((sale) => {
          const isSelected = selectedSale?.receipt_id === sale.receipt_id;
          const isVoided = sale.status === 'voided';
          const dateObj = new Date(sale.created_at);

          return (
            <div
              key={sale.receipt_id}
              onClick={() => onSelectSale(sale)}
              className={`grid grid-cols-12 gap-3 items-center px-4 py-3 cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-2 border-indigo-500' 
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'
              }`}
            >
              {/* ID & Time */}
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-1.5">
                  <SyncDot status={sale.sync_status} />
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                    #{sale.receipt_id.length > 14 ? `REC-...${sale.receipt_id.slice(-6).toUpperCase()}` : sale.receipt_id.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => onCopyId(sale.receipt_id, e)}
                    className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                    title="Copiar ID"
                  >
                    {copiedId === sale.receipt_id ? <Check size={11} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  {isVoided && (
                    <span className="text-[9px] font-black uppercase text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-1 rounded">
                      Anulada
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                  <Clock size={10} className="text-slate-400 dark:text-zinc-500" />
                  {dateObj.toLocaleDateString('pt-MZ')} {dateObj.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Payment Method */}
              <div className="col-span-3 min-w-0">
                <PaymentMethodBadge method={sale.payment_method} />
              </div>

              {/* Items Count */}
              <div className="col-span-2 text-center">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-zinc-300 font-mono">
                  {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Total MT */}
              <div className="col-span-2 text-right font-mono">
                <span className={`text-xs font-black ${isVoided ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(sale.total)}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => onPrint(sale, e)}
                  className="p-1.5 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reimprimir Recibo"
                >
                  <Printer size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
        <div>
          Vendas <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, filteredCount)}</span> de <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer text-slate-700 dark:text-zinc-300 text-xs shadow-2xs"
          >
            Anterior
          </button>
          <span className="font-bold px-1 text-slate-700 dark:text-zinc-300 text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer text-slate-700 dark:text-zinc-300 text-xs shadow-2xs"
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  );
}
