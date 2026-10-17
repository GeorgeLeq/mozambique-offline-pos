import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDB } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useTableWatcher } from '../../../lib/dbEvents';
import { NewPurchaseOrderModal } from '../NewOrder';
import { ExpectedDeliveryDetailsModal } from '../DetailsModal';
import { EditPurchaseOrderModal } from '../EditOrder';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { ExpectedDeliveriesToolbar } from './ExpectedDeliveriesToolbar';
import { ExpectedDeliveriesTable } from './ExpectedDeliveriesTable';
import { CheckSquare, Trash2, Edit3, Minimize2 } from 'lucide-react';
import { logAudit } from '../../../lib/audit';
import { useI18n } from '../../../i18n';
import { DeliveryUsageSummary } from '../services/deliveryLimitService';

import { ExpectedDeliveriesGuideModal } from './ExpectedDeliveriesGuideModal';
import { useDeliveryExports } from './hooks/useDeliveryExports';

export interface ExpectedDelivery {
  id: string;
  po_number?: number;
  invoice_number?: string;
  supplier_name: string;
  expected_date: string;
  status: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
  product_names?: string[];
  reception_status?: 'full' | 'partial' | 'none';
  has_deleted_products?: boolean;
  deleted_days_remaining?: number | null;
  sync_status?: number;
  total_cost_mt?: number;
  total_price_mt?: number;
  margin_pct?: number;
  total_expected_qty?: number;
  total_received_qty?: number;
  categories?: string[];
}

interface ExpectedDeliveriesProps {
  isAdminUnlocked?: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
  isFocusMode?: boolean;
  setIsFocusMode?: (val: boolean) => void;
  activeTab?: 'checker' | 'inventory' | 'orders';
  onSelectTab?: (tab: 'checker' | 'inventory' | 'orders') => void;
  orderSubTab?: 'pending' | 'history';
  onSelectOrderSubTab?: (tab: 'pending' | 'history') => void;
  deliveryUsage?: DeliveryUsageSummary | null;
  onOpenDeliveryUpgradeModal?: () => void;
}

export function ExpectedDeliveries({ 
  isAdminUnlocked = false, 
  onPromptAdminPin, 
  isFocusMode = false, 
  setIsFocusMode,
  activeTab = 'orders',
  onSelectTab,
  orderSubTab = 'pending',
  onSelectOrderSubTab,
  deliveryUsage,
  onOpenDeliveryUpgradeModal
}: ExpectedDeliveriesProps) {
  const t = useI18n();
  const { currentUser } = useAuth();
  const [deliveries, setDeliveries] = useState<ExpectedDelivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  
  // Inline editing state
  const [inlineEditingSupplierId, setInlineEditingSupplierId] = useState<string | null>(null);
  const [inlineEditingStockId, setInlineEditingStockId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [deliveryToDelete, setDeliveryToDelete] = useState<ExpectedDelivery | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Record<string, boolean>>({});
  
  const { exportPDF, exportCSV, importCSV, downloadTemplate } = useDeliveryExports(selectedIds.length > 0 ? deliveries.filter(d => selectedIds.includes(d.id)) : deliveries);
  
  useEffect(() => {
    const handleExportPDF = () => exportPDF();
    const handleExportCSV = () => exportCSV();
    const handleImportCSV = () => importCSV();
    const handleDownloadTemplate = () => downloadTemplate();

    document.addEventListener('export-expected-pdf', handleExportPDF);
    document.addEventListener('export-expected-csv', handleExportCSV);
    document.addEventListener('import-expected-csv', handleImportCSV);
    document.addEventListener('download-expected-template', handleDownloadTemplate);

    return () => {
      document.removeEventListener('export-expected-pdf', handleExportPDF);
      document.removeEventListener('export-expected-csv', handleExportCSV);
      document.removeEventListener('import-expected-csv', handleImportCSV);
      document.removeEventListener('download-expected-template', handleDownloadTemplate);
    };
  }, [exportPDF, exportCSV, importCSV, downloadTemplate]);

  const toggleHighlightId = (id: string) => {
    setHighlightedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Pagination State (Consistent with ProductList: 9 standard, 12 expanded)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isFocusMode ? 12 : 9;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleCollapseSupplier = (supplier: string) => {
    setCollapsedSuppliers(prev => ({ ...prev, [supplier]: !prev[supplier] }));
  };

  const isAuthorized = currentUser?.role === 'Admin' || isAdminUnlocked;

  const handleDeleteDelivery = async (delivery: ExpectedDelivery, justification?: string) => {
    try {
      const db = await getDB();
      const deliveryItems = await db.select('SELECT product_id FROM expected_delivery_items WHERE delivery_id = ?', [delivery.id]) as Array<{product_id: string}>;
      
      await db.execute('DELETE FROM expected_delivery_items WHERE delivery_id = ?', [delivery.id]);
      await db.execute('DELETE FROM expected_deliveries WHERE id = ?', [delivery.id]);

      for (const item of deliveryItems) {
        if (item.product_id) {
          try {
            const otherUses = await db.select('SELECT COUNT(*) as cnt FROM expected_delivery_items WHERE product_id = ?', [item.product_id]) as any[];
            const salesUses = await db.select('SELECT COUNT(*) as cnt FROM sale_items WHERE product_id = ?', [item.product_id]).catch(() => [{cnt: 0}]) as any[];
            const prodRes = await db.select('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]) as any[];
            
            if (
              (otherUses[0]?.cnt || 0) === 0 && 
              (salesUses[0]?.cnt || 0) === 0 && 
              (prodRes[0]?.stock_quantity || 0) === 0
            ) {
              await db.execute('DELETE FROM products WHERE id = ?', [item.product_id]);
              await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [item.product_id]);
            }
          } catch (cleanErr) {
            console.warn('Product cleanup warning:', cleanErr);
          }
        }
      }

      await logAudit(
        currentUser?.id, 
        'EXPECTED_DELIVERY_DELETED', 
        `Eliminada encomenda PO-${delivery.po_number || 1001}${justification ? ` - Motivo: ${justification}` : ''}`
      ).catch(() => {});

      try {
        await Promise.race([
          Promise.all([
            supabase.from('expected_delivery_items').delete().eq('delivery_id', delivery.id),
            supabase.from('expected_deliveries').delete().eq('id', delivery.id)
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 3000))
        ]);
      } catch (cloudErr) {
        console.warn('Cloud delete failed or timed out:', cloudErr);
      }

      toast.success(`Encomenda PO-${delivery.po_number || 1001} eliminada com sucesso`);
      setDeliveryToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t.errorDeletingOrder || 'Erro ao eliminar encomenda');
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const db = await getDB();
      const results = await db.select(`
        SELECT ed.*, COALESCE(u.name, ed.created_by, 'Admin') as creator_name
        FROM expected_deliveries ed
        LEFT JOIN users u ON ed.created_by = u.id
        ORDER BY ed.created_at DESC
      `) as ExpectedDelivery[];

      console.log('[ExpectedDeliveries] Loaded raw deliveries:', results);

      const enhanced = await Promise.all(results.map(async (d) => {
        const items = (await db.select(`
          SELECT 
            ei.expected_quantity, 
            ei.received_quantity, 
            p.stock_quantity, 
            p.price_mt, 
            p.cost_price_mt, 
            p.category, 
            COALESCE(ei.name, p.name, 'Produto') as name, 
            p.is_deleted, 
            p.deleted_at,
            p.updated_at,
            p.id as product_id
          FROM expected_delivery_items ei
          LEFT JOIN products p ON ei.product_id = p.id
          WHERE ei.delivery_id = ?
        `, [d.id])) as any[];

        console.log(`[ExpectedDeliveries] Items for delivery ${d.id}:`, items);

        let totalExpected = 0;
        let totalReceived = 0;
        let totalCost = 0;
        let totalPrice = 0;
        let fullyReceivedCount = 0;
        let hasDeletedProducts = false;
        let minDeletedDaysRemaining: number | null = null;
        const savedRetention = localStorage.getItem('mozpos_history_retention_days');
        const retentionDays = savedRetention ? parseInt(savedRetention, 10) : 30;
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();
        const categoriesSet = new Set<string>();

        for (const item of items) {
          const exp = Number(item.expected_quantity) || 0;
          const storedReceived = Number(item.received_quantity) || 0;
          const effReceived = (d.status === 'received' || d.status === 'concluded')
            ? (storedReceived > 0 ? storedReceived : exp)
            : (storedReceived > 0 ? storedReceived : (Number(item.stock_quantity) || 0));

          if (!item.name || Boolean(item.is_deleted)) {
            hasDeletedProducts = true;
            if (item.is_deleted) {
              const deletedDate = item.deleted_at 
                ? new Date(item.deleted_at).getTime() 
                : (item.updated_at ? new Date(item.updated_at).getTime() : nowMs);
              const diffMs = (deletedDate + retentionMs) - nowMs;
              const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              if (minDeletedDaysRemaining === null || days < minDeletedDaysRemaining) {
                minDeletedDaysRemaining = days;
              }
            }
          }

          const cost = Number(item.cost_price_mt) || 0;
          const price = Number(item.price_mt) || 0;

          totalExpected += exp;
          totalReceived += effReceived;
          totalCost += exp * cost;
          totalPrice += exp * price;

          if (item.category && typeof item.category === 'string' && item.category.trim() !== '') {
            categoriesSet.add(item.category.trim());
          }

          if (effReceived >= exp && exp > 0) {
            fullyReceivedCount++;
          }
        }

        let reception_status: 'full' | 'partial' | 'none' = 'none';
        if (items.length > 0) {
          if (fullyReceivedCount === items.length) {
            reception_status = 'full';
          } else if (totalReceived > 0) {
            reception_status = 'partial';
          }
        }

        const margin_pct = totalPrice > 0 ? Math.round(((totalPrice - totalCost) / totalPrice) * 100) : 0;

        return {
          ...d,
          product_names: items.map(i => i.name),
          reception_status,
          has_deleted_products: hasDeletedProducts,
          deleted_days_remaining: minDeletedDaysRemaining,
          total_cost_mt: totalCost,
          total_price_mt: totalPrice,
          margin_pct,
          total_expected_qty: totalExpected,
          total_received_qty: totalReceived,
          categories: Array.from(categoriesSet)
        };
      }));

      setDeliveries(enhanced);
    } catch (err) {
      console.error(err);
      toast.error(t.errorLoadingOrders || 'Erro ao carregar encomendas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live module watchers for instant real-time sync across SQLite tables
  useTableWatcher('expected_deliveries', loadData);
  useTableWatcher('expected_delivery_items', loadData);
  useTableWatcher('products', loadData);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      received: deliveries.filter(d => d.status === 'received' || d.status === 'concluded').length,
      discrepancy: deliveries.filter(d => d.status === 'discrepancy').length,
    };
  }, [deliveries]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'pending' ? d.status === 'pending' :
        statusFilter === 'received' ? (d.status === 'received' || d.status === 'concluded') :
        statusFilter === 'discrepancy' ? d.status === 'discrepancy' : true;

      if (!matchStatus) return false;

      if (!searchTerm) return true;

      const lowerSearch = searchTerm.toLowerCase();
      const matchSearch = 
        d.supplier_name.toLowerCase().includes(lowerSearch) ||
        String(d.po_number || '').toLowerCase().includes(lowerSearch) ||
        (d.invoice_number && d.invoice_number.toLowerCase().includes(lowerSearch)) ||
        (d.product_names && d.product_names.some(n => n.toLowerCase().includes(lowerSearch)));

      return matchSearch;
    });
  }, [deliveries, statusFilter, searchTerm]);

  // Reset page when search or status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / itemsPerPage));
  const paginatedDeliveries = useMemo(() => {
    if (groupBySupplier) return filteredDeliveries; // When grouping, show all within groups
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(start, start + itemsPerPage);
  }, [filteredDeliveries, currentPage, itemsPerPage, groupBySupplier]);

  const handleSelectAll = () => {
    const currentList = groupBySupplier ? filteredDeliveries : paginatedDeliveries;
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map(d => d.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveInlineSupplier = async (deliveryId: string, newSupplier: string) => {
    if (!newSupplier.trim()) {
      setInlineEditingSupplierId(null);
      return;
    }
    try {
      const db = await getDB();
      await db.execute('UPDATE expected_deliveries SET supplier_name = ?, sync_status = 0 WHERE id = ?', [newSupplier.trim(), deliveryId]);
      toast.success('Fornecedor atualizado com sucesso.');
      setInlineEditingSupplierId(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar fornecedor.');
    }
  };

  const handleSaveInlineStock = async (delivery: ExpectedDelivery, newStockStr: string) => {
    const newStock = parseFloat(newStockStr);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Quantidade inválida.');
      setInlineEditingStockId(null);
      return;
    }
    try {
      const db = await getDB();
      const items = await db.select('SELECT id FROM expected_delivery_items WHERE delivery_id = ?', [delivery.id]) as any[];
      if (items.length === 0) {
        toast.error('Encomenda não tem produtos.');
        setInlineEditingStockId(null);
        return;
      }
      if (items.length > 1) {
        toast.error('Use o botão Editar para encomendas com múltiplos produtos.');
        setInlineEditingStockId(null);
        return;
      }
      await db.execute('UPDATE expected_delivery_items SET expected_quantity = ?, sync_status = 0 WHERE id = ?', [newStock, items[0].id]);
      await db.execute('UPDATE expected_deliveries SET sync_status = 0 WHERE id = ?', [delivery.id]);
      toast.success('Quantidade atualizada com sucesso.');
      setInlineEditingStockId(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar quantidade.');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    try {
      const db = await getDB();
      for (const id of selectedIds) {
        await db.execute(
          'UPDATE expected_deliveries SET status = ?, sync_status = 0 WHERE id = ?',
          [newStatus, id]
        );
        await db.execute(
          'UPDATE expected_delivery_items SET status = ?, sync_status = 0 WHERE delivery_id = ?',
          [newStatus, id]
        );
      }
      toast.success(`Estado atualizado para ${selectedIds.length} encomendas`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t.errorUpdatingBulkStatus || 'Erro ao atualizar estado em lote');
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async (justification?: string) => {
    try {
      const db = await getDB();
      for (const id of selectedIds) {
        const deliveryItems = await db.select('SELECT product_id FROM expected_delivery_items WHERE delivery_id = ?', [id]) as Array<{product_id: string}>;
        
        await db.execute('DELETE FROM expected_delivery_items WHERE delivery_id = ?', [id]);
        await db.execute('DELETE FROM expected_deliveries WHERE id = ?', [id]);

        for (const item of deliveryItems) {
          if (item.product_id) {
            try {
              const otherUses = await db.select('SELECT COUNT(*) as cnt FROM expected_delivery_items WHERE product_id = ?', [item.product_id]) as any[];
              const salesUses = await db.select('SELECT COUNT(*) as cnt FROM sale_items WHERE product_id = ?', [item.product_id]).catch(() => [{cnt: 0}]) as any[];
              const prodRes = await db.select('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]) as any[];
              
              if (
                (otherUses[0]?.cnt || 0) === 0 && 
                (salesUses[0]?.cnt || 0) === 0 &&
                (prodRes[0]?.stock_quantity || 0) === 0
              ) {
                await db.execute('DELETE FROM products WHERE id = ?', [item.product_id]);
                await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [item.product_id]);
              }
            } catch (cleanErr) {
              console.warn('Product cleanup warning:', cleanErr);
            }
          }
        }
      }

      await logAudit(
        currentUser?.id, 
        'BULK_EXPECTED_DELIVERIES_DELETED', 
        `Eliminadas ${selectedIds.length} encomendas em lote${justification ? ` - Motivo: ${justification}` : ''}`
      ).catch(() => {});

      toast.success(`${selectedIds.length} encomendas eliminadas`);
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t.errorDeletingBulk || 'Erro ao eliminar em lote');
    }
  };

  const handleQuickStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      const db = await getDB();
      await db.execute(
        'UPDATE expected_deliveries SET status = ?, sync_status = 0 WHERE id = ?',
        [newStatus, deliveryId]
      );
      await db.execute(
        'UPDATE expected_delivery_items SET status = ?, sync_status = 0 WHERE delivery_id = ?',
        [newStatus, deliveryId]
      );

      if (newStatus === 'received') {
        const items = await db.select('SELECT product_id, expected_quantity FROM expected_delivery_items WHERE delivery_id = ?', [deliveryId]) as any[];
        for (const item of items) {
          if (item.product_id) {
            await db.execute(
              'UPDATE products SET stock_quantity = stock_quantity + ?, requires_verification = 0, sync_status = 0 WHERE id = ?',
              [item.expected_quantity, item.product_id]
            );
          }
        }
        toast.success('Stock creditado e verificação desbloqueada com sucesso!');
      }

      loadData();
    } catch (err) {
      console.error(err);
      toast.error(t.errorUpdatingStatus || 'Erro ao atualizar estado');
    }
  };

  const groupedDeliveries = useMemo(() => {
    return filteredDeliveries.reduce((acc, d) => {
      const sup = d.supplier_name || (t.otherSupplier || 'Outro');
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(d);
      return acc;
    }, {} as Record<string, ExpectedDelivery[]>);
  }, [filteredDeliveries, t]);

  const getStatusBadge = (delivery: ExpectedDelivery) => {
    return (
      <select
        value={delivery.status}
        onChange={(e) => handleQuickStatusChange(delivery.id, e.target.value)}
        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border-0 ${
          delivery.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
          (delivery.status === 'received' || delivery.status === 'concluded') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
          'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
      >
        <option value="pending" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{t.statusPending || 'Pendente'}</option>
        <option value="received" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{t.statusReceived || 'Recebido'}</option>
        <option value="discrepancy" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Divergência</option>
      </select>
    );
  };

  return (
    <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden ${
      isFocusMode
        ? 'h-full w-full rounded-none border-0'
        : 'h-full flex'
    }`}>
      {/* Top Filter & Action Bar (Matching ProductToolbar) */}
      <ExpectedDeliveriesToolbar
        deliveriesCount={deliveries.length}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusCounts={statusCounts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupBySupplier={groupBySupplier}
        setGroupBySupplier={setGroupBySupplier}
        isLoading={isLoading}
        onRefresh={loadData}
        onOpenGuide={() => setIsGuideOpen(true)}
        searchInputRef={searchInputRef}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode?.(!isFocusMode)}
        isAuthorized={isAuthorized}
        onPromptAdminPin={onPromptAdminPin}
        onNewOrder={() => setIsModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        orderSubTab={orderSubTab}
        onSelectOrderSubTab={onSelectOrderSubTab}
        deliveryUsage={deliveryUsage}
        onOpenDeliveryUpgradeModal={onOpenDeliveryUpgradeModal}
        onExportPDF={exportPDF}
        onExportCSV={exportCSV}
        onImportCSV={importCSV}
        onDownloadTemplate={downloadTemplate}
      />

      {/* Bulk Action Bar (when items selected) - Matching ProductList Bulk Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/30 px-6 py-2.5 flex items-center justify-between text-xs animate-fadeIn shrink-0">
          <button
            onClick={() => setSelectedIds([])}
            className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 px-2 py-1 -ml-2 rounded-lg transition-all cursor-pointer"
            title={t.clickToDeselectAll || "Clique para desmarcar todas as encomendas selecionadas"}
          >
            <CheckSquare size={16} />
            <span>{selectedIds.length} {t.selectedOrders || 'encomendas selecionadas'}</span>
            <span className="text-[10px] opacity-60 font-normal underline ml-1">({t.deselectAll || 'desmarcar todas'})</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('received')}
              className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-indigo-100 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {t.markReceived || 'Marcar Recebidas'}
            </button>
            <button
              onClick={() => handleBulkStatusChange('pending')}
              className="px-3 py-1 bg-white dark:bg-zinc-900 hover:bg-indigo-100 text-amber-600 dark:text-amber-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {t.markPending || 'Marcar Pendentes'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} /> {t.delete || 'Eliminar'}
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ExpectedDeliveriesTable
          paginatedDeliveries={paginatedDeliveries}
          selectedIds={selectedIds}
          highlightedIds={highlightedIds}
          toggleHighlightId={toggleHighlightId}
          handleSelectAll={handleSelectAll}
          handleToggleSelect={handleToggleSelect}
          groupBySupplier={groupBySupplier}
          groupedDeliveries={groupedDeliveries}
          collapsedSuppliers={collapsedSuppliers}
          toggleCollapseSupplier={toggleCollapseSupplier}
          getStatusBadge={getStatusBadge}
          setSelectedDeliveryId={setSelectedDeliveryId}
          setEditingDeliveryId={setEditingDeliveryId}
          setDeliveryToDelete={setDeliveryToDelete}
          isLoading={isLoading}
          readOnly={!isAuthorized}
          inlineEditingSupplierId={inlineEditingSupplierId}
          setInlineEditingSupplierId={setInlineEditingSupplierId}
          handleSaveInlineSupplier={handleSaveInlineSupplier}
          inlineEditingStockId={inlineEditingStockId}
          setInlineEditingStockId={setInlineEditingStockId}
          handleSaveInlineStock={handleSaveInlineStock}
        />
      </div>

      {/* Pagination Footer (Matching ProductList structure) */}
      {!groupBySupplier && (totalPages > 1 || filteredDeliveries.length > 0) && (
        <div className="px-6 py-3 border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            {t.showingPage || 'Mostrando página'} <strong className="text-slate-900 dark:text-zinc-100">{currentPage}</strong> {t.of || 'de'} {totalPages} ({filteredDeliveries.length} {filteredDeliveries.length === 1 ? (t.order || 'encomenda') : (t.orders || 'encomendas')})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold"
            >
              {t.previous || 'Anterior'}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer font-bold"
            >
              {t.next || 'Próxima'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <NewPurchaseOrderModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {selectedDeliveryId && (
        <ExpectedDeliveryDetailsModal
          deliveryId={selectedDeliveryId}
          onClose={() => { setSelectedDeliveryId(null); loadData(); }}
          onStatusUpdated={() => { setSelectedDeliveryId(null); loadData(); }}
        />
      )}

      {editingDeliveryId && (
        <EditPurchaseOrderModal
          deliveryId={editingDeliveryId}
          onClose={() => { setEditingDeliveryId(null); loadData(); }}
          onSuccess={loadData}
        />
      )}

      {deliveryToDelete && (
        <DeleteConfirmModal
          title={t.deleteOrder || "Eliminar Encomenda"}
          message={`Tem a certeza que deseja eliminar a encomenda PO-${deliveryToDelete.po_number || 1001}?`}
          onConfirm={(justification) => handleDeleteDelivery(deliveryToDelete, justification)}
          onClose={() => setDeliveryToDelete(null)}
          justificationPlaceholder="Indique o motivo da eliminação (ex: encomenda cancelada pelo fornecedor, erro no registo...)"
        />
      )}

      {isBulkDeleteConfirmOpen && (
        <DeleteConfirmModal
          title={t.bulkDeleteOrders || "Eliminar Encomendas em Lote"}
          message={`Tem a certeza que deseja eliminar permanentemente as ${selectedIds.length} encomendas selecionadas?`}
          onConfirm={(justification) => confirmBulkDelete(justification)}
          onClose={() => setIsBulkDeleteConfirmOpen(false)}
          justificationPlaceholder="Indique o motivo da eliminação em lote..."
        />
      )}

      {/* Expected Deliveries Acolhimento & PO Guide Modal */}
      <ExpectedDeliveriesGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
