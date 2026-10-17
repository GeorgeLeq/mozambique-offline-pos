import React, { useState, useEffect } from 'react';
import { AmbientBackground } from '../AmbientBackground';
import { WhatsAppQRModal } from '../WhatsAppQRModal';
import { DebtTable } from './DebtTable';
import { SettleModal } from './SettleModal';
import { HiddenReceipt } from './HiddenReceipt';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { ManualDebtModal } from './ManualDebtModal';
import { ClientGroupTable } from './ClientGroupTable';
import { ClientLedgerPagination } from './ClientLedgerPagination';
import { ClientLedgerHeader } from './ClientLedgerHeader';
import { ClientGuideModal } from './ClientGuideModal';
import { useClientLedger } from './hooks/useClientLedger';
import { ConfirmActionModal } from './ConfirmActionModal';
import { DebtRecord } from './types';
import DiagnosticConsole from '../DiagnosticConsole';
import { 
  Users, 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RefreshCw, 
  Download, 
  Plus, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useCustomersI18n } from '../../i18n';

export default function ClientManager({ onBack }: { onBack: () => void }) {
  const t = useCustomersI18n();
  const [selectedDebts, setSelectedDebts] = useState<Set<string>>(new Set());
  const [highlightedDebt, setHighlightedDebt] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Diagnostic state
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Keyboard shortcut listeners for diagnostics
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') || e.key === 'F12') {
        e.preventDefault();
        setIsDiagOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);

    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<'delete' | 'restore' | 'hard_delete' | null>(null);
  const [confirmDebt, setConfirmDebt] = useState<DebtRecord | null>(null);

  const {
    currentUser,
    debts,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    isGrouped,
    setIsGrouped,
    selectedGroupClient,
    setSelectedGroupClient,
    
    settleModalOpen,
    setSettleModalOpen,
    selectedDebt,
    
    receiptToPrint,
    
    whatsappModalOpen,
    setWhatsappModalOpen,
    whatsappUrl,
    
    historyModalOpen,
    setHistoryModalOpen,
    historyDebt,
    
    manualDebtModalOpen,
    setManualDebtModalOpen,
    debtToEdit,
    isRefreshing,
    
    processedList,
    groupedClients,
    paginatedGroupedClients,
    totalPages,
    paginatedDebts,
    
    handleMarkAsPaid,
    handleSaveManualDebt,
    handleDeleteDebt,
    handleRestoreDebt,
    handleHardDeleteDebt,
    handleExport,
    openSettleModal,
    openEditModal,
    openAddModal,
    handleShareWhatsApp,
    handlePrintReceipt,
    openHistoryModal,
    handleRefresh,
  } = useClientLedger(onBack, isFullScreen);

  const toggleSelectAll = () => {
    if (selectedDebts.size === paginatedDebts.length && paginatedDebts.length > 0) {
      setSelectedDebts(new Set());
    } else {
      setSelectedDebts(new Set(paginatedDebts.map(d => d.id)));
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedDebts);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDebts(next);
  };

  const triggerDeleteConfirm = (debt: DebtRecord) => {
    setConfirmDebt(debt);
    setConfirmActionType('delete');
    setConfirmModalOpen(true);
  };

  const triggerRestoreConfirm = (debt: DebtRecord) => {
    setConfirmDebt(debt);
    setConfirmActionType('restore');
    setConfirmModalOpen(true);
  };

  const triggerHardDeleteConfirm = (debt: DebtRecord) => {
    setConfirmDebt(debt);
    setConfirmActionType('hard_delete');
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmDebt || !confirmActionType) return;
    if (confirmActionType === 'delete') {
      await handleDeleteDebt(confirmDebt);
    } else if (confirmActionType === 'restore') {
      await handleRestoreDebt(confirmDebt);
    } else if (confirmActionType === 'hard_delete') {
      await handleHardDeleteDebt(confirmDebt);
    }
  };

  const totalPendingAmount = React.useMemo(() => {
    return debts
      .filter(d => d.status === 'unpaid' && d.is_deleted !== 1)
      .reduce((sum, curr) => sum + (curr.amount_mt || 0), 0);
  }, [debts]);

  const activeClientsCount = React.useMemo(() => {
    const names = new Set(
      debts
        .filter(d => d.is_deleted !== 1 && d.status === 'unpaid')
        .map(d => d.customer_name)
    );
    return names.size;
  }, [debts]);

  const toggleSelectAllClients = () => {
    if (selectedClients.size === paginatedGroupedClients.length && paginatedGroupedClients.length > 0) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(paginatedGroupedClients.map(g => g.clientName)));
    }
  };

  const toggleSelectClient = (clientName: string) => {
    const next = new Set(selectedClients);
    if (next.has(clientName)) {
      next.delete(clientName);
    } else {
      next.add(clientName);
    }
    setSelectedClients(next);
  };

  return (
    <div className={`h-screen max-h-screen flex flex-col font-sans select-none overflow-hidden relative ${
      isFullScreen ? 'p-0 gap-0' : 'p-2 sm:p-3 gap-2.5'
    } bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-all duration-300`}>
      <AmbientBackground />

      {/* POS Header Bar matching Employee Manager standard (hidden in fullscreen expand mode) */}
      {!isFullScreen && (
        <ClientLedgerHeader 
          totalPending={totalPendingAmount}
          totalClients={activeClientsCount}
          onOpenManualModal={openAddModal}
          onExportExcel={handleExport}
          onRefresh={handleRefresh}
          isExporting={false}
          selectedGroupClient={selectedGroupClient}
          onBackToGroups={() => setSelectedGroupClient(null)}
          onBack={onBack}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Main Table / Grouped Table Content Section */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10">
        {isGrouped && !selectedGroupClient ? (
          <div className="flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs">
            {/* Toolbar for Agrupar mode */}
            <div className="p-3 border-b border-slate-200/80 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-zinc-950/80 shrink-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={13} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.searchGroupedClients || "Pesquisar clientes agrupados..."}
                    className="w-full pl-8 pr-7 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="pl-3.5 pr-8 py-2 appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold text-[10px] uppercase tracking-wider outline-none cursor-pointer shadow-xs"
                  >
                    <option value="unpaid">{t.unpaid || 'Não Pagos'}</option>
                    <option value="partial">{t.partial || 'Parciais'}</option>
                    <option value="paid">{t.paid || 'Pagos'}</option>
                    <option value="all">{t.allStatus || 'Todos Estados'}</option>
                    <option value="deleted">{t.deleted || 'Cancelados'}</option>
                  </select>
                  <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={11} />
                </div>

                {/* Sorter */}
                <div className="relative shrink-0">
                  <select
                    value={sortOrder || 'date-desc'}
                    onChange={e => setSortOrder(e.target.value as any)}
                    className="pl-3.5 pr-8 py-2 appearance-none bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white font-bold text-[10px] uppercase tracking-wider outline-none cursor-pointer shadow-xs"
                  >
                    <option value="date-desc">{t.recent || 'Recentes'}</option>
                    <option value="date-asc">{t.oldest || 'Antigos'}</option>
                    <option value="amount-desc">{t.highestAmount || 'Maior Valor'}</option>
                    <option value="amount-asc">{t.lowestAmount || 'Menor Valor'}</option>
                  </select>
                  <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={11} />
                </div>

                {/* Pending Total */}
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-xl px-3 py-1.5 shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">{t.pendingTotal || 'Total Pendente:'}</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatCurrency(totalPendingAmount)} MT
                  </span>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Grouping Toggle */}
                <button
                  onClick={() => setIsGrouped(false)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 border border-indigo-600 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title={t.backToList || "Voltar à Visualização em Lista"}
                >
                  <Users size={11} />
                  <span>{t.grouped || 'Agrupado'}</span>
                </button>

                {/* Full-width expand toggle button */}
                <button
                  onClick={() => setIsFullScreen(prev => !prev)}
                  className={`p-2 rounded-xl border text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs ${
                    isFullScreen 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                  title={isFullScreen ? (t.restoreView || "Restaurar visualização") : (t.expandFullScreen || "Expandir modo ecrã inteiro")}
                >
                  {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>

                {/* Refresh */}
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs ${
                    isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  title={t.syncData || "Sincronizar dados"}
                >
                  <RefreshCw size={12} />
                </button>

                {/* Export */}
                <button
                  onClick={handleExport}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                  title={t.exportData || "Exportar dados"}
                >
                  <Download size={12} />
                </button>

                {/* New Debt */}
                <button
                  onClick={openAddModal}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  title={t.registerNewDebt || "Registar nova dívida"}
                >
                  <Plus size={11} />
                  <span>{t.newDebtBtn || 'Novo'}</span>
                </button>
              </div>
            </div>

            {/* Agrupar Table Body */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white/60 dark:bg-zinc-950/20">
              <ClientGroupTable 
                groupedClients={paginatedGroupedClients}
                onSelectClient={setSelectedGroupClient}
                selectedClients={selectedClients}
                onToggleSelectClient={toggleSelectClient}
                onToggleSelectAll={toggleSelectAllClients}
              />
            </div>

            {/* Pagination Footer */}
            {groupedClients.length > 0 && (
              <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
                <div>
                  {t.showing || 'Mostrando'} <span className="font-bold text-slate-800 dark:text-zinc-200">{(currentPage - 1) * itemsPerPage + 1}</span> {t.to || 'a'} <span className="font-bold text-slate-800 dark:text-zinc-200">{Math.min(currentPage * itemsPerPage, groupedClients.length)}</span> {t.of || 'de'} <span className="font-bold text-slate-800 dark:text-zinc-200">{groupedClients.length}</span> {t.clients || 'clientes'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl font-bold disabled:opacity-40 cursor-pointer shadow-xs text-slate-700 dark:text-zinc-300"
                  >
                    {t.previous || 'Anterior'}
                  </button>
                  <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages || 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl font-bold disabled:opacity-40 cursor-pointer shadow-xs text-slate-700 dark:text-zinc-300"
                  >
                    {t.next || 'Seguinte'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DebtTable 
            debts={processedList}
            paginatedDebts={paginatedDebts}
            selectedDebts={selectedDebts}
            highlightedDebt={highlightedDebt}
            setHighlightedDebt={setHighlightedDebt}
            toggleSelectAll={toggleSelectAll}
            toggleSelection={toggleSelection}
            onShareWhatsApp={handleShareWhatsApp}
            onSettle={openSettleModal}
            onPrintReceipt={handlePrintReceipt}
            onViewHistory={openHistoryModal}
            onEdit={openEditModal}
            onDelete={triggerDeleteConfirm}
            onRestore={triggerRestoreConfirm}
            onHardDelete={triggerHardDeleteConfirm}
            currentUser={currentUser}
            currentPage={currentPage}
            pageSize={itemsPerPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            isFocusMode={isFullScreen}
            onToggleFocus={() => setIsFullScreen(prev => !prev)}
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            isGrouped={isGrouped}
            setIsGrouped={setIsGrouped}
            selectedGroupClient={selectedGroupClient}
            setSelectedGroupClient={setSelectedGroupClient}
            onAddDebt={openAddModal}
            onExport={handleExport}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )}
      </div>

      <SettleModal 
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        selectedDebt={selectedDebt}
        onConfirm={(paidAmt, payMethod) => handleMarkAsPaid(paidAmt, payMethod)}
      />
      
      <ManualDebtModal 
        isOpen={manualDebtModalOpen}
        onClose={() => setManualDebtModalOpen(false)}
        onSave={handleSaveManualDebt}
        editDebt={debtToEdit}
      />

      <PaymentHistoryModal 
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        debt={historyDebt}
      />

      <WhatsAppQRModal 
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        whatsappUrl={whatsappUrl}
      />

      <ConfirmActionModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmDebt(null);
          setConfirmActionType(null);
        }}
        onConfirm={handleConfirmAction}
        debt={confirmDebt}
        actionType={confirmActionType}
      />

      <ClientGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <HiddenReceipt receiptToPrint={receiptToPrint} />

      <DiagnosticConsole isOpen={isDiagOpen} onClose={() => setIsDiagOpen(false)} />
    </div>
  );
}
