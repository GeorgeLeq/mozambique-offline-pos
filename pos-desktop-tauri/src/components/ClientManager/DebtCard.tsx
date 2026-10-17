import React from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, Clock, MessageCircle, CheckCircle2, Printer, Wallet, History, Edit2, Trash2, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { SyncDot } from './DebtTable';
import { useCustomersI18n } from '../../i18n';

interface DebtCardProps {
  key?: React.Key;
  debt: DebtRecord;
  isPartial: boolean;
  onShareWhatsApp: (debt: DebtRecord) => void;
  onSettle: (debt: DebtRecord) => void;
  onPrintReceipt: (debt: DebtRecord) => void;
  onViewHistory: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
}

export const DebtCard = React.memo(function DebtCard({
  debt,
  isPartial,
  onShareWhatsApp,
  onSettle,
  onPrintReceipt,
  onViewHistory,
  onEdit,
  onDelete
}: DebtCardProps) {
  const t = useCustomersI18n();
  const hasHistory = debt.payment_history && debt.payment_history.length > 0;
  
  let itemsPreview: any[] = [];
  if (debt.items_json) {
    try {
      let rawJson = debt.items_json;
      if (typeof rawJson === 'string' && rawJson.includes('\\"')) {
        rawJson = rawJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      itemsPreview = JSON.parse(rawJson);
      if (!Array.isArray(itemsPreview)) {
        itemsPreview = [{ name: String(itemsPreview), quantity: 1, total: debt.amount_mt }];
      }
    } catch(e) {
      if (typeof debt.items_json === 'string' && debt.items_json.trim()) {
        itemsPreview = [{ name: debt.items_json, quantity: 1, total: debt.amount_mt }];
      }
    }
  }

  // Generate a distinct gradient based on name
  const getGradient = (name: string) => {
    const colors = [
      'from-indigo-500/10 to-purple-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/10',
      'from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
      'from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10',
      'from-rose-500/10 to-pink-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10',
      'from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-500/10',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const avatarStyle = getGradient(debt.customer_name);
  const initials = debt.customer_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-850 shadow-[0_8px_30px_rgba(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col gap-5 group hover:border-indigo-500/25 dark:hover:border-zinc-800 transition-all relative overflow-hidden"
    >
      <div className="flex justify-between items-start gap-2 relative z-10">
        <div className="flex items-start gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarStyle} border flex items-center justify-center font-bold tracking-wider text-sm font-sans shrink-0`}>
              {initials || <User size={18} />}
            </div>
            <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug truncate flex items-center gap-1.5">
                  <SyncDot status={debt.sync_status} />
                  <span>{debt.customer_name}</span>
                </h3>
                
                <div className="space-y-1 mt-1.5">
                  {debt.phone_number && (
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono">
                        <Phone size={11} className="text-slate-400" />
                        {debt.phone_number}
                    </div>
                  )}
                  {debt.address && (
                    <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 max-w-[160px] truncate">
                        <MapPin size={11} className="text-slate-400" />
                        {debt.address}
                    </div>
                  )}
                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 font-mono">
                      <Clock size={11} className="text-slate-300 dark:text-zinc-600" />
                      {new Date(debt.created_at).toLocaleDateString()}
                  </div>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[10px] px-3 py-1 rounded-full border font-black tracking-wider uppercase ${
              debt.status === 'paid'
              ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400'
              : isPartial 
                ? 'text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400'
                : 'text-rose-600 border-rose-500/20 bg-rose-500/10 dark:text-rose-400'
          }`}>
            {debt.status === 'paid' ? (t.paidBadge || 'Pago') : isPartial ? (t.partialBadge || 'Parcial') : (t.unpaidBadge || 'Em Dívida')}
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <button 
              onClick={() => onEdit(debt)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all active:scale-90 cursor-pointer"
              title={t.editAction || 'Editar Fiado'}
            >
              <Edit2 size={13} className="stroke-[2.5]" />
            </button>
            <button 
              onClick={() => onDelete(debt)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer"
              title={t.delete || 'Apagar Registo'}
            >
              <Trash2 size={13} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {itemsPreview.length > 0 && (
        <div className="bg-slate-50/50 dark:bg-zinc-950/30 rounded-2xl p-4 text-xs border border-slate-150 dark:border-zinc-850 relative z-10">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 mb-3 font-bold uppercase tracking-wider text-[10px]">
            <ShoppingBag size={12} className="text-slate-400 dark:text-zinc-500" /> {t.debtArticles || 'Artigos do Fiado'}
          </div>
          <div className="space-y-2">
            {itemsPreview.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span className="truncate pr-2 font-medium">{item.quantity || 1}x {item.name || item.description || (t.itemsCountUnit || 'Artigo')}</span>
                <span className="font-mono font-bold">{formatCurrency(item.total ?? item.price ?? debt.amount_mt)}</span>
              </div>
            ))}
            {itemsPreview.length > 3 && (
              <div className="text-slate-400 dark:text-zinc-500 pt-1 text-[10px] font-bold uppercase tracking-wide">
                + {itemsPreview.length - 3} {t.itemsDescription || 'outros artigos...'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mt-1 pt-4 border-t border-slate-100 dark:border-zinc-850 relative z-10">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-0.5">{t.pendingBalance || 'Falta Pagar'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
              {formatCurrency(debt.amount_mt)}
          </div>
          {isPartial && (
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-2 flex flex-col gap-1">
              <span>{t.totalOriginal || 'Original'}: {formatCurrency(debt.original_amount || 0)}</span>
              {hasHistory && (
                 <button 
                   onClick={() => onViewHistory(debt)}
                   className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-colors border border-indigo-100/50 dark:border-indigo-500/10 w-fit mt-1 cursor-pointer"
                 >
                   <History size={11} className="stroke-[2.5]" /> {t.paymentHistoryTitle || 'Histórico de Pagos'}
                 </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-3 shrink-0">
          {debt.status === 'unpaid' && (
            <div className="flex items-center gap-2">
              {!isPartial && (
                <button
                  onClick={() => onShareWhatsApp(debt)}
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-all border border-emerald-500/20 shadow-sm active:scale-95 cursor-pointer"
                  title={t.whatsappReminder || 'Partilhar no WhatsApp'}
                >
                  <MessageCircle size={18} className="stroke-[2.5]" />
                </button>
              )}
              <button
                  onClick={() => onSettle(debt)}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 active:scale-95 cursor-pointer"
              >
                  <CheckCircle2 size={15} className="stroke-[3]" />
                  {t.pay || 'Liquidado'}
              </button>
            </div>
          )}
          {(debt.status === 'paid' || isPartial) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onShareWhatsApp(debt)}
                className="p-2.5 text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500 rounded-xl transition-all border border-emerald-500/10 shadow-sm active:scale-95 cursor-pointer"
                title={t.whatsappReminder || 'Partilhar Histórico no WhatsApp'}
              >
                <MessageCircle size={15} className="stroke-[2.5]" />
              </button>
              <button 
                onClick={() => onPrintReceipt(debt)}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-indigo-400 dark:hover:bg-zinc-900 rounded-xl transition-all border border-slate-200 dark:border-zinc-800 shadow-sm active:scale-95 cursor-pointer"
                title={t.printReceipt || 'Imprimir Recibo'}
              >
                <Printer size={15} />
              </button>
              <div className="text-right bg-slate-50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-zinc-850">
                <div className="text-[10px] text-slate-600 dark:text-zinc-300 font-extrabold uppercase tracking-wider flex items-center justify-end gap-1.5 leading-none">
                   <Wallet size={11} className="text-slate-400 dark:text-zinc-500" /> {debt.payment_method || (t.cashMethod || 'Dinheiro')}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 font-mono mt-1 flex items-center gap-1.5 justify-end leading-none">
                   {debt.paid_at ? new Date(debt.paid_at).toLocaleDateString() : new Date(debt.created_at).toLocaleDateString()}
                   {hasHistory && debt.status === 'paid' && (
                     <button 
                       onClick={() => onViewHistory(debt)}
                       className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                       title={t.paymentHistoryTitle || 'Ver Histórico de Pagos'}
                     >
                       <History size={11} className="stroke-[2.5]" />
                     </button>
                   )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
