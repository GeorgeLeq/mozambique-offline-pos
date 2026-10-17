import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AmbientBackground } from '../AmbientBackground';

// Subscription hook and operator limit service
import { useSubscription } from '../../subscription/subscriptionContext';
import { getUserUsageSummary, UserUsageSummary } from '../employee/services/userLimitService';

// Import custom hook
import { useCashierControl } from './hooks/useCashierControl';
import { useCashierControlI18n } from '../../i18n';

// Import modular visual components
import StatsHeader from './components/StatsHeader';
import OperatorsTable from './components/OperatorsTable';

// Import modal/drawer components
import EditCashModal from './EditCashModal';
import EmergencyTokensModal from './EmergencyTokensModal';
import SessionHistoryDrawer from './components/SessionHistoryDrawer';
import CashierControlGuideModal from './components/CashierControlGuideModal';

export default function CashierControlManager({ onBack }: { onBack: () => void }) {
  const t = useCashierControlI18n();
  const { openFeatureLockModal } = useSubscription();
  const [userUsage, setUserUsage] = useState<UserUsageSummary | null>(null);

  const {
    users,
    activeShifts,
    todayLogs,
    isLoading,
    isLockdownActive,
    defaultCash,
    editingUser,
    setEditingUser,
    cashInputValue,
    setCashInputValue,
    updateActiveShift,
    setUpdateActiveShift,
    tokensUser,
    setTokensUser,
    editingTerminalId,
    setEditingTerminalId,
    tempTerminalName,
    setTempTerminalName,
    handleToggleNeedsCash,
    handleOpenEditModal,
    handleSaveCashSettings,
    adjustPreset,
    handleSaveTerminalInline,
    handleToggleBlockStatus,
    handleToggleEmergencyLockdown,
  } = useCashierControl();

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Refresh operator usage summary whenever users list changes
  useEffect(() => {
    getUserUsageSummary().then(setUserUsage).catch(console.error);
  }, [users]);

  const handleOpenUpgradeModal = () => {
    openFeatureLockModal(
      'unlimited_users',
      t.upgradePlanTitle || 'Limite de Operadores Atingido',
      (t.upgradePlanDesc || 'Atingiu o limite de {0} operadores permitidos no seu plano atual. Atualize o seu plano para adicionar operadores ilimitados.').replace('{0}', String(userUsage?.limit || 3))
    );
  };

  const activeOperatorsCount = Object.keys(activeShifts).length;
  const exemptOperatorsCount = users.filter(u => u.needs_shift_cash === 0).length;

  return (
    <div id="cashier-control-root" className="flex-1 flex flex-col h-screen w-full relative overflow-hidden bg-[#fbfbfd] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans select-none">
      <AmbientBackground />

      {/* Single Unified Edge-to-Edge Topbar Header (Matches BarcodeHeader) */}
      <StatsHeader
        onBack={onBack}
        activeOperatorsCount={activeOperatorsCount}
        exemptOperatorsCount={exemptOperatorsCount}
        usage={userUsage}
        onOpenUpgradeModal={handleOpenUpgradeModal}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSessionHistory={() => setIsHistoryDrawerOpen(true)}
      />

      {/* Emergency Lockdown Banner if Active */}
      {isLockdownActive && (
        <div className="px-4 sm:px-6 py-2 bg-rose-600 text-white flex items-center justify-between text-xs font-bold shrink-0 z-20 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className="animate-pulse shrink-0" />
            <span>{t.lockdownBannerText || 'SISTEMA EM LOCKDOWN GERAL: Apenas administradores podem iniciar sessão nos caixas.'}</span>
          </div>
          <button
            onClick={handleToggleEmergencyLockdown}
            className="px-2.5 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer shadow-2xs"
          >
            {t.lockdownDeactivate || 'Desativar'}
          </button>
        </div>
      )}

      {/* Main Full-Screen Table View with Integrated Toolbar (Matches BarcodeTable) */}
      <main className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
        <OperatorsTable
          isLoading={isLoading}
          users={users}
          activeShifts={activeShifts}
          todayLogs={todayLogs}
          defaultCash={defaultCash}
          onToggleNeedsCash={handleToggleNeedsCash}
          onOpenEditModal={handleOpenEditModal}
          onOpenTokensModal={setTokensUser}
          onToggleBlockStatus={handleToggleBlockStatus}
          editingTerminalId={editingTerminalId}
          setEditingTerminalId={setEditingTerminalId}
          tempTerminalName={tempTerminalName}
          setTempTerminalName={setTempTerminalName}
          onSaveTerminalInline={handleSaveTerminalInline}
          isLockdownActive={isLockdownActive}
          onToggleLockdown={handleToggleEmergencyLockdown}
        />
      </main>

      {/* Edit Cash Settings Modal */}
      <div className="relative z-50">
        {editingUser && (
          <EditCashModal
            editingUser={editingUser}
            cashInputValue={cashInputValue}
            setCashInputValue={setCashInputValue}
            updateActiveShift={updateActiveShift}
            setUpdateActiveShift={setUpdateActiveShift}
            hasActiveShift={!!activeShifts[editingUser.id]}
            onClose={() => setEditingUser(null)}
            onSave={handleSaveCashSettings}
            onAdjustPreset={adjustPreset}
          />
        )}
        
        {/* Burner PINs Slide Out Drawer */}
        {tokensUser && (
          <EmergencyTokensModal
            user={tokensUser}
            onClose={() => setTokensUser(null)}
          />
        )}

        {/* Real-time Session History Drawer for Dispute Resolution */}
        <SessionHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
        />

        {/* Informative Zero-Scroll Guide Modal */}
        <CashierControlGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </div>
    </div>
  );
}
