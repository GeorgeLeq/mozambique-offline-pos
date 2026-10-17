import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebtsData } from './useDebtsData';
import { useDebtFiltering } from './useDebtFiltering';
import { useDebtModals } from './useDebtModals';
import { useDebtMutations } from './useDebtMutations';

/**
 * Main orchestrator hook for the Client Ledger module.
 * Combines data fetching, filtering, modal state management, and mutation operations.
 */
export function useClientLedger(_onBack: () => void, isFullScreen: boolean = false) {
  const { currentUser } = useAuth();

  // 1. Core data management (debts list & DB events listener)
  const { debts, setDebts, loadDebts, addOptimisticDebt, removeOptimisticDebt } = useDebtsData();

  // 2. Search, filter, sorting, and pagination state (adaptive items per page)
  const itemsPerPage = isFullScreen ? 12 : 8;
  const filtering = useDebtFiltering(debts, itemsPerPage);

  // 3. Modal visibility and active debt selection states
  const modals = useDebtModals();

  // 4. Mutation handlers (settle debt, save manual debt, delete, print, export)
  const mutations = useDebtMutations({
    currentUser,
    setDebts,
    loadDebts,
    addOptimisticDebt,
    removeOptimisticDebt,
    modals,
    filtering,
  });

  // 5. Pull-to-refresh / reload handler
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDebts();
      toast.success('Lista de fiado atualizada!');
    } catch (e) {
      toast.error('Erro ao atualizar lista');
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [loadDebts]);

  return {
    currentUser,
    debts,
    ...filtering,
    ...modals,
    ...mutations,
    isRefreshing,
    handleRefresh,
  };
}
