import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getDB } from '../../lib/db';
import { Product } from '../../lib/api';
import { useI18n } from '../../i18n';

interface PriceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceCheckModal({ isOpen, onClose }: PriceCheckModalProps) {
  const { pos: t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const search = async () => {
        try {
          const db = await getDB();
          const p = await db.select(
            "SELECT * FROM products WHERE barcode LIKE ? OR name LIKE ? LIMIT 5",
            [`%${searchTerm}%`, `%${searchTerm}%`]
          ) as Product[];
          setResults(p || []);
        } catch (e) {
          console.error(e);
        }
      };
      search();
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 "
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[400px]"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{t.priceCheckTitle || 'Verificador de Preços'}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={24} />
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.scanOrSearchPlaceholder || "Escaneie o código ou digite o nome..."}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-950/50 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-lg font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {results.length > 0 ? (
                  results.map(product => (
                    <div key={product.id} className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 shadow-2xs flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-100">{product.name}</h3>
                        <p className="text-sm font-mono text-slate-400 dark:text-zinc-500">{product.barcode}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {formatCurrency(product.price_mt)} MT
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          Stock: {product.stock_quantity || 0}
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchTerm.length >= 2 ? (
                  <div className="text-center py-10 text-slate-500 dark:text-zinc-400 font-medium">{t.productNotFound || 'Produto não encontrado.'}</div>
                ) : (
                  <div className="text-center py-10 text-slate-400 dark:text-zinc-500 font-medium">{t.waitingForScan || 'Aguardando código de barras ou pesquisa...'}</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
