import { useState } from 'react';
import toast from 'react-hot-toast';
import { generateWhatsAppLink, ReceiptData } from '../../../lib/printReceipt';
import { DebtRecord } from '../types';

export function useDebtModals() {
  // Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');

  // Print Receipt State
  const [receiptToPrint, setReceiptToPrint] = useState<DebtRecord | null>(null);

  // WhatsApp Modal State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Payment History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyDebt, setHistoryDebt] = useState<DebtRecord | null>(null);

  // Manual Debt Modal State
  const [manualDebtModalOpen, setManualDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtRecord | null>(null);

  // Modal Openers
  const openSettleModal = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    setAmountPaid(debt.amount_mt.toString());
    setSettleModalOpen(true);
  };

  const closeSettleModal = () => {
    setSettleModalOpen(false);
    setSelectedDebt(null);
    setPaymentMethod('cash');
    setAmountPaid('');
  };

  const openEditModal = (debt: DebtRecord) => {
    setDebtToEdit(debt);
    setManualDebtModalOpen(true);
  };

  const openAddModal = () => {
    setDebtToEdit(null);
    setManualDebtModalOpen(true);
  };

  const closeManualDebtModal = () => {
    setManualDebtModalOpen(false);
    setDebtToEdit(null);
  };

  const openHistoryModal = (debt: DebtRecord) => {
    setHistoryDebt(debt);
    setHistoryModalOpen(true);
  };

  const handleShareWhatsApp = (debt: DebtRecord) => {
    let items = [];
    if (debt.items_json) {
      try {
        items = JSON.parse(debt.items_json);
      } catch (e) {}
    }

    const paymentHistory = debt.payment_history?.map(p => ({
      date: p.created_at,
      amount: p.amount_mt,
      method: p.payment_method || 'cash'
    })) || [];

    const receiptData: ReceiptData = {
      shopName: "SmartPOS",
      receiptId: debt.receipt_id || debt.id,
      date: debt.created_at,
      cashierName: debt.cashier_name || "Caixa",
      items: items,
      totalDue: debt.original_amount || debt.amount_mt,
      paymentMethod: debt.status === 'paid' ? 'Fiado Pago' : 'Fiado',
      paymentHistory: paymentHistory
    };

    const url = generateWhatsAppLink(receiptData, debt.phone_number || '');
    setWhatsappUrl(url);
    setWhatsappModalOpen(true);
  };

  return {
    settleModalOpen,
    setSettleModalOpen,
    selectedDebt,
    setSelectedDebt,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    openSettleModal,
    closeSettleModal,

    receiptToPrint,
    setReceiptToPrint,

    whatsappModalOpen,
    setWhatsappModalOpen,
    whatsappUrl,
    handleShareWhatsApp,

    historyModalOpen,
    setHistoryModalOpen,
    historyDebt,
    openHistoryModal,

    manualDebtModalOpen,
    setManualDebtModalOpen,
    debtToEdit,
    setDebtToEdit,
    openEditModal,
    openAddModal,
    closeManualDebtModal,
  };
}
