import React, { useState } from 'react';
import { 
  UserCheck, ShieldAlert, Lock, Unlock, KeyRound, 
  Clock, Edit3, Save, X, RefreshCw, Search, ShieldCheck
} from 'lucide-react';
import { User } from '../../../types';
import { ShiftInfo, AuditLog } from '../hooks/useCashierControl';
import { useCashierControlI18n } from '../../../i18n';

export function SyncDot({ status }: { status?: number }) {
  const t = useCashierControlI18n();
  const isSynced = status === 1;
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        isSynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
      }`} 
      title={isSynced ? (t.syncedTooltip || 'Sincronizado com a Nuvem') : (t.pendingSyncTooltip || 'Pendente de sincronização')}
    />
  );
}

interface OperatorsTableProps {
  isLoading: boolean;
  users: User[];
  activeShifts: Record<string, ShiftInfo>;
  todayLogs: AuditLog[];
  defaultCash: number;
  
  // Handlers
  onToggleNeedsCash: (user: User) => void;
  onOpenEditModal: (user: User) => void;
  onOpenTokensModal: (user: User) => void;
  onToggleBlockStatus: (user: User) => void;
  
  // Inline terminal states
  editingTerminalId: string | null;
  setEditingTerminalId: (id: string | null) => void;
  tempTerminalName: string;
  setTempTerminalName: (val: string) => void;
  onSaveTerminalInline: (userId: string, name: string) => void;

  // Lockdown
  isLockdownActive?: boolean;
  onToggleLockdown?: () => void;
}

export default function OperatorsTable({
  isLoading,
  users,
  activeShifts,
  todayLogs,
  defaultCash,
  onToggleNeedsCash,
  onOpenEditModal,
  onOpenTokensModal,
  onToggleBlockStatus,
  editingTerminalId,
  setEditingTerminalId,
  tempTerminalName,
  setTempTerminalName,
  onSaveTerminalInline,
  isLockdownActive,
  onToggleLockdown,
}: OperatorsTableProps) {
  const t = useCashierControlI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'exempt' | 'blocked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getInitialsColorClass = (user: User, hasActiveShift: boolean) => {
    if (user.is_blocked === 1) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
    }
    if (hasActiveShift) {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800';
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = dateStr.includes('T') || dateStr.includes('Z')
        ? new Date(dateStr)
        : new Date(dateStr.replace(' ', 'T') + 'Z');
      if (isNaN(d.getTime())) return dateStr;
      
      const isToday = new Date().toDateString() === d.toDateString();
      const timePart = d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' });
      
      if (isToday) {
        return (t.todayAt || 'Hoje às {0}').replace('{0}', timePart);
      }
      
      const datePart = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Maputo' });
      return (t.dateAt || '{0} às {1}').replace('{0}', datePart).replace('{1}', timePart);
    } catch {
      return dateStr;
    }
  };

  const getLastShiftInfo = (userId: string) => {
    const userLogs = todayLogs.filter(log => log.user_id === userId);
    if (userLogs.length === 0) return null;
    
    const sorted = [...userLogs].sort((a, b) => {
      const tA = new Date(a.created_at.includes('T') || a.created_at.includes('Z') ? a.created_at : a.created_at.replace(' ', 'T') + 'Z').getTime() || 0;
      const tB = new Date(b.created_at.includes('T') || b.created_at.includes('Z') ? b.created_at : b.created_at.replace(' ', 'T') + 'Z').getTime() || 0;
      return tB - tA;
    });

    const latest = sorted[0];
    const formatted = formatDateTime(latest.created_at);
    
    if (latest.action.includes('LOGIN')) {
      return `${t.loginPrefix || 'Entrada:'} ${formatted}`;
    } else if (latest.action === 'LOGOUT') {
      return `${t.logoutPrefix || 'Saída:'} ${formatted}`;
    }
    
    return formatted;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term) ||
      (user.terminal_name && user.terminal_name.toLowerCase().includes(term));
    
    if (!matchesSearch) return false;

    const hasActiveShift = !!activeShifts[user.id];
    const isExempt = user.needs_shift_cash === 0;
    const isBlocked = user.is_blocked === 1;

    if (statusFilter === 'active') return hasActiveShift;
    if (statusFilter === 'exempt') return isExempt;
    if (statusFilter === 'blocked') return isBlocked;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
  const paginatedList = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = users.filter(u => !!activeShifts[u.id]).length;
  const exemptCount = users.filter(u => u.needs_shift_cash === 0).length;
  const blockedCount = users.filter(u => u.is_blocked === 1).length;

  if (isLoading) {
    return (
      <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center h-full">
        <RefreshCw className="animate-spin text-indigo-500 mb-3" size={32} />
        <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{t.loadingOperators || 'A carregar operadores e turnos...'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Integrated Unified Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Segmented Status Filters */}
          <div className="flex bg-slate-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterAll || 'Todos'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {users.length}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterInSession || 'Em Sessão'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('exempt'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'exempt'
                  ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterExempt || 'Isentos'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {exemptCount}
              </span>
            </button>
            <button
              onClick={() => { setStatusFilter('blocked'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'blocked'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterBlocked || 'Bloqueados'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {blockedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Search Input & Emergency Lockdown Action */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={13} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder={t.searchPlaceholder || 'Pesquisar por nome, ID ou banca...'}
              className="w-full pl-8.5 pr-7 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-xs font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs text-slate-800 dark:text-zinc-200"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded cursor-pointer"
                title={t.clearSearch || 'Limpar pesquisa'}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {onToggleLockdown && (
            <button
              onClick={onToggleLockdown}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs shrink-0 ${
                isLockdownActive
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600'
              }`}
              title={isLockdownActive ? (t.lockdownTooltipDeactivate || 'Desativar bloqueio geral de emergência') : (t.lockdownTooltipActivate || 'Ativar bloqueio geral de emergência')}
            >
              {isLockdownActive ? (
                <>
                  <ShieldAlert size={14} />
                  <span className="hidden sm:inline">{t.lockdownButtonActive || 'Lockdown Ativo'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span className="hidden sm:inline">{t.lockdownButtonNormal || 'Bloqueio Geral'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table Container - Edge-to-Edge with Sticky Header */}
      <div id="operators-table-container" className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5">
              <UserCheck size={32} className="text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              {searchTerm || statusFilter !== 'all' 
                ? (t.noOperatorsFound || 'Nenhum operador encontrado com os filtros aplicados') 
                : (t.noOperatorsRegistered || 'Nenhum operador registado')}
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              {t.noOperatorsHelp || 'Tente redefinir a pesquisa ou verificar as permissões de operador.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3.5 px-6">{t.tableOperator || 'Operador'}</th>
                <th className="py-3.5 px-6">{t.tableSessionStatus || 'Status da Sessão'}</th>
                <th className="py-3.5 px-6">{t.tableCashFloat || 'Fundo de Caixa'}</th>
                <th className="py-3.5 px-6">{t.tableTerminal || 'Banca / Terminal'}</th>
                <th className="py-3.5 px-6 text-right">{t.tableActions || 'Ações'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {paginatedList.map((user) => {
                const isExempt = user.needs_shift_cash === 0;
                const activeShift = activeShifts[user.id];
                const initials = getInitials(user.name);
                const badgeColors = getInitialsColorClass(user, !!activeShift);

                return (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors duration-150 h-[68px]"
                  >
                    {/* Operator Name & Badge */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${badgeColors} shadow-inner`}>
                            {initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                            activeShift ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <SyncDot status={user.sync_status} />
                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">
                              {user.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 block truncate">
                            {(user.role === 'Admin' ? (t.adminRole || 'Administrador') : (t.cashierRole || 'Operador'))} • ID: {user.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-6">
                      {user.is_blocked === 1 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 w-fit">
                            <ShieldAlert size={11} />
                            {t.statusBlocked || 'Bloqueado'}
                          </span>
                          {(() => {
                            const lastShift = getLastShiftInfo(user.id);
                            return lastShift ? (
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                                {lastShift}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      ) : activeShift ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 w-fit">
                            <Clock size={11} />
                            {t.statusInSession || 'Em Sessão'}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {t.sincePrefix || 'Desde:'} {activeShift.startTime ? formatDateTime(activeShift.startTime) : '—'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-700/60 w-fit">
                            <UserCheck size={11} />
                            {t.statusClosed || 'Fechado'}
                          </span>
                          {(() => {
                            const lastShift = getLastShiftInfo(user.id);
                            return lastShift ? (
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                {lastShift}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
                                {t.noLogsToday || 'Sem registos hoje'}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </td>

                    {/* Fundo de Caixa */}
                    <td className="py-3.5 px-6">
                      {isExempt ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg text-[10px] inline-block border border-amber-200 dark:border-amber-500/20">
                          {t.exemptFromCash || 'Isento de Caixa'}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-slate-800 dark:text-zinc-200 text-xs">
                              {user.opening_cash !== undefined && user.opening_cash !== null 
                                ? `${user.opening_cash.toLocaleString('pt-MZ')} MT`
                                : `${defaultCash.toLocaleString('pt-MZ')} MT (${t.generalDefault || 'Geral'})`}
                            </span>
                            <button
                              onClick={() => onOpenEditModal(user)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              title={t.editCashFloatTooltip || 'Configurar fundo de caixa individual'}
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                          {activeShift && (
                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                              {(t.currentShiftCash || 'Turno atual: {0} MT').replace(
                                '{0}',
                                activeShift.startingCash
                                  ? activeShift.startingCash.toLocaleString('pt-MZ')
                                  : defaultCash.toLocaleString('pt-MZ')
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Terminal / Banca */}
                    <td className="py-3.5 px-6">
                      {editingTerminalId === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempTerminalName}
                            onChange={(e) => setTempTerminalName(e.target.value)}
                            placeholder={t.terminalPlaceholder || 'Ex: Caixa 1'}
                            className="px-2 py-1 text-xs rounded-lg border border-indigo-200 dark:border-indigo-900/50 focus:border-indigo-500 outline-none bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-800 dark:text-zinc-200 font-bold max-w-[120px]"
                            maxLength={15}
                            autoFocus
                          />
                          <button
                            onClick={() => onSaveTerminalInline(user.id, tempTerminalName)}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                            title={t.saveTerminalTooltip || 'Gravar banca'}
                          >
                            <Save size={12} />
                          </button>
                          <button
                            onClick={() => setEditingTerminalId(null)}
                            className="p-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title={t.cancelTerminalTooltip || 'Cancelar'}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {user.terminal_name ? user.terminal_name : '—'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTerminalId(user.id);
                              setTempTerminalName(user.terminal_name || '');
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            title={t.editTerminalTooltip || 'Editar banca do operador'}
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Operational Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Needs shift Cash requirement trigger toggle */}
                        <button
                          onClick={() => onToggleNeedsCash(user)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border shadow-2xs ${
                            isExempt
                              ? 'bg-slate-50 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
                              : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50'
                          }`}
                          title={isExempt ? (t.requireCashTooltip || 'Ativar requisito de caixa inicial') : (t.exemptCashTooltip || 'Dispensar exigência de caixa')}
                        >
                          {isExempt ? (t.requireCashBtn || 'Exigir Caixa') : (t.exemptCashBtn || 'Isentar Caixa')}
                        </button>

                        {/* Tokens modal (Burner pins) */}
                        <button
                          onClick={() => onOpenTokensModal(user)}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-200 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                          title={t.tokensTooltip || 'Fichas de Autenticação Rápida de Emergência'}
                        >
                          <KeyRound size={14} />
                        </button>

                        {/* Block Operator Status */}
                        <button
                          onClick={() => onToggleBlockStatus(user)}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                            user.is_blocked === 1
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50'
                              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-rose-200 hover:text-rose-600 dark:hover:border-rose-900'
                          }`}
                          title={user.is_blocked === 1 ? (t.restoreAccessTooltip || 'Restaurar acesso do operador') : (t.blockOperatorTooltip || 'Bloquear operador do sistema')}
                        >
                          {user.is_blocked === 1 ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Docked Pagination Footer */}
      {filteredUsers.length > 0 && (
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
          <div>
            {t.paginationShowing || 'A mostrar'} <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredUsers.length === 0 ? 0 : startIndex + 1}</span> {t.paginationTo || 'a'} <span className="font-bold text-slate-800 dark:text-zinc-200">{endIndex}</span> {t.paginationOf || 'de'} <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredUsers.length}</span> {t.paginationOperators || 'operadores'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-2xs text-slate-700 dark:text-zinc-300"
            >
              {t.prevPage || 'Anterior'}
            </button>
            <span className="font-bold px-2 text-slate-800 dark:text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-2xs text-slate-700 dark:text-zinc-300"
            >
              {t.nextPage || 'Seguinte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
