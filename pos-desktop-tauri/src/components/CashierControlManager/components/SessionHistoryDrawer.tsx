import React, { useState, useEffect } from 'react';
import { getDB } from '../../../lib/db';
import { 
  X, Search, Calendar, Clock, LogIn, LogOut, Loader2, 
  User, Shield, ClipboardList, RefreshCw, AlertCircle,
  Maximize2, Minimize2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCashierControlI18n } from '../../../i18n';

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  created_at: string;
}

export default function SessionHistoryDrawer({ isOpen, onClose }: SessionHistoryDrawerProps) {
  const t = useCashierControlI18n();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'login' | 'logout'>('all');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Custom expandable width & pagination states
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Optimal number of events per page for audit clarity

  // Reset page number on filter adjustments
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, selectedDate]);

  const fetchSessionLogs = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      // Fetch login and logout events from audit_logs, joined with user roles
      const query = `
        SELECT al.id, al.user_id, al.action, al.details, al.created_at,
               COALESCE(u.name, al.user_name, 'Desconhecido') as user_name,
               COALESCE(u.role, 'Cashier') as user_role
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action IN ('LOGIN', 'LOGIN_SHIFT_START', 'LOGIN_RECONNECT', 'LOGOUT')
           OR al.action LIKE 'LOGIN%'
        ORDER BY al.created_at DESC
        LIMIT 250
      `;
      const result = await db.select(query) as LogEntry[];
      setLogs(result || []);
    } catch (err) {
      console.error('Erro ao ler logs de sessões para disputas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessionLogs();
    }
  }, [isOpen]);

  const parseSqliteDate = (str?: string) => {
    if (!str) return null;
    try {
      if (str.includes('T') || str.includes('Z')) {
        return new Date(str);
      }
      return new Date(str.replace(' ', 'T') + 'Z');
    } catch {
      return new Date(str);
    }
  };

  const formatMozTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    const date = parseSqliteDate(isoString);
    if (!date || isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('pt-MZ', {
      timeZone: 'Africa/Maputo',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMozDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const date = parseSqliteDate(isoString);
    if (!date || isNaN(date.getTime())) return '--/--/----';
    return date.toLocaleDateString('pt-MZ', {
      timeZone: 'Africa/Maputo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter logs based on search, action type, and date picker
  const filteredLogs = logs.filter(log => {
    // 1. Text search (cashier name, role, details)
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Action type filter
    const isLogin = log.action.includes('LOGIN');
    const isLogout = log.action === 'LOGOUT';
    const matchesAction = 
      actionFilter === 'all' ||
      (actionFilter === 'login' && isLogin) ||
      (actionFilter === 'logout' && isLogout);

    // 3. Date filter
    let matchesDate = true;
    if (selectedDate) {
      const logDateObj = parseSqliteDate(log.created_at);
      if (logDateObj) {
        const logDateYMD = logDateObj.toISOString().split('T')[0];
        matchesDate = logDateYMD === selectedDate;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  // Dynamic Pagination Calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Instant Clean Drawer Body (No sliding lag) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`relative w-full transition-all duration-200 bg-white dark:bg-zinc-950 h-full border-l border-slate-100 dark:border-zinc-900 shadow-2xl flex flex-col ${
              isExpanded ? 'max-w-4xl' : 'max-w-xl'
            }`}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 leading-none">
                    {t.historyTitle || 'Histórico de Sessões'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-1">
                    {t.historySubtitle || 'Auditoria de Entradas e Saídas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Expand Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? (t.collapseDrawer || "Minimizar") : (t.expandDrawer || "Expandir")}
                  className="p-1.5 hover:bg-slate-250/50 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-zinc-850 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  title={t.closeDrawer || "Fechar"}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Action Info Alert */}
            <div className="px-6 py-3 bg-indigo-500/5 border-b border-indigo-100/30 dark:border-indigo-950/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t.sessionNotice || 'Este histórico registra as credenciais exatas e os carimbos de data/hora (timestamps) em que cada operador iniciou ou encerrou a sessão no terminal offline. Use estes registros para resolver disputas de turnos.'}
              </p>
            </div>

            {/* Filter controls */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-900 space-y-3.5 shrink-0 bg-slate-50/30 dark:bg-zinc-950/10">
              {/* Search by Operator */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchHistoryPlaceholder || 'Pesquisar por operador, cargo ou detalhes...'}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 text-slate-400 pointer-events-none" size={12} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 focus:outline-hidden"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="absolute right-3.5 text-[9px] font-bold text-rose-500 hover:text-rose-600"
                    >
                      {t.clearDate || 'Limpar'}
                    </button>
                  )}
                </div>

                {/* Log type filter pills */}
                <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200/50 dark:border-zinc-850/50">
                  <button
                    onClick={() => setActionFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      actionFilter === 'all'
                        ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t.allActions || 'Todos'}
                  </button>
                  <button
                    onClick={() => setActionFilter('login')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      actionFilter === 'login'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t.loginAction || 'Entradas'}
                  </button>
                  <button
                    onClick={() => setActionFilter('logout')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      actionFilter === 'logout'
                        ? 'bg-slate-550 dark:bg-zinc-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t.logoutAction || 'Saídas'}
                  </button>
                </div>
              </div>
            </div>

             {/* List area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">{t.loadingHistory || 'Carregando Histórico...'}</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <ClipboardList className="text-slate-300" size={24} />
                  <span className="text-xs text-slate-400 font-bold">{t.noHistoryFound || 'Nenhum registro de sessão encontrado.'}</span>
                  <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                    {t.noHistoryHelp || 'Tente ajustar os filtros ou insira termos diferentes de pesquisa.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedLogs.map((log) => {
                    const isLogin = log.action.includes('LOGIN');
                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-zinc-950/20 flex flex-col gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                      >
                        {/* Title and Badge row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              isLogin
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'
                            }`}>
                              {isLogin ? <LogIn size={12} /> : <LogOut size={12} />}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-800 dark:text-zinc-200">
                                {log.user_name}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase">
                                {log.user_role === 'Admin' ? (t.adminRole || 'Gerente / Admin') : (t.cashierRole || 'Operador')}
                              </div>
                            </div>
                          </div>

                          {/* Timestamp Block */}
                          <div className="text-right font-mono text-[10px]">
                            <div className="font-extrabold text-slate-700 dark:text-zinc-300">
                              {formatMozTime(log.created_at)}
                            </div>
                            <div className="text-[8px] text-slate-400 dark:text-zinc-500 uppercase font-sans font-bold">
                              {formatMozDate(log.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Details log message */}
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 leading-normal bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-100/60 dark:border-white/5">
                          {log.details || (t.noDetailsProvided || 'Sem detalhes fornecidos.')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls Bar */}
            {filteredLogs.length > itemsPerPage && (
              <div className="px-6 py-3 bg-slate-50/50 dark:bg-zinc-900/30 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-4 shrink-0 text-xs">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ChevronLeft size={12} />
                  {t.prevPage || 'Anterior'}
                </button>
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {(t.pageOf || 'Página {0} de {1}').replace('{0}', String(currentPage)).replace('{1}', String(totalPages))}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  {t.nextPage || 'Seguinte'}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}

            {/* Refresh Footer */}
            <div className="p-4.5 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">
                {(t.showingRecords || 'Exibindo {0} registros').replace('{0}', String(filteredLogs.length))}
              </span>
              <button
                onClick={fetchSessionLogs}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-650 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                {t.refreshHistory || 'Atualizar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
