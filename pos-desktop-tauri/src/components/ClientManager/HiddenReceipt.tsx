import React, { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { useCustomersI18n } from '../../i18n';

interface HiddenReceiptProps {
  receiptToPrint: DebtRecord | null;
}

export function HiddenReceipt({ receiptToPrint }: HiddenReceiptProps) {
  const t = useCustomersI18n();

  const parsedItems = useMemo(() => {
    if (!receiptToPrint?.items_json) return [];
    try {
      const items = typeof receiptToPrint.items_json === 'string' 
        ? JSON.parse(receiptToPrint.items_json) 
        : receiptToPrint.items_json;
      if (Array.isArray(items)) {
        return items.map((item: any) => ({
          quantity: item.quantity || item.qty || 1,
          name: item.name || item.description || item.title || 'Artigo',
          total: item.total || item.amount || ((item.price || 0) * (item.quantity || 1))
        }));
      }
      return [];
    } catch {
      return [];
    }
  }, [receiptToPrint]);

  if (!receiptToPrint) return null;

  return (
    <div className="receipt-printable font-mono text-sm max-w-[80mm] mx-auto p-4 bg-white text-black hidden print:block">
        <h2 className="text-xl font-bold text-center mb-2">SmartPOS</h2>
        <div className="text-center mb-4 text-xs border-b border-black pb-2">
            <div>{t.client || 'Cliente'}: {receiptToPrint.customer_name}</div>
            {receiptToPrint.phone_number && <div>{t.phone || 'Tel'}: {receiptToPrint.phone_number}</div>}
            <div>{t.date || 'Data'}: {new Date(receiptToPrint.paid_at || receiptToPrint.created_at).toLocaleString()}</div>
            <div>{t.cashier || 'Operador'}: {receiptToPrint.cashier_name || "Caixa"}</div>
        </div>
        
        <div className="text-xs mb-4">
          {parsedItems.length > 0 ? parsedItems.map((item, i) => (
            <div key={i} className="flex justify-between mb-1">
              <span className="truncate pr-2">{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          )) : (
            <div className="flex justify-between mb-1">
              <span>{t.debtTitle || 'Fiado'}</span>
              <span>{formatCurrency(receiptToPrint.original_amount || receiptToPrint.amount_mt)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-black pt-2 flex justify-between font-bold">
            <span>{t.totalDebt || 'Total'}:</span>
            <span>{formatCurrency(receiptToPrint.original_amount || receiptToPrint.amount_mt)}</span>
        </div>
        
        {(receiptToPrint.total_paid || 0) > 0 && (
          <div className="flex justify-between text-xs mt-1">
              <span>{t.paidSoFar || 'Pago até agora'}:</span>
              <span>{formatCurrency(receiptToPrint.total_paid || 0)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xs mt-1">
            <span>{t.remainingAmount || 'Pendente'}:</span>
            <span>{formatCurrency(receiptToPrint.amount_mt)}</span>
        </div>

        {receiptToPrint.payment_history && receiptToPrint.payment_history.length > 0 && (
          <div className="mt-4 pt-2 border-t border-dashed border-black">
            <div className="font-bold text-xs mb-1">{t.paymentHistory || 'Histórico de Pagamentos'}:</div>
            {receiptToPrint.payment_history.map((p, i) => (
              <div key={i} className="flex justify-between text-[10px] mb-0.5">
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
                <span>{formatCurrency(p.amount_mt)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-6 text-[10px] border-t border-black pt-2">
            {t.thankYouPreference || 'Obrigado pela preferência!'}
        </div>
    </div>
  );
}

