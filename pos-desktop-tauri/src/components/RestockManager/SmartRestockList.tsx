import React, { useState, useEffect } from 'react';
import { getDB } from '../../lib/db';
import { Product } from '../../lib/api';
import toast from 'react-hot-toast';
import { FileText, Download, AlertTriangle, Search, Package, Maximize2, Minimize2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'motion/react';

export const SmartRestockList = React.memo(function SmartRestockList() {
  const [restockItems, setRestockItems] = useState<(Product & { threshold: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerPage = 10;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const db = await getDB();
      const settings = await db.select("SELECT * FROM settings WHERE key = 'low_stock_threshold'");
      const globalThreshold = settings && settings.length > 0 ? parseFloat(settings[0].value) : 5;

      const products = await db.select('SELECT * FROM products ORDER BY category ASC, name ASC') as Product[];
      
      const items = products.map(p => {
        const threshold = p.min_stock_alert !== null && p.min_stock_alert !== undefined 
          ? p.min_stock_alert 
          : globalThreshold;
        return { ...p, threshold };
      }).filter(p => (p.stock_quantity || 0) <= p.threshold);

      setRestockItems(items);
    } catch (err) {
      console.error('Failed to load restock list', err);
      toast.error('Erro ao carregar a lista de compras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportPDF = () => {
    if (restockItems.length === 0) {
      toast.error('Nenhum item na lista de compras.');
      return;
    }
    const doc = new jsPDF();
    doc.text('Lista de Compras Inteligente', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableData = restockItems.map(p => [
      p.category || 'Sem Categoria',
      p.name,
      p.barcode,
      p.stock_quantity || 0,
      p.threshold,
      p.cost_price_mt ? `${p.cost_price_mt} MT` : '-'
    ]);
    
    autoTable(doc, {
      startY: 28,
      head: [['Categoria', 'Produto', 'Código', 'Stock Atual', 'Alerta', 'Custo Ref.']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`lista_compras_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  const handleExportCSV = () => {
    if (restockItems.length === 0) {
      toast.error('Nenhum item na lista de compras.');
      return;
    }
    const headers = ['Categoria', 'Produto', 'Codigo_Barras', 'Stock_Atual', 'Alerta_Minimo', 'Preco_Custo'];
    const csvContent = [
      headers.join(','),
      ...restockItems.map(p => 
        [
          `"${(p.category || 'Sem Categoria').replace(/"/g, '""')}"`,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          p.barcode,
          p.stock_quantity || 0,
          p.threshold,
          p.cost_price_mt || 0
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lista_compras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado com sucesso!');
  };

  const filteredItems = restockItems.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full bg-transparent p-4 md:p-6">
      <div className="max-w-[95%] xl:max-w-[98%] w-full mx-auto flex flex-col h-full gap-6">
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative z-10">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Pesquisar por produto, código ou categoria..."
              className="w-full pl-11 pr-4 py-3 bg-white/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-sm shadow-sm dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-xs font-black uppercase tracking-wider shadow-sm hover:translate-y-[-1px] active:scale-95 cursor-pointer"
            >
              <Download size={14} className="text-slate-400 dark:text-zinc-550" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl transition-all shadow-md shadow-red-500/20 text-xs font-black uppercase tracking-wider hover:translate-y-[-1px] active:scale-95 cursor-pointer border-0"
            >
              <FileText size={14} />
              Imprimir PDF
            </button>
          </div>
        </div>

        {/* List */}
        <div className={`flex-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[2rem] border border-slate-200/50 dark:border-zinc-800/65 shadow-[0_8px_32px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 max-w-none max-h-none' : ''}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute bottom-4 right-4 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl z-30 cursor-pointer flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all"
            title={isExpanded ? "Reduzir vista" : "Expandir vista"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isExpanded ? "Reduzir" : "Expandir Lista"}</span>
          </button>
          <div className="overflow-auto flex-1 p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500 font-bold text-sm">
                A carregar lista de compras...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-zinc-500 p-8 text-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Package size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-zinc-200 mb-1">Stock Saudável</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">Nenhum produto atingiu o nível crítico de stock.</p>
                </div>
              </div>
            ) : (
              <div className="min-w-[800px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                      <th className="p-4 text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Produto & Categoria</th>
                      <th className="p-4 text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Código de Barras</th>
                      <th className="p-4 text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest text-right">Stock Atual</th>
                      <th className="p-4 text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest text-right">Alerta Mín.</th>
                      <th className="p-4 text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => {
                      const isCritical = (item.stock_quantity || 0) <= 0;
                      const isHighlighted = highlightedId === item.id;
                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          key={item.id} 
                          onClick={() => setHighlightedId(isHighlighted ? null : item.id)}
                          className={`border-b border-slate-100/50 dark:border-zinc-800/30 cursor-pointer transition-all ${
                            isHighlighted 
                              ? 'bg-indigo-100/90 dark:bg-indigo-950/70 ring-2 ring-indigo-500 shadow-md scale-[1.01]' 
                              : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/40'
                          } group`}
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold mt-0.5">{item.category || 'Sem categoria'}</div>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500 dark:text-zinc-400 select-all">
                            {item.barcode}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`inline-block px-3 py-1.5 rounded-xl font-mono font-black text-xs ${
                              isCritical 
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
                            }`}>
                              {item.stock_quantity || 0}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-xs text-slate-500 dark:text-zinc-500 font-bold">
                            {item.threshold}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end">
                              {isCritical ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-450 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10">
                                  <AlertTriangle size={12} className="stroke-[2.5]" />
                                  Esgotado
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-450 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10">
                                  <AlertTriangle size={12} className="stroke-[2.5]" />
                                  Baixo
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-zinc-800/50 p-4 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                A mostrar {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} registos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all active:scale-95"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === i + 1 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-850'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all active:scale-95"
                >
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
