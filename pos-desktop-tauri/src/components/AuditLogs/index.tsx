import React, { useState, useEffect } from 'react';
import { useAuditLogs } from './hooks/useAuditLogs';
import { AuditLogsHeader } from './components/AuditLogsHeader';
import { AuditLogsSummaryCards } from './components/AuditLogsSummaryCards';
import { AuditLogsToolbar } from './components/AuditLogsToolbar';
import { AuditLogsTable } from './components/AuditLogsTable';
import { AuditDetailModal } from './components/AuditDetailModal';
import { AmbientBackground } from '../AmbientBackground';

export default function AuditLogs({ onBack }: { onBack: () => void }) {
  const {
    logs,
    filteredLogs,
    paginatedLogs,
    userMap,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    dateRange,
    setDateRange,
    highlightedLogId,
    setHighlightedLogId,
    selectedLogForDetails,
    setSelectedLogForDetails,
    isLoading,
    currentPage,
    setCurrentPage,
    totalPages,
    categoryCounts,
    stats,
    loadLogs,
    exportCSV
  } = useAuditLogs();

  // Persist summary cards collapsed / expanded state without animation
  const [showSummaryCards, setShowSummaryCards] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pos_audit_show_summary');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSummaryCards = () => {
    setShowSummaryCards(prev => {
      const next = !prev;
      try {
        localStorage.setItem('pos_audit_show_summary', String(next));
      } catch (e) {
        console.warn('Could not persist summary cards preference:', e);
      }
      return next;
    });
  };

  return (
    <div id="audit-logs-root" className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-[#fbfbfd] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans select-none">
      <AmbientBackground />

      {/* 1. Header Bar with Cloud Status (Detects Paid vs Free Mode), Export CSV, Refresh & Guide */}
      <AuditLogsHeader
        onBack={onBack}
        onRefresh={loadLogs}
        onExportCSV={exportCSV}
        isLoading={isLoading}
        totalLogs={logs.length}
      />

      {/* 2. Optional Toggleable Summary Metric Cards (Instant without animation) */}
      {showSummaryCards && (
        <AuditLogsSummaryCards stats={stats} />
      )}

      {/* 3. Integrated Toolbar with Category Filters, Date Range, Summary Cards Toggle & Live Search */}
      <AuditLogsToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        dateRange={dateRange}
        setDateRange={setDateRange}
        categoryCounts={categoryCounts}
        showSummaryCards={showSummaryCards}
        onToggleSummaryCards={handleToggleSummaryCards}
      />

      {/* 4. Main Full-Screen Table View with Item Highlighter */}
      <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        <AuditLogsTable
          logs={paginatedLogs}
          loading={isLoading}
          userMap={userMap}
          highlightedLogId={highlightedLogId}
          onSelectLog={setHighlightedLogId}
          onViewDetails={setSelectedLogForDetails}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalFilteredCount={filteredLogs.length}
          totalCount={logs.length}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />
      </main>

      {/* 5. Detail Modal for Hash & Metadata Inspection */}
      <AuditDetailModal
        log={selectedLogForDetails}
        onClose={() => setSelectedLogForDetails(null)}
        userMap={userMap}
      />
    </div>
  );
}

export * from './types';
