import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  Shield, 
  User as UserIcon, 
  Search, 
  X, 
  AlertTriangle,
  Calendar,
  Info,
  Layers,
  ChevronDown
} from 'lucide-react';
import { User } from '../../types';
import { useEmployeesI18n } from '../../i18n';

interface EmployeeBinProps {
  deletedEmployees: User[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  retentionDays: number;
  onRetentionChange: (days: number) => void;
  onRestore: (user: User) => void;
  onPermanentDelete: (user: User) => void;
  onEmptyBin: () => void;
  isLoading?: boolean;
}

export function EmployeeBin({
  deletedEmployees,
  searchTerm,
  onSearchChange,
  retentionDays,
  onRetentionChange,
  onRestore,
  onPermanentDelete,
  onEmptyBin,
  isLoading
}: EmployeeBinProps) {
  const t = useEmployeesI18n();

  // Modals
  const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
  const [wipeTarget, setWipeTarget] = useState<User | null>(null);
  const [isEmptyBinConfirm, setIsEmptyBinConfirm] = useState(false);

  // Filtered list
  const filtered = useMemo(() => {
    return deletedEmployees.filter(emp => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        (emp.deletion_reason && emp.deletion_reason.toLowerCase().includes(term))
      );
    });
  }, [deletedEmployees, searchTerm]);

  // Calculate days left for each user
  const getDaysLeft = (user: User) => {
    if (retentionDays <= 0) return -1; // Never expires
    const deletedTime = user.deleted_at ? new Date(user.deleted_at).getTime() : new Date().getTime();
    const daysElapsed = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, retentionDays - daysElapsed);
  };

  return (
    <div id="employee-bin-container" className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top action / filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder || 'Pesquisar na lixeira...'}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Retention Policy Selector + Empty Bin Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300">
            <Clock size={13} className="text-amber-500" />
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t.retentionSelectorLabel || 'Retenção:'}
            </span>
            <div className="relative inline-block">
              <select
                value={retentionDays}
                onChange={(e) => onRetentionChange(Number(e.target.value))}
                className="appearance-none bg-transparent font-bold text-slate-800 dark:text-zinc-100 pr-5 cursor-pointer focus:outline-none text-xs"
              >
                <option value={15}>{t.retentionDaysOption?.replace('{0}', '15') || '15 Dias'}</option>
                <option value={30}>{t.retentionDaysOption?.replace('{0}', '30') || '30 Dias'}</option>
                <option value={60}>{t.retentionDaysOption?.replace('{0}', '60') || '60 Dias'}</option>
                <option value={90}>{t.retentionDaysOption?.replace('{0}', '90') || '90 Dias'}</option>
                <option value={0}>{t.retentionNeverOption || 'Nunca (Sem expiração)'}</option>
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {deletedEmployees.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEmptyBinConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              <Trash2 size={13} />
              <span>{t.emptyBinBtn || 'Esvaziar Lixeira'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white dark:bg-rose-500">
                {deletedEmployees.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-400">{t.syncPending || 'A carregar lixeira...'}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/40 dark:bg-zinc-900/20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3">
              <Trash2 size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">
              {t.noDeletedEmployees || 'A lixeira de operadores está vazia'}
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm">
              {t.noDeletedEmployeesDesc || 'Operadores revogados aparecerão aqui durante o período de retenção configurado antes da purga definitiva.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((emp) => {
              const daysLeft = getDaysLeft(emp);
              const isExpiredSoon = daysLeft >= 0 && daysLeft <= 3;
              const formattedDeletedDate = emp.deleted_at 
                ? new Date(emp.deleted_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '-';

              return (
                <motion.div
                  key={emp.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-black text-sm shrink-0">
                        {emp.role === 'Admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                          {emp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            emp.role === 'Admin'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          }`}>
                            {emp.role === 'Admin' ? (t.adminRole || 'Admin') : (t.cashierRole || 'Operador')}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                            ID: {emp.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Countdown pill */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        retentionDays <= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : daysLeft === 0
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                            : isExpiredSoon
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        <Clock size={10} className={isExpiredSoon ? 'animate-spin text-rose-600' : ''} />
                        <span>
                          {retentionDays <= 0 
                            ? (t.noExpiration || 'Sem Expiração') 
                            : daysLeft === 0 
                              ? (t.expiringToday || 'Expira Hoje') 
                              : t.daysLeftRemaining?.replace('{0}', String(daysLeft)) || `${daysLeft}d restantes`}
                        </span>
                      </span>

                      {/* Progress bar */}
                      {retentionDays > 0 && (
                        <div className="w-20 bg-slate-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              daysLeft <= 3 ? 'bg-rose-500' : daysLeft <= 7 ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                            style={{ 
                              width: `${Math.max(8, Math.min(100, (daysLeft / Math.max(1, retentionDays)) * 100))}%` 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason & Date Details Box */}
                  <div className="bg-slate-50 dark:bg-zinc-950/70 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {t.deletedOn || 'Revogado em'}:
                      </span>
                      <span className="font-medium text-slate-700 dark:text-zinc-300">{formattedDeletedDate}</span>
                    </div>

                    {emp.deletion_reason && (
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-300">
                        <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0 text-[11px]">
                          {t.revocationReason || 'Motivo'}:
                        </span>
                        <span className="text-[11px] font-medium text-right line-clamp-2">
                          {emp.deletion_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(emp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
                    >
                      <RotateCcw size={13} />
                      <span>{t.restoreBtn || 'Restaurar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWipeTarget(emp)}
                      className="py-2 px-3 bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                      title={t.permanentDeleteTooltip || 'Eliminar permanentemente'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {restoreTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRestoreTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10"
            >
              <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {t.confirmRestoreTitle || 'Restaurar Operador'}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    {t.restoreOperatorTooltip || 'Reativar operador e restabelecer acesso'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium mb-4">
                {t.confirmRestoreMsg?.replace('{0}', restoreTarget.name) || `Tem a certeza que deseja reativar o acesso do operador "${restoreTarget.name}"?`}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRestoreTarget(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.cancel || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = restoreTarget;
                    setRestoreTarget(null);
                    onRestore(target);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  {t.restoreBtn || 'Restaurar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wipe (Permanent Delete) Modal */}
      <AnimatePresence>
        {wipeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWipeTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-rose-500/20 rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {t.confirmPermanentDeleteTitle || 'Eliminação Definitiva'}
                  </h4>
                  <p className="text-xs text-rose-500 font-medium">
                    {t.permanentPurgeSQLite || 'Esta ação é irreversível'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium mb-4">
                {t.confirmPermanentDeleteMsg?.replace('{0}', wipeTarget.name) || `O operador "${wipeTarget.name}" será permanentemente removido de todas as bases de dados.`}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWipeTarget(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.cancel || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = wipeTarget;
                    setWipeTarget(null);
                    onPermanentDelete(target);
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {t.permanentDeleteBtn || 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty Entire Bin Confirmation Modal */}
      <AnimatePresence>
        {isEmptyBinConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEmptyBinConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-rose-500/20 rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {t.emptyBinConfirmTitle || 'Esvaziar Lixeira de Operadores'}
                  </h4>
                  <p className="text-xs text-rose-500 font-medium">
                    {t.permanentPurgeSQLite || 'Todos os operadores na lixeira serão apagados'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium mb-4">
                {t.emptyBinConfirmMsg || 'Esta ação eliminará definitivamente todos os operadores da lixeira tanto localmente no SQLite como na nuvem. Tem a certeza?'}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmptyBinConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.cancel || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmptyBinConfirm(false);
                    onEmptyBin();
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {t.emptyBinBtn || 'Esvaziar Lixeira'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
