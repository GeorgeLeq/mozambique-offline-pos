import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  RefreshCw, 
  UserPlus, 
  Maximize2, 
  Minimize2, 
  X,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../../lib/utils';
import { getFiadosUsage } from '../../../ClientManager/services/debtService';
import { useI18n } from '../../../../i18n';

interface FiadosHeaderProps {
  totalCount: number;
  totalOutstanding: number;
  isFullScreen: boolean;
  onRefresh: () => void;
  onNewDebt: () => void;
  onToggleFullScreen: () => void;
  onClose: () => void;
}

export function FiadosHeader({
  totalCount,
  totalOutstanding,
  isFullScreen,
  onRefresh,
  onNewDebt,
  onToggleFullScreen,
  onClose,
}: FiadosHeaderProps) {
  const { pos: t } = useI18n();
  const [usage, setUsage] = useState<{ current: number, limit: number, isAtLimit: boolean, isUnlimited: boolean } | null>(null);

  useEffect(() => {
    const checkLimits = async () => {
      const u = await getFiadosUsage();
      setUsage(u);
    };
    checkLimits();
    
    const handleSubsUpdate = () => checkLimits();
    window.addEventListener('subscription-entitlements-updated', handleSubsUpdate);
    window.addEventListener('subscription-plans-updated', handleSubsUpdate);
    return () => {
      window.removeEventListener('subscription-entitlements-updated', handleSubsUpdate);
      window.removeEventListener('subscription-plans-updated', handleSubsUpdate);
    };
  }, [totalCount]);

  return (
    <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-900 flex items-center justify-between bg-slate-50/90 dark:bg-zinc-950/90  shrink-0 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
          <Receipt size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t.clientCurrentAccounts || 'CONTAS CORRENTES DE CLIENTES'}
            </span>
            <span className="text-slate-300 dark:text-zinc-600">•</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              {totalCount} {totalCount === 1 ? (t.recordSingle || 'Registo') : (t.recordsPlural || 'Registos')}
            </span>
            {usage && (
              <>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  usage.isAtLimit 
                    ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                }`}>
                  <Users size={12} />
                  {usage.isUnlimited ? `${usage.current} / ∞` : `${usage.current} / ${usage.limit}`}
                </span>
              </>
            )}
            {totalOutstanding > 0 && (
              <>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                  {t.totalPending || 'Total Pendente:'} {formatCurrency(totalOutstanding)} MT
                </span>
              </>
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {t.fiadoBookAndSettlement || 'Livro de Fiados & Liquidação'}
          </h2>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            onRefresh();
            toast.success(t.fiadoDataUpdated || 'Lista de fiados atualizada!');
          }}
          className="p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          title={t.refreshData || 'Atualizar Dados'}
          id="fiados-refresh-btn"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={onNewDebt}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          id="fiados-new-btn"
        >
          <UserPlus size={13} />
          <span>{t.newFiado || 'Novo Fiado'}</span>
        </button>
        <button
          onClick={onToggleFullScreen}
          className="p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          title={isFullScreen ? (t.restoreSmallSize || 'Restaurar Tamanho Reduzido') : (t.expandFullScreen || 'Expandir para Ecrã Completo')}
          id="fiados-fullscreen-btn"
        >
          {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          id="fiados-close-btn"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
