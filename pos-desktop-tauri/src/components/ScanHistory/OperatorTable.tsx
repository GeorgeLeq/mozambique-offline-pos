import React, { useState, useMemo } from 'react';
import { 
  User, 
  Award, 
  ChevronRight, 
  Barcode, 
  Receipt, 
  Wallet, 
  DollarSign, 
  Search, 
  X, 
  ArrowUpDown, 
  Users 
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useScanHistoryI18n } from '../../i18n';

export interface OperatorStats {
  user_id: string;
  user_name: string;
  scan_count: number;
  items_sold: number;
  total_sales: number;
  payments: {
    cash: number;
    mpesa: number;
    emola: number;
    fiado: number;
  };
  payouts_count: number;
  payouts_total: number;
  sync_status?: number;
}

export function SyncDot({ status }: { status?: number }) {
  const t = useScanHistoryI18n();
  const isSynced = status === 1;
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        isSynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
      }`} 
      title={isSynced ? (t.syncedCloud || 'Sincronizado com a Nuvem') : (t.syncPending || 'Pendente de sincronização')}
    />
  );
}

interface OperatorTableProps {
  stats: OperatorStats[];
  onUserClick: (id: string, name: string) => void;
}

export function OperatorTable({ stats, onUserClick }: OperatorTableProps) {
  const t = useScanHistoryI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'sales_desc' | 'scans_desc' | 'name_asc'>('sales_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter and sort
  const filteredAndSortedStats = useMemo(() => {
    let list = [...stats];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        (s.user_name || '').toLowerCase().includes(q) || 
        (s.user_id || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'sales_desc') return b.total_sales - a.total_sales;
      if (sortBy === 'scans_desc') return b.scan_count - a.scan_count;
      if (sortBy === 'name_asc') return (a.user_name || '').localeCompare(b.user_name || '');
      return 0;
    });

    return list;
  }, [stats, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedStats.length / pageSize) || 1;
  const paginatedStats = useMemo(() => {
    return filteredAndSortedStats.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredAndSortedStats, currentPage, pageSize]);

  // Overall totals
  const totalSalesSum = useMemo(() => {
    return stats.reduce((acc, s) => acc + s.total_sales, 0);
  }, [stats]);

  const totalScansSum = useMemo(() => {
    return stats.reduce((acc, s) => acc + s.scan_count, 0);
  }, [stats]);

  const maxSales = Math.max(...stats.map(s => s.total_sales), 0);

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Top Integrated Control Toolbar (Matches BarcodeTable) */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Left: Search input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={14} />
            <input
              type="text"
              placeholder={t.searchOperatorPlaceholder || "Pesquisar por operador ou ID..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Sort Selector & Summaries */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-400 shadow-2xs">
            <ArrowUpDown size={12} className="text-slate-400 dark:text-zinc-500" />
            <span className="text-[11px] font-bold">{t.sortBy || "Ordenar:"}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="sales_desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">{t.sortSalesDesc || "Maior Receita"}</option>
              <option value="scans_desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">{t.sortScansDesc || "Mais Bips"}</option>
              <option value="name_asc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">{t.sortNameAsc || "Nome (A-Z)"}</option>
            </select>
          </div>

          {/* Operator count badge */}
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl px-2.5 py-1 shrink-0">
            <Users size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {stats.length} {stats.length === 1 ? (t.operatorBadgeSingular || 'Operador') : (t.operatorBadgePlural || 'Operadores')}
            </span>
          </div>

          {/* Total Bips badge (replaces duplicate total revenue) */}
          <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/50 border border-violet-200/80 dark:border-violet-800/60 rounded-xl px-2.5 py-1 shrink-0">
            <Barcode size={12} className="text-violet-600 dark:text-violet-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">{t.totalBips || "Total Bips:"}</span>
            <span className="text-xs font-black text-violet-700 dark:text-violet-300 font-mono">
              {totalScansSum.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Scroll Area */}
      <div id="operator-table-container" className="flex-1 overflow-y-auto">
        {filteredAndSortedStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-zinc-500">
            <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-850 rounded-2xl flex items-center justify-center mb-3 border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <User size={26} className="text-slate-400 dark:text-zinc-500 opacity-60" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{t.noOperatorsFound || 'Nenhum operador encontrado'}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.adjustSearch || 'Tente ajustar a sua pesquisa.'}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10 select-none">
              <tr>
                <th className="py-3 px-4 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{t.thOperatorPerf || 'Operador / Desempenho'}</span>
                  </div>
                </th>
                <th className="py-3 px-4 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <Barcode size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t.thScansItems || 'Bips / Artigos'}</span>
                  </div>
                </th>
                <th className="py-3 px-4 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={12} className="text-cyan-600 dark:text-cyan-400" />
                    <span>{t.thValuesByMethod || 'Valores por Método (MT)'}</span>
                  </div>
                </th>
                <th className="py-3 px-4 sm:px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Wallet size={12} className="text-rose-600 dark:text-rose-400" />
                    <span>{t.thPayouts || 'Saídas'}</span>
                  </div>
                </th>
                <th className="py-3 px-4 sm:px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign size={12} className="text-amber-600 dark:text-amber-400" />
                    <span>{t.thTotalRevenue || 'Receita Total'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              {paginatedStats.map((s) => {
                const isTopSeller = s.total_sales === maxSales && s.total_sales > 0;
                const totalPayments = s.payments.cash + s.payments.mpesa + s.payments.emola + s.payments.fiado;
                const cashPct = totalPayments > 0 ? (s.payments.cash / totalPayments) * 100 : 0;
                const mpesaPct = totalPayments > 0 ? (s.payments.mpesa / totalPayments) * 100 : 0;
                const emolaPct = totalPayments > 0 ? (s.payments.emola / totalPayments) * 100 : 0;
                const fiadoPct = totalPayments > 0 ? (s.payments.fiado / totalPayments) * 100 : 0;

                return (
                  <tr
                    key={s.user_id}
                    onClick={() => onUserClick(s.user_id, s.user_name)}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  >
                    {/* Operator Avatar & Details */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3 min-w-0">
                        <SyncDot status={s.sync_status} />
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 shrink-0 font-black text-xs">
                          {s.user_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {s.user_name}
                            </span>
                            {isTopSeller && (
                              <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase rounded-full flex items-center gap-0.5 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                                <Award size={9} /> {t.topSeller || 'Top'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                            <span>ID: {s.user_id.slice(0, 8)}</span>
                          </div>

                          {/* Progress ratio bar */}
                          <div className="w-full max-w-[180px] mt-1.5">
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden border border-slate-200/60 dark:border-zinc-700/60" title="Proporção de Métodos">
                              {totalPayments > 0 ? (
                                <>
                                  {cashPct > 0 && <div style={{ width: `${cashPct}%` }} className="bg-emerald-500" title={`Dinheiro: ${Math.round(cashPct)}%`} />}
                                  {mpesaPct > 0 && <div style={{ width: `${mpesaPct}%` }} className="bg-red-500" title={`M-Pesa: ${Math.round(mpesaPct)}%`} />}
                                  {emolaPct > 0 && <div style={{ width: `${emolaPct}%` }} className="bg-orange-500" title={`E-Mola: ${Math.round(emolaPct)}%`} />}
                                  {fiadoPct > 0 && <div style={{ width: `${fiadoPct}%` }} className="bg-amber-500" title={`Fiado: ${Math.round(fiadoPct)}%`} />}
                                </>
                              ) : (
                                <div className="w-full bg-slate-200 dark:bg-zinc-800" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Bips / Itens */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col text-xs font-mono text-slate-600 dark:text-zinc-400 gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                          <Barcode size={11} className="text-slate-400 dark:text-zinc-500" /> {(t.bipsCount || '{count} bips').replace('{count}', String(s.scan_count))}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                          <Receipt size={10} className="text-slate-400 dark:text-zinc-600" /> {s.items_sold === 1 ? (t.singleItem || '{count} item').replace('{count}', '1') : (t.itemsCount || '{count} itens').replace('{count}', String(s.items_sold))}
                        </span>
                      </div>
                    </td>

                    {/* Split Amounts in MT (Dark mode compatible) */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono max-w-[240px]">
                        <div className="flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-md px-1.5 py-0.5">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[9px]">{t.filterCash || 'DIN'}:</span>
                          <span className="text-slate-800 dark:text-zinc-100 font-bold">{formatCurrency(s.payments.cash)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-md px-1.5 py-0.5">
                          <span className="text-rose-700 dark:text-rose-400 font-bold text-[9px]">{t.filterMpesa || 'MPS'}:</span>
                          <span className="text-slate-800 dark:text-zinc-100 font-bold">{formatCurrency(s.payments.mpesa)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded-md px-1.5 py-0.5">
                          <span className="text-orange-700 dark:text-orange-400 font-bold text-[9px]">{t.filterEmola || 'EML'}:</span>
                          <span className="text-slate-800 dark:text-zinc-100 font-bold">{formatCurrency(s.payments.emola)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-md px-1.5 py-0.5">
                          <span className="text-amber-700 dark:text-amber-400 font-bold text-[9px]">{t.filterFiado || 'FIA'}:</span>
                          <span className="text-slate-800 dark:text-zinc-100 font-bold">{formatCurrency(s.payments.fiado)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Saídas */}
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono">
                      {s.payouts_count > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            -{formatCurrency(s.payouts_total)}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                            {s.payouts_count === 1
                              ? (t.payoutsCountSingular || '{count} saída').replace('{count}', '1')
                              : (t.payoutsCountPlural || '{count} saídas').replace('{count}', String(s.payouts_count))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    {/* Total Sales & Action */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(s.total_sales)} MT
                        </span>
                        <ChevronRight size={14} className="text-slate-400 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Docked Pagination Footer (Matches BarcodeTable) */}
      <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
        <div>
          {t.paginationShowing || 'A mostrar'} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> {t.paginationTo || 'a'}{' '}
          <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, filteredAndSortedStats.length)}</span> {t.paginationOf || 'de'}{' '}
          <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredAndSortedStats.length}</span> {t.paginationOperators || 'operadores'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            {t.prevBtn || 'Anterior'}
          </button>
          <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            {t.nextBtn || 'Seguinte'}
          </button>
        </div>
      </div>
    </div>
  );
}
