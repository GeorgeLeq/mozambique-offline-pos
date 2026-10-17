import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Plus, Download, Users, CheckCircle2, Clock, Wallet, LayoutGrid, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../../lib/utils';
import { DebtRecord } from './types';
import toast from 'react-hot-toast';
import { useCustomersI18n } from '../../i18n';

interface ClientLedgerControlsProps {
  filter: 'all' | 'unpaid' | 'paid' | 'partial' | 'deleted';
  setFilter: (filter: 'all' | 'unpaid' | 'paid' | 'partial' | 'deleted') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortOrder: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  setSortOrder: (val: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc') => void;
  isGrouped: boolean;
  setIsGrouped: (val: boolean) => void;
  onAddDebt: () => void;
  onExport: () => void;
  debts: DebtRecord[];
  currentUser?: any;
}

export function ClientLedgerControls({ 
  filter, 
  setFilter, 
  searchQuery, 
  setSearchQuery, 
  sortOrder, 
  setSortOrder,
  isGrouped,
  setIsGrouped,
  onAddDebt,
  onExport,
  debts,
  currentUser
}: ClientLedgerControlsProps) {
  const t = useCustomersI18n();
  const [expiryDays, setExpiryDays] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      return Number(localStorage.getItem('debts_expiry_days') || '30');
    }
    return 30;
  });

  const isAdminOrGerente = currentUser?.role === 'Admin' || currentUser?.role === 'Gerente';

  const totalPending = useMemo(() => {
    return debts
      .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
      .reduce((acc, curr) => acc + (curr.amount_mt || 0), 0);
  }, [debts]);

  return (
    <div className="bg-black/90 rounded-[2.5rem] shadow-xl border border-zinc-800 p-5 md:p-8 flex flex-col gap-5 relative overflow-hidden">
      {/* Soft color highlights on background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 relative z-10">
        {/* iOS/macOS styled segment pill controller with icons */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto hide-scrollbar w-full xl:w-auto gap-1 relative">
          {([
            { value: 'unpaid', label: t.unpaid || 'Não Pagos', icon: Clock },
            { value: 'partial', label: t.partial || 'Parciais', icon: Wallet },
            { value: 'paid', label: t.paid || 'Pagos', icon: CheckCircle2 },
            { value: 'all', label: t.allStatus || 'Todos', icon: LayoutGrid },
            { value: 'deleted', label: t.deleted || 'Cancelados', icon: Trash2 }
          ] as const).map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`relative px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer z-10 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLedgerFilter"
                    className="absolute inset-0 bg-indigo-600 rounded-full shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Info panel & key action buttons */}
        <div className="flex items-center gap-4 bg-zinc-950 px-5 py-3.5 rounded-2xl border border-zinc-800 shadow-inner whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">{t.pendingTotal || 'Saldo Pendente Total'}</span>
            <span className="text-xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
              {formatCurrency(totalPending)}
            </span>
          </div>
          
          {isAdminOrGerente && (
            <>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">{t.autoExpiration || 'Auto-Expiração'}</span>
                <select
                  value={expiryDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    localStorage.setItem('debts_expiry_days', val);
                    setExpiryDays(Number(val));
                    const numVal = Number(val);
                    toast.success(numVal <= 0 
                      ? (t.autoExpireNeverToast || 'Retenção de dívidas: Nunca (Sem expiração)') 
                      : (t.autoExpireDaysToast || `Auto-expiração definida para ${val} dias`).replace('{0}', val));
                    // Reload window to apply instant scans immediately
                    setTimeout(() => window.location.reload(), 800);
                  }}
                  className="bg-transparent text-xs font-black text-indigo-400 hover:text-indigo-300 outline-none border-none cursor-pointer mt-0.5 font-sans"
                >
                  <option value="30" className="bg-zinc-950 text-white">30 {t.days || 'Dias'}</option>
                  <option value="60" className="bg-zinc-950 text-white">60 {t.days || 'Dias'}</option>
                  <option value="90" className="bg-zinc-950 text-white">90 {t.days || 'Dias'}</option>
                  <option value="-1" className="bg-zinc-950 text-white">{t.neverOption || 'Nunca (Sem Expiração)'}</option>
                </select>
              </div>
            </>
          )}

          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGrouped(!isGrouped)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors duration-150 border flex items-center gap-1.5 cursor-pointer ${
                isGrouped 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
              }`}
            >
              <Users size={14} /> {isGrouped ? (t.grouped || 'Agrupado') : (t.grouped || 'Agrupar')}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced search and sorters row */}
      <div className="flex flex-col lg:flex-row gap-4 items-center relative z-10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder || 'Procurar por nome do cliente, telefone...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-zinc-900 transition-all text-white font-medium text-sm outline-none placeholder:text-zinc-600"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="relative flex-1 lg:flex-none">
             <select
               value={sortOrder}
               onChange={(e) => setSortOrder(e.target.value as any)}
               className="w-full pl-4 pr-11 py-3.5 appearance-none bg-zinc-950 border border-zinc-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-white font-extrabold text-xs uppercase tracking-wider outline-none cursor-pointer"
             >
               <option value="date-desc">{t.recent || 'Recentes Primeiro'}</option>
               <option value="date-asc">{t.oldest || 'Antigos Primeiro'}</option>
               <option value="amount-desc">{t.highestAmount || 'Maior Valor'}</option>
               <option value="amount-asc">{t.lowestAmount || 'Menor Valor'}</option>
             </select>
             <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
