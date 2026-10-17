import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  checkAppUpdate, 
  downloadAndInstallTauriUpdate, 
  openSupportWhatsApp,
  UpdateCheckResult, 
  CURRENT_APP_VERSION, 
  DEFAULT_SUPPORT_WHATSAPP,
  compareVersions
} from '../lib/syncEngine/systemConfig';

interface UpdateContextType {
  updateInfo: UpdateCheckResult | null;
  isChecking: boolean;
  isUpdating: boolean;
  updateProgress: number;
  updateStatusText: string;
  updateError: string | null;
  isSoftPromptDismissed: boolean;
  dismissSoftPrompt: () => void;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  startUpdate: () => Promise<void>;
  openWhatsAppSupport: (reason?: string) => void;
  // Testing helper for developer / demo verification
  simulateVersionRule: (minRequired: string, latest: string) => void;
  resetSimulatedVersion: () => void;
}

const UpdateContext = createContext<UpdateContextType | null>(null);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateStatusText, setUpdateStatusText] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSoftPromptDismissed, setIsSoftPromptDismissed] = useState<boolean>(false);

  const performCheck = useCallback(async (): Promise<UpdateCheckResult> => {
    setIsChecking(true);
    setUpdateError(null);
    try {
      const res = await checkAppUpdate();
      setUpdateInfo(res);
      return res;
    } catch (err: any) {
      console.warn('[UpdateContext] Check failed:', err);
      const fallback: UpdateCheckResult = {
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        minVersion: CURRENT_APP_VERSION,
        updateNotes: '',
        downloadUrl: '',
        supportWhatsapp: DEFAULT_SUPPORT_WHATSAPP,
        isHardBlocked: false,
        isSoftUpdateAvailable: false
      };
      setUpdateInfo(fallback);
      return fallback;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check on application mount
    performCheck();

    // Check periodically every 2 minutes or on window focus
    const interval = setInterval(() => {
      if (navigator.onLine && !document.hidden && !isUpdating) {
        performCheck();
      }
    }, 120000);

    const handleOnline = () => {
      if (!isUpdating) {
        performCheck();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [performCheck, isUpdating]);

  const startUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateProgress(5);
    setUpdateStatusText('A inicializar o instalador...');

    try {
      const result = await downloadAndInstallTauriUpdate((percent, status) => {
        setUpdateProgress(percent);
        setUpdateStatusText(status);
      });

      if (!result.success) {
        setUpdateError(result.message);
        setIsUpdating(false);
      }
    } catch (e: any) {
      setUpdateError(e?.message || 'Falha ao descarregar a actualização.');
      setIsUpdating(false);
    }
  };

  const dismissSoftPrompt = () => {
    setIsSoftPromptDismissed(true);
  };

  const openWhatsApp = (customReason?: string) => {
    openSupportWhatsApp({
      currentVersion: updateInfo?.currentVersion || CURRENT_APP_VERSION,
      requiredVersion: updateInfo?.minVersion || '1.0.0',
      reason: customReason || (updateInfo?.isHardBlocked ? 'Versão Obrigatória Expirada' : 'Suporte de Actualização OTA'),
      phoneNumber: updateInfo?.supportWhatsapp || DEFAULT_SUPPORT_WHATSAPP
    });
  };

  const simulateVersionRule = (minRequired: string, latest: string) => {
    const cur = CURRENT_APP_VERSION;
    const isHardBlocked = compareVersions(cur, minRequired) < 0;
    const isSoftUpdateAvailable = !isHardBlocked && compareVersions(cur, latest) < 0;

    setUpdateInfo({
      currentVersion: cur,
      latestVersion: latest,
      minVersion: minRequired,
      updateNotes: 'Melhorias críticas de segurança fiscal (AT) e actualização de base de dados SQLite.',
      downloadUrl: '',
      supportWhatsapp: DEFAULT_SUPPORT_WHATSAPP,
      isHardBlocked,
      isSoftUpdateAvailable
    });
    setIsSoftPromptDismissed(false);
    setUpdateError(null);
  };

  const resetSimulatedVersion = () => {
    performCheck();
  };

  return (
    <UpdateContext.Provider
      value={{
        updateInfo,
        isChecking,
        isUpdating,
        updateProgress,
        updateStatusText,
        updateError,
        isSoftPromptDismissed,
        dismissSoftPrompt,
        checkForUpdates: performCheck,
        startUpdate,
        openWhatsAppSupport: openWhatsApp,
        simulateVersionRule,
        resetSimulatedVersion
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useAppUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an UpdateProvider');
  }
  return context;
}
