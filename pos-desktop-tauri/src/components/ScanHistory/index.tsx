import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Info, 
  BarChart3, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Barcode, 
  Clock, 
  CheckCircle2, 
  Wallet,
  Users
} from 'lucide-react';
import { AmbientBackground } from '../AmbientBackground';
import { ThemeToggle } from '../ThemeToggle';
import { useScanHistory } from './hooks/useScanHistory';
import { OperatorTable } from './OperatorTable';
import { OperatorDetails } from './OperatorDetails';
import { formatCurrency } from '../../lib/utils';
import { InternetStatusBadge } from '../InternetStatusBadge';
import ScanHistoryGuideModal from './ScanHistoryGuideModal';
import { useSubscription } from '../../subscription/subscriptionContext';
import { syncSubscriptionsFromCloud } from '../../lib/syncEngine/subscriptions';
import { useScanHistoryI18n } from '../../i18n';

export default function ScanHistoryManager({ 
  onBack, 
  initialUser 
}: { 
  onBack: () => void; 
  initialUser?: { id: string; name: string } | null; 
}) {
  const t = useScanHistoryI18n();
  const {
    userStats,
    loading,
    selectedUserId,
    selectedUserName,
    userScans,
    userPayouts,
    activeSubTab,
    setActiveSubTab,
    handleUserClick,
    resetSelection,
  } = useScanHistory();

  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  const isAuditUnlocked = isFeatureUnlocked('advanced_audits');

  const [showGuideModal, setShowGuideModal] = useState(false);

  // Proactively check cloud subscription on mount to get freshest toggle state
  useEffect(() => {
    if (navigator.onLine) {
      syncSubscriptionsFromCloud().catch(err => console.warn('[ScanHistory] Proactive subscription sync:', err));
    }
  }, []);

  // Show lock modal immediately if feature is locked
  useEffect(() => {
    if (!isAuditUnlocked) {
      openFeatureLockModal(
        'advanced_audits',
        t.lockTitle || 'Auditoria Avançada de Leituras (Anti-Furto)',
        t.lockDesc || 'O histórico minucioso de cada código de barras bipado por operador, timestamps de venda e auditoria de sangrias faz parte dos planos Pro e Enterprise. Atualize para blindar o seu negócio contra quebras de caixa.'
      );
    }
  }, [isAuditUnlocked, openFeatureLockModal, t.lockTitle, t.lockDesc]);

  useEffect(() => {
    if (initialUser && !selectedUserId && isAuditUnlocked) {
      handleUserClick(initialUser.id, initialUser.name);
    }
  }, [initialUser, selectedUserId, isAuditUnlocked]);

  const handleBack = () => {
    if (selectedUserId) {
      resetSelection();
    } else {
      onBack();
    }
  };

  const globalTotalSales = useMemo(() => {
    return userStats.reduce((acc, curr) => acc + curr.total_sales, 0);
  }, [userStats]);

  const handleUnlockClick = () => {
    openFeatureLockModal(
      'advanced_audits',
      t.lockTitle || 'Auditoria Avançada de Leituras (Anti-Furto)',
      t.lockDesc || 'O histórico minucioso de cada código de barras bipado por operador, timestamps de venda e auditoria de sangrias faz parte dos planos Pro e Enterprise. Atualize para blindar o seu negócio contra quebras de caixa.'
    );
  };

  return (
    <div id="scan-history-root" className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-[#fbfbfd] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans select-none">
      <AmbientBackground />

      {/* Topbar Header (Edge-to-Edge, matching BarcodeHeader) */}
      <header className="relative z-20 px-4 sm:px-6 py-2.5 border-b border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs shrink-0 w-full">
        {/* Left Side: Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-xs shrink-0"
            title={t.backTooltip || "Voltar"}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{selectedUserId ? (t.headerTitleWithUser || 'Histórico de Scans: {name}').replace('{name}', selectedUserName) : (t.headerTitle || 'Registo de Atividade & Scans')}</span>
            </h1>

            <InternetStatusBadge />

            {/* Plan Badge or Stats Count */}
            {!isAuditUnlocked ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock size={10} /> {t.proPlanBadge || 'Pro Plan'}
              </span>
            ) : selectedUserId ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {(t.scansRecorded || '{count} bips registados').replace('{count}', String(userScans.length))}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700">
                {userStats.length === 1 
                  ? (t.operatorsSingular || '{count} operador').replace('{count}', '1')
                  : (t.operatorsCount || '{count} operadores').replace('{count}', String(userStats.length))}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Global Metric Pill, Guide, ThemeToggle */}
        <div className="flex items-center gap-2.5">
          {!selectedUserId && isAuditUnlocked && (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl px-3 py-1.5 shrink-0">
              <BarChart3 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t.globalRevenue || 'Receita Global:'}</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(globalTotalSales)} MT
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-indigo-600 dark:text-indigo-400 cursor-pointer shadow-xs shrink-0"
            title={t.guideTooltip || "Guia Explicativo para Administradores"}
          >
            <Info size={16} />
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area (Edge-to-Edge) */}
      <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        {!isAuditUnlocked ? (
          /* Subscription Locked Screen */
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-slate-50/50 dark:bg-zinc-950/50">
            <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xl p-8 text-center relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
                <ShieldCheck size={32} />
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 mb-3">
                <Sparkles size={12} /> {t.lockExclusive || 'Recurso Exclusivo Pro & Enterprise'}
              </span>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {t.lockTitle || 'Auditoria Forense de Leituras (Anti-Furto)'}
              </h2>

              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
                {t.lockDesc || 'O acesso cronológico de todos os códigos de barras bipados por operador, tempos de atendimento e conciliação de gaveta faz parte do plano Pro.'}
              </p>

              {/* 4 Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-xl mx-auto">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Barcode size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">{t.lockFeature1Title || 'Registo de Cada Bip'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t.lockFeature1Desc || 'Timestamp exato e produto registado no leitor.'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">{t.lockFeature2Title || 'Ranking por Operador'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t.lockFeature2Desc || 'Métricas comparativas de faturamento e volume.'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">{t.lockFeature3Title || 'Rastreio de Saídas'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t.lockFeature3Desc || 'Auditoria de sangrias e retiradas de gaveta.'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">{t.lockFeature4Title || 'Prevenção Anti-Fraude'}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t.lockFeature4Desc || 'Evite quebras de stock e faturamentos omitidos.'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.btnBackToPanel || 'Voltar ao Painel'}
                </button>

                <button
                  type="button"
                  onClick={handleUnlockClick}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock size={14} />
                  <span>{t.btnUnlockPro || 'Desbloquear com Pro / Enterprise'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">{t.loading || 'Carregando auditoria de scans...'}</p>
          </div>
        ) : !selectedUserId ? (
          <OperatorTable 
            stats={userStats} 
            onUserClick={handleUserClick} 
          />
        ) : (
          <OperatorDetails
            scans={userScans}
            payouts={userPayouts}
            activeTab={activeSubTab}
            onTabChange={setActiveSubTab}
            onBack={resetSelection}
            operatorName={selectedUserName}
          />
        )}
      </main>

      {/* Guide / Info Modal for Admins */}
      <ScanHistoryGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
