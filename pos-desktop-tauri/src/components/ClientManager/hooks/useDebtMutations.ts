import { Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../lib/utils';
import { DebtRecord } from '../types';
import { settleDebtInDB, saveManualDebtInDB, deleteDebtFromDB, softDeleteDebtInDB, restoreDebtInDB } from '../services/debtService';
import { useDebtModals } from './useDebtModals';
import { useDebtFiltering } from './useDebtFiltering';
import { logAudit } from '../../../lib/audit';

interface UseDebtMutationsParams {
  currentUser: any;
  setDebts: Dispatch<SetStateAction<DebtRecord[]>>;
  loadDebts: () => Promise<void>;
  addOptimisticDebt: (debt: DebtRecord) => void;
  removeOptimisticDebt: (id: string) => void;
  modals: ReturnType<typeof useDebtModals>;
  filtering: ReturnType<typeof useDebtFiltering>;
}

export function useDebtMutations({
  currentUser,
  setDebts,
  loadDebts,
  addOptimisticDebt,
  removeOptimisticDebt,
  modals,
  filtering,
}: UseDebtMutationsParams) {

  const handleMarkAsPaid = async (paidAmountVal?: string, paymentMethodVal?: string) => {
    if (!modals.selectedDebt) return;
    const t0 = performance.now();
    console.log('[ClientLedger] handleMarkAsPaid: START');

    const targetAmountStr = paidAmountVal !== undefined ? paidAmountVal : modals.amountPaid;
    const targetMethodStr = paymentMethodVal !== undefined ? paymentMethodVal : modals.paymentMethod;

    try {
      const result = await settleDebtInDB(modals.selectedDebt, targetAmountStr, targetMethodStr, currentUser);
      const tSettle = performance.now();
      console.log(`[ClientLedger] settleDebtInDB completed in ${(tSettle - t0).toFixed(2)}ms`);

      if (result.isFullyPaid) {
        toast.success(`Dívida totalmente liquidada via ${result.cleanPaymentMethod.toUpperCase()}`);
      } else {
        toast.success(`Pagamento parcial de ${formatCurrency(result.paidNum)} registado`);
      }

      // Optimistically update React state immediately
      setDebts(prev => prev.map(d => {
        if (d.id !== modals.selectedDebt!.id) return d;
        const currentTotalPaid = (d.total_paid || 0) + result.paidNum;
        const origAmt = d.original_amount || (d.amount_mt + (d.total_paid || 0));
        if (result.isFullyPaid) {
          return {
            ...d,
            status: 'paid',
            amount_mt: 0,
            original_amount: origAmt,
            paid_at: result.now,
            payment_method: result.cleanPaymentMethod,
            total_paid: currentTotalPaid,
            payment_history: [result.newHistoryItem, ...(d.payment_history || [])]
          };
        } else {
          return {
            ...d,
            amount_mt: Math.max(0, d.amount_mt - result.paidNum),
            original_amount: origAmt,
            total_paid: currentTotalPaid,
            payment_history: [result.newHistoryItem, ...(d.payment_history || [])]
          };
        }
      }));

      // Close modal and reset state immediately
      modals.closeSettleModal();

      // Trigger background reload from DB to ensure sync consistency
      loadDebts().then(() => {
        console.log('[ClientLedger] Background loadDebts completed after handleMarkAsPaid');
      }).catch(err => console.error('[ClientLedger] Background loadDebts error:', err));

      // Non-blocking background cloud sync for debts & debt_payments
      import('../../../lib/syncEngine/debts').then(({ syncDebtsToCloud }) => {
        syncDebtsToCloud().then(() => {
          import('../../../lib/syncEngine/debtPayments').then(({ syncDebtPaymentsToCloud }) => {
            syncDebtPaymentsToCloud().catch(err => console.warn('Background debt payments sync failed:', err));
          }).catch(() => {});
        }).catch(err => console.warn('Background debt sync failed:', err));
      }).catch(() => {});

      const tEnd = performance.now();
      console.log(`[ClientLedger] handleMarkAsPaid: DONE in ${(tEnd - t0).toFixed(2)}ms`);
    } catch (e: any) {
      console.error('[ClientLedger] handleMarkAsPaid: ERROR', e);
      toast.error(`Erro ao processar pagamento: ${e?.message || String(e)}`);
      try {
        await loadDebts();
      } catch (reloadErr) {
        console.error('[ClientLedger] Failed to reload after error:', reloadErr);
      }
    }
  };

  const handleSaveManualDebt = async (debtData: Partial<DebtRecord>) => {
    const t0 = performance.now();
    console.log('[ClientLedger] handleSaveManualDebt: START');

    const cleanCustomer = (debtData.customer_name || '').trim();
    const cleanPhone = (debtData.phone_number || '').trim();
    const cleanAddress = (debtData.address || '').trim();
    const cleanAmount = Number(debtData.amount_mt) || 0;
    const itemsJson = debtData.items_json || null;
    const cashier = currentUser?.name || 'Caixa';

    const isEdit = Boolean(debtData.id);
    const targetId = debtData.id || crypto.randomUUID();
    const now = new Date().toISOString();

    if (!isEdit) {
      const { checkFiadosLimit } = await import('../services/debtService');
      const limitCheck = await checkFiadosLimit(cleanCustomer);
      if (!limitCheck.allowed) {
        toast.error(`Limite de Clientes Atingido (${limitCheck.current}/${limitCheck.limit}). Atualize para o plano PRO.`);
        return; // Early return, don't close modal, block creation
      }
    }

    const payload = {
      ...debtData,
      id: targetId,
      isEdit,
      created_at: debtData.created_at || now
    };

    try {
      // 1. Save to DB synchronously FIRST and await its absolute completion
      await saveManualDebtInDB(payload, currentUser);
      console.log(`[ClientLedger] DB save completed in ${(performance.now() - t0).toFixed(2)}ms`);

      // 2. Reload the debts list from SQLite so the UI state is 100% updated with the true DB record
      await loadDebts();
      console.log(`[ClientLedger] loadDebts finished in ${(performance.now() - t0).toFixed(2)}ms`);

      // 3. Reset filters and close modal only AFTER SQLite reports 100% success
      modals.closeManualDebtModal();
      filtering.setSelectedGroupClient(null);
      filtering.setIsGrouped(false);
      filtering.setCurrentPage(1);
      filtering.setSearchQuery('');
      if (filtering.filter === 'paid') filtering.setFilter('unpaid');

      // 4. Show the definitive success toast
      if (isEdit) {
        toast.success('Dívida atualizada com sucesso');
      } else {
        toast.success('Dívida manual guardada com sucesso');
      }

      // 5. Background re-sync with Cloud (non-blocking for UI/modal closed)
      import('../../../lib/syncEngine/debts').then(({ syncDebtsToCloud }) => {
        syncDebtsToCloud().then(() => {
          import('../../../lib/syncEngine/debtPayments').then(({ syncDebtPaymentsToCloud }) => {
            syncDebtPaymentsToCloud().catch(err => console.warn('Background debt payments sync failed:', err));
          }).catch(() => {});
        }).catch(err => console.warn('Background debt sync failed:', err));
      }).catch(() => {});

      console.log(`[ClientLedger] handleSaveManualDebt: DONE in ${(performance.now() - t0).toFixed(2)}ms`);
    } catch (e: any) {
      console.error('[ClientLedger] handleSaveManualDebt: ERROR', e);
      toast.error(`Erro ao salvar a dívida no banco de dados: ${e?.message || String(e)}`);
      // Propagate error back to ManualDebtModal's onSubmit so it keeps isSaving active/handles errors
      throw e;
    }
  };

  const handleDeleteDebt = async (debt: DebtRecord) => {
    try {
      await softDeleteDebtInDB(debt.id);
      
      // Audit trail logging
      const details = `Dívida Cancelada (Soft Delete): Cliente: "${debt.customer_name}", Valor: ${debt.amount_mt} MT, Registado por: "${debt.cashier_name || 'N/A'}", Cancelado por: "${currentUser?.name || 'Caixa'}"`;
      await logAudit(currentUser?.id || 'system', 'DEBT_SOFT_DELETED', details);

      toast.success('Dívida movida para Cancelados');
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, is_deleted: 1, deleted_at: new Date().toISOString() } : d));
      await loadDebts();
    } catch (e) {
      console.error('Failed to soft delete debt:', e);
      toast.error('Erro ao cancelar dívida');
    }
  };

  const handleRestoreDebt = async (debt: DebtRecord) => {
    const isAdminOrGerente = currentUser?.role === 'Admin' || currentUser?.role === 'Gerente';
    if (!isAdminOrGerente) {
      toast.error('Apenas Administradores ou Gerentes podem restaurar dívidas!');
      return;
    }

    try {
      await restoreDebtInDB(debt.id);
      
      // Audit trail logging
      const details = `Dívida Restaurada: Cliente: "${debt.customer_name}", Valor: ${debt.amount_mt} MT, Restaurado por: "${currentUser?.name || 'Caixa'}"`;
      await logAudit(currentUser?.id || 'system', 'DEBT_RESTORED', details);

      toast.success('Dívida restaurada com sucesso');
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, is_deleted: 0, deleted_at: null } : d));
      await loadDebts();
    } catch (e) {
      console.error('Failed to restore debt:', e);
      toast.error('Erro ao restaurar dívida');
    }
  };

  const handleHardDeleteDebt = async (debt: DebtRecord) => {
    const isAdminOrGerente = currentUser?.role === 'Admin' || currentUser?.role === 'Gerente';
    if (!isAdminOrGerente) {
      toast.error('Apenas Administradores ou Gerentes podem apagar permanentemente dívidas!');
      return;
    }

    try {
      await deleteDebtFromDB(debt.id);
      
      // Audit trail logging
      const details = `Dívida Apagada Permanentemente (Hard Delete): Cliente: "${debt.customer_name}", Valor: ${debt.amount_mt} MT, Registado por: "${debt.cashier_name || 'N/A'}", Apagado por: "${currentUser?.name || 'Caixa'}"`;
      await logAudit(currentUser?.id || 'system', 'DEBT_HARD_DELETED', details);

      toast.success('Dívida apagada permanentemente');
      setDebts(prev => prev.filter(d => d.id !== debt.id));
      await loadDebts();
    } catch (e) {
      console.error('Failed to hard delete debt:', e);
      toast.error('Erro ao apagar permanentemente dívida');
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Client Name,Phone,Status,Pending Amount,Original Amount,Created At\n"
      + filtering.processedList.map(d => {
          return `"${d.customer_name}","${d.phone_number || ''}","${d.status}",${d.amount_mt},${d.original_amount || d.amount_mt},"${new Date(d.created_at).toLocaleString()}"`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_fiado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Extrato exportado com sucesso');
  };

  const handlePrintReceipt = (debt: DebtRecord) => {
    modals.setReceiptToPrint(debt);
    toast.success('A imprimir talão...', { icon: '🖨️' });
    setTimeout(() => {
      window.print();
      setTimeout(() => modals.setReceiptToPrint(null), 500);
    }, 500);
  };

  return {
    handleMarkAsPaid,
    handleSaveManualDebt,
    handleDeleteDebt,
    handleRestoreDebt,
    handleHardDeleteDebt,
    handleExport,
    handlePrintReceipt,
  };
}
