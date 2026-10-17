import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShoppingBag, Info } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { GroupedShiftSale } from './BlindCloseTypes';
import { useI18n } from '../../../i18n';

interface BlindCloseAuditProps {
  varianceValue: number;
  baseCashValue: number;
  shiftTotals: { cash: number; mpesa: number; fiado: number; total: number };
  totalPayouts: number;
  expectedCashValue: number;
  shiftSales: GroupedShiftSale[];
  isSalesHistoryOpen: boolean;
  onToggleSalesHistory: () => void;
  loadingSales: boolean;
}

export const BlindCloseAudit: React.FC<BlindCloseAuditProps> = ({
  shiftSales,
  loadingSales,
}) => {
  const { pos: t, common: commonT } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2 mb-4">
          <ShieldCheck size={14} className="text-indigo-500" />
          {t.shiftSalesSummary || 'Resumo de Vendas do Turno'}
        </h3>

        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-4 rounded-[2rem] shadow-sm text-center mb-5">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            {t.totalShiftSales || 'Vendas Totais do Turno'}
          </span>
          <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {formatCurrency(shiftSales.reduce((sum, s) => sum + s.total, 0))}
          </span>
          <span className="block text-[9px] text-slate-400 dark:text-zinc-550 mt-1 uppercase font-bold tracking-wider">
            {t.totalTransactionsRecorded || 'Total de'} {shiftSales.length} {t.transactionsRegistered || 'transações registadas'}
          </span>
        </div>
      </div>

      {/* Sales list is displayed directly here */}
      <div className="space-y-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          <ShoppingBag size={13} className="text-indigo-500" />
          {t.transactionsList || 'Lista de Transações'} ({shiftSales.length})
        </span>

        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 hide-scrollbar">
          {loadingSales ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
              {t.loadingTransactions || 'Carregando transações...'}
            </div>
          ) : shiftSales.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-600 text-xs">
              {t.noSalesRecordedShift || 'Nenhuma venda registada neste turno.'}
            </div>
          ) : (
            shiftSales.map((sale) => (
              <div 
                key={sale.receipt_id} 
                className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl text-xs space-y-2.5 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    #{sale.receipt_id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-slate-450 dark:text-zinc-450 bg-slate-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded-md">
                    {sale.payment_method.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 pl-2.5 border-l-2 border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[150px]">{item.quantity}x {item.product_name}</span>
                      <span className="font-mono">{formatCurrency(item.total_mt)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-black border-t border-dashed border-slate-100 dark:border-zinc-800 pt-1.5">
                  <span className="uppercase text-slate-400">{t.totalPaid || 'Total Pago:'}</span>
                  <span className="font-mono text-slate-800 dark:text-zinc-100">{formatCurrency(sale.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Informative Security Disclaimer */}
      <div className="mt-8 bg-slate-150/40 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200/40 dark:border-white/5 flex gap-3 items-start">
        <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
          {t.blindCloseDisclaimer || 'O Fecho Cego é um protocolo de segurança anti-roubo. O operador não tem acesso ao saldo estimado em caixa ou diferenças ("quebra de caixa") no ecrã. A gerência receberá o relatório auditado completo comparando a contagem física declarada com os registros do sistema.'}
        </p>
      </div>
    </div>
  );
};
