import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Database, RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, 
  ShieldCheck, Lock, KeyRound, Server, HelpCircle
} from 'lucide-react';
import { getDB } from '../../lib/db';
import { syncAllToCloud } from '../../lib/syncEngine';
import toast from 'react-hot-toast';
import { useSettingsI18n } from '../../i18n';

interface SyncTabProps {
  onOpenDevDiagnostics?: () => void;
  onOpenInfo?: () => void;
}

export default function SyncTab({ onOpenDevDiagnostics, onOpenInfo }: SyncTabProps) {
  const t = useSettingsI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalPending, setTotalPending] = useState(0);

  // Monitor network state
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Hydrate pending count
  const loadQuickStats = async () => {
    try {
      const db = await getDB();
      const entityMap = [
        { table: 'sales', filter: 'is_synced = 0' },
        { table: 'products', filter: 'sync_status = 0' },
        { table: 'users', filter: 'sync_status = 0' },
        { table: 'debts', filter: 'sync_status = 0' },
        { table: 'debt_payments', filter: 'sync_status = 0' },
        { table: 'shift_reports', filter: 'sync_status = 0' },
        { table: 'audit_logs', filter: 'sync_status = 0' },
        { table: 'till_payouts', filter: 'sync_status = 0' },
        { table: 'spoiled_items', filter: 'sync_status = 0' },
        { table: 'emergency_tokens', filter: 'sync_status = 0' },
        { table: 'expected_deliveries', filter: 'sync_status = 0' },
      ];

      let sum = 0;
      for (const item of entityMap) {
        try {
          const res = await db.select(`SELECT COUNT(*) as count FROM ${item.table} WHERE ${item.filter}`) as any[];
          sum += res && res[0] ? Number(res[0].count) : 0;
        } catch {
          // Ignore
        }
      }
      setTotalPending(sum);
    } catch (err) {
      console.error('Failed to count pending sync stats', err);
    }
  };

  useEffect(() => {
    loadQuickStats();
    const interval = setInterval(() => loadQuickStats(), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Terminal Offline: Ligue-se à internet para sincronizar com a nuvem central.');
      return;
    }

    setIsSyncing(true);
    const syncToastId = toast.loading('A sincronizar operações locais com a nuvem...');

    try {
      await syncAllToCloud();
      await loadQuickStats();
      toast.success('Sincronização concluída com sucesso!', { id: syncToastId });
    } catch (err: any) {
      console.error('Sync failed:', err);
      toast.error(`Falha ao sincronizar: ${err.message || 'Verifique o estado da rede'}`, { id: syncToastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      key="sync"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Database size={22} className="text-indigo-600 dark:text-indigo-400" />
            {t.syncTitle || 'Segurança, Armazenamento Local & Sincronia na Nuvem'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
            {t.syncSubtitle || 'Arquitetura Offline-First com armazenamento local seguro e replicação automática para o servidor de nuvem.'}
          </p>
        </div>

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            <HelpCircle size={15} className="text-indigo-500" />
            <span>{t.helpGuide || 'Guia de Ajuda'}</span>
          </button>
        )}
      </div>

      {/* Main Grid: Status Cards and Trigger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
        {/* Col 1: Estado da Base Local e Nuvem */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Base Local Card */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  {t.localDbTitle || 'Base de Dados Local'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-800/50">
                {t.localDbStatus || 'Ativo & Seguro'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              {t.localDbDesc || 'Todas as vendas, cadastros e fechos de caixa são gravados instantaneamente no disco local da máquina. O sistema nunca trava se a internet cair.'}
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>{t.localDbProtectionNote || 'Proteção automática contra quebras de energia'}</span>
            </div>
          </div>

          {/* Servidor Nuvem Card */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-indigo-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  {t.cloudServerTitle || 'Servidor de Nuvem Central'}
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                isOnline 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' 
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
              }`}>
                {isOnline ? (t.cloudServerOnline || 'Online (Conectado)') : (t.cloudServerOffline || 'Modo Offline')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              {t.cloudServerDesc || 'Sincronização em segundo plano assim que houver rede disponível. Encriptação ponta a ponta para proteger os dados da sua loja.'}
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              <Lock size={13} className="text-indigo-500" />
              <span>{t.cloudSecurityNote || 'Ligação encriptada e cópias de segurança protegidas'}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Pendências e Ação de Forçar Sincronia */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  {t.pendingDataQueue || 'Fila de Dados Pendentes'}
                </span>
                <div className="flex items-center gap-1.5">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Wifi size={13} /> {t.internetActive || 'Internet Ativa'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
                      <WifiOff size={13} /> {t.noConnection || 'Sem Ligação'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 block">{t.unSyncedRecordsLabel || 'Registos por sincronizar'}</span>
                  <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {totalPending}
                  </span>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Database size={24} />
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mt-3">
                {totalPending === 0 
                  ? (t.allSyncedText || 'Tudo em dia! Todas as operações deste terminal estão guardadas em segurança na nuvem.') 
                  : `${t.pendingRecordsPrefix || 'Existem'} ${totalPending} ${t.pendingRecordsSuffix || 'operações guardadas localmente aguardando envio para o servidor central.'}`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? (t.syncingState || 'A Sincronizar com a Nuvem...') : (t.forceSyncButton || 'Forçar Sincronização Agora')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
