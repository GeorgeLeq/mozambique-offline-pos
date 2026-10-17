import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../../lib/db';
import { logAudit } from '../../../../lib/audit';
import { generateWhatsAppLink } from '../../../../lib/printReceipt';
import { spoolJob } from '../../../../lib/printSpooler';
import { SaleReceipt, SaleItem, PruneOptionType } from '../types';

interface UseSalesActionsProps {
  currentUser: any;
  onRefresh: () => void;
}

export function useSalesActions({ currentUser, onRefresh }: UseSalesActionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Advanced Refund Wizard States
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refundReceiptId, setRefundReceiptId] = useState('');
  const [refundItem, setRefundItem] = useState<SaleItem | null>(null);

  const handleCopyId = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success('ID de Recibo copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Erro ao copiar ID');
    }
  };

  const handlePrint = (sale: SaleReceipt, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const receiptData = {
        shopName: localStorage.getItem('receipt_header_title') || "SmartPOS",
        receiptId: sale.receipt_id,
        date: sale.created_at,
        cashierName: currentUser?.name || "Caixa",
        items: sale.items.map(i => ({
          name: i.product_name,
          quantity: i.quantity,
          price: i.total_mt / (i.quantity || 1),
          total: i.total_mt
        })),
        totalDue: sale.total,
        paymentMethod: sale.payment_method
      };
      spoolJob(`Reimpressão #${sale.receipt_id.substring(0, 8).toUpperCase()}`, 'receipt', receiptData);
      toast.success('Recibo enviado para a impressora!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao iniciar impressão');
    }
  };

  const handleShareWhatsApp = (sale: SaleReceipt, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const receiptData = {
      shopName: localStorage.getItem('receipt_header_title') || "SmartPOS",
      receiptId: sale.receipt_id,
      date: sale.created_at,
      cashierName: currentUser?.name || "Caixa",
      items: sale.items.map(i => ({
        name: i.product_name,
        quantity: i.quantity,
        price: i.total_mt / (i.quantity || 1),
        total: i.total_mt
      })),
      totalDue: sale.total,
      paymentMethod: sale.payment_method
    };
    const url = generateWhatsAppLink(receiptData);
    setWhatsappUrl(url);
    setWhatsappModalOpen(true);
  };

  const handleVoidItem = (receiptId: string, item: SaleItem) => {
    setRefundReceiptId(receiptId);
    setRefundItem(item);
    setWizardOpen(true);
  };

  const handlePruneSales = async (pruneOption: PruneOptionType) => {
    let keepMs = 0;
    let label = '';
    
    switch (pruneOption) {
      case '24h': keepMs = 24 * 60 * 60 * 1000; label = 'últimas 24 horas'; break;
      case '3d': keepMs = 3 * 24 * 60 * 60 * 1000; label = 'últimos 3 dias'; break;
      case '7d': keepMs = 7 * 24 * 60 * 60 * 1000; label = 'últimos 7 dias'; break;
      case 'all': keepMs = 0; label = 'todo o histórico'; break;
      default: return;
    }

    const confirmMessage = pruneOption === 'all' 
      ? 'Aviso Crítico: Esta ação irá apagar TODO o histórico de vendas local permanentemente. Tem certeza?' 
      : `Deseja limpar as vendas antigas, mantendo apenas as de ${label}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const db = await getDB();
      if (pruneOption === 'all') {
        await db.execute('DELETE FROM sales');
      } else {
        const thresholdDate = new Date(Date.now() - keepMs);
        const pad = (n: number) => String(n).padStart(2, '0');
        const sqliteThreshold = `${thresholdDate.getUTCFullYear()}-${pad(thresholdDate.getUTCMonth() + 1)}-${pad(thresholdDate.getUTCDate())} ${pad(thresholdDate.getUTCHours())}:${pad(thresholdDate.getUTCMinutes())}:${pad(thresholdDate.getUTCSeconds())}`;
        await db.execute('DELETE FROM sales WHERE datetime(created_at) < datetime(?)', [sqliteThreshold]);
      }

      await logAudit(
        currentUser?.id, 
        'SALES_HISTORY_PRUNED', 
        `Histórico de vendas limpo. Filtro de preservação: ${pruneOption}.`
      );

      toast.success('Histórico de vendas limpo com sucesso!');
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao limpar histórico');
    }
  };

  return {
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
    handlePruneSales,
  };
}
