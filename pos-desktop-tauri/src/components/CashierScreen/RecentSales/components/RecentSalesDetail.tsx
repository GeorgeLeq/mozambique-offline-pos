import React, { useState, useMemo } from 'react';
import { 
  Receipt as ReceiptIcon, 
  Printer, 
  Share2,
  Search,
  X
} from 'lucide-react';
import { SaleReceipt, SaleItem } from '../types';
import { formatCurrency } from '../../../../lib/utils';

interface RecentSalesDetailProps {
  selectedSale: SaleReceipt | null;
  onPrint: (sale: SaleReceipt, e?: React.MouseEvent) => void;
  onShareWhatsApp: (sale: SaleReceipt, e?: React.MouseEvent) => void;
  onVoidItem: (receiptId: string, item: SaleItem) => void;
}

export function RecentSalesDetail({
  selectedSale,
  onPrint,
  onShareWhatsApp,
  onVoidItem
}: RecentSalesDetailProps) {
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Filter items in receipt when searching
  const filteredItems = useMemo(() => {
    if (!selectedSale) return [];
    if (!itemSearchQuery.trim()) return selectedSale.items;
    const q = itemSearchQuery.toLowerCase();
    return selectedSale.items.filter(item => 
      item.product_name.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  }, [selectedSale, itemSearchQuery]);

  if (!selectedSale) {
    return (
      <div className="w-[360px] lg:w-[420px] bg-slate-50 dark:bg-zinc-950/70 p-5 flex flex-col items-center justify-center h-full text-slate-400 dark:text-zinc-600 text-xs font-bold text-center shrink-0 border-l border-slate-200 dark:border-zinc-900 transition-colors">
        <ReceiptIcon size={32} className="mb-2 opacity-40" />
        Selecione uma venda na tabela ao lado para visualizar os detalhes e opções de reimpressão.
      </div>
    );
  }

  return (
    <div className="w-[360px] lg:w-[420px] bg-slate-50/60 dark:bg-zinc-950/70 p-5 flex flex-col justify-between overflow-hidden shrink-0 border-l border-slate-200 dark:border-zinc-900 transition-colors">
      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Detail Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-900 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Detalhe do Recibo
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <h3 className="font-mono font-black text-sm text-slate-900 dark:text-white">
                #{selectedSale.receipt_id.toUpperCase()}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onPrint(selectedSale, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              title="Imprimir Recibo"
            >
              <Printer size={13} /> Reimprimir
            </button>
            <button
              onClick={(e) => onShareWhatsApp(selectedSale, e)}
              className="p-1.5 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-500/20"
              title="Enviar por WhatsApp"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Meta Summary */}
        <div className="grid grid-cols-2 gap-2 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-850 text-xs shrink-0 shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-bold">Data</span>
            <span className="font-medium text-slate-700 dark:text-zinc-200 font-mono">
              {new Date(selectedSale.created_at).toLocaleDateString('pt-MZ')} {new Date(selectedSale.created_at).toLocaleTimeString('pt-MZ')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-bold">Método</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              {selectedSale.payment_method?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Items List Breakdown with Scrollable Max Height */}
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Artigos no Talão ({selectedSale.items.length})
              </span>
              {itemSearchQuery && (
                <span className="text-[10px] font-bold text-indigo-500">
                  ({filteredItems.length} encontrados)
                </span>
              )}
            </div>
            {selectedSale.items.length > 5 && !itemSearchQuery && (
              <span className="text-[10px] font-bold text-indigo-500">
                Rolagem activa
              </span>
            )}
          </div>

          {/* Quick Search within Receipt Items if more than 5 items */}
          {selectedSale.items.length > 5 && (
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="Pesquisar artigo ou código..."
                className="w-full bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium"
              />
              {itemSearchQuery && (
                <button
                  type="button"
                  onClick={() => setItemSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col divide-y divide-slate-100 dark:divide-zinc-900 bg-white dark:bg-zinc-900/30 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-2xs">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Nenhum artigo corresponde à pesquisa.
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 dark:text-zinc-100 block truncate">
                      {item.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-zinc-400 font-mono">
                      <span>{item.quantity}x {formatCurrency(item.total_mt / (item.quantity || 1))}</span>
                      {item.barcode && <span>• {item.barcode}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-900 dark:text-white block">
                      {formatCurrency(item.total_mt)}
                    </span>
                    {item.status !== 'voided' && selectedSale.status !== 'voided' && (
                      <button
                        onClick={() => onVoidItem(selectedSale.receipt_id, item)}
                        className="text-[9px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 underline cursor-pointer mt-0.5"
                      >
                        Devolver Artigo
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Box */}
        <div className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl flex items-center justify-between shrink-0 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total do Recibo:</span>
          <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
            {formatCurrency(selectedSale.total)} MT
          </span>
        </div>
      </div>
    </div>
  );
}
