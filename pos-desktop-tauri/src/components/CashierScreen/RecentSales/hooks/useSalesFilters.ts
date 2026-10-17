import { useMemo } from 'react';
import { SaleReceipt, SaleItem, PaymentFilterType, TimeFilterType } from '../types';

interface UseSalesFiltersProps {
  sales: SaleReceipt[];
  searchQuery: string;
  paymentFilter: PaymentFilterType;
  timeFilter: TimeFilterType;
  currentPage: number;
  pageSize?: number;
}

export function useSalesFilters({
  sales,
  searchQuery,
  paymentFilter,
  timeFilter,
  currentPage,
  pageSize = 12,
}: UseSalesFiltersProps) {
  // Filtered sales logic
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Payment filter
      if (paymentFilter !== 'all') {
        const method = (sale.payment_method || '').toLowerCase();
        if (paymentFilter === 'cash' && !method.includes('cash') && !method.includes('din')) return false;
        if (paymentFilter === 'mpesa' && !method.includes('mpesa') && !method.includes('m-pesa')) return false;
        if (paymentFilter === 'emola' && !method.includes('emola') && !method.includes('e-mola')) return false;
        if (paymentFilter === 'fiado' && !method.includes('fiado')) return false;
        if (paymentFilter === 'mixed' && !method.includes('mixed')) return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const date = new Date(sale.created_at);
        const now = new Date();
        const hour = date.getHours();
        
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        const yesterdayStart = new Date(now); yesterdayStart.setDate(now.getDate() - 1); yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(now); yesterdayEnd.setDate(now.getDate() - 1); yesterdayEnd.setHours(23, 59, 59, 999);

        switch (timeFilter) {
          case 'today_morning':
            if (!(date >= todayStart && date <= todayEnd && hour >= 6 && hour < 12)) return false;
            break;
          case 'today_afternoon':
            if (!(date >= todayStart && date <= todayEnd && hour >= 12 && hour < 18)) return false;
            break;
          case 'today_night':
            if (!(date >= todayStart && date <= todayEnd && (hour >= 18 || hour < 6))) return false;
            break;
          case 'yesterday_morning':
            if (!(date >= yesterdayStart && date <= yesterdayEnd && hour >= 6 && hour < 12)) return false;
            break;
          case 'yesterday_afternoon':
            if (!(date >= yesterdayStart && date <= yesterdayEnd && hour >= 12 && hour < 18)) return false;
            break;
          case 'yesterday_night':
            if (!(date >= yesterdayStart && date <= yesterdayEnd && (hour >= 18 || hour < 6))) return false;
            break;
          case 'last_2_days':
            if (date < new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) return false;
            break;
          case 'last_7_days':
            if (date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
            break;
          case 'last_15_days':
            if (date < new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)) return false;
            break;
          default: break;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRid = String(sale.receipt_id || '').toLowerCase().includes(q);
        const matchesCustomer = String(sale.customer_name || '').toLowerCase().includes(q);
        const matchesItems = sale.items.some((it: SaleItem) => 
          String(it.product_name || '').toLowerCase().includes(q) || 
          String(it.barcode || '').toLowerCase().includes(q)
        );
        if (!matchesRid && !matchesCustomer && !matchesItems) return false;
      }

      return true;
    });
  }, [sales, searchQuery, paymentFilter, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  return {
    filteredSales,
    paginatedSales,
    totalPages,
    pageSize,
  };
}
