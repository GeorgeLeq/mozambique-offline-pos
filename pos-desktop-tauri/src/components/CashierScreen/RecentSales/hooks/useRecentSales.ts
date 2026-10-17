import { useState, useEffect, useCallback } from 'react';
import { getDB } from '../../../../lib/db';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  SaleReceipt, 
  PaymentFilterType, 
  TimeFilterType, 
  PruneOptionType 
} from '../types';
import { useSalesFilters } from './useSalesFilters';
import { useSalesActions } from './useSalesActions';

export function useRecentSales(isOpen: boolean) {
  const { currentUser } = useAuth();
  const [sales, setSales] = useState<SaleReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pruneOption, setPruneOption] = useState<PruneOptionType>('24h');
  const [selectedSale, setSelectedSale] = useState<SaleReceipt | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const query = `
        SELECT s.*, p.name as product_name, p.barcode as product_barcode 
        FROM sales s 
        LEFT JOIN products p ON s.product_id = p.id 
        ORDER BY s.id DESC 
        LIMIT 600
      `;
      const salesList = await db.select(query) as any[];
      
      const grouped: { [key: string]: SaleReceipt } = {};
      salesList.forEach(sale => {
        const rid = sale.receipt_id || String(sale.id);
        if (!grouped[rid]) {
          grouped[rid] = {
            receipt_id: rid,
            created_at: sale.created_at,
            payment_method: sale.payment_method || 'Dinheiro',
            status: sale.status,
            sync_status: sale.sync_status !== undefined ? sale.sync_status : 1,
            customer_name: sale.customer_name || 'Consumidor Final',
            total: 0,
            items: []
          };
        }
        if (sale.sync_status === 0) {
          grouped[rid].sync_status = 0;
        }
        grouped[rid].total += Number(sale.total_mt) || 0;
        grouped[rid].items.push({
          id: sale.id,
          product_id: sale.product_id,
          product_name: sale.product_name || 'Produto Desconhecido',
          barcode: sale.product_barcode || '',
          quantity: Number(sale.quantity) || 1,
          total_mt: Number(sale.total_mt) || 0,
          status: sale.status,
          price: Number(sale.price) || (Number(sale.total_mt) / (Number(sale.quantity) || 1)),
          created_at: sale.created_at
        });
      });

      const list = Object.values(grouped).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSales(list);
      
      // Update selectedSale reference if available
      setSelectedSale(prev => {
        if (!prev && list.length > 0) return list[0];
        if (prev) {
          const updated = list.find(s => s.receipt_id === prev.receipt_id);
          return updated || list[0] || null;
        }
        return null;
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar vendas recentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        loadSales();
      }, 100);
    } else {
      setSales([]);
      setSelectedSale(null);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, loadSales]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, timeFilter, isOpen]);

  // Hook 2: Filtering and Pagination
  const { filteredSales, paginatedSales, totalPages, pageSize } = useSalesFilters({
    sales,
    searchQuery,
    paymentFilter,
    timeFilter,
    currentPage,
    pageSize: 12,
  });

  // Hook 3: Actions (Print, Share WhatsApp, ID copy, Pruning, Void Items)
  const {
    copiedId,
    whatsappModalOpen,
    setWhatsappModalOpen,
    whatsappUrl,
    wizardOpen,
    setWizardOpen,
    refundReceiptId,
    refundItem,
    handleCopyId,
    handlePrint,
    handleShareWhatsApp,
    handleVoidItem,
    handlePruneSales: executePruneSales,
  } = useSalesActions({
    currentUser,
    onRefresh: loadSales,
  });

  const handlePruneSales = () => {
    executePruneSales(pruneOption);
  };

  return {
    sales,
    loading,
    isFullScreen,
    setIsFullScreen,
    selectedSale,
    setSelectedSale,
    copiedId,
    searchQuery,
    setSearchQuery,
    paymentFilter,
    setPaymentFilter,
    timeFilter,
    setTimeFilter,
    pruneOption,
    setPruneOption,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    filteredSales,
    paginatedSales,
    whatsappModalOpen,
    setWhatsappModalOpen,
    whatsappUrl,
    wizardOpen,
    setWizardOpen,
    refundReceiptId,
    refundItem,
    loadSales,
    handleCopyId,
    handlePrint,
    handleShareWhatsApp,
    handleVoidItem,
    handlePruneSales,
  };
}
