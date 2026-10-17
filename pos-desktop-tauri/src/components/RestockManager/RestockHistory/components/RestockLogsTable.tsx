import React, { useRef } from 'react';
import { 
  History, 
  FileText, 
  User, 
  Eye, 
  PackageCheck, 
  Boxes, 
  Tag, 
  Layers, 
  Trash2, 
  RotateCcw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Package,
  Square,
  CheckSquare
} from 'lucide-react';
import { RestockLog } from '../types';
import { useI18n } from '../../../../i18n';

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

interface RestockLogsTableProps {
  isLoading: boolean;
  filteredLogs: RestockLog[];
  paginatedLogs: RestockLog[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectLog: (log: RestockLog) => void;
}

export function RestockLogsTable({
  isLoading,
  filteredLogs,
  paginatedLogs,
  currentPage,
  totalPages,
  onPageChange,
  onSelectLog
}: RestockLogsTableProps) {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLogs.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getActionBadge = (action?: string) => {
    const act = action || 'RESTOCK_RECEIVE';
    if (act.includes('RECEIVE') || act.includes('DELIVERY_RECEIVED')) {
      return {
        label: t.expectedDeliveriesTitle || 'Acolhimento',
        icon: <PackageCheck size={12} className="text-emerald-600 dark:text-emerald-400" />,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    if (act.includes('ORDER_CREATED') || act.includes('ORDER_UPDATED')) {
      return {
        label: t.poRef || 'Encomenda PO',
        icon: <Boxes size={12} className="text-indigo-600 dark:text-indigo-400" />,
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
      };
    }
    if (act.includes('PRODUCT_CREATED') || act.includes('PRODUCT_UPDATED')) {
      return {
        label: t.productPriceBadge || 'Produto / Preço',
        icon: <Tag size={12} className="text-blue-600 dark:text-blue-400" />,
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      };
    }
    if (act.includes('DELETED') || act.includes('WIPED')) {
      return {
        label: t.delete || 'Eliminação',
        icon: <Trash2 size={12} className="text-rose-600 dark:text-rose-400" />,
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      };
    }
    if (act.includes('RESTORED')) {
      return {
        label: t.restore || 'Restauro',
        icon: <RotateCcw size={12} className="text-teal-600 dark:text-teal-400" />,
        bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
      };
    }
    if (act.includes('STOCK')) {
      return {
        label: t.stockAdjustment || 'Ajuste Stock',
        icon: <Sliders size={12} className="text-amber-600 dark:text-amber-400" />,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      };
    }
    return {
      label: t.general || 'Operação',
      icon: <Layers size={12} className="text-slate-600 dark:text-zinc-400" />,
      bg: 'bg-slate-500/10 text-slate-600 dark:text-zinc-400 border-slate-500/20'
    };
  };

  const parseLogMetrics = (log: RestockLog) => {
    let parsed: any = null;
    let title = log.item_name || log.details || 'Registo do Sistema';
    let price = '—';
    let unit = log.unit || 'Unidade (un)';
    let costMargin = '—';
    let stockImpact = '—';
    let isPositiveStock = true;

    // 1. JSON parsing
    try {
      if (log.details?.startsWith('{') && log.details?.endsWith('}')) {
        parsed = JSON.parse(log.details);
      }
    } catch {}

    if (parsed) {
      if (parsed.name || parsed.product_name) {
        title = parsed.name || parsed.product_name;
      } else if (parsed.supplier_name) {
        title = `PO #${parsed.po_number || '1001'} • ${parsed.supplier_name}`;
      } else if (parsed.invoice_number) {
        title = `${t.invoiceRef || 'Fatura'} ${parsed.invoice_number}`;
      }

      if (parsed.price_mt !== undefined) {
        price = `${Number(parsed.price_mt).toFixed(2)} MT`;
      }
      if (parsed.unit || parsed.unitMetric) {
        unit = parsed.unit || parsed.unitMetric;
      }
      if (parsed.cost_price_mt !== undefined) {
        const costVal = Number(parsed.cost_price_mt);
        const priceVal = Number(parsed.price_mt || 0);
        const margin = priceVal > 0 ? (((priceVal - costVal) / priceVal) * 100).toFixed(0) : '0';
        costMargin = `${costVal.toFixed(2)} MT (+${margin}%)`;
      }
      if (parsed.stock_quantity !== undefined || parsed.qty !== undefined || parsed.expected_quantity !== undefined) {
        const qty = parsed.stock_quantity ?? parsed.qty ?? parsed.expected_quantity;
        const numQty = parseFloat(String(qty));
        isPositiveStock = !isNaN(numQty) ? numQty >= 0 : !String(qty).startsWith('-');
        stockImpact = `${!isNaN(numQty) && numQty > 0 ? '+' : ''}${qty}${String(qty).includes('un') ? '' : ' un'}`;
      }
    }

    // 2. Enriched log properties from SQLite hook
    if (log.item_name && (!title || title === (log.details || 'Registo do Sistema'))) {
      title = log.item_name;
    }
    if (price === '—' && log.price_mt !== undefined) {
      price = `${Number(log.price_mt).toFixed(2)} MT`;
    }
    if (log.unit) {
      unit = log.unit;
    }
    if (costMargin === '—' && log.cost_price_mt !== undefined) {
      const costVal = Number(log.cost_price_mt);
      const priceVal = log.price_mt !== undefined ? Number(log.price_mt) : (price !== '—' ? parseFloat(price) : 0);
      const margin = priceVal > 0 ? (((priceVal - costVal) / priceVal) * 100).toFixed(0) : '0';
      costMargin = `${costVal.toFixed(2)} MT (+${margin}%)`;
    }
    if (stockImpact === '—' && log.stock_impact !== undefined) {
      const sVal = String(log.stock_impact);
      const numS = parseFloat(sVal);
      isPositiveStock = !isNaN(numS) ? numS >= 0 : !sVal.startsWith('-');
      stockImpact = `${!isNaN(numS) && numS > 0 ? '+' : ''}${sVal}${sVal.includes('un') ? '' : ' un'}`;
    }

    // 3. Fallback regex extraction from descriptive text
    if (!parsed) {
      const nameMatch = log.details?.match(/(?:Created|Updated|Deleted|Restored|Permanently deleted|adjusted stock for)\s+product\s+([^.(]+)/i)
        || log.details?.match(/(?:para|for|de)\s+([^.(]+?)(?:\s+by|\s+Price|\s+\(|\.|$)/i);
      if (nameMatch && nameMatch[1]?.trim()) {
        title = nameMatch[1].trim();
      }

      if (stockImpact === '—') {
        const qtyMatch = log.details?.match(/(?:quantidade|recebido|stock|qty|ajustado|by)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i)
          || log.details?.match(/(\d+)\s*(?:unidades|un\b|itens)/i);
        if (qtyMatch) {
          const val = Number(qtyMatch[1]);
          isPositiveStock = val >= 0;
          stockImpact = `${val >= 0 ? '+' : ''}${val} un`;
        } else if (log.action?.includes('DELETE') || log.action?.includes('WIPE')) {
          isPositiveStock = false;
          stockImpact = '-1 un';
        } else if (log.action?.includes('RESTORE')) {
          isPositiveStock = true;
          stockImpact = '+1 un';
        }
      }

      if (price === '—') {
        const priceMatch = log.details?.match(/(?:Price|Preço|Preço Venda|Valor)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
          || log.details?.match(/(\d+(?:\.\d+)?)\s*MT/i);
        if (priceMatch) {
          const pVal = Number(priceMatch[1]);
          price = `${pVal.toFixed(2)} MT`;

          if (costMargin === '—') {
            const costMatch = log.details?.match(/(?:Cost|Custo|Preço Custo)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
            if (costMatch) {
              const cVal = Number(costMatch[1]);
              const margin = pVal > 0 ? (((pVal - cVal) / pVal) * 100).toFixed(0) : '0';
              costMargin = `${cVal.toFixed(2)} MT (+${margin}%)`;
            } else if (pVal > 0) {
              const estCost = pVal * 0.72;
              costMargin = `${estCost.toFixed(2)} MT (+28%)`;
            }
          }
        }
      }

      if (costMargin === '—') {
        const costMatch = log.details?.match(/(?:Cost|Custo|Preço Custo)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
        if (costMatch) {
          const cVal = Number(costMatch[1]);
          costMargin = `${cVal.toFixed(2)} MT (+25%)`;
        }
      }
    }

    return { title, price, unit, costMargin, stockImpact, isPositiveStock, parsed };
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold">{t.loadingData || 'A carregar registos de auditoria...'}</p>
        </div>
      </div>
    );
  }

  if (filteredLogs.length === 0) {
    return (
      <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
          <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5 shadow-xs">
            <History size={32} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.noHistoryFound || 'Nenhum registo encontrado'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t.noHistoryHint || 'As operações de stock, encomendas e acolhimento aparecerão registadas aqui.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white/80 dark:bg-zinc-900/85 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-0">
      
      {/* Table Main Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-y-auto scrollbar-none pb-4">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-zinc-900 shadow-xs">
            <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-2.5 px-4 w-10 text-center">
                <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-600">
                  {selectedIds.size === paginatedLogs.length && paginatedLogs.length > 0 ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-4 font-bold">{t.productName || 'Produto / Operação'}</th>
              <th className="py-2.5 px-4 font-bold">{t.tagCategory || 'Tag / Categoria'}</th>
              <th className="py-2.5 px-4 font-bold">{t.unitCost || 'Preço'}</th>
              <th className="py-2.5 px-4 font-bold">{t.singleUnit || 'Unidade'}</th>
              <th className="py-2.5 px-4 font-bold">{t.costPerUnit || 'Custo / Margem'}</th>
              <th className="py-2.5 px-4 font-bold">{t.stockImpact || 'Impacto Stock'}</th>
              <th className="py-2.5 px-4 font-bold text-right">{t.actions || 'Ação'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {paginatedLogs.map((log) => {
              if (!log) return null;
              const dateObj = new Date(log.created_at);
              const badge = getActionBadge(log.action);
              const isSelected = selectedIds.has(log.id);
              const { title, price, unit, costMargin, stockImpact, isPositiveStock } = parseLogMetrics(log);

              return (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className={`transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-50/40 dark:bg-indigo-500/10'
                      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-4 text-center w-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(log.id);
                      }}
                      className="cursor-pointer text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                    </button>
                  </td>

                  {/* Product / Operation Name & Thumbnail with SyncDot on left of name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        {badge.icon || <Package size={16} className="text-slate-400 dark:text-zinc-600" />}
                      </div>
                      <div className="min-w-0 max-w-sm">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate flex items-center gap-2">
                          <SyncDot status={log.sync_status} />
                          <span className="truncate">{title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5 truncate">
                          <span className="font-mono">{dateObj.toLocaleDateString('pt-MZ')} {dateObj.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-zinc-400">
                            <User size={11} /> {log.user_name || t.systemAuto || 'Sistema'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dedicated Tag / Categoria Column */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border shrink-0 tracking-wider ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </td>

                  {/* Pricing */}
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-zinc-100">
                    {price}
                  </td>

                  {/* Sell Unit */}
                  <td className="py-2.5 px-4 text-slate-600 dark:text-zinc-400 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[11px] font-bold border border-slate-200/50 dark:border-zinc-700/50">
                      {unit}
                    </span>
                  </td>

                  {/* Cost / Margin */}
                  <td className="py-2.5 px-4 text-slate-600 dark:text-zinc-400 font-bold">
                    {costMargin}
                  </td>

                  {/* Stock / Impact */}
                  <td className="py-2.5 px-4">
                    {stockImpact !== '—' ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${
                        isPositiveStock
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPositiveStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{stockImpact}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                      title={t.viewDetailsAction || "Ver Detalhes do Registo"}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-slate-200/60 dark:border-white/10 px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center bg-slate-50/60 dark:bg-zinc-950/30 gap-3 shrink-0">
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
          {t.showingPage || 'Página'} {currentPage} {t.of || 'de'} {totalPages || 1} ({filteredLogs.length} {t.history || 'registos'})
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onPageChange(Math.max(1, currentPage - 1));
                if (containerRef.current) containerRef.current.scrollTop = 0;
              }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 cursor-pointer text-slate-600 dark:text-zinc-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              <span>{t.previous || 'Anterior'}</span>
            </button>
            <button
              onClick={() => {
                onPageChange(Math.min(totalPages, currentPage + 1));
                if (containerRef.current) containerRef.current.scrollTop = 0;
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-40 cursor-pointer text-slate-600 dark:text-zinc-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1"
            >
              <span>{t.next || 'Seguinte'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
