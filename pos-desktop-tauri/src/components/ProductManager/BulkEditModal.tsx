import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Check } from 'lucide-react';
import { getDB } from '../../lib/db';
import toast from 'react-hot-toast';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: () => void;
}

export function BulkEditModal({ isOpen, onClose, products, onSuccess }: BulkEditModalProps) {
  const t = useProductsI18n();
  const tCommon = useCommonI18n();

  const [category, setCategory] = useState('');
  const [costPriceMt, setCostPriceMt] = useState('');
  const [priceMt, setPriceMt] = useState('');
  
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory('');
      setCostPriceMt('');
      setPriceMt('');
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const db = await getDB();
        const results = await db.select('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
        setExistingCategories(results.map((r: any) => r.category));
      } catch (err) {}
    };
    fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!category && !costPriceMt && !priceMt) {
      toast.error(t.atLeastOneFieldRequired);
      return;
    }

    try {
      const db = await getDB();
      for (const p of products) {
        const updates: any[] = [];
        const params: any[] = [];
        
        if (category) {
          updates.push('category = ?');
          params.push(category);
        }
        if (costPriceMt) {
          updates.push('cost_price_mt = ?');
          params.push(parseFloat(costPriceMt));
        }
        if (priceMt) {
          updates.push('price_mt = ?');
          params.push(parseFloat(priceMt));
        }
        
        if (updates.length > 0) {
          updates.push('sync_status = 0');
          params.push(p.id);
          await db.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
        }
      }
      toast.success(t.bulkUpdatedSuccess.replace('{0}', products.length.toString()));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Bulk edit failed', err);
      toast.error(t.bulkUpdateError);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && products.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/10 z-10"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-50">{t.bulkEditTitle}</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{t.bulkEditingCount.replace('{0}', products.length.toString())}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold">
                {t.bulkEditHint}
              </div>

              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{t.category}</label>
                <div 
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 flex items-center justify-between cursor-text transition-all shadow-sm text-sm"
                >
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setIsCategoryDropdownOpen(true);
                    }}
                    className="bg-transparent outline-none flex-1 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 min-w-0"
                    placeholder={t.keepCurrentCategory}
                  />
                  <ChevronDown size={16} className={`text-slate-400 shrink-0 cursor-pointer transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  }} />
                </div>

                <AnimatePresence>
                  {isCategoryDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto hide-scrollbar p-1"
                    >
                      {existingCategories.filter(c => c.toLowerCase().includes(category.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-550">
                          {category ? `${t.setAs} "${category}"` : t.typeToCreateCategory}
                        </div>
                      ) : (
                        existingCategories
                          .filter(c => c.toLowerCase().includes(category.toLowerCase()))
                          .map(c => (
                            <div
                              key={c}
                              onClick={() => {
                                setCategory(c);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${category === c ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                            >
                              <span className="truncate">{c}</span>
                              {category === c && <Check size={14} className="shrink-0 ml-2" />}
                            </div>
                          ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{t.costPrice} (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPriceMt}
                    onChange={(e) => setCostPriceMt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 outline-none transition-all font-mono shadow-sm text-sm"
                    placeholder={t.unchanged}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{t.retailPrice} (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceMt}
                    onChange={(e) => setPriceMt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 outline-none transition-all font-mono shadow-sm text-sm"
                    placeholder={t.unchanged}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/40 flex justify-end gap-2 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
              >
                {tCommon.cancel}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
              >
                <Save size={14} />
                {t.saveChanges}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
