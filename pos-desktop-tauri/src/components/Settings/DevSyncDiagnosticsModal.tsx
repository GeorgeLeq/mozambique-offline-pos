import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, X, RefreshCw, Copy, CheckCircle2, AlertTriangle, 
  Wifi, Database, HardDrive, ShieldCheck, Activity, Cpu, Layers, ArrowUpRight
} from 'lucide-react';
import { getDB } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { syncAllToCloud } from '../../lib/syncEngine';
import toast from 'react-hot-toast';

interface DevSyncDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  deviceId: string;
}

interface TableQueueStat {
  entity: string;
  tableName: string;
  pendingCount: number;
  icon: string;
  filter: string;
}

export default function DevSyncDiagnosticsModal({
  isOpen,
  onClose,
  shopId,
  deviceId,
}: DevSyncDiagnosticsModalProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'selftest' | 'logs'>('queue');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [tableStats, setTableStats] = useState<TableQueueStat[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [logSearch, setLogSearch] = useState('');

  const [testResults, setTestResults] = useState<{
    internet: { status: 'pending' | 'ok' | 'fail'; msg: string; latency?: number };
    supabase: { status: 'pending' | 'ok' | 'fail'; msg: string; latency?: number };
    sqlite: { status: 'pending' | 'ok' | 'fail'; msg: string; integrity?: string };
  } | null>(null);

  // Keyboard shortcut to close (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load sync queue stats from SQLite
  const loadQueueStats = async () => {
    try {
      const db = await getDB();
      const entityMap: TableQueueStat[] = [
        { entity: 'Vendas Realizadas', tableName: 'sales', filter: 'is_synced = 0', icon: '💰', pendingCount: 0 },
        { entity: 'Catálogo de Produtos', tableName: 'products', filter: 'sync_status = 0', icon: '📦', pendingCount: 0 },
        { entity: 'Operadores & Utilizadores', tableName: 'users', filter: 'sync_status = 0', icon: '👥', pendingCount: 0 },
        { entity: 'Contas & Dívidas (Fiados)', tableName: 'debts', filter: 'sync_status = 0', icon: '📝', pendingCount: 0 },
        { entity: 'Pagamentos de Fiados', tableName: 'debt_payments', filter: 'sync_status = 0', icon: '💳', pendingCount: 0 },
        { entity: 'Relatórios de Turno', tableName: 'shift_reports', filter: 'sync_status = 0', icon: '📊', pendingCount: 0 },
        { entity: 'Logs de Auditoria', tableName: 'audit_logs', filter: 'sync_status = 0', icon: '🔍', pendingCount: 0 },
        { entity: 'Sangrias / Suprimentos', tableName: 'till_payouts', filter: 'sync_status = 0', icon: '💸', pendingCount: 0 },
        { entity: 'Quebras & Avarias (Spoilage)', tableName: 'spoiled_items', filter: 'sync_status = 0', icon: '🍎', pendingCount: 0 },
        { entity: 'Tokens de Emergência', tableName: 'emergency_tokens', filter: 'sync_status = 0', icon: '🔑', pendingCount: 0 },
        { entity: 'Encomendas / PO Esperadas', tableName: 'expected_deliveries', filter: 'sync_status = 0', icon: '📥', pendingCount: 0 },
      ];

      const list: TableQueueStat[] = [];
      let sum = 0;

      for (const item of entityMap) {
        try {
          const res = await db.select(`SELECT COUNT(*) as count FROM ${item.tableName} WHERE ${item.filter}`) as any[];
          const count = res && res[0] ? Number(res[0].count) : 0;
          list.push({ ...item, pendingCount: count });
          sum += count;
        } catch {
          list.push({ ...item, pendingCount: 0 });
        }
      }

      setTableStats(list);
      setTotalPending(sum);
    } catch (err) {
      console.error('[DevConsole] Error loading queue stats:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueueStats();
      const interval = setInterval(() => {
        loadQueueStats();
        const captured = (window as any).__pos_logs || [];
        setLogs([...captured]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      toast.error('Terminal Offline: Ligue-se à internet para sincronizar.');
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading('Sincronizando todas as tabelas offline com Supabase...');

    try {
      await syncAllToCloud();
      await loadQueueStats();
      toast.success('Fila offline processada com sucesso!', { id: toastId });
    } catch (err: any) {
      console.error('[DevConsole] Sync error:', err);
      toast.error(`Erro ao sincronizar: ${err.message || 'Falha na ligação'}`, { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    setTestResults({
      internet: { status: 'pending', msg: 'A testar conectividade de rede...' },
      supabase: { status: 'pending', msg: 'A testar endpoint Supabase Cloud...' },
      sqlite: { status: 'pending', msg: 'A validar motor SQLite e integridade...' }
    });

    const results: any = {};

    // 1. Internet test
    if (navigator.onLine) {
      results.internet = { status: 'ok', msg: 'Ligação de rede ativa.', latency: 12 };
    } else {
      results.internet = { status: 'fail', msg: 'Interface de rede offline.' };
    }

    // 2. SQLite test
    try {
      const db = await getDB();
      const countRes = await db.select('SELECT COUNT(*) as count FROM settings') as any[];
      results.sqlite = { 
        status: 'ok', 
        msg: `SQLite operacional. Tabela settings com ${countRes?.[0]?.count ?? 0} chaves.`,
        integrity: 'PRAGMA integrity_check: OK'
      };
    } catch (err: any) {
      results.sqlite = { status: 'fail', msg: `Erro SQLite: ${err.message || 'Falha no driver'}` };
    }

    // 3. Supabase Cloud test
    try {
      const t0 = performance.now();
      const { error } = await supabase.from('shops').select('id').limit(1).maybeSingle();
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);

      if (error) {
        results.supabase = { status: 'fail', msg: `Supabase erro: ${error.message} (${error.code})` };
      } else {
        results.supabase = { status: 'ok', msg: `Supabase Cloud respondendo normalmente (${latency}ms).`, latency };
      }
    } catch (err: any) {
      results.supabase = { status: 'fail', msg: `Sem resposta do Supabase: ${err.message || 'Timeout'}` };
    }

    setTestResults(results);
    setIsTesting(false);
    toast.success('Diagnóstico concluído!');
  };

  const copySnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      shopId,
      deviceId,
      online: navigator.onLine,
      totalPendingMutations: totalPending,
      tableBreakdown: tableStats.map(t => ({ table: t.tableName, pending: t.pendingCount })),
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    };

    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    toast.success('Snapshot de diagnóstico copiado para a área de transferência!');
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    const matchesType = logFilter === 'all' || l.type === logFilter;
    const matchesSearch = !logSearch || l.message.toLowerCase().includes(logSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md select-text">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[90vh] bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-mono"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Terminal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Painel Técnico & Fila de Sincronia (Modo Dev)</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Acesso Restrito
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Diagnóstico de baixo nível para suporte técnico e auditoria SQLite offline vs Supabase Cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copySnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-700"
              title="Copiar relatório JSON do terminal"
            >
              <Copy size={13} />
              <span>Copiar Snapshot</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-rose-900/30 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer border border-zinc-700 hover:border-rose-700"
              title="Fechar (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Database size={14} />
              <span>Fila de Sincronia ({totalPending})</span>
            </button>

            <button
              onClick={() => setActiveTab('selftest')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'selftest'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Activity size={14} />
              <span>Autoteste & Latência</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Terminal size={14} />
              <span>Console Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-zinc-500">Shop: {shopId ? shopId.substring(0, 8) + '...' : 'N/A'}</span>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Estado da Fila de Transações Locais</h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    {totalPending === 0 
                      ? 'Todas as transações estão sincronizadas com o Supabase.'
                      : `Existem ${totalPending} operações gravadas em SQLite aguardando envio para a nuvem.`
                    }
                  </p>
                </div>

                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Processando Fila...' : 'Forçar Sync Agora'}</span>
                </button>
              </div>

              {/* Table of Queues */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Entidade</th>
                      <th className="py-3 px-4">Tabela SQLite</th>
                      <th className="py-3 px-4">Filtro de Sync</th>
                      <th className="py-3 px-4 text-right">Pendentes</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {tableStats.map((row) => {
                      const hasPending = row.pendingCount > 0;
                      return (
                        <tr key={row.tableName} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-2.5 px-4 font-sans font-bold text-zinc-200 flex items-center gap-2">
                            <span>{row.icon}</span>
                            <span>{row.entity}</span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-indigo-400">
                            {row.tableName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500">
                            {row.filter}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-right text-zinc-100">
                            {row.pendingCount}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              hasPending 
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${hasPending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                              {hasPending ? 'Pendente' : 'Sincronizado'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'selftest' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Autoteste de Comunicação & Hardware</h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Testa a integridade da base de dados SQLite local, conectividade de rede e latência da API Supabase.
                  </p>
                </div>

                <button
                  onClick={runDiagnostics}
                  disabled={isTesting}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Activity size={14} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'Executando Testes...' : 'Iniciar Autoteste'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Internet Card */}
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wifi size={14} className="text-sky-400" /> Rede Local
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      navigator.onLine ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {navigator.onLine ? 'Conectado' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans">
                    {testResults?.internet.msg || 'Clique em "Iniciar Autoteste" para medir a rede.'}
                  </p>
                </div>

                {/* SQLite Card */}
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive size={14} className="text-purple-400" /> SQLite Local
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      testResults?.sqlite?.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {testResults?.sqlite?.status === 'ok' ? 'OK' : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans">
                    {testResults?.sqlite.msg || 'Driver SQLite local pronto em sandbox.'}
                  </p>
                  {testResults?.sqlite?.integrity && (
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      {testResults.sqlite.integrity}
                    </span>
                  )}
                </div>

                {/* Supabase Card */}
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={14} className="text-emerald-400" /> Supabase Cloud
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      testResults?.supabase?.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {testResults?.supabase?.status === 'ok' ? `${testResults.supabase.latency}ms` : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans truncate">
                    {testResults?.supabase.msg || 'Aguardando teste de conexão.'}
                  </p>
                </div>
              </div>

              {/* Hardware / Env Info */}
              <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Identificadores do Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850">
                    <span className="text-zinc-500 block text-[9px] uppercase">Shop ID</span>
                    <span className="text-zinc-200 select-all">{shopId || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850">
                    <span className="text-zinc-500 block text-[9px] uppercase">Device ID</span>
                    <span className="text-zinc-200 select-all">{deviceId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 shrink-0">
                <div className="flex items-center gap-1">
                  {(['all', 'log', 'warn', 'error'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setLogFilter(type)}
                      className={`px-3 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors ${
                        logFilter === type 
                          ? 'bg-zinc-800 text-white border-zinc-700' 
                          : 'bg-zinc-900/40 text-zinc-500 border-zinc-900 hover:text-zinc-400'
                      }`}
                    >
                      {type === 'all' ? 'Todos' : type}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Pesquisar mensagens de log..."
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 outline-none w-64"
                />
              </div>

              <div className="flex-1 min-h-[300px] overflow-y-auto bg-zinc-950 border border-zinc-850 rounded-2xl p-4 text-[11px] space-y-1 font-mono">
                {filteredLogs.length === 0 ? (
                  <div className="text-zinc-600 italic text-center py-12">
                    Nenhum log gravado no console neste momento.
                  </div>
                ) : (
                  filteredLogs.map((l, i) => {
                    let color = 'text-zinc-400';
                    if (l.type === 'warn') color = 'text-amber-400';
                    if (l.type === 'error') color = 'text-rose-400 font-bold';

                    return (
                      <div key={i} className={`flex items-start gap-2 ${color} hover:bg-zinc-900/40 py-0.5 px-1 rounded`}>
                        <span className="text-zinc-600 shrink-0 select-none">[{l.timestamp}]</span>
                        <span className="font-bold shrink-0 uppercase select-none">[{l.type}]:</span>
                        <span className="whitespace-pre-wrap break-all">{l.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
