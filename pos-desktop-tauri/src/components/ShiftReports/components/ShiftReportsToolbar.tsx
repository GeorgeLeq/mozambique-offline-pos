import React, { useState, useEffect } from 'react';
import { Search, Info, X, Clock, Archive, Filter, Wallet, ArrowUp, ArrowDown } from 'lucide-react';

interface ShiftReportsToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: 'all' | 'ok' | 'shortage' | 'surplus';
  setStatusFilter: (val: 'all' | 'ok' | 'shortage' | 'surplus') => void;
  showArchive: boolean;
}

export function ShiftReportsToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  showArchive
}: ShiftReportsToolbarProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pos_shift_reports_guide_dismissed');
    if (dismissed === 'true') {
      // If previously dismissed, we can optionally default or let it open only when clicked
    }
  }, []);

  const handleCloseGuide = () => {
    if (dontShowAgain) {
      localStorage.setItem('pos_shift_reports_guide_dismissed', 'true');
    }
    setShowGuideModal(false);
  };

  const scrollToTop = () => {
    const topEl = document.getElementById('shift-reports-top-header');
    
    // 1. Scroll window and document elements
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // 2. Scroll element into view
    if (topEl) {
      topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 3. Reset all ancestor scroll containers
      let parent = topEl.parentElement;
      while (parent && parent !== document.body) {
        parent.scrollTo({ top: 0, behavior: 'smooth' });
        parent.scrollTop = 0;
        parent = parent.parentElement;
      }
    }

    // 4. Ensure any main viewport scrollables are reset to top
    const scrollables = document.querySelectorAll('.overflow-auto, .overflow-y-auto, main');
    scrollables.forEach((el) => {
      if (el instanceof HTMLElement && el.id !== 'sidebar-container') {
        el.scrollTo({ top: 0, behavior: 'smooth' });
        el.scrollTop = 0;
      }
    });
  };

  const scrollDownByPage = () => {
    const tableEl = document.getElementById('shift-reports-table-container');

    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      let parent = tableEl.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll' || parent.scrollHeight > parent.clientHeight) {
          parent.scrollBy({ top: 500, behavior: 'smooth' });
        }
        parent = parent.parentElement;
      }
    } else {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={showArchive ? "Pesquisar no arquivo histórico..." : "Pesquisar por operador, ID ou data..."}
          className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('ok')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'ok'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            Sem Quebras
          </button>
          <button
            onClick={() => setStatusFilter('shortage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'shortage'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            Com Quebra
          </button>
          <button
            onClick={() => setStatusFilter('surplus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'surplus'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            Com Sobra
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={scrollToTop}
            className="p-3 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-2xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-sm flex items-center justify-center"
            title="Saltar para o Topo"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={scrollDownByPage}
            className="p-3 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-sm flex items-center justify-center"
            title="Descer para Tabela / Paginação"
          >
            <ArrowDown size={16} />
          </button>
          <button
            onClick={() => setShowGuideModal(true)}
            className="px-4 py-3 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-slate-200/80 dark:border-zinc-800 transition-all shadow-sm flex items-center gap-2 text-xs font-bold shrink-0"
            title="Guia do Módulo de Turnos"
          >
            <Info size={16} /> Guia do Módulo
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseGuide}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Guia Completo: Turnos e Auditoria</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Tudo o que o Administrador precisa de saber</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 mb-6">
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-1">
                  <Clock size={16} className="text-indigo-600" /> Tabela e Histórico (30 Dias)
                </div>
                A tabela principal exibe todos os turnos fechados nos últimos 30 dias de forma rápida. Para consultar turnos mais antigos, utilize o botão de <strong>Arquivo Histórico</strong> para carregar os registos guardados em segurança na nuvem.
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-1">
                  <Filter size={16} className="text-indigo-600" /> Pesquisa e Filtros
                </div>
                Pode procurar instantaneamente por nome do operador, ID do turno ou data na barra de pesquisa. Utilize os botões de filtro ("Todos", "Sem Quebras", "Com Quebra", "Com Sobra") para auditar rapidamente discrepâncias de caixa.
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white mb-1">
                  <Wallet size={16} className="text-indigo-600" /> Fundo de Maneio
                </div>
                É o valor base em Meticais (MT) que a loja utiliza para abrir os caixas no início do dia. Pode configurar o valor padrão no canto superior direito a qualquer momento.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 bg-transparent"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Não mostrar novamente</span>
              </label>

              <button
                onClick={handleCloseGuide}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition-all"
              >
                Compreendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

