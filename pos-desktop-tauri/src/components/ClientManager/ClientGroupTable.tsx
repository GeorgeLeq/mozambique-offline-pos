import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Phone, 
  MapPin, 
  ChevronRight, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import { useCustomersI18n } from '../../i18n';

export interface ClientGroupItem {
  clientName: string;
  debts: DebtRecord[];
}

interface ClientGroupTableProps {
  groupedClients: ClientGroupItem[];
  onSelectClient: (clientName: string) => void;
  selectedClients?: Set<string>;
  onToggleSelectClient?: (clientName: string) => void;
  onToggleSelectAll?: () => void;
}

export const ClientGroupTable = React.memo(function ClientGroupTable({
  groupedClients,
  onSelectClient,
  selectedClients = new Set(),
  onToggleSelectClient,
  onToggleSelectAll,
}: ClientGroupTableProps) {
  const t = useCustomersI18n();

  return (
    <div className="flex flex-col w-full min-h-0 bg-white/40 dark:bg-zinc-950/40">
      {/* Table Header */}
      <div className="sticky top-0 z-20 grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-slate-200/80 dark:border-white/5 bg-slate-100 dark:bg-zinc-950 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 select-none shadow-xs">
        <div className="col-span-1 flex justify-center">
          {onToggleSelectAll && (
            <button
              type="button"
              onClick={onToggleSelectAll}
              className="cursor-pointer text-slate-400 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Selecionar Todos"
            >
              {selectedClients.size === groupedClients.length && groupedClients.length > 0 ? (
                <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square size={16} />
              )}
            </button>
          )}
        </div>
        <div className="col-span-4 flex items-center gap-1.5">
          <User size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.client || 'Cliente'} & {t.contact || 'Contacto'}</span>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <AlertCircle size={12} className="text-amber-600 dark:text-amber-400" />
          <span>{t.unpaidBadge || 'Compras Pendentes'}</span>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <DollarSign size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span>{t.pendingBalance || 'Saldo Total em Aberto'}</span>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <Calendar size={12} className="text-purple-600 dark:text-purple-400" />
          <span>{t.date || 'Último Registo'}</span>
        </div>
        <div className="col-span-1 flex items-center justify-end">
          <span>{t.actions || 'Ação'}</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-900 bg-white/40 dark:bg-zinc-950/40">
        {groupedClients.map((group) => {
          const totalPending = group.debts
            .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
            .reduce((sum, d) => sum + (d.amount_mt || 0), 0);

          const totalOriginal = group.debts
            .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
            .reduce((sum, d) => sum + (d.original_amount || d.amount_mt || 0), 0);

          const sortedDebts = [...group.debts].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestDebt = sortedDebts[0];
          const unpaidCount = group.debts.filter(d => d.status === 'unpaid' && d.is_deleted !== 1).length;
          const isSelected = selectedClients.has(group.clientName);

          return (
            <motion.div
              key={group.clientName}
              whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.04)' }}
              onClick={() => onSelectClient(group.clientName)}
              className={`grid grid-cols-12 gap-4 items-center px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex justify-center" onClick={(e) => e.stopPropagation()}>
                {onToggleSelectClient && (
                  <button
                    type="button"
                    onClick={() => onToggleSelectClient(group.clientName)}
                    className="cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* Client & Contact Info */}
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-500/20">
                    {group.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-zinc-100 truncate text-xs">
                      {group.clientName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {latestDebt?.phone_number && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={10} className="text-slate-400 shrink-0" />
                          {latestDebt.phone_number}
                        </span>
                      )}
                      {latestDebt?.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          {latestDebt.address}
                        </span>
                      )}
                      {!latestDebt?.phone_number && !latestDebt?.address && (
                        <span className="italic text-slate-400">{t.notInformed || 'Sem contacto'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Purchases Count */}
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  unpaidCount > 0
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {unpaidCount > 0 ? `${unpaidCount} ${t.unpaidBadge || 'Pendente'}` : (t.paidBadge || 'Sem Dívidas')}
                </span>
              </div>

              {/* Total Balance */}
              <div className="col-span-2 font-mono">
                <div className="flex flex-col">
                  <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                    {formatCurrency(totalPending)}
                  </span>
                  {totalOriginal > totalPending && (
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                      {t.originalAmount ? t.originalAmount.substring(0, 4) : 'Orig'}: {formatCurrency(totalOriginal)}
                    </span>
                  )}
                </div>
              </div>

              {/* Last Activity */}
              <div className="col-span-2 text-slate-600 dark:text-zinc-400 text-xs">
                {latestDebt?.created_at ? (
                  <span className="font-mono text-[11px]">
                    {new Date(latestDebt.created_at).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>

              {/* Action Button */}
              <div className="col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-all border border-slate-200/60 dark:border-zinc-800">
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

