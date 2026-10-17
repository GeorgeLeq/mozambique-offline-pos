import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Package, 
  Trash2, 
  X, 
  ChevronRight,
  Boxes,
  CheckCircle2,
  Award,
  TrendingUp
} from 'lucide-react';
import { Product } from '../../lib/api';
import { useI18n } from '../../i18n';

interface StockAndMoversProps {
  lowStockItems: Product[];
  topMovers?: { name: string; qty: number }[];
  totalStockQty: number;
  totalStockValue: number;
  totalStockCost: number;
  catalogValue?: number;
  catalogCost?: number;
  recentSpoiled?: any[];
  allProducts: Product[];
  deadStockValue?: number;
  worstDeadStockItem?: { name: string; days: number; cost: number } | null;
  onLogSpoilage: (productId: string, qty: number, reason: string, authorizedBy: string) => Promise<void>;
  onNavigateToRestock?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StockAndMovers({
  lowStockItems,
  topMovers = [],
  totalStockQty,
  totalStockValue,
  totalStockCost,
  allProducts,
  onLogSpoilage,
  onNavigateToRestock
}: StockAndMoversProps) {
  const t = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Spoilage Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Danificado');
  const [authorizedBy, setAuthorizedBy] = useState('Gerente');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
  };

  // Calculate overall stock health percentage
  const totalProductsCount = allProducts.length || 1;
  const healthyProductsCount = Math.max(0, totalProductsCount - lowStockItems.length);
  const healthPercentage = Math.min(100, Math.round((healthyProductsCount / totalProductsCount) * 100));

  // Max quantity among top movers for proportional bar calculation
  const maxMoverQty = Math.max(...topMovers.map(m => m.qty), 1);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert(t.selectProduct);
      return;
    }
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert("Por favor, introduza uma quantidade válida.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogSpoilage(selectedProductId, qtyNum, reason, authorizedBy);
      // Reset form
      setSelectedProductId('');
      setQuantity('1');
      setReason('Danificado');
      setAuthorizedBy('Gerente');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* TILE 1: Valor em Armazém (Inventory Valuation & Health) */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 border border-slate-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20">
                <Boxes size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {t.warehouseValue}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  {t.warehouseValueSub}
                </p>
              </div>
            </div>

            {/* Quick Spoilage Logger Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              title="Registar perda de artigo ou quebra"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 border border-slate-200/60 dark:border-zinc-700/60 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
            >
              <Trash2 size={11} />
              <span>{t.spoilageLabel}</span>
            </button>
          </div>

          {/* Main Valuation Display */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/60 dark:border-zinc-800 mb-2.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              {t.shelfValue}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCurrency(totalStockValue)}
              </span>
            </div>
          </div>

          {/* Sub-Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/60 dark:border-indigo-500/15">
              <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t.physicalUnits}
              </p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 truncate">
                {Math.round(totalStockQty).toLocaleString('pt-MZ')} unid
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
              <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t.acquisitionCost}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-zinc-200 font-mono mt-0.5 truncate">
                {formatCurrency(totalStockCost)}
              </p>
            </div>
          </div>

          {/* Health Status Bar */}
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>{t.registeredArticles.replace('{{count}}', allProducts.length.toString())}</span>
              </span>
              <span className={`text-[9px] font-black font-mono ${healthPercentage > 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {t.stockedPct.replace('{{pct}}', healthPercentage.toString())}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  healthPercentage > 85 ? 'bg-emerald-500' : healthPercentage > 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* TILE 2: Alertas Críticos de Reposição (Low Stock Radar) */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 border border-slate-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-200/60 dark:border-amber-500/20">
                <AlertTriangle size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {t.restockAlertsTitle}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  {t.restockAlertsSub}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border font-mono ${
              lowStockItems.length === 0 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
            }`}>
              {lowStockItems.length === 1 ? t.alertCountSingle : t.alertCountLabel.replace('{{count}}', lowStockItems.length.toString())}
            </span>
          </div>

          {/* List of Low Stock Items */}
          <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-zinc-500">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.stockFullySupplied}</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">{t.noOutOfStock}</p>
              </div>
            ) : (
              lowStockItems.slice(0, 3).map((item) => {
                const isOutOfStock = (item.stock_quantity || 0) <= 0;
                const minAlert = item.min_stock_alert || 5;

                return (
                  <div 
                    key={item.id}
                    className="p-2 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400">
                          {t.minAlertLabel}: {minAlert}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono border ${
                        isOutOfStock 
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {item.stock_quantity || 0} unid
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 1-Tap Action Button: Go to Restock Manager */}
        {onNavigateToRestock && (
          <button
            onClick={onNavigateToRestock}
            className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider rounded-2xl transition-all shadow-xs cursor-pointer"
          >
            <Package size={13} />
            <span>{t.restockStockBtn}</span>
            <ChevronRight size={13} />
          </button>
        )}
      </motion.div>

      {/* TILE 3: Top 3 Artigos Mais Vendidos (Fast Movers) */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 border border-slate-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-slate-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20">
                <Award size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {t.topMoversTitle}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  {t.topMoversSub}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
              {t.todayBadge}
            </span>
          </div>

          {/* List of Top Movers */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {topMovers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-zinc-500">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-1.5">
                  <TrendingUp size={16} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.noSalesToday}</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">{t.todaySalesAppearHere}</p>
              </div>
            ) : (
              topMovers.slice(0, 3).map((item, idx) => {
                const percent = Math.round((item.qty / maxMoverQty) * 100);
                const rankColors = [
                  'bg-amber-500 text-white',
                  'bg-slate-400 text-white',
                  'bg-amber-700 text-white'
                ];

                return (
                  <div 
                    key={idx}
                    className="p-2.5 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${rankColors[idx] || 'bg-slate-300 text-slate-700'}`}>
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {item.qty} unid
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 dark:text-zinc-500 text-center font-bold">
          {t.autoRankingNotice}
        </div>
      </motion.div>

      {/* Registo de Quebra Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-800/40 mb-5">
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Trash2 size={16} className="text-rose-500" />
                  {t.registerSpoilageModalTitle}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 dark:text-zinc-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                    {t.selectProduct}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    <option value="">{t.selectProductPlaceholder}</option>
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock_quantity || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                      {t.quantity}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl py-2.5 px-4 text-xs font-bold font-mono text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                      placeholder="Ex: 1"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                      {t.reasonCause}
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    >
                      <option value="Danificado">{t.reasonDamaged}</option>
                      <option value="Expirado">{t.reasonExpired}</option>
                      <option value="Roubado/Falta">{t.reasonTheft}</option>
                      <option value="Perda">{t.reasonInternalLoss}</option>
                      <option value="Brinde/Oferta">{t.reasonGiftOffer}</option>
                    </select>
                  </div>
                </div>

                {/* Authorized By */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                    {t.authorizedBy}
                  </label>
                  <input
                    type="text"
                    required
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="Ex: Gerente / Admin"
                  />
                </div>

                <div className="pt-3 flex gap-3 justify-end border-t border-slate-100 dark:border-zinc-800/40 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? t.registering : t.confirmSpoilage}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
