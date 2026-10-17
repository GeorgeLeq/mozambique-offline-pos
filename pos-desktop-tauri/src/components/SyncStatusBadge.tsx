import React, { useState, useEffect } from 'react';
import { useI18n, getLanguage, LanguageCode } from '../i18n';
import { checkPendingSyncCount } from '../lib/syncEngine';

interface SyncStatusBadgeProps {
  className?: string;
  module?: 'products' | 'deliveries' | 'sales' | 'all' | string;
}

export function SyncStatusBadge({ className = '', module }: SyncStatusBadgeProps) {
  const [lang, setLang] = useState<LanguageCode>(getLanguage());
  const t = useI18n(lang);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Listen to language changes
  useEffect(() => {
    const handleLocaleChange = () => {
      setLang(getLanguage());
    };
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  // Listen to network online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending unsynced items with debounce
  const updatePendingState = async () => {
    if (document.hidden) return;
    try {
      const count = await checkPendingSyncCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    updatePendingState();

    // Gentle background poll (45s instead of 5s) to eliminate idle CPU IPC thrashing
    const interval = setInterval(() => {
      if (!document.hidden) {
        updatePendingState();
      }
    }, 45000);

    const handleSyncStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      if (detail.status === 'syncing') {
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
        updatePendingState();
      }
    };

    const handleDataMutated = () => {
      updatePendingState();
    };

    window.addEventListener('pos-sync-status', handleSyncStatus);
    window.addEventListener('sale-completed', handleDataMutated);
    window.addEventListener('product-saved', handleDataMutated);
    window.addEventListener('sync-complete', handleDataMutated);
    document.addEventListener('visibilitychange', handleDataMutated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pos-sync-status', handleSyncStatus);
      window.removeEventListener('sale-completed', handleDataMutated);
      window.removeEventListener('product-saved', handleDataMutated);
      window.removeEventListener('sync-complete', handleDataMutated);
      document.removeEventListener('visibilitychange', handleDataMutated);
    };
  }, []);

  // Determine pill status state
  const isPending = !isOnline ? pendingCount > 0 : (pendingCount > 0 || isSyncing);

  if (!isOnline) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 shadow-xs ${className}`}
        title="Dispositivo Offline - A guardar vendas localmente no SQLite"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
        <span className="uppercase tracking-wider text-[10px]">
          {pendingCount > 0 ? `${t.pending || 'Pendente'} (${pendingCount})` : (t.offline || 'Offline')}
        </span>
      </div>
    );
  }

  if (isPending) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 shadow-xs ${className}`}
        title="Existem dados pendentes a aguardar sincronização com o servidor"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          {isSyncing && (
            <span className="absolute w-2 h-2 rounded-full bg-amber-400/60 animate-ping"></span>
          )}
        </div>
        <span className="uppercase tracking-wider text-[10px]">
          {t.pending || 'Pendente'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shadow-xs ${className}`}
      title="Todos os registos locais estão 100% sincronizados com a nuvem"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
      <span className="uppercase tracking-wider text-[10px]">
        {t.synced || 'Sincronizado'}
      </span>
    </div>
  );
}
