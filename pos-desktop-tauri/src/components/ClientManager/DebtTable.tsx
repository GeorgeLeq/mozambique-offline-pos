import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  SlidersHorizontal, 
  CheckSquare, 
  Square, 
  MessageCircle, 
  Printer, 
  History, 
  Edit2, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  Plus, 
  Download, 
  Users, 
  X, 
  RefreshCw,
  Maximize2,
  Minimize2,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { useCustomersI18n } from '../../i18n';

export function SyncDot({ status }: { status?: number }) {
  const t = useCustomersI18n();
  if (status === 0) {
    return (
      <span
        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block shadow-xs"
        title={t.pendingSync || 'Alteração pendente / a sincronizar'}
      />
    );
  }
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0 inline-block opacity-60"
      title={t.syncedCloud || 'Sincronizado na nuvem'}
    />
  );
}


interface DebtRowProps {
  debt: DebtRecord;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggleSelection: (id: string) => void;
  onSetHighlighted: (id: string | null) => void;
  onShareWhatsApp: (debt: DebtRecord) => void;
  onSettle: (debt: DebtRecord) => void;
  onPrintReceipt: (debt: DebtRecord) => void;
  onViewHistory: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
  onRestore?: (debt: DebtRecord) => void;
  onHardDelete?: (debt: DebtRecord) => void;
}

const DebtRow = React.memo(({
  debt,
  isSelected,
  isHighlighted,
  onToggleSelection,
  onSetHighlighted,
  onShareWhatsApp,
  onSettle,
  onPrintReceipt,
  onViewHistory,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete
}: DebtRowProps) => {
  const t = useCustomersI18n();
  const orig = debt.original_amount || debt.amount_mt;
  const isPartial = debt.status === 'unpaid' && Math.abs(debt.amount_mt - orig) > 0.01 && debt.amount_mt > 0;
  const hasHistory = debt.payment_history && debt.payment_history.length > 0;

  const expiryDays = React.useMemo(() => {
    if (typeof localStorage !== 'undefined') {
      return Number(localStorage.getItem('debts_expiry_days') || '30');
    }
    return 30;
  }, []);

  const daysLeft = React.useMemo(() => {
    if (debt.is_deleted !== 1) return -1;
    if (expiryDays <= 0) return -1;
    const deletedAtMs = debt.deleted_at 
      ? new Date(debt.deleted_at).getTime() 
      : (debt.created_at ? new Date(debt.created_at).getTime() : new Date().getTime());
    const daysElapsed = Math.floor((new Date().getTime() - deletedAtMs) / (1000 * 60 * 60 * 24));
    return Math.max(0, expiryDays - daysElapsed);
  }, [debt.is_deleted, debt.deleted_at, debt.created_at, expiryDays]);

  const itemsPreview = React.useMemo(() => {
    let preview: any[] = [];
    if (debt.items_json) {
      try {
        let rawJson = debt.items_json;
        if (typeof rawJson === 'string' && rawJson.includes('\\"')) {
          rawJson = rawJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        preview = JSON.parse(rawJson);
        if (!Array.isArray(preview)) {
          preview = [{ name: String(preview), quantity: 1 }];
        }
      } catch (e) {
        if (typeof debt.items_json === 'string' && debt.items_json.trim()) {
          preview = [{ name: debt.items_json, quantity: 1 }];
        }
      }
    }
    return preview;
  }, [debt.items_json]);

  return (
    <div
      id={`debt-row-${debt.id}`}
      onClick={() => onSetHighlighted(isHighlighted ? null : debt.id)}
      className={`grid grid-cols-12 gap-4 items-center px-4 py-2 cursor-pointer border-b border-slate-100 dark:border-zinc-800/60 transition-colors ${
        isHighlighted 
          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-l-4 border-l-indigo-500 shadow-sm' 
          : isSelected 
            ? 'bg-slate-100/80 dark:bg-zinc-800/60' 
            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
      }`}
    >
      <div className="col-span-1 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onToggleSelection(debt.id)}
          className="cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {isSelected ? (
            <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square size={16} />
          )}
        </button>
      </div>
      <div className="col-span-3 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 min-w-0">
            <SyncDot status={debt.sync_status} />
            <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs tracking-tight truncate">{debt.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 min-w-0 overflow-hidden">
            {debt.phone_number && (
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 shrink-0">
                <Phone size={10} className="text-slate-400 dark:text-zinc-500" /> {debt.phone_number}
              </span>
            )}
            {debt.address && (
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 flex items-center gap-1 truncate max-w-[100px]">
                <MapPin size={10} className="text-indigo-500 dark:text-indigo-400 shrink-0" /> {debt.address}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={debt.is_deleted === 1 ? "col-span-2 min-w-0" : "col-span-3 min-w-0"}>
        {itemsPreview.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-800 dark:text-zinc-200 font-medium truncate text-xs">
              {itemsPreview[0].quantity || 1}x {itemsPreview[0].name || itemsPreview[0].description || (t.itemsCountUnit || 'Artigo')}
              {itemsPreview.length > 1 && ` (+${itemsPreview.length - 1})`}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
              {t.debtRecordTitle || 'Registo de Fiado'}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 italic text-xs">{t.noArticles || 'Sem artigos'}</span>
        )}
      </div>
      <div className="col-span-2 font-mono">
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white text-xs">
            {formatCurrency(debt.amount_mt)}
          </span>
          {isPartial && (
            <span className="text-[9px] text-slate-400 dark:text-zinc-400">
              {t.originalAmount ? t.originalAmount.substring(0, 4) : 'Orig'}: {formatCurrency(debt.original_amount || 0)}
            </span>
          )}
        </div>
      </div>
      {debt.is_deleted === 1 ? (
        <div className="col-span-2 flex flex-col gap-1 min-w-0 pr-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
              {t.deletedBadge || 'Cancelado'}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider border ${
              expiryDays <= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : daysLeft === 0
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                  : daysLeft <= 3
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              <Clock size={9} className={daysLeft > 0 && daysLeft <= 3 ? 'animate-spin text-rose-600' : ''} />
              <span>
                {expiryDays <= 0 
                  ? (t.noExpiration || 'Sem Expiração') 
                  : daysLeft === 0 
                    ? (t.expiringToday || 'Expira Hoje') 
                    : `${daysLeft}d ${t.remaining || 'restantes'}`}
              </span>
            </span>
          </div>

          {/* Progress countdown bar */}
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                expiryDays <= 0 
                  ? 'bg-emerald-500' 
                  : daysLeft <= 3 
                    ? 'bg-rose-500' 
                    : daysLeft <= 7 
                      ? 'bg-amber-500' 
                      : 'bg-indigo-500'
              }`}
              style={{ 
                width: expiryDays <= 0 ? '100%' : `${Math.max(6, Math.min(100, (daysLeft / Math.max(1, expiryDays)) * 100))}%` 
              }}
            />
          </div>
        </div>
      ) : (
        <div className="col-span-1 flex flex-col gap-1 items-start">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            debt.status === 'paid'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : isPartial
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}>
            {debt.status === 'paid' ? (t.paidBadge || 'Pago') : isPartial ? (t.partialBadge || 'Parcial') : (t.unpaidBadge || 'Pendente')}
          </span>
        </div>
      )}
      <div className="col-span-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {debt.is_deleted === 1 ? (
            <>
              <button
                onClick={() => onRestore?.(debt)}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                title={t.restore || 'Restaurar'}
              >
                {t.restore || 'Restaurar'}
              </button>
              <button
                onClick={() => onHardDelete?.(debt)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                title={t.permanentDelete || 'Apagar permanente'}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onShareWhatsApp(debt)}
                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                title={t.share || 'Partilhar'}
              >
                <MessageCircle size={13} />
              </button>

              {debt.status !== 'paid' && (
                <button
                  onClick={() => onSettle(debt)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  {t.pay || 'Liquidar'}
                </button>
              )}

              {(debt.status === 'paid' || isPartial) && (
                <>
                  <button
                    onClick={() => onPrintReceipt(debt)}
                    className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                    title={t.printReceipt || 'Imprimir'}
                  >
                    <Printer size={13} />
                  </button>
                  {hasHistory && (
                    <button
                      onClick={() => onViewHistory(debt)}
                      className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                      title={t.paymentHistoryTitle || 'Histórico'}
                    >
                      <History size={13} />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => onEdit(debt)}
                className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                title={t.editAction || 'Editar'}
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDelete(debt)}
                className="p-1.5 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-zinc-800 cursor-pointer"
                title={t.delete || 'Eliminar'}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});


DebtRow.displayName = 'DebtRow';

interface DebtTableProps {
  debts: DebtRecord[];
  paginatedDebts: DebtRecord[];
  selectedDebts: Set<string>;
  highlightedDebt: string | null;
  setHighlightedDebt: (id: string | null) => void;
  toggleSelectAll: () => void;
  toggleSelection: (id: string) => void;
  onShareWhatsApp: (debt: DebtRecord) => void;
  onSettle: (debt: DebtRecord) => void;
  onPrintReceipt: (debt: DebtRecord) => void;
  onViewHistory: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
  onRestore?: (debt: DebtRecord) => void;
  onHardDelete?: (debt: DebtRecord) => void;
  currentUser?: any;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  filter?: 'all' | 'unpaid' | 'paid' | 'partial' | 'deleted';
  setFilter?: (filter: 'all' | 'unpaid' | 'paid' | 'partial' | 'deleted') => void;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  sortOrder?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  setSortOrder?: (val: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc') => void;
  isGrouped?: boolean;
  setIsGrouped?: (val: boolean) => void;
  selectedGroupClient?: string | null;
  setSelectedGroupClient?: (val: string | null) => void;
  onAddDebt?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DebtTable({
  debts,
  paginatedDebts,
  selectedDebts,
  highlightedDebt,
  setHighlightedDebt,
  toggleSelectAll,
  toggleSelection,
  onShareWhatsApp,
  onSettle,
  onPrintReceipt,
  onViewHistory,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  currentUser,
  currentPage,
  pageSize,
  totalPages,
  setCurrentPage,
  isFocusMode = false,
  onToggleFocus,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  isGrouped = false,
  setIsGrouped,
  selectedGroupClient,
  setSelectedGroupClient,
  onAddDebt,
  onExport,
  onRefresh,
  isRefreshing = false,
}: DebtTableProps) {
  const t = useCustomersI18n();
  const [expiryDays, setExpiryDays] = React.useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      return Number(localStorage.getItem('debts_expiry_days') || '30');
    }
    return 30;
  });

  const totalPending = React.useMemo(() => {
    return debts
      .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
      .reduce((acc, curr) => acc + (curr.amount_mt || 0), 0);
  }, [debts]);

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/5 flex flex-col shadow-xs overflow-hidden rounded-3xl transition-colors duration-300">
      {/* Search, Status Filter, Sort Order, Pending Amount Bar */}
      <div className="border-b border-slate-200/80 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 px-6 py-3.5 flex flex-wrap gap-4 items-center justify-between shrink-0 select-none">
          {/* Left/Middle side: Search, Status Filter, Sort Order, Pending Amount */}
          <div className="flex flex-1 min-w-[280px] flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={14} />
              <input
                type="text"
                placeholder={t.searchPlaceholder || "Pesquisar cliente ou contacto..."}
                value={searchQuery || ''}
                onChange={e => setSearchQuery?.(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-medium text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            {setFilter && filter && (
              <div className="relative shrink-0">
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as any)}
                  className="pl-3.5 pr-8 py-2 appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold text-[10px] uppercase tracking-wider outline-none cursor-pointer shadow-xs"
                >
                  <option value="unpaid">{t.unpaid || 'Não Pagos'}</option>
                  <option value="partial">{t.partial || 'Parciais'}</option>
                  <option value="paid">{t.paid || 'Pagos'}</option>
                  <option value="all">{t.allStatus || 'Todos Estados'}</option>
                  <option value="deleted">{t.deleted || 'Cancelados'}</option>
                </select>
                <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={11} />
              </div>
            )}

            {/* Sorter */}
            <div className="relative shrink-0">
              <select
                value={sortOrder || 'date-desc'}
                onChange={e => setSortOrder?.(e.target.value as any)}
                className="pl-3.5 pr-8 py-2 appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold text-[10px] uppercase tracking-wider outline-none cursor-pointer shadow-xs"
              >
                <option value="date-desc">{t.recent || 'Recentes'}</option>
                <option value="date-asc">{t.oldest || 'Antigos'}</option>
                <option value="amount-desc">{t.highestAmount || 'Maior Valor'}</option>
                <option value="amount-asc">{t.lowestAmount || 'Menor Valor'}</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={11} />
            </div>

            {/* Pending Amount Badge */}
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-xl px-3 py-1.5 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t.unpaidBadge || t.pending || 'Pendente'}:</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(totalPending)} MT
              </span>
            </div>

            {/* Selected Group Indicator */}
            {selectedGroupClient && setSelectedGroupClient && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-2.5 py-1 shrink-0">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                  {t.grouped || t.group || 'Grupo'}: {selectedGroupClient}
                </span>
                <button
                  onClick={() => setSelectedGroupClient(null)}
                  className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 p-0.5 rounded cursor-pointer"
                  title="Remover filtro de grupo"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Right side: Grouping, Expiry, Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Grouping Toggle */}
            {setIsGrouped && (
              <button
                onClick={() => setIsGrouped(!isGrouped)}
                className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isGrouped
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
                title={t.groupByClient || "Agrupar por Cliente"}
              >
                <Users size={11} />
                <span>{t.grouped || t.group || 'Agrupar'}</span>
              </button>
            )}

            {/* Expiry select for Admin/Gerente */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente') && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-xs">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{t.exp || 'EXP'}:</span>
                <select
                  value={expiryDays}
                  onChange={e => {
                    const val = e.target.value;
                    localStorage.setItem('debts_expiry_days', val);
                    setExpiryDays(Number(val));
                    const numVal = Number(val);
                    import('react-hot-toast').then(({ default: toast }) => {
                      toast.success(numVal <= 0 
                        ? (t.autoExpireNeverToast || 'Retenção de dívidas: Nunca (Sem expiração)') 
                        : (t.autoExpireDaysToast || `Auto-expiração definida para ${val} dias`).replace('{0}', val));
                    });
                    setTimeout(() => window.location.reload(), 800);
                  }}
                  className="bg-transparent text-[10px] font-black text-indigo-600 dark:text-indigo-400 outline-none border-none cursor-pointer"
                >
                  <option value="30" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">30 {t.days || 'd'}</option>
                  <option value="60" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">60 {t.days || 'd'}</option>
                  <option value="90" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">90 {t.days || 'd'}</option>
                  <option value="-1" className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">{t.neverOption || 'Nunca'}</option>
                </select>
              </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className={`p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs ${
                  isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''
                }`}
                title={t.syncData || "Sincronizar dados"}
              >
                <RefreshCw size={12} />
              </button>
            )}

            {/* Expand / Full-Width Toggle Button */}
            {onToggleFocus && (
              <button
                onClick={onToggleFocus}
                className={`p-2 rounded-xl border text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs ${
                  isFocusMode 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
                title={isFocusMode ? (t.restoreView || "Restaurar visualização") : (t.fullscreenMode || "Expandir modo ecrã inteiro")}
              >
                {isFocusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            )}

            {/* Export Button */}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                title={t.exportDebts || "Exportar dados de fiado"}
              >
                <Download size={12} />
              </button>
            )}

            {/* Add Debt Button */}
            {onAddDebt && (
              <button
                onClick={onAddDebt}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title={t.newDebt || "Registar nova dívida"}
              >
                <Plus size={11} />
                <span>{t.newDebt || 'Novo'}</span>
              </button>
            )}
          </div>
        </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white/60 dark:bg-zinc-950/20">
        {filter === 'deleted' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300 text-xs shrink-0">
            <div className="flex items-center gap-2 font-bold text-[11px]">
              <Clock size={15} className="text-amber-600 shrink-0" />
              <span>
                {expiryDays <= 0 ? (
                  <>{t.retentionPolicy || 'Retenção'}: <strong className="text-emerald-600 dark:text-emerald-400">{t.neverOption || 'Nunca (Sem Expiração)'}</strong>. Fiados cancelados são mantidos na lixeira indefinidamente.</>
                ) : (
                  <>{t.retentionPolicy || 'Retenção de Cancelados'}: <strong>{expiryDays} {t.days || 'Dias'}</strong>. Dívidas no lixo serão apagadas permanentemente após expirar o prazo.</>
                )}
              </span>
            </div>
          </div>
        )}
        {paginatedDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-zinc-800">
              <User size={32} className="text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{t.noDebtsFound || 'Nenhum registo de fiado encontrado'}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.tryAdjustingFilters || 'Tente ajustar os filtros ou pesquisar por outro cliente.'}</p>
          </div>
        ) : (
          <div className="flex flex-col w-full min-h-0">
            {/* Header row */}
            <div className="sticky top-0 z-20 grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-slate-200/80 dark:border-white/5 bg-slate-100 dark:bg-zinc-950 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 select-none shadow-xs">
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="cursor-pointer text-slate-400 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Selecionar Todos"
                >
                  {selectedDebts.size === paginatedDebts.length && paginatedDebts.length > 0 ? (
                    <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </div>
              <div className="col-span-3 flex items-center gap-1.5">
                <User size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t.client || 'Cliente'} / {t.contact || 'Contacto'}</span>
              </div>
              {filter === 'deleted' ? (
                <>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t.itemsDescription || t.items || 'Artigos / Descrição'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-amber-600 dark:text-amber-400" />
                    <span>{t.amount || 'Valor'} (MT)</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Clock size={12} className="text-rose-600 dark:text-rose-400" />
                    <span>{t.retentionCountdown || 'Retenção & Expurgo'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t.itemsDescription || t.items || 'Artigos / Descrição'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-amber-600 dark:text-amber-400" />
                    <span>{t.amount || 'Valor'} (MT)</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-1.5">
                    <Activity size={12} className="text-cyan-600 dark:text-cyan-400" />
                    <span>{t.status || 'Estado'}</span>
                  </div>
                </>
              )}
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <SlidersHorizontal size={12} className="text-slate-400 dark:text-zinc-400" />
                <span>{t.actions || 'Ações'}</span>
              </div>
            </div>

            {/* Static high-performance body container */}
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-900 bg-white/40 dark:bg-zinc-950/40">
              {paginatedDebts.map((debt) => (
                <DebtRow
                  key={debt.id}
                  debt={debt}
                  isSelected={selectedDebts.has(debt.id)}
                  isHighlighted={highlightedDebt === debt.id}
                  onToggleSelection={toggleSelection}
                  onSetHighlighted={setHighlightedDebt}
                  onShareWhatsApp={onShareWhatsApp}
                  onSettle={onSettle}
                  onPrintReceipt={onPrintReceipt}
                  onViewHistory={onViewHistory}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onHardDelete={onHardDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {debts.length > 0 && (
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div>
            {t.showing || 'Mostrando'} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> {t.to || 'a'} <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, debts.length)}</span> {t.of || 'de'} <span className="font-bold text-slate-800 dark:text-zinc-200">{debts.length}</span> {t.records || 'registos'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl font-bold disabled:opacity-40 cursor-pointer shadow-xs text-slate-700 dark:text-zinc-300"
            >
              {t.prev || 'Anterior'}
            </button>
            <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages || 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl font-bold disabled:opacity-40 cursor-pointer shadow-xs text-slate-700 dark:text-zinc-300"
            >
              {t.next || 'Seguinte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

