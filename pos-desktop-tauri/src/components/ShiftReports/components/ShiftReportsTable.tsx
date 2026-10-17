import React from 'react';
import { 
  FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, 
  Printer, Calendar, Clock, User, Search, X, Lock, Sparkles, BarChart3 
} from 'lucide-react';
import { ShiftReport } from '../types';
import { formatCurrency } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSubscription } from '../../../subscription/subscriptionContext';
import { useShiftReportsI18n } from '../../../i18n';

interface ShiftReportsTableProps {
  reports: ShiftReport[];
  loading: boolean;
  userMap: Record<string, string>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onPrintReport: (report: ShiftReport, details: any, userName: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showArchive: boolean;
  onOpenScans?: (userId: string, userName: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: 'all' | 'ok' | 'shortage' | 'surplus';
  setStatusFilter: (val: 'all' | 'ok' | 'shortage' | 'surplus') => void;
  totalFilteredCount: number;
  totalCount: number;
  okCount: number;
  shortageCount: number;
  surplusCount: number;
  showSummaryCards?: boolean;
  onToggleSummaryCards?: () => void;
}

export function ShiftReportsTable({
  reports,
  loading,
  userMap,
  expandedId,
  onToggleExpand,
  onPrintReport,
  currentPage,
  totalPages,
  onPageChange,
  showArchive,
  onOpenScans,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalFilteredCount,
  totalCount,
  okCount,
  shortageCount,
  surplusCount,
  showSummaryCards,
  onToggleSummaryCards
}: ShiftReportsTableProps) {
  const t = useShiftReportsI18n();
  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  const isAuditUnlocked = isFeatureUnlocked('advanced_audits');

  const handleOpenScansClick = (e: React.MouseEvent, report: ShiftReport, userName: string, scansCount: number) => {
    e.stopPropagation();

    if (!isAuditUnlocked) {
      openFeatureLockModal(
        'advanced_audits',
        t.scansAuditTitle || 'Auditoria Avançada de Leituras (Anti-Furto)',
        t.scansAuditTheftDesc || 'O acesso detalhado às leituras bipadas por operador e histórico de itens vendidos faz parte do plano Pro ou Enterprise. Atualize para auditar os bips e prevenir quebras de caixa.'
      );
      return;
    }

    if (scansCount > 0 && onOpenScans) {
      onOpenScans(report.user_id, userName);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Top Integrated Control Toolbar (Matches BarcodeTable) */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Segmented Status Filters & Summary Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleSummaryCards && (
            <button
              type="button"
              onClick={onToggleSummaryCards}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer shadow-2xs ${
                showSummaryCards
                  ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800'
              }`}
              title={showSummaryCards ? (t.hideSummaryCardsTooltip || 'Ocultar cartões de métricas') : (t.toggleSummaryCardsTooltip || 'Mostrar cartões de métricas')}
            >
              <BarChart3 size={14} className={showSummaryCards ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400'} />
              <span>{showSummaryCards ? (t.hideSummary || 'Ocultar Resumo') : (t.showSummary || 'Mostrar Resumo')}</span>
              {showSummaryCards ? <ChevronUp size={12} className="text-indigo-500 opacity-80" /> : <ChevronDown size={12} className="opacity-60" />}
            </button>
          )}

          <div className="flex bg-slate-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterAll || 'Todos'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700 font-semibold">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ok')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ok'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t.filterOk || 'Sem Quebras'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold">
                {okCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('shortage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'shortage'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" />
              <span>{t.filterShortage || 'Com Quebra'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold">
                {shortageCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('surplus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'surplus'
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterSurplus || 'Com Sobra'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold">
                {surplusCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Search Input (Matches BarcodeTable) */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={14} />
            <input
              type="text"
              placeholder={showArchive ? (t.searchArchivePlaceholder || "Pesquisar arquivo histórico...") : (t.searchPlaceholder || "Pesquisar por operador, ID, data...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Scroll Area */}
      <div id="shift-reports-table-container" className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 dark:text-zinc-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">{t.loadingShifts || 'Carregando relatórios de turno...'}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/60 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 border border-slate-200/60 dark:border-zinc-700/60">
              <FileText size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">{t.noReportsFound || 'Nenhum relatório encontrado'}</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
              {showArchive 
                ? (t.noArchiveReports || 'Não há registros arquivados no Supabase para este estabelecimento.')
                : (t.noRecentReports || 'Nenhum fecho de turno registrado recentemente nos últimos 30 dias com os filtros selecionados.')}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 sm:px-6 w-12 text-center">{t.thStatus || 'Status'}</th>
                <th className="py-3 px-4 sm:px-6">{t.thShiftDate || 'Turno & Data'}</th>
                <th className="py-3 px-4 sm:px-6">{t.thOperator || 'Operador'}</th>
                <th className="py-3 px-4 sm:px-6">{t.thExpected || 'Esperado'}</th>
                <th className="py-3 px-4 sm:px-6">{t.thReported || 'Contado'}</th>
                <th className="py-3 px-4 sm:px-6">{t.thDifference || 'Diferença'}</th>
                <th className="py-3 px-4 sm:px-6 text-right">{t.thDetails || 'Detalhes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {reports.map((report) => {
                const userName = userMap[report.user_id] || report.user_id || (t.systemOperator || 'Sistema');
                const isExpanded = expandedId === report.id;
                let details: any = null;
                try {
                  details = report.details_json ? JSON.parse(report.details_json) : null;
                } catch (e) {}

                const scansCount = details?.stats?.scansCount || 0;

                return (
                  <React.Fragment key={report.id}>
                    <tr 
                      onClick={() => onToggleExpand(report.id)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors duration-150 cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/25 dark:bg-indigo-950/15' : ''
                      }`}
                    >
                      {/* Status Icon */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="inline-flex items-center justify-center">
                          {report.difference_mt === 0 ? (
                            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/40">
                              <CheckCircle2 size={15} />
                            </div>
                          ) : (
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                              report.difference_mt < 0 
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40' 
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40'
                            }`}>
                              <AlertTriangle size={15} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Turno & Data */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-zinc-100">
                            RT-{report.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} /> {new Date(report.created_at).toLocaleDateString('pt-MZ')}
                            <Clock size={11} className="ml-1" /> {new Date(report.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Operador */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                            {userName.substring(0, 2)}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {userName}
                          </span>
                        </div>
                      </td>

                      {/* Esperado */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">
                          {formatCurrency(report.expected_amount_mt)}
                        </span>
                      </td>

                      {/* Contado */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrency(report.reported_amount_mt)}
                        </span>
                      </td>

                      {/* Diferença */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black font-mono border ${
                          report.difference_mt === 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                            : report.difference_mt < 0
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
                        }`}>
                          {report.difference_mt === 0 
                            ? '0,00 MT' 
                            : report.difference_mt > 0 
                            ? `+${formatCurrency(report.difference_mt)}` 
                            : formatCurrency(report.difference_mt)}
                        </span>
                      </td>

                      {/* Expand Chevron / Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Accordion Audit Breakdown Drawer */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40">
                          <div className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {/* Resumo de Caixa */}
                              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                                  {t.physicalCashSummary || 'Resumo de Caixa Físico'}
                                </span>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.initialFloat || 'Fundo Inicial:'}</span>
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                                      {formatCurrency(details?.stats?.baseCash || 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.cashSales || 'Vendas em Dinheiro:'}</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                      +{formatCurrency(details?.stats?.cashSalesTotal || 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.tillPayouts || 'Saídas / Sangrias:'}</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                                      -{formatCurrency(details?.stats?.tillPayoutsTotal || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Outras Formas */}
                              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                                  {t.electronicPayments || 'Outros Meios Eletrónicos'}
                                </span>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.mpesaLabel || 'M-Pesa:'}</span>
                                    <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                                      {formatCurrency(details?.stats?.mpesaSalesTotal || 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.emolaLabel || 'e-Mola:'}</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                                      {formatCurrency(details?.stats?.emolaSalesTotal || 0)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">{t.cardPosLabel || 'POS Cartão:'}</span>
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">
                                      {formatCurrency(details?.stats?.cardSalesTotal || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Nota de Auditoria & Actions */}
                              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                                    {t.auditOpinionTitle || 'Parecer de Auditoria'}
                                  </span>
                                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed italic">
                                    {report.difference_mt === 0 
                                      ? (t.auditOpinionOk || 'Turno encerrado sem divergências financeiras. Valores apurados e validados com sucesso.') 
                                      : ((t.auditOpinionDiscrepancy || 'Turno com divergência de {0}. Registrado no log de auditoria fiscal.').replace('{0}', formatCurrency(report.difference_mt)))}
                                  </p>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPrintReport(report, details, userName);
                                    }}
                                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer size={13} />
                                    <span>{t.printPdf || 'Imprimir PDF'}</span>
                                  </button>

                                  {/* "VER LEITURAS" WITH SUBSCRIPTION GATING */}
                                  {onOpenScans && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenScansClick(e, report, userName, scansCount)}
                                      disabled={isAuditUnlocked && scansCount === 0}
                                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                        !isAuditUnlocked
                                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                          : scansCount > 0
                                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                                          : 'bg-slate-50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-600 cursor-not-allowed border border-slate-100 dark:border-zinc-800'
                                      }`}
                                      title={
                                        !isAuditUnlocked 
                                          ? (t.scansAuditTitle || 'Auditoria Avançada de Leituras (Plano Pro)') 
                                          : scansCount === 0 
                                          ? (t.noScansInShift || 'O operador não realizou leituras neste turno') 
                                          : (t.viewScansTooltip || 'Ver produtos bipados neste turno')
                                      }
                                    >
                                      {!isAuditUnlocked ? (
                                        <>
                                          <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                                          <span>{t.viewScansInRow || 'Ver Leituras'}</span>
                                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black uppercase">
                                            {t.scansProBadge || 'Pro'}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Search size={12} />
                                          <span>{t.viewScansInRow || 'Ver Leituras'}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Docked Bottom Pagination Footer (Matches BarcodeTable) */}
      <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
        <div>
          {t.paginationShowing || 'A mostrar'} <span className="font-bold text-slate-800 dark:text-zinc-200">{reports.length}</span> {t.paginationOf || 'de'}{' '}
          <span className="font-bold text-slate-800 dark:text-zinc-200">{totalFilteredCount}</span> {t.paginationReports || 'relatórios'}
          {statusFilter !== 'all' && <span> {((t.paginationFilteredFrom || '(filtrados de {0})').replace('{0}', String(totalCount)))}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            {t.prevBtn || 'Anterior'}
          </button>
          
          <span className="px-2 font-bold text-slate-700 dark:text-zinc-300">
            {currentPage} / {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            {t.nextBtn || 'Seguinte'}
          </button>
        </div>
      </div>
    </div>
  );
}
