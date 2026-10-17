import React from 'react';
import { X, CheckCircle2, BookOpen, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils';
import { DebtRecord } from '../../../ClientManager/types';

interface FiadosSettlePanelProps {
  selectedDebt: DebtRecord | null;
  isSettleOpen: boolean;
  settleAmount: string;
  setSettleAmount: (amount: string) => void;
  settleMethod: string;
  setSettleMethod: (method: string) => void;
  isSubmitting: boolean;
  onClosePanel: () => void;
  onConfirmSettle: (e: React.FormEvent) => void;
  onViewItems?: (debt: DebtRecord) => void;
}

export function FiadosSettlePanel({
  selectedDebt,
  isSettleOpen,
  settleAmount,
  setSettleAmount,
  settleMethod,
  setSettleMethod,
  isSubmitting,
  onClosePanel,
  onConfirmSettle,
  onViewItems,
}: FiadosSettlePanelProps) {
  return (
    <div className="w-[360px] lg:w-[420px] bg-slate-50/60 dark:bg-zinc-950/70 p-5 flex flex-col justify-between overflow-y-auto shrink-0 border-l border-slate-200 dark:border-zinc-900 transition-colors">
      {selectedDebt && isSettleOpen ? (
        <form onSubmit={onConfirmSettle} className="flex flex-col justify-between h-full gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-900 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Liquidação Direta
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  Registar Pagamento
                </h3>
              </div>
              <button
                type="button"
                onClick={onClosePanel}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                id="close-settle-panel-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-bold">Cliente</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedDebt.customer_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onViewItems === 'function') {
                      onViewItems(selectedDebt);
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  <ShoppingBag size={11} />
                  <span>Ver Artigos</span>
                </button>
              </div>

              {selectedDebt.phone_number && (
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-bold">Telefone</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedDebt.phone_number}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px]">Saldo Devedor:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                  {formatCurrency(selectedDebt.amount_mt)} MT
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Valor Pago (MT) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={settleAmount}
                  max={selectedDebt.amount_mt}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  placeholder="0.00"
                  id="settle-amount-input"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold text-xs">MT</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSettleAmount((selectedDebt.amount_mt / 2).toFixed(2))}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-2xs"
                >
                  50% ({formatCurrency(selectedDebt.amount_mt / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => setSettleAmount(selectedDebt.amount_mt.toString())}
                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/30"
                >
                  Total 100% ({formatCurrency(selectedDebt.amount_mt)})
                </button>
              </div>
            </div>

            {/* Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Método de Pagamento *
              </label>
              <select
                value={settleMethod}
                onChange={(e) => setSettleMethod(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-indigo-500 cursor-pointer"
                id="settle-method-select"
              >
                <option value="cash">Dinheiro (Numerário)</option>
                <option value="mpesa">M-Pesa</option>
                <option value="emola">e-Mola</option>
                <option value="card">Cartão / POS</option>
              </select>
            </div>
          </div>

          {/* Confirm Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-900 flex gap-2">
            <button
              type="button"
              onClick={onClosePanel}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedDebt.status === 'paid'}
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="confirm-settle-btn"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? 'A registar...' : 'Confirmar Liquidação'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-zinc-600 text-xs font-bold text-center">
          <BookOpen size={32} className="mb-2 opacity-40" />
          Selecione uma conta corrente na tabela para visualizar o histórico e efetuar liquidação direta.
        </div>
      )}
    </div>
  );
}
