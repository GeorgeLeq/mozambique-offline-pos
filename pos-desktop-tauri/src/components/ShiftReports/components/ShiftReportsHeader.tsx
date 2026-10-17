import React, { useState } from 'react';
import { 
  ArrowLeft, Clock, Archive, FileText, 
  HelpCircle, Lock, Search 
} from 'lucide-react';
import { InternetStatusBadge } from '../../InternetStatusBadge';
import { useSubscription } from '../../../subscription/subscriptionContext';
import { ShiftReportsGuideModal } from './ShiftReportsGuideModal';
import { useShiftReportsI18n } from '../../../i18n';

interface ShiftReportsHeaderProps {
  onBack: () => void;
  baseCash?: string;
  setBaseCash?: (val: string) => void;
  isSavingBaseCash?: boolean;
  onSaveBaseCash?: () => void;
  showArchive: boolean;
  setShowArchive: (val: boolean) => void;
  onFetchArchive: () => void;
  loadingArchive: boolean;
  totalShifts?: number;
  totalExpected?: number;
  totalReported?: number;
  totalDifference?: number;
  hasArchiveRecords?: boolean;
  onOpenScans?: (userId?: string, userName?: string) => void;
}

export function ShiftReportsHeader({
  onBack,
  showArchive,
  setShowArchive,
  onFetchArchive,
  loadingArchive,
  hasArchiveRecords,
  onOpenScans
}: ShiftReportsHeaderProps) {
  const t = useShiftReportsI18n();
  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  const isAuditUnlocked = isFeatureUnlocked('advanced_audits');

  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleOpenScansWithPlan = () => {
    if (!isAuditUnlocked) {
      openFeatureLockModal(
        'advanced_audits',
        t.scansAuditTitle || 'Auditoria Avançada de Leituras',
        t.scansAuditDesc || 'O acesso ao histórico detalhado de bips e produtos por operador requer o plano Pro ou Enterprise. Atualize para auditar cada leitura e prevenir quebras de inventário.'
      );
      return;
    }
    if (onOpenScans) {
      onOpenScans();
    }
  };

  return (
    <>
      <header className="relative z-20 px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs shrink-0 w-full">
        {/* Left side: Back, Title & Online Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs shrink-0"
            title={t.backToMenu || "Voltar ao Menu"}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                {t.headerTitle || 'Relatórios de Turno'}
              </h1>
              <InternetStatusBadge />
            </div>
          </div>
        </div>

        {/* Right side: Archive Switcher, Scans History & Info Guide */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Recentes vs Arquivo Toggle Segment */}
          <div className="flex bg-slate-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setShowArchive(false)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !showArchive
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Clock size={12} />
              <span className="hidden md:inline">{t.recentShifts || 'Recentes (30d)'}</span>
            </button>
            <button
              onClick={onFetchArchive}
              disabled={loadingArchive || (!hasArchiveRecords && !showArchive)}
              title={!hasArchiveRecords && !showArchive ? (t.noArchiveTooltip || 'Nenhum registo arquivado encontrado') : (t.loadArchiveTooltip || 'Carregar arquivo histórico da nuvem')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showArchive
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : (!hasArchiveRecords && !showArchive)
                  ? 'text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Archive size={12} />
              <span className="hidden md:inline">
                {loadingArchive ? (t.loadingArchive || 'A carregar...') : (t.archiveShifts || 'Arquivo')}
              </span>
            </button>
          </div>

          {/* Scan History Button (Subscription Aware) */}
          {onOpenScans && (
            <button
              type="button"
              onClick={handleOpenScansWithPlan}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                !isAuditUnlocked
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title={!isAuditUnlocked ? (t.scansAuditTitle || 'Auditoria Avançada de Leituras (Recurso Pro)') : (t.scansHistoryTitle || 'Ver histórico de leituras e bips')}
            >
              {!isAuditUnlocked ? (
                <>
                  <Lock size={13} className="text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">{t.viewScans || 'Ver Leituras'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                    {t.scansProBadge || 'Pro'}
                  </span>
                </>
              ) : (
                <>
                  <Search size={13} />
                  <span className="hidden sm:inline">{t.scansHistoryTitle || 'Histórico de Leituras'}</span>
                </>
              )}
            </button>
          )}

          {/* Informative Guide Trigger */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-xs flex items-center justify-center cursor-pointer"
            title={t.shiftGuideTooltip || "Guia de Auditoria de Turnos"}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* Guide Modal */}
      <ShiftReportsGuideModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
}
