import React, { useState, useRef } from 'react';
import { 
  Clock, ShieldCheck, Users, Search, Calendar, RefreshCw, 
  ListFilter, Activity, LogIn, LogOut, CheckCircle2 
} from 'lucide-react';
import { User } from '../../types';
import SessionAuditTimeline from './components/SessionAuditTimeline';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
  user_role?: 'Admin' | 'Cashier';
}

interface SessionLogsListProps {
  todayLogs: AuditLog[];
  users: User[];
  logsDateStart: string;
  setLogsDateStart: (val: string) => void;
  logsDateEnd: string;
  setLogsDateEnd: (val: string) => void;
  onRefreshLogs: (start: string, end: string) => void;
  isExpanded: boolean;
}

interface SessionBlock {
  id: string;
  start: string;
  end?: string;
  isActive?: boolean;
}

// Robust UTC to Central Africa Time (CAT / Mozambique Time UTC+2) parsing and formatting
const parseSqliteDate = (str?: string) => {
  if (!str) return null;
  try {
    if (str.includes('T') || str.includes('Z')) {
      return new Date(str);
    }
    // Convert SQLite standard "YYYY-MM-DD HH:MM:SS" to UTC ISO
    const formatted = str.replace(' ', 'T') + 'Z';
    return new Date(formatted);
  } catch {
    return new Date(str);
  }
};

const formatMozTime = (isoString?: string) => {
  if (!isoString) return '--:--';
  const date = parseSqliteDate(isoString);
  if (!date || isNaN(date.getTime())) return '--:--';
  try {
    return date.toLocaleTimeString('pt-MZ', {
      timeZone: 'Africa/Maputo',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '--:--';
  }
};

const SessionLogsList = React.memo(function SessionLogsList({ 
  todayLogs, 
  users,
  logsDateStart,
  setLogsDateStart,
  logsDateEnd,
  setLogsDateEnd,
  onRefreshLogs,
  isExpanded
}: SessionLogsListProps) {
  const [activeTab, setActiveTab] = useState<'workers' | 'admins'>('workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'active' | 'inactive'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshLogs(logsDateStart, logsDateEnd);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Helper to parse sessions of a user from the selected log period
  const getUserSessions = (userId: string, currentShiftStart?: string): SessionBlock[] => {
    const userLogs = todayLogs.filter(log => log.user_id === userId);
    
    // Sort oldest first to reconstruct chronological sessions
    const sortedLogs = [...userLogs].sort((a, b) => {
      const timeA = parseSqliteDate(a.created_at)?.getTime() || 0;
      const timeB = parseSqliteDate(b.created_at)?.getTime() || 0;
      return timeA - timeB;
    });

    const sessions: SessionBlock[] = [];
    let activeBlock: { id: string; start: string } | null = null;

    sortedLogs.forEach((log) => {
      if (log.action === 'LOGIN' || log.action === 'LOGIN_SHIFT_START' || log.action === 'LOGIN_RECONNECT') {
        if (activeBlock) {
          sessions.push({
            id: activeBlock.id,
            start: activeBlock.start,
            end: log.created_at
          });
        }
        activeBlock = { id: log.id, start: log.created_at };
      } else if (log.action === 'LOGOUT') {
        if (activeBlock) {
          sessions.push({
            id: activeBlock.id,
            start: activeBlock.start,
            end: log.created_at
          });
          activeBlock = null;
        } else {
          sessions.push({
            id: log.id,
            start: '', 
            end: log.created_at
          });
        }
      }
    });

    if (activeBlock) {
      sessions.push({
        id: activeBlock.id,
        start: activeBlock.start,
        isActive: true
      });
    }

    if (currentShiftStart) {
      const alreadyHasActive = sessions.some(s => s.isActive || !s.end);
      if (!alreadyHasActive) {
        sessions.push({
          id: 'db-active-shift',
          start: currentShiftStart,
          isActive: true
        });
      } else {
        const unclosed = sessions.find(s => !s.end);
        if (unclosed) {
          unclosed.isActive = true;
        }
      }
    }

    // Sort descending by start time to show latest first in display
    return sessions.sort((a, b) => {
      const timeA = parseSqliteDate(a.start)?.getTime() || 0;
      const timeB = parseSqliteDate(b.start)?.getTime() || 0;
      return timeB - timeA;
    });
  };

  // 1. Search term filter
  const getFilteredUsers = (role: 'Admin' | 'Cashier') => {
    return users.filter(u => {
      if (u.role !== role) return false;
      
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.terminal_name && u.terminal_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      const sessions = getUserSessions(u.id, u.current_shift_start);
      const hasActive = !!u.current_shift_start || sessions.some(s => s.isActive);

      if (filterAction === 'active') return hasActive;
      if (filterAction === 'inactive') return !hasActive;
      
      return true;
    });
  };

  const filteredWorkers = getFilteredUsers('Cashier');
  const filteredAdmins = getFilteredUsers('Admin');

  const currentList = activeTab === 'workers' ? filteredWorkers : filteredAdmins;

  const renderUserSessions = (user: User) => {
    const sessions = getUserSessions(user.id, user.current_shift_start);
    const hasActiveShift = !!user.current_shift_start || sessions.some(s => s.isActive);

    return (
      <div 
        key={user.id} 
        className="p-4.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-100/80 dark:border-white/5 space-y-3.5 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200"
      >
        {/* User Info Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border shadow-sm ${
              hasActiveShift 
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/30 dark:text-emerald-400' 
                : 'bg-slate-100 border-slate-200 dark:bg-zinc-850 dark:border-zinc-850 text-slate-500 dark:text-zinc-400'
            }`}>
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  {user.role === 'Admin' ? 'Admin' : 'Operador'}
                </span>
                {user.terminal_name && (
                  <>
                    <span className="text-[9px] text-slate-350 dark:text-zinc-650">•</span>
                    <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400">
                      {user.terminal_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Badge */}
          {hasActiveShift ? (
            <span className="flex items-center gap-1 text-[9px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EM SERVIÇO
            </span>
          ) : (
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/40 px-2.5 py-1 rounded-full border border-slate-200/40 dark:border-zinc-800/40">
              OFFLINE
            </span>
          )}
        </div>

        {/* Sessions Timeline Blocks */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 hide-scrollbar max-h-[500px] min-h-[60px]">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-slate-400 dark:text-zinc-550 italic pl-1 py-4">
              Nenhuma sessão de trabalho registrada neste período.
            </p>
          ) : (
            sessions.map((session, index) => {
              const isSessionExpanded = expandedSessionId === session.id;
              return (
                <div 
                  key={session.id || index}
                  className={`p-3 rounded-xl border flex flex-col gap-2.5 text-xs transition-all duration-200 ${
                    session.isActive 
                      ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-800 dark:text-emerald-300 shadow-[0_2px_12px_rgba(16,185,129,0.02)]' 
                      : 'bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-zinc-400 shadow-xs'
                  }`}
                >
                  {/* Clickable Header for Expand/Contract */}
                  <div 
                    onClick={() => setExpandedSessionId(isSessionExpanded ? null : session.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer select-none hover:opacity-80 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={11} className={session.isActive ? 'text-emerald-500' : 'text-slate-400'} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {session.isActive ? 'Turno Ativo' : `Sessão ${sessions.length - index}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono font-bold text-[11px]">
                      <div>
                        <span className="text-[8px] font-sans font-black text-slate-400 dark:text-zinc-500 uppercase block leading-none mb-0.5">INÍCIO</span>
                        <span>{session.start ? formatMozTime(session.start) : '--:--'}</span>
                      </div>
                      <div className="text-slate-300 dark:text-zinc-750 text-xs">➔</div>
                      <div className="text-right">
                        <span className="text-[8px] font-sans font-black text-slate-400 dark:text-zinc-500 uppercase block leading-none mb-0.5">FIM</span>
                        {session.isActive ? (
                          <span className="text-emerald-500 font-extrabold text-[9px] font-sans tracking-wide animate-pulse">ATIVO</span>
                        ) : (
                          <span>{session.end ? formatMozTime(session.end) : '--:--'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Detailed Auditor & Event Timeline */}
                  {isSessionExpanded && (
                    <SessionAuditTimeline 
                      userId={user.id} 
                      userName={user.name} 
                      session={session} 
                      sessionIndex={sessions.length - index}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Date Range & Dynamic Loader Block */}
      <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-white/5 shrink-0 space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
          <Calendar size={13} />
          <span>Filtro de Período de Sessões</span>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block mb-1 uppercase">De</label>
            <input 
              type="date"
              value={logsDateStart}
              onChange={(e) => setLogsDateStart(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block mb-1 uppercase">Até</label>
            <input 
              type="date"
              value={logsDateEnd}
              onChange={(e) => setLogsDateEnd(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/60 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'A Atualizar...' : 'Pesquisar Período'}
        </button>
      </div>

      {/* Advanced Toolbar: Search & Action Filters */}
      <div className="flex flex-col gap-3 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por operador ou banca..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-950/30 text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action pills & legend tabs */}
        <div className="flex items-center justify-between gap-2">
          {/* Action pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilterAction('all')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
                filterAction === 'all'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterAction('active')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                filterAction === 'active'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:text-slate-700'
              }`}
            >
              <Activity size={10} />
              Em Serviço
            </button>
            <button
              onClick={() => setFilterAction('inactive')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                filterAction === 'inactive'
                  ? 'bg-slate-350 dark:bg-zinc-800 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:text-slate-700'
              }`}
            >
              Offline
            </button>
          </div>

          <div className="flex bg-slate-100 dark:bg-zinc-950 p-0.5 rounded-xl border border-slate-200/30 dark:border-white/5 shrink-0">
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'workers'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              Caixas
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Main Sessions Lists Grid/Timeline Area */}
      <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar min-h-0">
        {currentList.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={28} className="text-slate-300 dark:text-zinc-750 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">Nenhum operador corresponde aos filtros.</p>
          </div>
        ) : isExpanded ? (
          /* Multi-column dashboard grid when drawer is expanded in widescreen mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {currentList.map((u) => renderUserSessions(u))}
          </div>
        ) : (
          /* Simple focused single column scroll list when in regular narrow drawer mode */
          <div className="space-y-3.5 pb-4">
            {currentList.map((u) => renderUserSessions(u))}
          </div>
        )}
      </div>

      {/* Dynamic interactive legend footer */}
      <div className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 border-t border-slate-100/80 dark:border-zinc-850 pt-2 flex items-center justify-between shrink-0">
        <span>CAT (GMT+2) • {currentList.length} operadores filtrados</span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativo
        </span>
      </div>
    </div>
  );
});

export default SessionLogsList;
