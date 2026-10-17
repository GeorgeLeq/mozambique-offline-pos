import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { RestockHistoryProps, RestockTabType } from './types';
import { useRestockHistory } from './hooks/useRestockHistory';
import { useTrashBin } from './hooks/useTrashBin';
import { RestockHistoryHeader } from './components/RestockHistoryHeader';
import { RestockLogsTable } from './components/RestockLogsTable';
import { TrashBinTable } from './components/TrashBinTable';
import { RestockDetailsModal } from '../RestockDetailsModal';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { HistoryGuideModal } from '../HistoryGuideModal';
import { useI18n } from '../../../i18n';

export function RestockHistory({ 
  isAdminUnlocked = false, 
  onPromptAdminPin,
  orderSubTab = 'history',
  onSelectOrderSubTab,
  isFocusMode = false,
  onToggleFocusMode,
  activeTab: activeMainTab = 'orders',
  onSelectTab: onSelectMainTab
}: RestockHistoryProps) {
  const t = useI18n();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<RestockTabType>('history');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Check if current user has history permission directly or if unlocked
  const hasHistoryPermission = () => {
    if (currentUser?.role === 'Admin' || isAdminUnlocked) return true;
    if (currentUser?.permissions_json) {
      try {
        const parsed = JSON.parse(currentUser.permissions_json);
        const perms: string[] = Array.isArray(parsed) ? parsed : (parsed.permissions || []);
        if (perms.includes('history') || perms.includes('audit')) return true;
      } catch (e) {
        console.warn('Error parsing user permissions', e);
      }
    }
    return false;
  };

  const isAccessAllowed = hasHistoryPermission();

  // History logs hook
  const {
    logs,
    filteredLogs,
    paginatedLogs,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isLoading: isLoadingLogs,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedLog,
    setSelectedLog,
    logToDeleteId,
    setLogToDeleteId,
    retentionDays,
    handleSetRetentionDays,
    handleDeleteLog
  } = useRestockHistory();

  // Trash bin hook
  const {
    deletedProducts,
    filteredTrash,
    trashSearchTerm,
    setTrashSearchTerm,
    isLoading: isLoadingTrash,
    selectedTrashIds,
    toggleSelectTrash,
    toggleSelectAllTrash,
    productToWipe,
    setProductToWipe,
    isBulkRestoreConfirm,
    setIsBulkRestoreConfirm,
    isBulkWipeConfirm,
    setIsBulkWipeConfirm,
    handleRestoreProduct,
    handleBulkRestore,
    handlePermanentWipeProduct,
    handleBulkWipe,
    getDaysRemaining
  } = useTrashBin(currentUser);

  return (
    <div className={`flex flex-col h-full w-full bg-transparent relative z-10 overflow-hidden ${
      isFocusMode ? 'p-0' : 'p-3 sm:p-4'
    }`}>
      <div className={`w-full flex flex-col h-full overflow-hidden ${
        isFocusMode ? 'gap-0' : 'gap-3'
      }`}>
        
        {/* Top Header & Toolbar */}
        <RestockHistoryHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orderSubTab={orderSubTab}
          onSelectOrderSubTab={onSelectOrderSubTab}
          isFocusMode={isFocusMode}
          onToggleFocusMode={onToggleFocusMode}
          activeMainTab={activeMainTab}
          onSelectMainTab={onSelectMainTab}
          logsCount={logs.length}
          trashCount={deletedProducts.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          trashSearchTerm={trashSearchTerm}
          setTrashSearchTerm={setTrashSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          retentionDays={retentionDays}
          onSetRetentionDays={handleSetRetentionDays}
          onOpenGuide={() => setIsGuideOpen(true)}
          isAccessAllowed={isAccessAllowed}
          onPromptAdminPin={onPromptAdminPin}
          filteredLogs={filteredLogs}
          filteredTrash={filteredTrash}
        />

        {/* Tab 1: Arrival Audit History */}
        {activeTab === 'history' && (
          <RestockLogsTable
            isLoading={isLoadingLogs}
            filteredLogs={filteredLogs}
            paginatedLogs={paginatedLogs}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onSelectLog={setSelectedLog}
          />
        )}

        {/* Tab 2: Soft-Deleted Products Trash Bin */}
        {activeTab === 'trash' && (
          <TrashBinTable
            isLoading={isLoadingTrash}
            filteredTrash={filteredTrash}
            retentionDays={retentionDays}
            selectedTrashIds={selectedTrashIds}
            onToggleSelectTrash={toggleSelectTrash}
            onToggleSelectAllTrash={toggleSelectAllTrash}
            onRestoreProduct={handleRestoreProduct}
            onRequestWipeProduct={setProductToWipe}
            onOpenBulkRestoreConfirm={() => setIsBulkRestoreConfirm(true)}
            onOpenBulkWipeConfirm={() => setIsBulkWipeConfirm(true)}
            getDaysRemaining={getDaysRemaining}
          />
        )}

      </div>

      {/* Guide Info Modal */}
      <HistoryGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Log Details Modal */}
      {selectedLog && (
        <RestockDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onDelete={(id) => setLogToDeleteId(id)}
        />
      )}

      {/* Single Log Delete Modal */}
      {logToDeleteId && (
        <DeleteConfirmModal
          title={t.deleteLogTitle || "Eliminar Registo de Histórico"}
          message={t.deleteLogMessage || "Tem a certeza de que deseja eliminar este registo de histórico permanentemente? Esta ação não pode ser desfeita."}
          onConfirm={() => handleDeleteLog(logToDeleteId)}
          onClose={() => setLogToDeleteId(null)}
        />
      )}

      {/* Single Product Wipe Modal */}
      {productToWipe && (
        <DeleteConfirmModal
          title={t.wipeProductTitle || "Eliminar Definitivamente"}
          message={t.wipeProductMessage ? t.wipeProductMessage(productToWipe.name) : `Tem a certeza que deseja eliminar permanentemente "${productToWipe.name}"? Esta ação removerá o produto e os seus códigos de barras associados sem possibilidade de restauro.`}
          onConfirm={handlePermanentWipeProduct}
          onClose={() => setProductToWipe(null)}
        />
      )}

      {/* Bulk Restore Modal */}
      {isBulkRestoreConfirm && (
        <DeleteConfirmModal
          title={t.bulkRestoreTitle || "Restaurar Lote de Produtos"}
          message={t.bulkRestoreMessage ? t.bulkRestoreMessage(selectedTrashIds.length) : `Deseja restaurar ${selectedTrashIds.length} produtos de volta ao inventário ativo?`}
          onConfirm={handleBulkRestore}
          onClose={() => setIsBulkRestoreConfirm(false)}
        />
      )}

      {/* Bulk Wipe Modal */}
      {isBulkWipeConfirm && (
        <DeleteConfirmModal
          title={t.bulkWipeTitle || "Eliminação Definitiva em Lote"}
          message={t.bulkWipeMessage ? t.bulkWipeMessage(selectedTrashIds.length) : `ATENÇÃO: Deseja eliminar ${selectedTrashIds.length} produtos permanentemente? Esta ação libertará espaço no SQLite mas é irreversível.`}
          onConfirm={handleBulkWipe}
          onClose={() => setIsBulkWipeConfirm(false)}
        />
      )}
    </div>
  );
}

export default RestockHistory;
