import React, { useRef } from 'react';
import { ExpectedDelivery } from './index';
import { SyncDot } from '../../ProductManager/ProductList/ProductTable';
import { 
  CheckSquare, 
  Square, 
  Eye, 
  Edit2, 
  Edit3,
  Trash2, 
  CheckCircle, 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw,
  Truck,
  Package,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Tag,
  TrendingUp,
  DollarSign,
  Layers,
  Check, 
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useI18n } from '../../../i18n';

function InlineSupplierEditor({
  delivery,
  onSave,
  onCancel
}: {
  delivery: ExpectedDelivery;
  onSave: (deliveryId: string, newSupplier: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = React.useState(delivery.supplier_name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(delivery.id, value);
          if (e.key === 'Escape') onCancel();
        }}
        className="px-2 py-1 text-xs font-bold rounded-lg border border-indigo-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none w-[120px]"
      />
      <button onClick={() => onSave(delivery.id, value)} className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer transition-colors" title="Guardar">
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-md cursor-pointer transition-colors" title="Cancelar">
        <X size={13} />
      </button>
    </div>
  );
}

function InlineStockEditor({
  delivery,
  onSave,
  onCancel
}: {
  delivery: ExpectedDelivery;
  onSave: (delivery: ExpectedDelivery, newValue: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = React.useState(String(delivery.total_expected_qty || 0));
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(delivery, value);
          if (e.key === 'Escape') onCancel();
        }}
        className="w-16 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-indigo-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none"
      />
      <button onClick={() => onSave(delivery, value)} className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer transition-colors" title="Guardar">
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-md cursor-pointer transition-colors" title="Cancelar">
        <X size={13} />
      </button>
    </div>
  );
}

interface ExpectedDeliveriesTableProps {
  paginatedDeliveries: ExpectedDelivery[];
  selectedIds: string[];
  highlightedIds: Set<string>;
  toggleHighlightId: (id: string) => void;
  handleSelectAll: () => void;
  handleToggleSelect: (id: string) => void;
  groupBySupplier: boolean;
  groupedDeliveries: Record<string, ExpectedDelivery[]>;
  collapsedSuppliers: Record<string, boolean>;
  toggleCollapseSupplier: (supplier: string) => void;
  getStatusBadge: (delivery: ExpectedDelivery) => React.ReactNode;
  setSelectedDeliveryId: (id: string) => void;
  setEditingDeliveryId: (id: string) => void;
  setDeliveryToDelete: (delivery: ExpectedDelivery) => void;
  isLoading: boolean;
  readOnly?: boolean;
  inlineEditingSupplierId?: string | null;
  setInlineEditingSupplierId?: (id: string | null) => void;
  handleSaveInlineSupplier?: (deliveryId: string, newSupplier: string) => void;
  inlineEditingStockId?: string | null;
  setInlineEditingStockId?: (id: string | null) => void;
  handleSaveInlineStock?: (delivery: ExpectedDelivery, newStock: string) => void;
}

export function ExpectedDeliveriesTable({
  paginatedDeliveries,
  selectedIds,
  highlightedIds,
  toggleHighlightId,
  handleSelectAll,
  handleToggleSelect,
  groupBySupplier,
  groupedDeliveries,
  collapsedSuppliers,
  toggleCollapseSupplier,
  getStatusBadge,
  setSelectedDeliveryId,
  setEditingDeliveryId,
  setDeliveryToDelete,
  isLoading,
  readOnly = false,
  inlineEditingSupplierId,
  setInlineEditingSupplierId,
  handleSaveInlineSupplier,
  inlineEditingStockId,
  setInlineEditingStockId,
  handleSaveInlineStock
}: ExpectedDeliveriesTableProps) {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold">{t.loadingOrders || 'A carregar encomendas e produtos...'}</p>
      </div>
    );
  }

  if (paginatedDeliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5">
          <Truck size={32} className="text-slate-400" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{t.noOrdersFound || 'Nenhuma encomenda encontrada'}</p>
        <p className="text-xs text-slate-400 mt-0.5">{t.noOrdersHint || 'Tente ajustar os filtros ou pesquisar por outro termo.'}</p>
      </div>
    );
  }

  const getDeliveryDateStatus = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        label: `${t.delayedDays || 'Atrasada'} (${daysAgo}d)`,
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      };
    } else if (diffDays === 0) {
      return {
        label: t.today || 'Hoje',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 animate-pulse font-extrabold'
      };
    } else if (diffDays <= 3) {
      return {
        label: `${t.inDays || 'Em'} ${diffDays}d`,
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      };
    } else {
      return {
        label: t.onTime || 'No Prazo',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      };
    }
  };

  const renderDeliveryRow = (delivery: ExpectedDelivery) => {
    const poString = `PO-${delivery.po_number || 1001}`;
    const isSelected = selectedIds.includes(delivery.id);
    const isHighlighted = highlightedIds.has(delivery.id);

    const handleRowClick = () => {
      const nextHighlighted = !isHighlighted;
      toggleHighlightId(delivery.id);
      
      // Auto-select on highlight when authorized
      if (!readOnly && nextHighlighted && !isSelected) {
        handleToggleSelect(delivery.id);
      }
    };

    return (
      <tr 
        key={delivery.id} 
        onClick={handleRowClick}
        className={`transition-all cursor-pointer group ${
          isHighlighted 
            ? 'bg-indigo-100/90 dark:bg-indigo-950/70 ring-2 ring-indigo-500 shadow-md scale-[1.01]' 
            : isSelected 
            ? 'bg-indigo-50/40 dark:bg-indigo-500/10' 
            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/40'
        }`}
      >
        {/* Checkbox Column */}
        <td className="py-2 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
          {!readOnly && (
            <button 
              onClick={() => handleToggleSelect(delivery.id)} 
              className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
            </button>
          )}
        </td>

        {/* Sync Status Dot (Far Left) */}
        <td className="py-2 px-1 text-center w-7" onClick={(e) => e.stopPropagation()}>
          <SyncDot status={(delivery as any).sync_status} />
        </td>

        {/* PO & Invoices */}
        <td className="py-2 px-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <Truck size={14} />
            </div>
            <div>
              <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs">
                <span>{poString}</span>
              </div>
              {delivery.invoice_number && (
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block leading-tight">
                  FAT: {delivery.invoice_number}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Expected Delivery Date */}
        <td className="py-2 px-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-mono">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span>{new Date(delivery.expected_date).toLocaleDateString()}</span>
            </div>
            {(() => {
              const dateStatus = getDeliveryDateStatus(delivery.expected_date);
              if (!dateStatus) return null;
              return (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-tight ${dateStatus.className}`}>
                  {dateStatus.label}
                </span>
              );
            })()}
          </div>
        </td>

        {/* Supplier */}
        <td className="py-2 px-3">
          {inlineEditingSupplierId === delivery.id ? (
            <InlineSupplierEditor 
              delivery={delivery}
              onSave={handleSaveInlineSupplier!}
              onCancel={() => setInlineEditingSupplierId!(null)}
            />
          ) : (
            <div className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate max-w-[130px] flex items-center gap-2 group/supplier">
              {delivery.supplier_name}
              {!readOnly && setInlineEditingSupplierId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInlineEditingSupplierId(delivery.id);
                  }}
                  className="opacity-0 group-hover/supplier:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer"
                  title="Editar fornecedor inline"
                >
                  <Edit3 size={13} />
                </button>
              )}
            </div>
          )}
        </td>

        {/* Tag / Category Dedicated Section */}
        <td className="py-2 px-3">
          {delivery.categories && delivery.categories.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
              {delivery.categories.slice(0, 2).map((cat, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 truncate max-w-[110px]"
                >
                  <Tag size={9} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{cat}</span>
                </span>
              ))}
              {delivery.categories.length > 2 && (
                <span className="text-[9px] font-bold text-slate-400">+{delivery.categories.length - 2}</span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              <Tag size={9} className="text-slate-400" />
              <span>{t.general || 'Geral'}</span>
            </span>
          )}
        </td>

        {/* Stock / Impact */}
        <td className="py-2 px-3">
          {inlineEditingStockId === delivery.id ? (
            <InlineStockEditor 
              delivery={delivery}
              onSave={handleSaveInlineStock!}
              onCancel={() => setInlineEditingStockId!(null)}
            />
          ) : (
            <div className="space-y-0.5 group/stock">
              <div className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                <span>+{delivery.total_expected_qty || 0} un</span>
                {!readOnly && setInlineEditingStockId && (
                  <div className="opacity-0 group-hover/stock:opacity-100 flex items-center ml-1 border border-slate-200 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineEditingStockId(delivery.id);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      title="Editar quantidade"
                    >
                      <Plus size={13} />
                    </button>
                    <div className="w-px h-3 bg-slate-200 dark:bg-zinc-700"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineEditingStockId(delivery.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Editar quantidade"
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                <span>{delivery.total_received_qty || 0} / {delivery.total_expected_qty || 0} {t.receivedCount ? t.receivedCount.toLowerCase() : 'recebidas'}</span>
              </div>
            </div>
          )}
        </td>

        {/* Products Preview & Reception Badges */}
        <td className="py-2 px-3 max-w-xs">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-600 dark:text-zinc-400 truncate">
              {delivery.product_names?.join(', ') || t.noProductsRegistered || 'Sem produtos registados'}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {delivery.has_deleted_products && (
                <span 
                  className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" 
                  title={delivery.deleted_days_remaining !== undefined && delivery.deleted_days_remaining !== null 
                    ? `Contém produto removido do catálogo. Purga permanente em ${delivery.deleted_days_remaining} dias.` 
                    : "Contém produto removido do catálogo"}
                >
                  <RotateCcw size={9} />
                  <span>{t.deletedItem || 'Item Eliminado'} {delivery.deleted_days_remaining !== undefined && delivery.deleted_days_remaining !== null ? `(${delivery.deleted_days_remaining}d)` : ''}</span>
                </span>
              )}
              {delivery.reception_status === 'full' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle size={10} /> {t.fullReception || 'Receção Total'}
                </span>
              )}
              {delivery.reception_status === 'partial' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock size={10} /> {t.partialReception || 'Receção Parcial'}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Status Badge */}
        <td className="py-2 px-3">
          {getStatusBadge(delivery)}
        </td>

        {/* Action Buttons Column */}
        <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setSelectedDeliveryId(delivery.id)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
              title={t.viewDetails || "Ver Detalhes / Receber Stock"}
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setEditingDeliveryId(delivery.id)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
              title={t.editDelivery || "Editar Encomenda"}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setDeliveryToDelete(delivery)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
              title={t.deleteOrder || "Eliminar Encomenda"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div ref={containerRef} className="flex-1 min-h-0 w-full h-full relative overflow-y-auto overflow-x-auto pb-8">
      <table className="w-full text-left border-collapse min-w-[950px]">
        <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-zinc-900 shadow-xs">
          <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <th className="py-2 px-3 w-10 text-center">
              {!readOnly && (
                <button onClick={handleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                  {selectedIds.length === paginatedDeliveries.length && paginatedDeliveries.length > 0 ? (
                    <CheckSquare size={16} className="text-indigo-600" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              )}
            </th>
            <th className="py-2 px-1 w-7 text-center">
              <span className="sr-only">Sync</span>
            </th>
            <th className="py-2 px-3 font-bold">{t.poNumber || t.poRef || 'Número PO'}</th>
            <th className="py-2 px-3 font-bold">{t.expectedDate || 'Data Prevista'}</th>
            <th className="py-2 px-3 font-bold">{t.supplierName || 'Fornecedor'}</th>
            <th className="py-2 px-3 font-bold">{t.tagCategory || 'Tag / Categoria'}</th>
            <th className="py-2 px-3 font-bold">{t.stockImpact || 'Impacto Stock'}</th>
            <th className="py-2 px-3 font-bold">{t.productsAndReception || 'Produtos & Receção'}</th>
            <th className="py-2 px-3 font-bold">{t.status || 'Estado'}</th>
            <th className="py-2 px-3 font-bold text-right">{t.actions || 'Ações'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
          {groupBySupplier ? (
            (Object.entries(groupedDeliveries) as Array<[string, ExpectedDelivery[]]>).map(([supplier, items]) => {
              const isCollapsed = collapsedSuppliers[supplier];
              return (
                <React.Fragment key={supplier}>
                  <tr className="bg-slate-100/70 dark:bg-zinc-900/70 border-y border-slate-200/60 dark:border-zinc-800">
                    <td colSpan={10} className="py-2 px-4 font-bold text-slate-800 dark:text-zinc-200">
                      <button 
                        onClick={() => toggleCollapseSupplier(supplier)}
                        className="flex items-center gap-2 cursor-pointer w-full text-left"
                      >
                        {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        <Building2 size={15} className="text-indigo-600" />
                        <span className="text-xs">{supplier}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
                          {items.length} {items.length === 1 ? (t.order || 'encomenda') : (t.orders || 'encomendas')}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {!isCollapsed && items.map(renderDeliveryRow)}
                </React.Fragment>
              );
            })
          ) : (
            paginatedDeliveries.map(renderDeliveryRow)
          )}
        </tbody>
      </table>
    </div>
  );
}
