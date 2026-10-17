import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, User, Calendar, Plus } from 'lucide-react';
import { getDB } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { AmbientBackground } from './AmbientBackground';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';

export default function TillPayoutsManager({ onBack }: { onBack: () => void }) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const results = await db.select(`
        SELECT t.*, u.name as user_name
        FROM till_payouts t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `);
      setPayouts(results as any[]);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar saídas de caixa');
    } finally {
      setLoading(false);
    }
  };

  const filtered = payouts.filter(p => 
    p.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col p-6 font-sans select-none transition-colors duration-500 overflow-hidden relative">
      <AmbientBackground />
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 mb-8 max-w-6xl mx-auto w-full relative z-10"
      >
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/50 transition-all text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-x-1"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Saídas de Caixa</h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 max-w-6xl mx-auto w-full flex flex-col relative z-10 gap-6 overflow-hidden"
      >
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              placeholder="Pesquisar por motivo, nota ou operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100/50 dark:bg-zinc-950/50 pl-11 pr-4 py-3 rounded-2xl border border-slate-200/50 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
          </div>
        </div>

        <div className="flex-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 overflow-hidden relative flex flex-col min-h-0">
          <div className="overflow-auto flex-1 p-6 space-y-4">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Carregando...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-950/50 text-slate-400 dark:text-zinc-600 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
                  <Wallet size={28} />
                </div>
                <p className="text-lg font-medium">Nenhuma saída de caixa encontrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((p) => (
                  <div 
                    key={p.id}
                    className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-zinc-950/20 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/10">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-zinc-100 text-lg">
                          {p.reason}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                          {p.note || 'Sem observação'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(p.created_at).toLocaleString('pt-MZ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {p.user_name || 'Desconhecido'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-zinc-100 text-right w-full md:w-auto">
                      {formatCurrency(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
