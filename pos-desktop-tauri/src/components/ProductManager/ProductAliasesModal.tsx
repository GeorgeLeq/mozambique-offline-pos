import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { getDB } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Barcode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface Alias {
  id: string;
  barcode: string;
}

interface ProductAliasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductAliasesModal({ isOpen, onClose, product }: ProductAliasesModalProps) {
  const t = useProductsI18n();
  const tCommon = useCommonI18n();
  const { currentUser } = useAuth();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [newBarcode, setNewBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadAliases();
      setNewBarcode('');
    }
  }, [isOpen, product]);

  const loadAliases = async () => {
    if (!product) return;
    try {
      const db = await getDB();
      const results = await db.select(
        'SELECT id, barcode FROM product_aliases WHERE product_id = ? ORDER BY created_at DESC',
        [product.id]
      ) as Alias[];
      setAliases(results || []);
    } catch (err) {
      console.error(err);
      toast.error(t.errorLoadingAliases);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newBarcode.trim()) return;

    // Ensure it's not the main barcode
    if (newBarcode.trim() === product.barcode) {
      toast.error(t.isMainBarcodeError);
      return;
    }

    setLoading(true);
    try {
      const db = await getDB();
      
      // Check if exists in products
      const pCheck = await db.select('SELECT id FROM products WHERE barcode = ?', [newBarcode.trim()]);
      if (pCheck && pCheck.length > 0) {
        toast.error(t.barcodeAlreadyMainError);
        setLoading(false);
        return;
      }

      // Check if exists in aliases
      const aCheck = await db.select('SELECT id FROM product_aliases WHERE barcode = ?', [newBarcode.trim()]);
      if (aCheck && aCheck.length > 0) {
        toast.error(t.barcodeAlreadyAliasError);
        setLoading(false);
        return;
      }

      const id = crypto.randomUUID();
      await db.execute(
        'INSERT INTO product_aliases (id, product_id, barcode) VALUES (?, ?, ?)',
        [id, product.id, newBarcode.trim()]
      );
      
      await logAudit(
        currentUser?.id, 
        'PRODUCT_ALIAS_ADDED', 
        `Adicionou o código ${newBarcode.trim()} ao produto ${product.name}`
      );
      
      toast.success(t.barcodeAddedSuccess);
      setNewBarcode('');
      loadAliases();
    } catch (err) {
      console.error(err);
      toast.error(t.errorAddingBarcode);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlias = async (aliasId: string, barcode: string) => {
    try {
      const db = await getDB();
      await db.execute('DELETE FROM product_aliases WHERE id = ?', [aliasId]);
      
      // Attempt cloud deletion for instant propagation
      try {
        await supabase.from('product_aliases').delete().eq('id', aliasId);
      } catch (e) {
        console.log('Skipped cloud alias deletion (offline):', e);
      }
      
      await logAudit(
        currentUser?.id, 
        'PRODUCT_ALIAS_REMOVED', 
        `Removeu o código ${barcode} do produto ${product?.name}`
      );
      
      toast.success(t.barcodeRemovedSuccess);
      loadAliases();
    } catch (err) {
      console.error(err);
      toast.error(t.errorRemovingBarcode);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && product && (
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
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 z-10 flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-50">
                  {t.multiBarcodeTitle}
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  {t.multiBarcodeSubtitle}{' '}
                  <span className="font-bold text-slate-600 dark:text-zinc-300">{product.name}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Main Barcode Display */}
              <div className="flex items-center gap-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100/45 dark:border-indigo-500/10">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Barcode size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {t.mainBarcodeLabel}
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {product.barcode}
                  </div>
                </div>
              </div>

              {/* Add New Alias */}
              <form onSubmit={handleAddAlias} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.scanOrTypeBarcode}
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-zinc-100 text-sm font-mono placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newBarcode.trim() || loading}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-600/10 shrink-0"
                >
                  <Plus size={16} />
                  {tCommon.add}
                </button>
              </form>

              {/* Alias List */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-white/5">
                  {t.alternativeBarcodes} ({aliases.length})
                </h3>
                
                {aliases.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 dark:text-zinc-500 text-xs font-medium">
                    {t.noAlternativeBarcodes}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {aliases.map(alias => (
                      <div 
                        key={alias.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-white/5 bg-white dark:bg-zinc-950/20 hover:border-slate-300 dark:hover:border-zinc-800 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Barcode size={14} className="text-slate-400" />
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                            {alias.barcode}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteAlias(alias.id, alias.barcode)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title={tCommon.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-white/5 rounded-b-[2rem]">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {tCommon.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
