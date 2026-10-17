import { useState, useEffect, useMemo } from 'react';
import { DebtRecord } from '../types';

export function useDebtFiltering(debts: DebtRecord[], customItemsPerPage: number = 8) {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'partial' | 'deleted'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = customItemsPerPage;
  
  const [isGrouped, setIsGrouped] = useState(false);
  const [selectedGroupClient, setSelectedGroupClient] = useState<string | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortOrder, isGrouped, selectedGroupClient]);

  const processedList = useMemo(() => {
    let list = debts.filter(d => {
      if (selectedGroupClient && d.customer_name !== selectedGroupClient) return false;

      const isDeleted = d.is_deleted === 1;
      if (filter === 'deleted') {
        if (!isDeleted) return false;
      } else {
        if (isDeleted) return false;
      }

      // Status filtering
      const totalPaid = d.total_paid || 0;
      const currentAmt = d.amount_mt;
      const status = d.status;

      let statusMatch = true;
      if (filter === 'paid') {
        statusMatch = status === 'paid' || currentAmt <= 0;
      } else if (filter === 'unpaid') {
        // Fully unpaid: not marked paid, balance > 0, and 0 paid so far
        statusMatch = status !== 'paid' && currentAmt > 0 && totalPaid === 0;
      } else if (filter === 'partial') {
        // Partially paid: not marked paid, balance > 0, and total_paid > 0
        statusMatch = status !== 'paid' && currentAmt > 0 && totalPaid > 0;
      }
      
      if (!statusMatch) return false;
      
      // Search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = d.customer_name?.toLowerCase().includes(query);
        const phoneMatch = d.phone_number?.includes(query);
        if (!nameMatch && !phoneMatch) return false;
      }
      
      return true;
    });
    
    // Sorting
    list.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime() || 0;
      const timeB = new Date(b.created_at || 0).getTime() || 0;
      if (sortOrder === 'date-desc') return timeB - timeA;
      if (sortOrder === 'date-asc') return timeA - timeB;
      if (sortOrder === 'amount-desc') return (b.amount_mt || 0) - (a.amount_mt || 0);
      if (sortOrder === 'amount-asc') return (a.amount_mt || 0) - (b.amount_mt || 0);
      return 0;
    });
    
    return list;
  }, [debts, filter, searchQuery, sortOrder, selectedGroupClient]);

  const groupedClients = useMemo(() => {
    if (!isGrouped || selectedGroupClient) return [];
    
    const groups: Record<string, DebtRecord[]> = {};
    processedList.forEach(d => {
      const name = d.customer_name || 'Unknown';
      if (!groups[name]) groups[name] = [];
      groups[name].push(d);
    });
    
    return Object.entries(groups)
      .map(([name, records]) => ({ clientName: name, debts: records }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [processedList, isGrouped, selectedGroupClient]);

  const totalPages = Math.ceil(
    (isGrouped && !selectedGroupClient ? groupedClients.length : processedList.length) / itemsPerPage
  );
  const paginatedDebts = processedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedGroupedClients = groupedClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    isGrouped,
    setIsGrouped,
    selectedGroupClient,
    setSelectedGroupClient,
    processedList,
    groupedClients,
    totalPages,
    paginatedDebts,
    paginatedGroupedClients,
  };
}
