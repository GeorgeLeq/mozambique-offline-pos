import React, { useState, useEffect, useRef } from 'react';
import { getDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { X, RefreshCw, Copy, CheckCircle, AlertTriangle, Terminal, Wifi, Database } from 'lucide-react';
import toast from 'react-hot-toast';

interface DiagnosticConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticConsole({ isOpen, onClose }: DiagnosticConsoleProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [search, setSearch] = useState('');
  
  // Diagnostic self-test states
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    internet: { status: 'pending' | 'ok' | 'fail'; msg: string };
    supabase: { status: 'pending' | 'ok' | 'fail'; msg: string };
    sqlite: { status: 'pending' | 'ok' | 'fail'; msg: string };
  } | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load logs from the globally captured window variable
    const interval = setInterval(() => {
      const captured = (window as any).__pos_logs || [];
      setLogs([...captured]);
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  // Global keyboard listener to close with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const runSelfTest = async () => {
    setIsTesting(true);
    setTestResults({
      internet: { status: 'pending', msg: 'A verificar ligação física à internet...' },
      supabase: { status: 'pending', msg: 'A ligar à nuvem do Supabase...' },
      sqlite: { status: 'pending', msg: 'A abrir base de dados local SQLite...' }
    });

    const results: {
      internet: { status: 'ok' | 'fail' | 'pending'; msg: string };
      supabase: { status: 'ok' | 'fail' | 'pending'; msg: string };
      sqlite: { status: 'ok' | 'fail' | 'pending'; msg: string };
    } = {
      internet: { status: 'fail', msg: 'Sem ligação' },
      supabase: { status: 'fail', msg: 'Indisponível' },
      sqlite: { status: 'fail', msg: 'Erro de leitura' }
    };

    // 1. Test standard connectivity
    const online = navigator.onLine;
    if (online) {
      results.internet = { status: 'ok', msg: 'Computador conectado à Internet local.' };
    } else {
      results.internet = { status: 'fail', msg: 'O sistema operativo reporta que a ligação de rede está inativa.' };
    }

    // 2. Test local SQLite database
    try {
      const db = await getDB();
      if (db) {
        // Try simple settings query
        const settings = await db.select('SELECT COUNT(*) as count FROM settings') as any[];
        const count = settings?.[0]?.count ?? 0;
        results.sqlite = { status: 'ok', msg: `SQLite Ativo. settings lido com sucesso (${count} registros).` };
      } else {
        results.sqlite = { status: 'fail', msg: 'Driver SQLite carregado, mas retornou ponteiro nulo.' };
      }
    } catch (err: any) {
      results.sqlite = { status: 'fail', msg: `Falha no SQLite: ${err.message || 'Erro desconhecido'}` };
      console.error('[DIAGNOSTICS] SQLite test error', err);
    }

    // 3. Test Supabase reachability
    try {
      const start = Date.now();
      const { error } = await supabase.from('shops').select('id').limit(1).maybeSingle();
      const duration = Date.now() - start;
      if (error) {
        results.supabase = { status: 'fail', msg: `Supabase respondeu com erro: ${error.message} (${error.code})` };
      } else {
        results.supabase = { status: 'ok', msg: `Supabase Cloud ligado. Tempo de resposta: ${duration}ms` };
      }
    } catch (err: any) {
      results.supabase = { status: 'fail', msg: `Falha ao ligar ao Supabase: ${err.message || 'Sem conexão à rota'}` };
      console.error('[DIAGNOSTICS] Supabase connectivity error', err);
    }

    setTestResults(results);
    setIsTesting(false);
    toast.success('Diagnóstico concluído!');
  };

  const copyLogs = () => {
    const rawText = logs
      .map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    
    const diagnosticsHeader = `=== POS TERMINAL DIAGNOSTICS ===\n` +
      `Timestamp: ${new Date().toLocaleString()}\n` +
      `Online Status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}\n` +
      `Supabase URL: ${import.meta.env.VITE_SUPABASE_URL || 'Not Defined'}\n` +
      `===============================\n\n` +
      rawText;

    navigator.clipboard.writeText(diagnosticsHeader);
    toast.success('Logs copiados com sucesso!');
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    const matchesType = filterType === 'all' || l.type === filterType;
    const matchesSearch = !search || l.message.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-zinc-300 font-mono text-xs select-text overflow-hidden p-4 md:p-6 border border-zinc-900 rounded-3xl m-2 shadow-2xl">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-indigo-400 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">POS Terminal Diagnostics & Live Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-lg cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-wider"
          >
            <Copy size={11} />
            <span>Copiar Logs</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-900 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 rounded-lg cursor-pointer transition-all"
            title="Fechar Terminal (ESC)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 mb-4">
        {/* Internet */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Wifi size={12} className="text-sky-400" /> Rede Física
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
              navigator.onLine ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {navigator.onLine ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-400">
            {testResults?.internet.msg || 'Aguardando início de autoteste para validação da rede local...'}
          </p>
        </div>

        {/* Supabase Cloud */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Database size={12} className="text-emerald-400" /> Supabase Cloud
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
              testResults?.supabase.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              testResults?.supabase.status === 'fail' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-900 text-zinc-500'
            }`}>
              {testResults?.supabase.status === 'ok' ? 'Online' : testResults?.supabase.status === 'fail' ? 'Erro' : 'Não Testado'}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-400 truncate">
            {testResults?.supabase.msg || `URL: ${import.meta.env.VITE_SUPABASE_URL || 'Não Declarada'}`}
          </p>
        </div>

        {/* SQLite Isolation */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Database size={12} className="text-purple-400" /> Isolamento SQLite
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
              testResults?.sqlite.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              testResults?.sqlite.status === 'fail' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-900 text-zinc-500'
            }`}>
              {testResults?.sqlite.status === 'ok' ? 'SQLite OK' : testResults?.sqlite.status === 'fail' ? 'Erro' : 'Não Testado'}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-400">
            {testResults?.sqlite.msg || 'Aguardando validação do banco de dados SQLite local...'}
          </p>
        </div>
      </div>

      {/* Run Self Test Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={runSelfTest}
          disabled={isTesting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[10px] uppercase tracking-wider shadow-md"
        >
          <RefreshCw size={11} className={isTesting ? 'animate-spin' : ''} />
          <span>{isTesting ? 'A Analisar...' : 'Executar Autoteste de Sistema'}</span>
        </button>
      </div>

      {/* Log Console Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-2xl mb-4 shrink-0">
        <div className="flex items-center gap-1">
          {(['all', 'log', 'warn', 'error'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg border font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-colors ${
                filterType === type 
                  ? 'bg-zinc-800 text-white border-zinc-700' 
                  : 'bg-zinc-900/40 text-zinc-500 border-zinc-900 hover:text-zinc-400'
              }`}
            >
              {type === 'all' ? 'Todos os Logs' : type}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar mensagens de erro..."
          className="flex-1 max-w-xs bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-lg text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Log Print Stream */}
      <div className="flex-1 overflow-y-auto bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-1.5 font-mono select-text min-h-0 text-[11px] leading-relaxed">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic text-center py-8">
            Nenhum log registrado para os filtros selecionados.
          </div>
        ) : (
          filteredLogs.map((l, i) => {
            let color = 'text-zinc-400';
            if (l.type === 'warn') color = 'text-amber-400';
            if (l.type === 'error') color = 'text-rose-500 font-bold';
            
            return (
              <div key={i} className={`flex items-start gap-2 ${color} hover:bg-zinc-900/50 py-0.5 rounded px-1`}>
                <span className="text-zinc-600 shrink-0 select-none">[{l.timestamp}]</span>
                <span className="font-bold shrink-0 uppercase select-none">[{l.type}]:</span>
                <span className="whitespace-pre-wrap break-all">{l.message}</span>
              </div>
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}
