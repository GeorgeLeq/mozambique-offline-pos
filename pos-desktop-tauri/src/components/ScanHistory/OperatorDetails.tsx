import React, { useState, useMemo, useEffect } from 'react';
import { 
  Barcode, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowUpDown, 
  Coins, 
  DollarSign,
  Package,
  Clock,
  X,
  Receipt,
  Tag
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useScanHistoryI18n } from '../../i18n';

interface OperatorDetailsProps {
  scans: any[];
  payouts: any[];
  activeTab: 'scans' | 'payouts';
  onTabChange: (tab: 'scans' | 'payouts') => void;
  onBack: () => void;
  operatorName?: string;
}

export function OperatorDetails({ scans, payouts, activeTab, onTabChange, onBack, operatorName }: OperatorDetailsProps) {
  const t = useScanHistoryI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'mpesa' | 'emola' | 'fiado'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [currentPageScans, setCurrentPageScans] = useState(1);
  const [currentPagePayouts, setCurrentPagePayouts] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPageScans(1);
  }, [searchQuery, filterPayment, sortOrder]);

  const stats = useMemo(() => {
    const totalScans = scans.length;
    const totalRevenue = scans.reduce((acc, s) => acc + (s.total_mt || 0), 0);
    const cashSales = scans
      .filter(s => (s.payment_method || '').toLowerCase().replace('-', '') === 'cash')
      .reduce((acc, s) => acc + (s.total_mt || 0), 0);
    const totalPayouts = payouts.reduce((acc, p) => acc + (p.amount || 0), 0);
    const netDrawerCash = cashSales - totalPayouts;

    return { totalScans, totalRevenue, cashSales, totalPayouts, netDrawerCash };
  }, [scans, payouts]);

  const filteredScans = useMemo(() => {
    let result = [...scans];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.product_name || '').toLowerCase().includes(q) || 
        (s.barcode || '').toLowerCase().includes(q)
      );
    }
    if (filterPayment !== 'all') {
      result = result.filter(s => {
        const method = (s.payment_method || '').toLowerCase().replace('-', '');
        return method === filterPayment;
      });
    }
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [scans, searchQuery, filterPayment, sortOrder]);

  const filteredScansTotalValue = useMemo(() => {
    return filteredScans.reduce((acc, s) => acc + (s.total_mt || 0), 0);
  }, [filteredScans]);

  const sortedPayouts = useMemo(() => {
    let result = [...payouts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.reason || '').toLowerCase().includes(q) || 
        (p.note || '').toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [payouts, searchQuery, sortOrder]);

  const totalPagesScans = Math.ceil(filteredScans.length / pageSize) || 1;
  const paginatedScans = useMemo(() => {
    return filteredScans.slice((currentPageScans - 1) * pageSize, currentPageScans * pageSize);
  }, [filteredScans, currentPageScans, pageSize]);

  const totalPagesPayouts = Math.ceil(sortedPayouts.length / pageSize) || 1;
  const paginatedPayouts = useMemo(() => {
    return sortedPayouts.slice((currentPagePayouts - 1) * pageSize, currentPagePayouts * pageSize);
  }, [sortedPayouts, currentPagePayouts, pageSize]);

  const getPaymentBadge = (methodStr: string) => {
    const m = (methodStr || '').toLowerCase().replace('-', '');
    switch(m) {
      case 'cash':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 inline-flex items-center gap-1 font-mono">
            <Coins size={10} /> {t.cashPayment || 'Dinheiro'}
          </span>
        );
      case 'mpesa':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 inline-flex items-center gap-1 font-mono">
            <DollarSign size={10} /> M-Pesa
          </span>
        );
      case 'emola':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 inline-flex items-center gap-1 font-mono">
            <DollarSign size={10} /> e-Mola
          </span>
        );
      case 'fiado':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 inline-flex items-center gap-1 font-mono">
            <Calendar size={10} /> {t.fiadoPayment || 'Fiado'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 font-mono">
            {methodStr || '-'}
          </span>
        );
    }
  };

  const formatFriendlyDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `${t.dateToday || 'Hoje'}, ${timeStr}`;
      const day = d.getDate();
      const months = [
        t.monthJan || 'Jan', t.monthFeb || 'Fev', t.monthMar || 'Mar', t.monthApr || 'Abr',
        t.monthMay || 'Mai', t.monthJun || 'Jun', t.monthJul || 'Jul', t.monthAug || 'Ago',
        t.monthSep || 'Set', t.monthOct || 'Out', t.monthNov || 'Nov', t.monthDec || 'Dez'
      ];
      return `${day} ${months[d.getMonth()]}, ${timeStr}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Top Integrated Control Toolbar (Matches BarcodeTable) */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Left Row: SubTabs & Search */}
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* SubTab Pill Switchers */}
          <div className="flex p-0.5 bg-slate-200/70 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => onTabChange('scans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'scans' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Barcode size={13} /> {(t.tabSalesScans || 'Vendas / Bips ({count})').replace('{count}', String(stats.totalScans))}
            </button>
            <button
              onClick={() => onTabChange('payouts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'payouts' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Wallet size={13} /> {(t.tabPayouts || 'Saídas ({count})').replace('{count}', String(payouts.length))}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'scans' ? (t.searchScansPlaceholder || "Pesquisar produto ou código bip...") : (t.searchPayoutsPlaceholder || "Pesquisar motivo ou observação...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Payment Method Filters (Scans only) */}
          {activeTab === 'scans' && (
            <div className="flex items-center bg-slate-200/60 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-0.5">
              {(['all', 'cash', 'mpesa', 'emola', 'fiado'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setFilterPayment(method)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    filterPayment === method 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {method === 'all' ? (t.filterAll || 'Todos') : 
                   method === 'cash' ? (t.filterCash || 'DIN') : 
                   method === 'mpesa' ? (t.filterMpesa || 'MPS') : 
                   method === 'emola' ? (t.filterEmola || 'EML') : (t.filterFiado || 'FIA')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Row: Financial Metrics & Sort Order */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Subtotal */}
          {activeTab === 'scans' && (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl px-2.5 py-1 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t.subtotal || "Subtotal:"}</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(filteredScansTotalValue)} MT
              </span>
            </div>
          )}

          {/* Sort button */}
          <button
            onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowUpDown size={12} className="text-slate-400 dark:text-zinc-500" />
            <span>{sortOrder === 'newest' ? (t.sortNewest || 'Mais Recentes') : (t.sortOldest || 'Mais Antigos')}</span>
          </button>
        </div>
      </div>

      {/* Main Table Scroll Area */}
      <div id="operator-details-container" className="flex-1 overflow-y-auto">
        {activeTab === 'scans' ? (
          filteredScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-zinc-500">
              <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-850 rounded-2xl flex items-center justify-center mb-3 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                <Barcode size={26} className="text-slate-400 dark:text-zinc-500 opacity-60" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{t.noScansFound || 'Nenhum registo de bip encontrado'}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.adjustScanFilters || 'Tente ajustar a sua pesquisa ou filtros de pagamento.'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-3 px-4 sm:px-6 text-center w-14">
                    <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400 mx-auto" />
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{t.thArticleCode || 'Artigo / Código Bip'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <Receipt size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{t.thQuantity || 'Quantidade'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <Coins size={12} className="text-amber-600 dark:text-amber-400" />
                      <span>{t.thPaymentMethod || 'Método Pagamento'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign size={12} className="text-cyan-600 dark:text-cyan-400" />
                      <span>{t.thTotalValue || 'Valor Total (MT)'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock size={12} className="text-slate-400 dark:text-zinc-400" />
                      <span>{t.thTime || 'Hora'}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                {paginatedScans.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border mx-auto shrink-0 ${
                        s.status === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                      }`}>
                        {s.status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 min-w-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs tracking-tight truncate">
                          {s.product_name || (t.unregisteredProduct || 'Produto Não Registado')}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                          <Barcode size={10} className="text-slate-400 dark:text-zinc-500" /> {s.barcode || (t.na || 'N/A')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">
                        {(s.quantity || 1)}x {s.quantity > 1 ? (t.itemsCount || 'itens').replace('{count}', '').trim() : (t.singleItem || 'item').replace('{count}', '').trim()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      {getPaymentBadge(s.payment_method)}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono">
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {formatCurrency(s.total_mt || 0)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 font-mono">
                        {formatFriendlyDate(s.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* Payouts Table */
          sortedPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 dark:text-zinc-500">
              <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-850 rounded-2xl flex items-center justify-center mb-3 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                <Wallet size={26} className="text-slate-400 dark:text-zinc-500 opacity-60" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{t.noPayoutsFound || 'Nenhum levantamento de caixa'}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.noPayoutsDesc || 'Este operador ainda não realizou saídas de dinheiro.'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-3 px-4 sm:px-6 text-center w-14">
                    <Wallet size={12} className="text-rose-600 dark:text-rose-400 mx-auto" />
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className="text-rose-600 dark:text-rose-400" />
                      <span>{t.thReasonCategory || 'Motivo / Categoria'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6">
                    <span>{t.thNotes || 'Observações'}</span>
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign size={12} className="text-rose-600 dark:text-rose-400" />
                      <span>{t.thAmountWithdrawn || 'Valor Retirado'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock size={12} className="text-slate-400 dark:text-zinc-400" />
                      <span>{t.thDateTime || 'Data / Hora'}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                {paginatedPayouts.map((p, idx) => (
                  <tr
                    key={p.id || idx}
                    className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 mx-auto shrink-0">
                        <Wallet size={11} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 min-w-0">
                      <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs tracking-tight truncate block">
                        {p.reason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 min-w-0">
                      <span className="text-xs text-slate-600 dark:text-zinc-400 italic truncate block">
                        {p.note ? `"${p.note}"` : <span className="text-slate-400 dark:text-zinc-600 not-italic">{t.noNotes || 'Sem observações'}</span>}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 font-mono text-right">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                        -{formatCurrency(p.amount)} MT
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 font-mono">
                        {formatFriendlyDate(p.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Docked Pagination Footer (Matches BarcodeTable) */}
      {activeTab === 'scans' ? (
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div>
            {t.paginationShowing || 'A mostrar'} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPageScans - 1) * pageSize + 1}</span> {t.paginationTo || 'a'}{' '}
            <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPageScans * pageSize, filteredScans.length)}</span> {t.paginationOf || 'de'}{' '}
            <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredScans.length}</span> {t.recordsLabel || 'registos'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageScans(p => Math.max(p - 1, 1))}
              disabled={currentPageScans <= 1}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {t.prevBtn || 'Anterior'}
            </button>
            <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
              {currentPageScans} / {totalPagesScans}
            </span>
            <button
              onClick={() => setCurrentPageScans(p => Math.min(p + 1, totalPagesScans))}
              disabled={currentPageScans >= totalPagesScans}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {t.nextBtn || 'Seguinte'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div>
            {t.paginationShowing || 'A mostrar'} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPagePayouts - 1) * pageSize + 1}</span> {t.paginationTo || 'a'}{' '}
            <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPagePayouts * pageSize, sortedPayouts.length)}</span> {t.paginationOf || 'de'}{' '}
            <span className="font-bold text-slate-800 dark:text-zinc-200">{sortedPayouts.length}</span> {t.recordsLabel || 'registos'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPagePayouts(p => Math.max(p - 1, 1))}
              disabled={currentPagePayouts <= 1}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {t.prevBtn || 'Anterior'}
            </button>
            <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
              {currentPagePayouts} / {totalPagesPayouts}
            </span>
            <button
              onClick={() => setCurrentPagePayouts(p => Math.min(p + 1, totalPagesPayouts))}
              disabled={currentPagePayouts >= totalPagesPayouts}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {t.nextBtn || 'Seguinte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
