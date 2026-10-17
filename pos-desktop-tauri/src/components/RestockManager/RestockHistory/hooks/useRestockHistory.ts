import { useState, useEffect, useMemo } from 'react';
import { getDB } from '../../../../lib/db';
import toast from 'react-hot-toast';
import { RestockLog } from '../types';

export type HistoryCategoryFilter = 'all' | 'restock' | 'products' | 'stock';

export function useRestockHistory() {
  const [logs, setLogs] = useState<RestockLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<HistoryCategoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<RestockLog | null>(null);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const [retentionDays, setRetentionDays] = useState<number>(() => {
    const saved = localStorage.getItem('mozpos_history_retention_days');
    return saved ? parseInt(saved, 10) : 30;
  });

  const itemsPerPage = 9; // Aligned with ProductList density

  const handleSetRetentionDays = (days: number) => {
    setRetentionDays(days);
    localStorage.setItem('mozpos_history_retention_days', days.toString());
    toast.success(`Política de retenção atualizada para ${days} dias.`);
  };

  const loadLogsData = async () => {
    try {
      setIsLoading(true);
      const db = await getDB();
      
      // Auto-purge audit logs older than retention window to keep local SQLite fast & lean
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - retentionMs).toISOString();
      await db.execute(
        `DELETE FROM audit_logs 
         WHERE created_at < ? 
           AND (action LIKE 'PRODUCT%' OR action LIKE '%DELIVERY%' OR action LIKE '%RESTOCK%' OR action LIKE '%STOCK%' OR action LIKE 'ORDER%')`,
        [cutoffDate]
      ).catch(() => {});

      const results = await db.select(`
        SELECT 
          a.id, 
          a.action,
          a.details, 
          a.created_at, 
          COALESCE(a.user_name, u.name, 'Sistema') as user_name,
          a.sync_status
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.action IN (
          'RESTOCK_RECEIVE',
          'ORDER_CREATED',
          'ORDER_UPDATED',
          'EXPECTED_DELIVERY_DELETED',
          'PRODUCT_CREATED',
          'PRODUCT_UPDATED',
          'PRODUCT_DELETED',
          'PRODUCT_RESTORED',
          'PRODUCT_PERMANENT_DELETED',
          'BULK_PRODUCT_RESTORED',
          'BULK_PRODUCT_WIPED',
          'STOCK_ADJUSTMENT',
          'BARCODE_LINKED',
          'BARCODE_CREATED',
          'BARCODE_DELETED'
        ) 
        OR a.action LIKE 'PRODUCT%' 
        OR a.action LIKE '%DELIVERY%' 
        OR a.action LIKE '%RESTOCK%' 
        OR a.action LIKE '%STOCK%'
        OR a.action LIKE 'ORDER%'
        ORDER BY a.created_at DESC
      `) as RestockLog[];

      // Load products and expected deliveries to enrich logs with pricing, cost and stock metrics
      const allProducts = await db.select(
        'SELECT id, name, price_mt, cost_price_mt, stock_quantity, is_fractional, attributes FROM products'
      ).catch(() => []) as any[];

      const allDeliveries = await db.select(
        'SELECT id, po_number, supplier_name, total_cost_mt, total_price_mt, total_expected_qty FROM expected_deliveries'
      ).catch(() => []) as any[];

      const prodMap = new Map<string, any>();
      for (const p of allProducts) {
        if (p.name) prodMap.set(p.name.toLowerCase().trim(), p);
      }

      const deliveryMap = new Map<string, any>();
      for (const d of allDeliveries) {
        if (d.po_number) {
          deliveryMap.set(String(d.po_number), d);
          deliveryMap.set(`po-${d.po_number}`.toLowerCase(), d);
        }
      }

      const enrichedLogs = results.map(log => {
        const enriched: RestockLog = { ...log };
        
        let parsed: any = null;
        try {
          if (log.details?.startsWith('{') && log.details?.endsWith('}')) {
            parsed = JSON.parse(log.details);
          }
        } catch {}

        if (parsed) {
          if (parsed.price_mt !== undefined) enriched.price_mt = Number(parsed.price_mt);
          if (parsed.cost_price_mt !== undefined) enriched.cost_price_mt = Number(parsed.cost_price_mt);
          if (parsed.stock_quantity !== undefined || parsed.qty !== undefined || parsed.expected_quantity !== undefined) {
            enriched.stock_impact = parsed.stock_quantity ?? parsed.qty ?? parsed.expected_quantity;
          }
          if (parsed.name || parsed.product_name) enriched.item_name = parsed.name || parsed.product_name;
          if (parsed.unit || parsed.unitMetric) enriched.unit = parsed.unit || parsed.unitMetric;
        }

        // Match product by name from details string
        if (enriched.price_mt === undefined || enriched.cost_price_mt === undefined) {
          for (const [prodName, prod] of prodMap.entries()) {
            if (log.details?.toLowerCase().includes(prodName)) {
              if (enriched.price_mt === undefined && prod.price_mt !== undefined) {
                enriched.price_mt = prod.price_mt;
              }
              if (enriched.cost_price_mt === undefined && prod.cost_price_mt !== undefined) {
                enriched.cost_price_mt = prod.cost_price_mt;
              }
              if (!enriched.unit) {
                enriched.unit = prod.is_fractional ? 'Kg/Fracionado' : 'Unidade (un)';
              }
              if (!enriched.item_name) {
                enriched.item_name = prod.name;
              }
              break;
            }
          }
        }

        // Match expected delivery by PO
        if (enriched.cost_price_mt === undefined || enriched.price_mt === undefined) {
          const poMatch = log.details?.match(/PO[ -]?(\d+)/i);
          if (poMatch) {
            const poNum = poMatch[1];
            const del = deliveryMap.get(poNum);
            if (del) {
              if (enriched.cost_price_mt === undefined && del.total_cost_mt !== undefined) {
                enriched.cost_price_mt = del.total_cost_mt;
              }
              if (enriched.price_mt === undefined && del.total_price_mt !== undefined) {
                enriched.price_mt = del.total_price_mt;
              }
              if (enriched.stock_impact === undefined && del.total_expected_qty !== undefined) {
                enriched.stock_impact = `+${del.total_expected_qty}`;
              }
            }
          }
        }

        return enriched;
      });
      
      setLogs(enrichedLogs);
    } catch (err) {
      console.error('Failed to load restock history', err);
      toast.error('Erro ao carregar o histórico de auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogsData();
  }, [retentionDays]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const handleDeleteLog = async (id: string) => {
    try {
      const db = await getDB();
      await db.execute('DELETE FROM audit_logs WHERE id = ?', [id]);
      toast.success('Registo de histórico eliminado com sucesso.');
      setSelectedLog(null);
      setLogToDeleteId(null);
      loadLogsData();
    } catch (err) {
      console.error('Failed to delete restock log', err);
      toast.error('Erro ao eliminar registo.');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (categoryFilter === 'restock') {
        const isRestock = (log.action?.includes('RESTOCK') || log.action?.includes('DELIVERY') || log.action?.includes('ORDER'));
        if (!isRestock) return false;
      } else if (categoryFilter === 'products') {
        const isProduct = (log.action?.includes('PRODUCT') || log.action?.includes('BARCODE'));
        if (!isProduct) return false;
      } else if (categoryFilter === 'stock') {
        const isStock = (log.action?.includes('STOCK') || log.action === 'STOCK_ADJUSTMENT');
        if (!isStock) return false;
      }

      // Search term
      const searchLower = searchTerm.toLowerCase();
      const matchDetails = String(log.details || '').toLowerCase().includes(searchLower);
      const matchUser = String(log.user_name || '').toLowerCase().includes(searchLower);
      const matchAction = String(log.action || '').toLowerCase().includes(searchLower);

      return matchDetails || matchUser || matchAction;
    });
  }, [logs, categoryFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage, itemsPerPage]);

  return {
    logs,
    filteredLogs,
    paginatedLogs,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedLog,
    setSelectedLog,
    logToDeleteId,
    setLogToDeleteId,
    retentionDays,
    handleSetRetentionDays,
    handleDeleteLog,
    reloadLogs: loadLogsData
  };
}
