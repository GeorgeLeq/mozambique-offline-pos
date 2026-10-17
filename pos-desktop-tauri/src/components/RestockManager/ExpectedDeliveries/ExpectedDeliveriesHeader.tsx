import React from 'react';
import { Search, Layers, Trash2, RefreshCw, Lock, Plus, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../../lib/i18n';

interface ExpectedDeliveriesHeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  groupBySupplier: boolean;
  setGroupBySupplier: (val: boolean) => void;
  selectedIds: string[];
  handleBulkStatusChange: (status: string) => void;
  handleBulkDelete: () => void;
  isLoading: boolean;
  loadData: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  isAuthorized: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
  setIsModalOpen: (val: boolean) => void;
  totalFilteredCount: number;
}

export function ExpectedDeliveriesHeader({
  searchTerm,
  setSearchTerm,
  groupBySupplier,
  setGroupBySupplier,
  selectedIds,
  handleBulkStatusChange,
  handleBulkDelete,
  isLoading,
  loadData,
  isFocusMode = false,
  onToggleFocus,
  isAuthorized,
  onPromptAdminPin,
  setIsModalOpen,
  totalFilteredCount
}: ExpectedDeliveriesHeaderProps) {
  const t = useI18n();

  return (
    <div className={`transition-all duration-300 ${
      isFocusMode
        ? 'px-4 py-2 border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-zinc-950 flex flex-row items-center justify-between gap-3 w-full shrink-0 shadow-sm rounded-none'
        : 'flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center'
    }`}>
      <div className={`flex flex-wrap items-center gap-3 ${isFocusMode ? 'flex-1 max-w-2xl' : 'w-full lg:w-auto'}`}>
        <div className={`relative ${isFocusMode ? 'w-48 sm:w-64' : 'w-full sm:w-[320px]'}`}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchDeliveriesPlaceholder || "Pesquisar PO, fornecedor..."}
            className={`w-full pl-9 pr-3 bg-white/85 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-bold shadow-sm dark:text-white ${
              isFocusMode ? 'py-1.5' : 'py-3'
            }`}
          />
        </div>

        {/* Toggle Group By Supplier */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            className={`rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              isFocusMode ? 'px-2.5 py-1.5' : 'px-3.5 py-3 rounded-2xl'
            } ${
              groupBySupplier 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white/85 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
            }`}
            title="Separar/Agrupar por fornecedor"
          >
            <Layers size={13} />
            <span className={isFocusMode ? 'hidden sm:inline' : ''}>Agrupar por Fornecedor</span>
          </button>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border-0 shadow-md ${
                isFocusMode ? 'px-3 py-1.5' : 'px-4 py-3 rounded-2xl'
              }`}
            >
              <option value="" disabled className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Alterar Estado ({selectedIds.length})</option>
              <option value="pending" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Marcar Pendente</option>
              <option value="received" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Marcar Recebido</option>
              <option value="discrepancy" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Divergência</option>
            </select>

            <button
              onClick={handleBulkDelete}
              className={`bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer border-0 shrink-0 ${
                isFocusMode ? 'px-3 py-1.5' : 'px-4 py-3 rounded-2xl'
              }`}
            >
              <Trash2 size={13} />
              <span>Eliminar ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={loadData}
          className={`bg-white/85 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 ${
            isFocusMode ? 'p-1.5' : 'p-3'
          }`}
          title="Atualizar lista de encomendas"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin text-indigo-600" : ""} />
        </button>

        <button
          onClick={() => {
            if (isAuthorized) {
              setIsModalOpen(true);
            } else if (onPromptAdminPin) {
              onPromptAdminPin(() => setIsModalOpen(true));
            } else {
              toast.error("Acesso restrito ao administrador");
            }
          }}
          className={`flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20 text-[10px] font-black uppercase tracking-wider hover:translate-y-[-1px] active:scale-95 cursor-pointer border-0 ${
            isFocusMode ? 'px-4 py-2' : 'px-6 py-3 rounded-2xl'
          }`}
        >
          <Lock size={11} className={isAuthorized ? "hidden" : ""} />
          <Plus size={13} className={isAuthorized ? "" : "hidden"} />
          <span>{t.newDeliveryOrder || 'Nova Encomenda'}</span>
        </button>

        {/* Foco Toggle Button */}
        {onToggleFocus && (
          <button
            onClick={onToggleFocus}
            className={`rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isFocusMode ? 'p-1.5' : 'p-2.5'
            } ${
              isFocusMode
                ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                : 'bg-white/85 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-400'
            }`}
            title={isFocusMode ? "Sair do Modo Foco" : "Ativar Modo Foco"}
          >
            {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
