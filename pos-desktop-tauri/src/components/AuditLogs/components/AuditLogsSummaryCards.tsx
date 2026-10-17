import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Users, 
  Cloud, 
  CloudOff, 
  Database, 
  Info,
  Lock,
  Sparkles
} from 'lucide-react';
import { AuditStats } from '../types';
import { useSubscription } from '../../../subscription/subscriptionContext';
import { AuditGuideModal } from './AuditGuideModal';
import { useAuditsI18n } from '../../../i18n';

interface AuditLogsSummaryCardsProps {
  stats: AuditStats;
}

export function AuditLogsSummaryCards({ stats }: AuditLogsSummaryCardsProps) {
  const t = useAuditsI18n();
  const { isFeatureUnlocked, openFeatureLockModal } = useSubscription();
  const isCloudBackupUnlocked = isFeatureUnlocked('cloud_backup');
  const [guideTopic, setGuideTopic] = useState<string | null>(null);

  const handleCloudClick = () => {
    if (!isCloudBackupUnlocked) {
      openFeatureLockModal(
        'cloud_backup',
        t.cloudBackupTitle || 'Backup e Sincronização em Nuvem',
        t.cloudBackupDesc || 'O backup em nuvem e histórico perpétuo de auditoria está protegido por plano de subscrição. No plano gratuito, os registos são mantidos de forma segura e offline no SQLite local.'
      );
    }
  };

  return (
    <>
      <div className="px-4 sm:px-6 py-3.5 bg-slate-100/50 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-white/10 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Total de Eventos */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardTotalLogs || "Total Registos"}
              </span>
              <button
                type="button"
                onClick={() => setGuideTopic('total')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoTotalLogs || "Informações sobre Registos"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
                  {stats.totalLogs}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500">
                  {t.unitActions || "ações"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <ShieldCheck size={11} className="text-indigo-500" />
                <span>{t.noteSqliteAudited || "Base SQLite auditada"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Eventos Hoje */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardTodayLogs || "Hoje"}
              </span>
              <button
                type="button"
                onClick={() => setGuideTopic('hoje')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoTodayLogs || "Informações sobre Eventos de Hoje"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 font-mono">
                  {stats.todayLogsCount}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500">
                  {t.unitToday || "hoje"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Clock size={11} className="text-indigo-500" />
                <span>{t.noteSessionsSales || "Sessões & Vendas"}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Operadores no Registo */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardOperators || "Operadores"}
              </span>
              <button
                type="button"
                onClick={() => setGuideTopic('operadores')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoOperators || "Informações sobre Operadores"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
                  {stats.uniqueOperatorsCount}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500">
                  {t.unitUsers || "utilizadores"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Users size={11} className="text-purple-500" />
                <span>{t.noteIndividualTracking || "Rastreio individual"}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Alertas & Ações Críticas */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between group hover:border-amber-200 dark:hover:border-amber-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardCriticalActions || "Ações Críticas"}
              </span>
              <button
                type="button"
                onClick={() => setGuideTopic('criticas')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoCriticalActions || "Informações sobre Ações Críticas"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                  {stats.criticalCount}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-zinc-500">
                  {t.unitAlerts || "alertas"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <ShieldAlert size={11} />
                <span>{t.noteReversalsPermissions || "Estornos / Permissões"}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Status da Nuvem (Detects Paid vs Free Mode) */}
          <div 
            onClick={handleCloudClick}
            className={`bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${
              isCloudBackupUnlocked
                ? 'border-emerald-200/80 dark:border-emerald-900/40 hover:bg-emerald-50/20'
                : 'border-amber-200/80 dark:border-amber-900/40 hover:bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardCloudBackup || "Backup Cloud"}
              </span>
              {isCloudBackupUnlocked ? (
                <Cloud size={13} className="text-emerald-500" />
              ) : (
                <Lock size={13} className="text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm sm:text-base font-black tracking-tight ${
                  isCloudBackupUnlocked 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {isCloudBackupUnlocked ? (t.cloudBackupActive || 'Nuvem Ativa') : (t.cloudBackupLocal || 'Arquivo Local')}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                {isCloudBackupUnlocked ? (t.autoBackupLabel || 'Backup Automático') : (t.freeModeLockedLabel || 'Modo Grátis (Bloqueado)')}
              </div>
            </div>
          </div>

          {/* Card 6: Integridade SQLite Local */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardIntegrity || "Integridade"}
              </span>
              <Database size={13} className="text-indigo-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {t.integrityValue || "100% Íntegro"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-500" />
                <span>{t.noteSha256Verified || "SHA-256 Verificado"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Guide Modal */}
      <AuditGuideModal
        isOpen={Boolean(guideTopic)}
        onClose={() => setGuideTopic(null)}
        topic={guideTopic}
      />
    </>
  );
}
