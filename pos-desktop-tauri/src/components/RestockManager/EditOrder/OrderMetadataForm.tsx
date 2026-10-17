import React from 'react';
import { Building2, Calendar, ShieldAlert } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface OrderMetadataFormProps {
  supplierName: string;
  setSupplierName: (val: string) => void;
  expectedDate: string;
  setExpectedDate: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
}

export function OrderMetadataForm({
  supplierName,
  setSupplierName,
  expectedDate,
  setExpectedDate,
  status,
  setStatus,
}: OrderMetadataFormProps) {
  const t = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
      {/* 1. Supplier Name */}
      <div className="lg:col-span-4">
        <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Building2 size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.supplierName || 'Fornecedor'}</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder={t.supplierName || "Nome do fornecedor..."}
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 shadow-2xs transition-all"
          required
        />
      </div>

      {/* 2. Expected Date */}
      <div className="lg:col-span-3">
        <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Calendar size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.expectedDate || 'Data Prevista'}</span>
        </label>
        <input
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 shadow-2xs [color-scheme:light] dark:[color-scheme:dark] transition-all"
        />
      </div>

      {/* 3. Global PO Status */}
      <div className="lg:col-span-3">
        <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
          {t.globalPoStatus || 'Estado Global PO'}
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 shadow-2xs transition-all cursor-pointer"
        >
          <option value="pending">{t.pendingLocksStock || 'Pendente (Tranca Stock)'}</option>
          <option value="received">{t.receivedDirect || 'Recebida (Desbloqueia POS)'}</option>
          <option value="discrepancy">{t.discrepancyLock || 'Divergência Detetada'}</option>
        </select>
      </div>

      {/* 4. Info / Sync Badge */}
      <div className="lg:col-span-2 flex items-center gap-2 p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/70 dark:border-amber-800/40">
        <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-[9.5px] font-bold text-amber-900 dark:text-amber-300 leading-tight truncate">
          {t.offlinePosSync || 'Sincronização Offline POS'}
        </span>
      </div>
    </div>
  );
}
