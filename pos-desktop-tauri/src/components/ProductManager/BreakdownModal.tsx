import React, { useState } from 'react';
import { Product } from '../../lib/api';
import { motion } from 'motion/react';
import { getDB } from '../../lib/db';
import toast from 'react-hot-toast';
import { useProductsI18n, useCommonI18n } from '../../i18n';

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdownSource: Product | null;
  products: Product[];
  onSuccess: () => void;
}

export function BreakdownModal({ isOpen, onClose, breakdownSource, products, onSuccess }: BreakdownModalProps) {
  const t = useProductsI18n();
  const tCommon = useCommonI18n();
  const [breakdownTargetId, setBreakdownTargetId] = useState('');
  const [breakdownRatio, setBreakdownRatio] = useState('1');

  if (!isOpen || !breakdownSource) return null;

  const executeBreakdown = async () => {
    if (!breakdownTargetId) return;
    const ratio = parseFloat(breakdownRatio);
    if (isNaN(ratio) || ratio <= 0) {
      toast.error(t.invalidRatio);
      return;
    }

    try {
      const db = await getDB();
      const targetProduct = products.find(p => p.id === breakdownTargetId);
      if (!targetProduct) return;

      const sourceStock = parseFloat(breakdownSource.stock_quantity?.toString() || '0');
      if (sourceStock < 1) {
        toast.error(t.notEnoughStockBreakdown);
        return;
      }

      const targetStock = parseFloat(targetProduct.stock_quantity?.toString() || '0');

      await db.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [sourceStock - 1, breakdownSource.id]);
      await db.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [targetStock + ratio, targetProduct.id]);

      toast.success(
        t.breakdownSuccess
          .replace('{0}', breakdownSource.name)
          .replace('{1}', ratio.toString())
          .replace('{2}', targetProduct.name)
      );
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t.breakdownFailed);
    }
  };

  return (
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
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-6"
      >
        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-2">{t.breakdownTitle}</h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
          {t.breakdownDescription.replace('{0}', breakdownSource.name)}{' '}
          ({t.availableStock}: {parseFloat(breakdownSource.stock_quantity?.toString() || '0')})
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">{t.targetProduct}</label>
            <select
              value={breakdownTargetId}
              onChange={(e) => setBreakdownTargetId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dark:text-white"
            >
              <option value="">{t.selectTargetProduct}</option>
              {products.filter(p => p.id !== breakdownSource.id).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({t.tableStock}: {p.stock_quantity || 0})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">{t.unitsGeneratedPerBulk}</label>
            <input
              type="number"
              step="any"
              value={breakdownRatio}
              onChange={(e) => setBreakdownRatio(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dark:text-white font-mono"
              placeholder="e.g. 12"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-medium rounded-xl transition-colors"
            >
              {tCommon.cancel}
            </button>
            <button
              onClick={executeBreakdown}
              disabled={!breakdownTargetId || parseFloat(breakdownRatio) <= 0 || parseFloat(breakdownSource.stock_quantity?.toString() || '0') < 1}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              {t.breakdownAction}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
