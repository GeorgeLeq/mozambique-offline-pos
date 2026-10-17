import React, { useState } from 'react';
import { useShiftReports } from './hooks/useShiftReports';
import { ShiftReportsHeader } from './components/ShiftReportsHeader';
import { ShiftReportsSummaryCards } from './components/ShiftReportsSummaryCards';
import { ShiftReportsTable } from './components/ShiftReportsTable';
import { AmbientBackground } from '../AmbientBackground';
import { ShiftReport } from './types';
import { formatCurrency } from '../../lib/utils';
import { useShiftReportsI18n } from '../../i18n';
import toast from 'react-hot-toast';

export default function ShiftReports({ onBack, onOpenScans }: { onBack: () => void, onOpenScans?: (userId?: string, userName?: string) => void }) {
  const t = useShiftReportsI18n();
  const {
    loading,
    baseCash,
    setBaseCash,
    isSavingBaseCash,
    expandedId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    userMap,
    currentPage,
    setCurrentPage,
    showArchive,
    setShowArchive,
    loadingArchive,
    totalPages,
    paginatedReports,
    filteredReports,
    totalExpected,
    totalReported,
    totalDifference,
    totalShifts,
    activeShiftsCount,
    okCount,
    shortageCount,
    surplusCount,
    hasArchiveRecords,
    fetchArchivedReportsFromCloud,
    handleSaveBaseCash,
    toggleExpand
  } = useShiftReports();

  // Persist summary cards collapsed / expanded state (matching AuditLogs)
  const [showSummaryCards, setShowSummaryCards] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pos_shift_reports_show_summary');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSummaryCards = () => {
    setShowSummaryCards(prev => {
      const next = !prev;
      try {
        localStorage.setItem('pos_shift_reports_show_summary', String(next));
      } catch {}
      return next;
    });
  };

  const handlePrintReport = (report: ShiftReport, details: any, userName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t.printPopupError || 'Permita popups para imprimir o relatório');
      return;
    }
    const reportStatusText = report.difference_mt === 0 
      ? (t.printStatusOk || 'SEM QUEBRAS (OK)')
      : report.difference_mt < 0 
      ? (t.printStatusShortage || 'QUEBRA DE CAIXA') 
      : (t.printStatusSurplus || 'SOBRA DE CAIXA');

    const htmlContent = `
      <html>
        <head>
          <title>${t.printTitle || 'Relatório de Turno'} - RT-${report.id.substring(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #111; max-width: 800px; margin: 0 auto; }
            h2, h3 { text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
            .section { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
            .footer { text-align: center; font-size: 11px; margin-top: 30px; color: #777; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>${t.printStoreTitle || 'PONTO DE VENDA - MOÇAMBIQUE'}</h2>
          <h3>${t.printReportTitle || 'RELATÓRIO DE ENCERRAMENTO DE TURNO'}</h3>
          <div class="subtitle">${t.printIdLabel || 'ID:'} RT-${report.id} | ${t.printDateLabel || 'Data:'} ${new Date(report.created_at).toLocaleString('pt-MZ')}</div>
          
          <div class="section">
            <div class="row"><span>${t.printOperatorLabel || 'Operador:'}</span> <strong>${userName}</strong></div>
            <div class="row"><span>${t.printStatusLabel || 'Status:'}</span> <strong>${reportStatusText}</strong></div>
          </div>

          <div class="section">
            <div class="row"><span>${t.printExpectedLabel || 'Esperado Sistema:'}</span> <strong>${formatCurrency(report.expected_amount_mt)}</strong></div>
            <div class="row"><span>${t.printReportedLabel || 'Contado Físico:'}</span> <strong>${formatCurrency(report.reported_amount_mt)}</strong></div>
            <div class="row total"><span>${t.printDifferenceLabel || 'Diferença (Quebra/Sobra):'}</span> <strong>${formatCurrency(report.difference_mt)}</strong></div>
          </div>

          <div class="section">
            <h4>${t.printBillingDetails || 'Detalhes do Faturamento'}</h4>
            <div class="row"><span>${t.printBaseFloat || 'Fundo de Maneio:'}</span> <span>${formatCurrency(details?.stats?.baseCash || 0)}</span></div>
            <div class="row"><span>${t.printCashSales || 'Vendas em Dinheiro:'}</span> <span>${formatCurrency(details?.stats?.cashSalesTotal || 0)}</span></div>
            <div class="row"><span>${t.printTillPayouts || 'Saídas de Caixa:'}</span> <span>-${formatCurrency(details?.stats?.tillPayoutsTotal || 0)}</span></div>
            <div class="row"><span>${t.printMpesaSales || 'Vendas M-Pesa:'}</span> <span>${formatCurrency(details?.stats?.mpesaSalesTotal || 0)}</span></div>
            <div class="row"><span>${t.printEmolaSales || 'Vendas e-Mola:'}</span> <span>${formatCurrency(details?.stats?.emolaSalesTotal || 0)}</span></div>
          </div>

          <div class="footer">
            <p>${t.printFooterNote || 'Documento gerado eletronicamente para fins de auditoria e conformidade fiscal (Moçambique).'}</p>
            <p>${t.printResponsibleSign || 'Assinatura do Responsável: ___________________________'}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div id="shift-reports-root" className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-[#fbfbfd] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans select-none">
      <AmbientBackground />

      {/* Unified Edge-to-Edge Topbar Header (Matches BarcodeHeader) */}
      <ShiftReportsHeader
        onBack={onBack}
        baseCash={baseCash}
        setBaseCash={setBaseCash}
        isSavingBaseCash={isSavingBaseCash}
        onSaveBaseCash={handleSaveBaseCash}
        showArchive={showArchive}
        setShowArchive={setShowArchive}
        onFetchArchive={fetchArchivedReportsFromCloud}
        loadingArchive={loadingArchive}
        totalShifts={totalShifts}
        totalExpected={totalExpected}
        totalReported={totalReported}
        totalDifference={totalDifference}
        hasArchiveRecords={hasArchiveRecords}
        onOpenScans={onOpenScans}
      />

      {/* Summary Metric Cards with Interactive Info Guide Modals */}
      {showSummaryCards && (
        <ShiftReportsSummaryCards
          totalShifts={totalShifts}
          totalExpected={totalExpected}
          totalReported={totalReported}
          totalDifference={totalDifference}
          activeShiftsCount={activeShiftsCount}
          baseCash={baseCash}
          setBaseCash={setBaseCash}
          isSavingBaseCash={isSavingBaseCash}
          onSaveBaseCash={handleSaveBaseCash}
          okCount={okCount}
          shortageCount={shortageCount}
          surplusCount={surplusCount}
        />
      )}

      {/* Main Full-Screen Table View with Integrated Toolbar (Matches BarcodeTable) */}
      <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        <ShiftReportsTable
          reports={paginatedReports}
          loading={loading}
          userMap={userMap}
          expandedId={expandedId}
          onToggleExpand={toggleExpand}
          onPrintReport={handlePrintReport}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showArchive={showArchive}
          onOpenScans={onOpenScans}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalFilteredCount={filteredReports.length}
          totalCount={totalShifts}
          okCount={okCount}
          shortageCount={shortageCount}
          surplusCount={surplusCount}
          showSummaryCards={showSummaryCards}
          onToggleSummaryCards={handleToggleSummaryCards}
        />
      </main>
    </div>
  );
}
