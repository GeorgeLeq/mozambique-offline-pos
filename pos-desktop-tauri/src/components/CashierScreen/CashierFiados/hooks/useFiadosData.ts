import React, { useState, useEffect } from 'react';
import { useDebtsData } from '../../../ClientManager/hooks/useDebtsData';
import { DebtRecord } from '../../../ClientManager/types';
import { FiadoStatusFilter } from '../types';
import { useFiadosFilters } from './useFiadosFilters';
import { useFiadosActions } from './useFiadosActions';

export function useFiadosData(isOpen: boolean, currentUser: any) {
  const { debts, loadDebts } = useDebtsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FiadoStatusFilter>('unpaid');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('cash');
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Items breakdown modal state
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemsModalDebt, setItemsModalDebt] = useState<DebtRecord | null>(null);

  // Fixed page size for clean pagination without table scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Load debts on open & reset filters
  useEffect(() => {
    if (isOpen) {
      loadDebts();
      setSearchTerm('');
      setStatusFilter('unpaid');
      setSelectedDebt(null);
      setIsSettleOpen(false);
      setItemsModalOpen(false);
      setItemsModalDebt(null);
    }
  }, [isOpen, loadDebts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, isOpen]);

  // Set settle defaults when a debt is selected
  useEffect(() => {
    if (selectedDebt) {
      setSettleAmount(selectedDebt.amount_mt.toString());
      setSettleMethod('cash');
    }
  }, [selectedDebt]);

  // Hook 2: Filtering & pagination
  const {
    filteredDebts,
    paginatedDebts,
    totalPages,
    totalOutstandingBalance,
  } = useFiadosFilters({
    debts,
    searchTerm,
    statusFilter,
    currentPage,
    pageSize,
  });

  // Hook 3: Actions
  const {
    isSubmitting,
    handleConfirmSettle,
    handleSaveNewDebt,
  } = useFiadosActions({
    currentUser,
    loadDebts,
    setSelectedDebt,
    setIsSettleOpen,
    setIsNewDebtOpen,
  });

  const onConfirmSettle = (e: React.FormEvent) => {
    return handleConfirmSettle(e, selectedDebt, settleAmount, settleMethod);
  };

  const handleOpenItemsModal = (debt: DebtRecord) => {
    setItemsModalDebt(debt);
    setItemsModalOpen(true);
  };

  return {
    debts,
    loadDebts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedDebt,
    setSelectedDebt,
    isSettleOpen,
    setIsSettleOpen,
    settleAmount,
    setSettleAmount,
    settleMethod,
    setSettleMethod,
    isNewDebtOpen,
    setIsNewDebtOpen,
    isFullScreen,
    setIsFullScreen,
    itemsModalOpen,
    setItemsModalOpen,
    itemsModalDebt,
    handleOpenItemsModal,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    filteredDebts,
    paginatedDebts,
    totalOutstandingBalance,
    isSubmitting,
    onConfirmSettle,
    handleSaveNewDebt,
  };
}
