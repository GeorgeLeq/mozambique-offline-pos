import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../../lib/utils';
import { settleDebtInDB, saveManualDebtInDB } from '../../../ClientManager/services/debtService';
import { DebtRecord } from '../../../ClientManager/types';

interface UseFiadosActionsProps {
  currentUser: any;
  loadDebts: () => Promise<void>;
  setSelectedDebt: (debt: DebtRecord | null) => void;
  setIsSettleOpen: (open: boolean) => void;
  setIsNewDebtOpen: (open: boolean) => void;
}

export function useFiadosActions({
  currentUser,
  loadDebts,
  setSelectedDebt,
  setIsSettleOpen,
  setIsNewDebtOpen,
}: UseFiadosActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle settlement of an existing debt
  const handleConfirmSettle = async (
    e: React.FormEvent,
    selectedDebt: DebtRecord | null,
    settleAmount: string,
    settleMethod: string
  ) => {
    e.preventDefault();
    if (!selectedDebt || isSubmitting) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor de pagamento válido.');
      return;
    }

    if (amount > selectedDebt.amount_mt) {
      toast.error(`O valor do pagamento não pode ser maior do que o saldo devedor (${selectedDebt.amount_mt} MT).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await settleDebtInDB(selectedDebt, settleAmount, settleMethod, currentUser);
      
      // Log an audit log
      try {
        const { logAudit } = await import('../../../../lib/audit');
        await logAudit(
          currentUser?.id || 'cashier',
          'DEBT_SETTLEMENT',
          `Liquidação de Dívida no Caixa: Cliente: "${selectedDebt.customer_name}", Pago: ${amount} MT via ${settleMethod}.`
        );
      } catch (auditErr) {
        console.warn('Failed to log settlement audit:', auditErr);
      }

      toast.success(`Pagamento de ${formatCurrency(amount)} registado com sucesso!`);
      await loadDebts();
      
      // Reset state
      setIsSettleOpen(false);
      setSelectedDebt(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar pagamento de fiado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving a new manual debt
  const handleSaveNewDebt = async (debtData: Partial<DebtRecord>) => {
    try {
      const cleanCustomer = (debtData.customer_name || '').trim();
      const { checkFiadosLimit } = await import('../../../ClientManager/services/debtService');
      const limitCheck = await checkFiadosLimit(cleanCustomer);
      if (!limitCheck.allowed) {
        toast.error(`Limite de Clientes Atingido (${limitCheck.current}/${limitCheck.limit}). O Administrador deve atualizar para o plano PRO.`);
        return; // Early return, block creation
      }

      const res = await saveManualDebtInDB(debtData, currentUser);
      
      try {
        const { logAudit } = await import('../../../../lib/audit');
        await logAudit(
          currentUser?.id || 'cashier',
          'DEBT_CREATED_MANUAL',
          `Novo Fiado Registado no Caixa: Cliente: "${res.cleanCustomer}", Valor: ${res.cleanAmount} MT.`
        );
      } catch (auditErr) {
        console.warn('Failed to log new debt audit:', auditErr);
      }

      toast.success('Novo fiado registado com sucesso!');
      await loadDebts();
      setIsNewDebtOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao guardar novo registo de fiado.');
    }
  };

  return {
    isSubmitting,
    handleConfirmSettle,
    handleSaveNewDebt,
  };
}
