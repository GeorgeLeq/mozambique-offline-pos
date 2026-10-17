import React, { useState, useEffect, useMemo } from 'react';
import { 
  Edit2, 
  RefreshCw, 
  Trash2, 
  Search, 
  Shield, 
  Users,
  X,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { User } from '../../types';
import { getAvailablePermissions } from './constants';
import { useEmployeesI18n } from '../../i18n';
import { EmployeeBin } from './EmployeeBin';
import { PermissionBadge, getPermissionCategoryStyle } from './PermissionBadge';

export function SyncDot({ status }: { status?: number }) {
  const t = useEmployeesI18n();
  if (status === 0) {
    return (
      <span
        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 inline-block shadow-xs"
        title={t.syncPending || 'Alteração local pendente de sincronização'}
      />
    );
  }
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shrink-0 inline-block opacity-75"
      title={t.syncCloud || 'Sincronizado na nuvem / SQLite'}
    />
  );
}

interface EmployeeListProps {
  employees: User[];
  deletedEmployees?: User[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  roleFilter: 'all' | 'Admin' | 'Cashier' | 'bin';
  setRoleFilter: (v: 'all' | 'Admin' | 'Cashier' | 'bin') => void;
  onAddClick: () => void;
  selectedUser: User | null;
  onEditClick: (user: User) => void;
  onRegeneratePin: (user: User) => void;
  onDeleteClick: (user: User) => void;
  onOpenGuide?: () => void;
  retentionDays?: number;
  onRetentionChange?: (days: number) => void;
  onRestoreEmployee?: (user: User) => void;
  onPermanentDeleteEmployee?: (user: User) => void;
  onEmptyBin?: () => void;
  isLoading?: boolean;
}

export const EmployeeList = React.memo(function EmployeeList({
  employees,
  deletedEmployees = [],
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  selectedUser,
  onEditClick,
  onRegeneratePin,
  onDeleteClick,
  retentionDays = 30,
  onRetentionChange = () => {},
  onRestoreEmployee = () => {},
  onPermanentDeleteEmployee = () => {},
  onEmptyBin = () => {},
  isLoading = false
}: EmployeeListProps) {
  const t = useEmployeesI18n();
  const availablePermissions = useMemo(() => getAvailablePermissions(t), [t]);
  
  // Helper to get initials for avatar
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Counts for role pills
  const activeEmployees = useMemo(() => employees.filter(e => !e.is_deleted || e.is_deleted === 0), [employees]);
  const cashiersCount = activeEmployees.filter(e => e.role === 'Cashier').length;
  const adminsCount = activeEmployees.filter(e => e.role === 'Admin').length;

  // Perform client-side filter
  const filteredList = useMemo(() => {
    return activeEmployees.filter(emp => {
      const nameMatch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === 'all' || emp.role === roleFilter;
      return (nameMatch || idMatch) && roleMatch;
    });
  }, [activeEmployees, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length);
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden w-full h-full">
      {/* Integrated Unified Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Segmented Filter Pills (4 Tabs: Todos, Operadores, Admins, Lixeira) */}
          <div className="flex bg-slate-200/60 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterAll || 'Todos'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {activeEmployees.length}
              </span>
            </button>
            <button
              onClick={() => setRoleFilter('Cashier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'Cashier'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterCashiers || 'Operadores'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {cashiersCount}
              </span>
            </button>
            <button
              onClick={() => setRoleFilter('Admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'Admin'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{t.filterAdmins || 'Admins'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-700/60">
                {adminsCount}
              </span>
            </button>
            <button
              onClick={() => setRoleFilter('bin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleFilter === 'bin'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Trash2 size={13} className={roleFilter === 'bin' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
              <span>{t.tabBin || 'Lixeira'}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                deletedEmployees.length > 0 
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/20' 
                  : 'bg-slate-100 dark:bg-zinc-700/60'
              }`}>
                {deletedEmployees.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar for active list */}
        {roleFilter !== 'bin' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={13} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder || 'Pesquisar por nome ou ID...'}
                className="w-full pl-8.5 pr-7 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-xs font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs text-slate-800 dark:text-zinc-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded cursor-pointer"
                  title={t.clearSearch || 'Limpar pesquisa'}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Switch: Bin vs Active Table */}
      {roleFilter === 'bin' ? (
        <EmployeeBin 
          deletedEmployees={deletedEmployees}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          retentionDays={retentionDays}
          onRetentionChange={onRetentionChange}
          onRestore={onRestoreEmployee}
          onPermanentDelete={onPermanentDeleteEmployee}
          onEmptyBin={onEmptyBin}
          isLoading={isLoading}
        />
      ) : (
        <>
          {/* Table Container - Edge-to-Edge with Sticky Header */}
          <div id="employee-table-container" className="flex-1 overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-zinc-500">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-3 border border-slate-200/60 dark:border-white/5">
                  <Users size={32} className="text-slate-400 dark:text-zinc-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  {searchTerm || roleFilter !== 'all' 
                    ? (t.noEmployeesFound || 'Nenhum operador encontrado com os filtros aplicados') 
                    : (t.noEmployeesRegistered || 'Nenhum operador registado')}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  {t.tryAdjustingSearch || 'Tente pesquisar por outro termo ou cadastre um novo operador no botão acima.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-950/40 sticky top-0 z-10 backdrop-blur-xs">
                    <th className="py-3 px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      {t.tableEmployee || 'Funcionário / Operador'}
                    </th>
                    <th className="py-3 px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      {t.tableRole || 'Função'}
                    </th>
                    <th className="py-3 px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      {t.tablePermissions || 'Permissões Específicas'}
                    </th>
                    <th className="py-3 px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      {t.tableOpeningCash || 'Fundo Operador'}
                    </th>
                    <th className="py-3 px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400 text-right">
                      {t.tableActions || 'Ações'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {paginatedList.map(emp => {
                    const isSelected = selectedUser?.id === emp.id;
                    const perms = emp.permissions_json ? JSON.parse(emp.permissions_json) : [];
                    const userPermissions: string[] = Array.isArray(perms) ? perms : (perms.permissions || []);
                    
                    return (
                      <tr 
                        key={emp.id}
                        className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 group ${
                          isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Column 1: Operator Name & ID */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              emp.role === 'Admin'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20'
                            }`}>
                              {getInitials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <SyncDot status={emp.sync_status} />
                                <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">
                                  {emp.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono block">
                                ID: {emp.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Role Badge */}
                        <td className="py-3.5 px-6">
                          {emp.role === 'Admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-2xs">
                              <Shield size={11} />
                              {t.adminRole || 'Administrador'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-2xs">
                              <Users size={11} />
                              {t.cashierRole || 'Operador'}
                            </span>
                          )}
                        </td>

                        {/* Column 3: Specific Permissions */}
                        <td className="py-3.5 px-6">
                          {emp.role === 'Admin' ? (
                            <div className="relative group/perms inline-flex items-center cursor-help">
                              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                                <Shield size={12} className="text-indigo-500" />
                                {t.unrestrictedAccess || 'Acesso Irrestrito'}
                              </span>
                              
                              {/* Premium Admin Tooltip */}
                              <div className="absolute left-0 bottom-full mb-2.5 hidden group-hover/perms:block z-50 w-80 p-3.5 bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/70 dark:border-zinc-700/80 pointer-events-none ring-1 ring-black/40">
                                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full mb-2.5" />
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10 text-indigo-400 font-bold text-xs">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Shield size={13} className="text-indigo-400" />
                                  </div>
                                  <div>
                                    <span className="block font-black text-slate-100">{t.adminRole || 'Administrador'}</span>
                                    <span className="text-[10px] text-indigo-300 font-medium">{t.unrestrictedAccess || 'Acesso Total & Irrestrito'}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                                  {t.adminRoleDesc || 'Privilégios totais e irrestritos para gerir vendas, configurações globais, relatórios financeiros, auditorias de segurança, inventário e operadores de caixa.'}
                                </p>
                              </div>
                            </div>
                          ) : userPermissions.length === 0 ? (
                            <div className="relative group/perms inline-flex items-center cursor-help">
                              <span className="text-xs text-slate-500 dark:text-zinc-400 italic px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/50 dark:border-zinc-700/50">
                                {t.noSubPermissions || 'Sem sub-permissões'}
                              </span>
                              
                              {/* Premium Standard Cashier Tooltip */}
                              <div className="absolute left-0 bottom-full mb-2.5 hidden group-hover/perms:block z-50 w-80 p-3.5 bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/70 dark:border-zinc-700/80 pointer-events-none ring-1 ring-black/40">
                                <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full mb-2.5" />
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10 text-amber-400 font-bold text-xs">
                                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Users size={13} className="text-amber-400" />
                                  </div>
                                  <div>
                                    <span className="block font-black text-slate-100">{t.cashierRole || 'Operador de Caixa'}</span>
                                    <span className="text-[10px] text-amber-300 font-medium">Perfil Essencial de Vendas</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                                  {t.noSubPermissionsDesc || 'Operador com permissões essenciais de atendimento: registo de vendas no POS, impressão de faturas e abertura/fecho de turno regular.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 max-w-md">
                              {userPermissions.length >= availablePermissions.length ? (
                                <div className="relative group/perms inline-flex items-center cursor-help">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-2xs hover:bg-emerald-500/15 transition-all">
                                    <Shield size={12} />
                                    {(t.allPermissions || 'Todas as Permissões ({0})').replace('{0}', String(availablePermissions.length))}
                                  </span>

                                  {/* Premium All Permissions Hover Tooltip */}
                                  <div className="absolute left-0 bottom-full mb-2.5 hidden group-hover/perms:block z-50 w-96 p-4 bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/70 dark:border-zinc-700/80 pointer-events-none ring-1 ring-black/40 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full mb-3" />
                                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <Shield size={14} />
                                        <span>{t.activePermissionsTitle || 'Permissões Atribuídas'}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                                          {userPermissions.length}/{availablePermissions.length}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">
                                        {emp.name}
                                      </span>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                      {availablePermissions.map(p => {
                                        const catStyle = getPermissionCategoryStyle(p.category, t);
                                        const IconComp = p.icon || Shield;
                                        return (
                                          <div key={p.id} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-start gap-2.5">
                                            <div className={`w-7 h-7 rounded-lg ${catStyle.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}>
                                              <IconComp size={13} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center justify-between gap-1">
                                                <p className="text-xs font-bold text-slate-100 leading-tight truncate">
                                                  {p.label}
                                                </p>
                                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider ${catStyle.badgeBg}`}>
                                                  {catStyle.label}
                                                </span>
                                              </div>
                                              <p className="text-[10.5px] text-slate-300 font-medium leading-snug mt-1">
                                                {p.accessSummary || p.desc}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {userPermissions.slice(0, 3).map(pId => {
                                    const p = availablePermissions.find(item => item.id === pId);
                                    if (!p) return null;
                                    return (
                                      <PermissionBadge
                                        key={pId}
                                        permission={p}
                                        userName={emp.name}
                                        t={t}
                                      />
                                    );
                                  })}
                                  {userPermissions.length > 3 && (
                                    <div className="relative group/more inline-flex items-center cursor-help">
                                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-extrabold border border-indigo-200/70 dark:border-indigo-800/70 hover:bg-indigo-100 transition-colors">
                                        +{userPermissions.length - 3}
                                      </span>

                                      {/* Tooltip for remaining permissions */}
                                      <div className="absolute left-0 bottom-full mb-2.5 hidden group-hover/more:block z-50 w-88 p-3.5 bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/70 dark:border-zinc-700/80 pointer-events-none ring-1 ring-black/40 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-2.5" />
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-bold text-indigo-300">
                                          <span>{t.activePermissionsTitle || 'Mais Permissões'}</span>
                                          <span className="text-[10px] font-mono text-slate-400">
                                            +{userPermissions.length - 3} {t.activePermissionsTitle || 'restantes'}
                                          </span>
                                        </div>
                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                          {userPermissions.slice(3).map(pId => {
                                            const p = availablePermissions.find(item => item.id === pId);
                                            if (!p) return null;
                                            const catStyle = getPermissionCategoryStyle(p.category, t);
                                            const IconComp = p.icon || Shield;
                                            return (
                                              <div key={pId} className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-2.5">
                                                <div className={`w-6 h-6 rounded-lg ${catStyle.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}>
                                                  <IconComp size={12} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center justify-between gap-1">
                                                    <p className="text-xs font-bold text-slate-100 leading-tight truncate">
                                                      {p.label}
                                                    </p>
                                                    <span className={`text-[8px] px-1 py-0.2 rounded border font-bold uppercase ${catStyle.badgeBg}`}>
                                                      {catStyle.label}
                                                    </span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-300 font-medium leading-snug mt-1">
                                                    {p.accessSummary || p.desc}
                                                  </p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Column 4: Opening Cash Fund */}
                        <td className="py-3.5 px-6">
                          {emp.needs_shift_cash === 0 ? (
                            <span className="text-xs font-medium text-slate-400 dark:text-zinc-400">
                              {t.shiftExempt || 'Isento de Caixa'}
                            </span>
                          ) : emp.opening_cash !== undefined && emp.opening_cash !== null ? (
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
                              {Number(emp.opening_cash).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-zinc-500 italic">
                              {t.storeDefault || 'Padrão da Loja'}
                            </span>
                          )}
                        </td>

                        {/* Column 5: Action Buttons */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit operator button */}
                            <button
                              onClick={() => onEditClick(emp)}
                              className="p-2 text-slate-600 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-indigo-500/5 rounded-xl transition-all shadow-2xs cursor-pointer"
                              title={t.editOperator || 'Editar operador'}
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Regenerate PIN button */}
                            <button
                              onClick={() => onRegeneratePin(emp)}
                              className="p-2 text-slate-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-200 dark:hover:border-amber-500/20 hover:bg-amber-500/5 rounded-xl transition-all shadow-2xs cursor-pointer"
                              title={t.regeneratePin || 'Regerar Novo PIN'}
                            >
                              <RefreshCw size={14} />
                            </button>

                            {/* Delete operator (if not admin) */}
                            {emp.role !== 'Admin' && (
                              <button
                                onClick={() => onDeleteClick(emp)}
                                className="p-2 text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-200 dark:hover:border-rose-500/20 hover:bg-rose-500/5 rounded-xl transition-all shadow-2xs cursor-pointer"
                                title={t.revokeAccess || 'Revogar Acesso'}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
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
          {filteredList.length > 0 && (
            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-950/60 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
              <div>
                {t.paginationShowing || 'A mostrar'}{' '}
                <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredList.length === 0 ? 0 : startIndex + 1}</span>{' '}
                {t.paginationTo || 'a'}{' '}
                <span className="font-bold text-slate-800 dark:text-zinc-200">{endIndex}</span>{' '}
                {t.paginationOf || 'de'}{' '}
                <span className="font-bold text-slate-800 dark:text-zinc-200">{filteredList.length}</span>{' '}
                {t.paginationOperators || 'operadores'}
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
        </>
      )}
    </div>
  );
});

