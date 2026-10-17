import { useMemo } from 'react';
import { DebtRecord } from '../../../ClientManager/types';
import { FiadoStatusFilter } from '../types';

interface UseFiadosFiltersProps {
  debts: DebtRecord[];
  searchTerm: string;
  statusFilter: FiadoStatusFilter;
  currentPage: number;
  pageSize?: number;
}

export function useFiadosFilters({
  debts,
  searchTerm,
  statusFilter,
  currentPage,
  pageSize = 12,
}: UseFiadosFiltersProps) {
  // Filter & Search logic
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      // Exclude soft-deleted records
      if (d.is_deleted === 1) return false;

      // Status filtering
      if (statusFilter === 'unpaid' && d.status !== 'unpaid') return false;
      if (statusFilter === 'paid' && d.status !== 'paid') return false;

      // Text search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = d.customer_name?.toLowerCase().includes(term);
        const matchesPhone = d.phone_number?.toLowerCase().includes(term);
        const matchesAddress = d.address?.toLowerCase().includes(term);
        const matchesCashier = d.cashier_name?.toLowerCase().includes(term);
        return matchesName || matchesPhone || matchesAddress || matchesCashier;
      }

      return true;
    });
  }, [debts, searchTerm, statusFilter]);

  // Aggregate outstanding debt calculations
  const totalOutstandingBalance = useMemo(() => {
    return debts
      .filter(d => d.is_deleted !== 1 && d.status === 'unpaid')
      .reduce((sum, d) => sum + (Number(d.amount_mt) || 0), 0);
  }, [debts]);

  const totalPages = Math.max(1, Math.ceil(filteredDebts.length / pageSize));
  
  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDebts.slice(start, start + pageSize);
  }, [filteredDebts, currentPage, pageSize]);

  return {
    filteredDebts,
    paginatedDebts,
    totalPages,
    pageSize,
    totalOutstandingBalance,
  };
}
