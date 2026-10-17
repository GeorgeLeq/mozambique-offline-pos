import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  Lock, 
  HelpCircle
} from 'lucide-react';
import { InternetStatusBadge } from '../../InternetStatusBadge';
import { useSubscription } from '../../../subscription/subscriptionContext';
import { AuditGuideModal } from './AuditGuideModal';
import { useAuditsI18n } from '../../../i18n';

interface AuditLogsHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  isLoading: boolean;
  totalLogs: number;
}

export function AuditLogsHeader({
  onBack,
  onRefresh,
  onExportCSV,
  isLoading,
  totalLogs
}: AuditLogsHeaderProps) {
  const t = useAuditsI18n();
  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  // Strictly check cloud_backup toggle from Supabase/SQLite
  const isCloudBackupUnlocked = isFeatureUnlocked('cloud_backup');

  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleCloudBadgeClick = () => {
    if (!isCloudBackupUnlocked) {
      openFeatureLockModal(
        'cloud_backup',
        t.cloudBackupTitle || 'Backup e Sincronização em Nuvem',
        t.cloudBackupDesc || 'A cópia de segurança em nuvem e histórico perpétuo de auditoria está disponível nos planos pagos. No modo gratuito, todos os registos são mantidos localmente e com total segurança no SQLite do dispositivo.'
      );
    }
  };

  return (
    <>
      <header className="relative z-20 px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs shrink-0 w-full">
        {/* Left side: Back Button, Title & Online Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs shrink-0 active:scale-95"
            title={t.backToPanel || "Voltar ao Painel"}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                {t.title || "Auditoria do Sistema"}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40">
                {t.immutableBadge || "Logs Imutáveis"}
              </span>
              <InternetStatusBadge />
            </div>
          </div>
        </div>

        {/* Right side: Cloud status badge, CSV export, refresh & guide */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Cloud Backup Status Badge (Detects Paid vs Free Mode) */}
          <button
            onClick={handleCloudBadgeClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isCloudBackupUnlocked
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                : 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
            }`}
            title={
              isCloudBackupUnlocked 
                ? (t.cloudActiveTooltip || 'Backup Contínuo em Nuvem Ativo (Plano Pago)') 
                : (t.localFileTooltip || 'Arquivo Local no SQLite (Clique para ver detalhes do plano com backup em nuvem)')
            }
          >
            {isCloudBackupUnlocked ? (
              <>
                <Cloud size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t.cloudActive || "Nuvem Ativa"}</span>
              </>
            ) : (
              <>
                <CloudOff size={13} className="text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">{t.localFile || "Arquivo Local"}</span>
                <span className="sm:hidden">{t.localShort || "Local"}</span>
                <Lock size={11} className="text-amber-600 dark:text-amber-400 ml-0.5" />
              </>
            )}
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={onExportCSV}
            disabled={totalLogs === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
            title={t.exportCsvTooltip || "Exportar registos para CSV"}
          >
            <Download size={13} />
            <span className="hidden md:inline">{t.exportCsv || "Exportar CSV"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs active:scale-95"
            title={t.refreshTooltip || "Atualizar Registos"}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
          </button>

          {/* Info / Guide Modal Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-xs active:scale-95"
            title={t.guideTooltip || "Guia de Auditoria e Segurança"}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* Guide Modal */}
      <AuditGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
}
