import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, User, Barcode, Calendar, Receipt, ChevronDown, ChevronUp, Package, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ScanFeedItem {
  id: string;
  created_at: string;
  product_name: string;
  barcode: string;
  operator_name: string;
  payment_method: string;
  quantity: number;
  total_mt: number;
}

interface GlobalScanFeedProps {
  scans: ScanFeedItem[];
}

export function GlobalScanFeed({ scans }: GlobalScanFeedProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalPages = Math.ceil(scans.length / itemsPerPage);
  
  const paginatedScans = useMemo(() => {
    return scans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [scans, currentPage]);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-zinc-800 text-[10px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-bold bg-slate-50/50 dark:bg-zinc-900/30">
                <th className="px-5 py-4 w-16 text-center">Hora</th>
                <th className="px-5 py-4 w-24">Operador</th>
                <th className="px-5 py-4">Produto</th>
                <th className="px-5 py-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {paginatedScans.map((s, idx) => {
                const isExpanded = expandedRowId === s.id;
                
                return (
                  <React.Fragment key={s.id || idx}>
                    <tr 
                      onClick={() => setExpandedRowId(isExpanded ? null : s.id)}
                      className={`group cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-50 dark:bg-zinc-800/80' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-mono text-xs">
                          <Clock size={12} />
                          {formatTime(s.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20 shrink-0">
                            <User size={12} />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-zinc-300 text-xs truncate max-w-[120px]">
                            {s.operator_name || 'Desconhecido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[250px] lg:max-w-none">
                          {s.product_name || 'Produto Não Registado'}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-700 dark:hover:text-zinc-200 transition-all">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Accordion Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-zinc-900/80">
                          <td colSpan={4} className="p-0 border-b border-slate-200/50 dark:border-zinc-800/50">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between border-l-2 border-indigo-500">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data Exata</span>
                                    <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                      <Calendar size={12} className="text-slate-400" />
                                      {formatDate(s.created_at)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Código de Barras</span>
                                    <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                      <Barcode size={12} className="text-slate-400" />
                                      {s.barcode || 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pagamento</span>
                                    <span className="text-xs font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                                      <Receipt size={12} className="text-slate-400" />
                                      {s.payment_method ? s.payment_method.toUpperCase() : 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total (Qtd x Valor)</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Package size={10} /> {s.quantity}x
                                      </span>
                                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatCurrency(s.total_mt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {scans.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <Search size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhum registo encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border border-slate-150 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            Página {currentPage} de {totalPages} ({scans.length} registos globais)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1 hidden md:flex">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-transparent text-slate-650 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-slate-400 dark:text-zinc-600 text-xs px-1">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Seguinte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
