import React, { useState, useEffect } from 'react';
import { 
  getDB 
} from '../../../lib/db';
import { 
  Activity, ShieldAlert, FileText, Printer, CheckCircle2, 
  Search, Filter, ShoppingBag, ArrowUpRight, ArrowDownLeft, 
  HelpCircle, AlertTriangle, Loader2, Sparkles, Check
} from 'lucide-react';
import { useCashierControlI18n } from '../../../i18n';

interface SessionBlock {
  id: string;
  start: string;
  end?: string;
  isActive?: boolean;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'sale' | 'payout' | 'refund' | 'void' | 'other';
  title: string;
  details: string;
  badge?: string;
  amount?: number;
}

interface SessionAuditTimelineProps {
  userId: string;
  userName: string;
  session: SessionBlock;
  sessionIndex: number;
}

const parseSqliteDate = (str?: string) => {
  if (!str) return null;
  try {
    if (str.includes('T') || str.includes('Z')) {
      return new Date(str);
    }
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

const formatMozDate = (isoString?: string) => {
  if (!isoString) return '--/--/----';
  const date = parseSqliteDate(isoString);
  if (!date || isNaN(date.getTime())) return '--/--/----';
  try {
    return date.toLocaleDateString('pt-MZ', {
      timeZone: 'Africa/Maputo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '--/--/----';
  }
};

export default function SessionAuditTimeline({ 
  userId, 
  userName, 
  session,
  sessionIndex
}: SessionAuditTimelineProps) {
  const t = useCashierControlI18n();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'payouts' | 'audits'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auditing status persisted in localStorage for compliance
  const [auditStatus, setAuditStatus] = useState<'pending' | 'approved' | 'discrepancy'>(() => {
    const saved = localStorage.getItem(`audit_status_${session.id}`);
    return (saved as any) || 'pending';
  });

  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadSessionDetails();
  }, [userId, session.start, session.end]);

  const loadSessionDetails = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const startStr = session.start ? session.start : '1970-01-01 00:00:00';
      // If active, query up to future/current moment
      const endStr = session.end ? session.end : new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      const allEvents: TimelineEvent[] = [];

      // 1. Fetch relevant Audit Logs for this cashier session range
      const auditRows = await db.select(
        `SELECT * FROM audit_logs 
         WHERE user_id = ? 
           AND created_at >= ? 
           AND created_at <= ? 
         ORDER BY created_at ASC`,
        [userId, startStr, endStr]
      ) as any[];

      auditRows?.forEach(row => {
        let type: TimelineEvent['type'] = 'other';
        let badge = '';

        if (row.action.includes('LOGIN')) {
          type = 'login';
          badge = 'SESSÃO INICIADA';
        } else if (row.action === 'LOGOUT') {
          type = 'logout';
          badge = 'SESSÃO ENCERRADA';
        } else if (row.action === 'ITEM_REFUNDED') {
          type = 'refund';
          badge = 'REEMBOLSO';
        } else if (row.action === 'TILL_PAYOUT_APPROVED') {
          type = 'payout';
          badge = 'SANGRIA';
        } else if (row.action === 'void_receipt' || row.action === 'remove_item') {
          type = 'void';
          badge = 'ANULAÇÃO';
        }

        allEvents.push({
          id: row.id,
          timestamp: row.created_at,
          type,
          title: row.action.replace(/_/g, ' '),
          details: row.details || '',
          badge
        });
      });

      // 2. Fetch Till Payouts (Sangrias)
      const payoutRows = await db.select(
        `SELECT * FROM till_payouts 
         WHERE user_id = ? 
           AND created_at >= ? 
           AND created_at <= ? 
         ORDER BY created_at ASC`,
        [userId, startStr, endStr]
      ) as any[];

      payoutRows?.forEach(row => {
        allEvents.push({
          id: `payout-${row.id}`,
          timestamp: row.created_at,
          type: 'payout',
          title: 'Sangria de Caixa (Saída)',
          details: `Valor: ${row.amount_mt.toLocaleString('pt-MZ')} MT • Autorizado por: ${row.authorized_by}. Motivo: ${row.reason} ${row.note ? `(${row.note})` : ''}`,
          badge: 'SANGRIA',
          amount: row.amount_mt
        });
      });

      // 3. Fetch Sales made in this session window
      const salesRows = await db.select(
        `SELECT receipt_id, payment_method, SUM(total_mt) as total_amount, MIN(created_at) as created_at, COUNT(*) as items_count 
         FROM sales 
         WHERE user_id = ? 
           AND created_at >= ? 
           AND created_at <= ? 
         GROUP BY receipt_id
         ORDER BY created_at ASC`,
        [userId, startStr, endStr]
      ) as any[];

      salesRows?.forEach(row => {
        allEvents.push({
          id: `sale-${row.receipt_id}`,
          timestamp: row.created_at,
          type: 'sale',
          title: `Venda Registrada`,
          details: `Recibo #${row.receipt_id} • ${row.items_count} artigo(s) vendidos • Método: ${row.payment_method.toUpperCase()}`,
          badge: 'VENDA',
          amount: row.total_amount
        });
      });

      // Sort chronological descending
      allEvents.sort((a, b) => {
        const timeA = parseSqliteDate(a.timestamp)?.getTime() || 0;
        const timeB = parseSqliteDate(b.timestamp)?.getTime() || 0;
        return timeB - timeA;
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Erro ao ler logs de auditoria detalhados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAuditStatus = (newStatus: 'pending' | 'approved' | 'discrepancy') => {
    setAuditStatus(newStatus);
    localStorage.setItem(`audit_status_${session.id}`, newStatus);
  };

  // Filter & search timeline events
  const filteredEvents = events.filter(evt => {
    // 1. Filter Type
    if (filterType === 'sales' && evt.type !== 'sale') return false;
    if (filterType === 'payouts' && evt.type !== 'payout') return false;
    if (filterType === 'audits' && !['login', 'logout', 'refund', 'void', 'other'].includes(evt.type)) return false;

    // 2. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return evt.title.toLowerCase().includes(q) || evt.details.toLowerCase().includes(q);
    }

    return true;
  });

  const salesEvents = events.filter(e => e.type === 'sale');
  const payoutsEvents = events.filter(e => e.type === 'payout');

  const totalSalesValue = salesEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPayoutValue = payoutsEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'login':
        return <CheckCircle2 size={13} className="text-emerald-500" />;
      case 'logout':
        return <Activity size={13} className="text-slate-500" />;
      case 'sale':
        return <ShoppingBag size={13} className="text-indigo-500" />;
      case 'payout':
        return <ArrowUpRight size={13} className="text-amber-500" />;
      case 'refund':
        return <ArrowDownLeft size={13} className="text-rose-500" />;
      case 'void':
        return <ShieldAlert size={13} className="text-rose-600 font-extrabold animate-pulse" />;
      default:
        return <HelpCircle size={13} className="text-slate-400" />;
    }
  };

  const getEventColorClass = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'login':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30';
      case 'logout':
        return 'bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-400 border-slate-200/50 dark:border-zinc-800';
      case 'sale':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30';
      case 'payout':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30';
      case 'refund':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30';
      case 'void':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-zinc-900 border-slate-200/50';
    }
  };

  return (
    <div className="mt-3 p-4.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 space-y-4 shadow-inner">
      
      {/* Mini Summary Headers & Direct Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-5">
          <div className="font-mono text-xs">
            <span className="text-[9px] font-sans font-black text-slate-400 dark:text-zinc-550 block uppercase leading-none">{t.shiftSales || 'Vendas do Turno'}</span>
            <strong className="text-slate-800 dark:text-zinc-200 text-[13px]">{totalSalesValue.toLocaleString('pt-MZ')} MT</strong>
            <span className="text-[9px] font-sans font-semibold text-indigo-500 block">({salesEvents.length} {t.salesCountSuffix || 'vendas'})</span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800" />

          <div className="font-mono text-xs">
            <span className="text-[9px] font-sans font-black text-slate-400 dark:text-zinc-550 block uppercase leading-none">{t.payouts || 'Sangrias'}</span>
            <strong className="text-amber-600 dark:text-amber-400 text-[13px]">{totalPayoutValue.toLocaleString('pt-MZ')} MT</strong>
            <span className="text-[9px] font-sans font-semibold text-amber-500 block">({payoutsEvents.length} {t.payoutsCountSuffix || 'saídas'})</span>
          </div>
        </div>

        {/* Auditing Action Center */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end">
          {/* Quick Ticket Print Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg border border-slate-200/70 dark:border-zinc-800 text-slate-600 dark:text-zinc-350 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={t.viewAuditReceipt || "Visualizar Talão de Turno"}
          >
            <Printer size={13} />
          </button>

          {/* Compliance Audit status selectors */}
          <div className="flex bg-slate-200/50 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/30 dark:border-zinc-800/80">
            <button
              onClick={() => handleUpdateAuditStatus('approved')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                auditStatus === 'approved'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-550 dark:text-zinc-400 hover:text-slate-850'
              }`}
            >
              {auditStatus === 'approved' && <Check size={8} />}
              {t.auditCompliant || 'Conforme'}
            </button>
            <button
              onClick={() => handleUpdateAuditStatus('discrepancy')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                auditStatus === 'discrepancy'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-550 dark:text-zinc-400 hover:text-slate-850'
              }`}
            >
              {auditStatus === 'discrepancy' && <AlertTriangle size={8} />}
              {t.auditAnomaly || 'Anomalia'}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Controls: Mini-Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.filterSessionEventsPlaceholder || "Filtrar eventos desta sessão..."}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-slate-700 dark:text-zinc-200 placeholder-slate-400"
          />
        </div>

        {/* Categories filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                : 'text-slate-400 dark:text-zinc-550'
            }`}
          >
            {t.allActions || 'Todos'}
          </button>
          <button
            onClick={() => setFilterType('sales')}
            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
              filterType === 'sales'
                ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-400 dark:text-zinc-550'
            }`}
          >
            {t.filterSales || 'Vendas'}
          </button>
          <button
            onClick={() => setFilterType('payouts')}
            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
              filterType === 'payouts'
                ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                : 'text-slate-400 dark:text-zinc-550'
            }`}
          >
            {t.filterPayouts || 'Sangrias'}
          </button>
          <button
            onClick={() => setFilterType('audits')}
            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
              filterType === 'audits'
                ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                : 'text-slate-400 dark:text-zinc-550'
            }`}
          >
            {t.filterAudits || 'Auditoria'}
          </button>
        </div>
      </div>

      {/* Chronological Logs Feed */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar min-h-[100px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={18} />
            <span className="text-[10px] text-slate-400 font-bold uppercase">{t.loadingDetailedAudit || 'Carregando Auditoria Detalhada...'}</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{t.noEventsCategory || 'Nenhum evento registrado nesta categoria.'}</span>
          </div>
        ) : (
          <div className="relative pl-3 border-l-2 border-slate-100 dark:border-zinc-850 space-y-4 py-1.5">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="relative group">
                
                {/* Timeline node icon indicator */}
                <div className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border ${getEventColorClass(evt.type)} z-10`}>
                  {getEventIcon(evt.type)}
                </div>

                {/* Event text card */}
                <div className="bg-slate-50/40 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-slate-100/60 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 capitalize">
                        {evt.title.toLowerCase()}
                      </span>
                      {evt.badge && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${getEventColorClass(evt.type)}`}>
                          {evt.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-450 dark:text-zinc-500">
                      {formatMozTime(evt.timestamp)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal font-semibold">
                    {evt.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRINT DIALOG / TALÃO DE TURNO */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-150 dark:border-zinc-850 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Printer size={15} className="text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">{t.auditReceiptTitle || 'Talão de Auditoria'}</span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Virtual Thermal ticket body */}
            <div className="p-5 overflow-y-auto max-h-[400px]">
              <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 font-mono text-[10px] text-slate-750 dark:text-zinc-350 space-y-3 shadow-inner select-all">
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 dark:border-zinc-800 pb-3">
                  <h3 className="font-extrabold text-[12px] tracking-tight uppercase text-slate-800 dark:text-zinc-150">MOZAMBIQUE RETAIL POS</h3>
                  <p className="text-[8px] text-slate-400 uppercase">CONTROLO DE CAIXA E AUDITORIA</p>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-slate-300 dark:border-zinc-800 pb-3">
                  <p><strong>CAIXA:</strong> {userName.toUpperCase()}</p>
                  <p><strong>TURNO ID:</strong> #{session.id.substring(0, 8).toUpperCase()}</p>
                  <p><strong>STATUS AUDITORIA:</strong> {auditStatus.toUpperCase()}</p>
                  <p><strong>DATA:</strong> {formatMozDate(session.start)}</p>
                  <p><strong>INÍCIO:</strong> {formatMozTime(session.start)}</p>
                  <p><strong>FIM:</strong> {session.end ? formatMozTime(session.end) : 'ATIVO / EM SERVIÇO'}</p>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-slate-300 dark:border-zinc-800 pb-3">
                  <div className="flex justify-between">
                    <span>VENDAS ({salesEvents.length}):</span>
                    <strong>{totalSalesValue.toLocaleString('pt-MZ')} MT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SANGRIAS ({payoutsEvents.length}):</span>
                    <strong>{totalPayoutValue.toLocaleString('pt-MZ')} MT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>ANULAÇÕES:</span>
                    <strong>{events.filter(e => e.type === 'void').length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>ESTORNOS:</span>
                    <strong>{events.filter(e => e.type === 'refund').length}</strong>
                  </div>
                </div>

                <div className="text-center pt-5 space-y-4">
                  <p className="text-[8px] uppercase tracking-wide">ASSINATURAS DE CONFORMIDADE</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-t border-slate-400 dark:border-zinc-700 pt-1">
                      <p className="text-[7px]">OPERADOR</p>
                    </div>
                    <div className="border-t border-slate-400 dark:border-zinc-700 pt-1">
                      <p className="text-[7px]">SUPERVISOR</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Confirmation Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-850 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-250 transition-colors cursor-pointer"
              >
                {t.closeTicket || 'Sair'}
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={12} />
                {t.printTicket || 'Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
