import React from 'react';
import { useI18n } from '../../../i18n';
import { Building2, Calendar, FileText, ShieldAlert } from 'lucide-react';

interface NewOrderMetadataProps {
  supplier: string;
  setSupplier: (val: string) => void;
  invoiceNumber: string;
  setInvoiceNumber: (val: string) => void;
  expectedDate: string;
  setExpectedDate: (val: string) => void;
  globalRequiresVerification: boolean;
  setGlobalRequiresVerification: (val: boolean) => void;
}

export function NewOrderMetadata({
  supplier,
  setSupplier,
  invoiceNumber,
  setInvoiceNumber,
  expectedDate,
  setExpectedDate,
  globalRequiresVerification,
  setGlobalRequiresVerification,
}: NewOrderMetadataProps) {
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
          value={supplier}
          onChange={e => setSupplier(e.target.value)}
          placeholder="Ex: Cervejas de Moçambique, Coca-Cola..."
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-2xs transition-all"
          required
        />
      </div>

      {/* 2. Invoice / Guia Ref */}
      <div className="lg:col-span-3">
        <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <FileText size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.invoiceRef || 'Nº Fatura / Guia'}</span>
        </label>
        <input
          type="text"
          value={invoiceNumber}
          onChange={e => setInvoiceNumber(e.target.value)}
          placeholder="Ex: FT-2026/089"
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-2xs transition-all"
        />
      </div>

      {/* 3. Expected Date */}
      <div className="lg:col-span-2">
        <label className="block text-[10.5px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Calendar size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t.expectedDate || 'Data Prevista'}</span>
        </label>
        <input
          type="date"
          value={expectedDate}
          onChange={e => setExpectedDate(e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-bold text-slate-900 dark:text-zinc-100 shadow-2xs transition-all [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {/* 4. Global Verification Switch */}
      <div className="lg:col-span-3 flex items-center justify-between sm:justify-end gap-3 p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-800/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldAlert size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="truncate">
            <span className="block text-[10px] font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider truncate">
              {t.receptionVerification || 'Verif. no Acolhimento'}
            </span>
            <span className="block text-[9px] text-indigo-700/80 dark:text-indigo-300/80 truncate">
              {globalRequiresVerification ? (t.locksInPosUntilVerified || 'Tranca no POS até verif.') : (t.freeSaleInPos || 'Venda livre no POS')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setGlobalRequiresVerification(!globalRequiresVerification)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${globalRequiresVerification ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'}`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalRequiresVerification ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>
    </div>
  );
}

