import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Coins, Smartphone, Target } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface RotatingRevenueCardProps {
  todayRevenue: number;
  mpesaRevenue: number;
  emolaRevenue: number;
  cashSalesTotal: number;
  baseCash: number;
  payoutsTotal: number;
  salesGoal: number;
  rotationSpeed: number;
  formatCurrency: (val: number) => string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const RotatingRevenueCard: React.FC<RotatingRevenueCardProps> = React.memo(({
  todayRevenue,
  mpesaRevenue,
  emolaRevenue,
  cashSalesTotal,
  baseCash,
  payoutsTotal,
  salesGoal,
  rotationSpeed,
  formatCurrency,
}) => {
  const t = useI18n();
  // State to handle the auto-rotating indices: 0 = Receita Total, 1 = Dinheiro Vivo, 2 = M-Pesa, 3 = e-Mola
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (rotationSpeed <= 0) return;
    
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 4);
    }, rotationSpeed * 1000);

    return () => clearInterval(interval);
  }, [rotationSpeed]);

  const mpesaPct = todayRevenue > 0 ? Math.round((mpesaRevenue / todayRevenue) * 100) : 0;
  const emolaPct = todayRevenue > 0 ? Math.round((emolaRevenue / todayRevenue) * 100) : 0;

  const metrics = [
    {
      id: 0,
      label: t.totalRevenue,
      value: todayRevenue,
      badge: t.general,
      badgeClass: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
      icon: <TrendingUp size={20} className="stroke-[2.5]" />,
      iconClass: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      borderColor: "hover:border-indigo-500/20 dark:hover:border-indigo-500/10",
      subtitle: `M-Pesa: ${formatCurrency(mpesaRevenue)} • e-Mola: ${formatCurrency(emolaRevenue)}`,
    },
    {
      id: 1,
      label: t.cashSales,
      value: cashSalesTotal,
      badge: t.till,
      badgeClass: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      icon: <Coins size={20} className="stroke-[2.5]" />,
      iconClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      borderColor: "hover:border-emerald-500/20 dark:hover:border-emerald-500/10",
      subtitle: `${t.openingFund}: ${formatCurrency(baseCash)} • ${t.payoutsLabel}: -${formatCurrency(payoutsTotal)}`,
    },
    {
      id: 2,
      label: t.mpesaVodacom,
      value: mpesaRevenue,
      badge: "M-Pesa",
      badgeClass: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
      icon: <Smartphone size={20} className="stroke-[2.5]" />,
      iconClass: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
      borderColor: "hover:border-rose-500/20 dark:hover:border-rose-500/10",
      subtitle: t.representsPercentage.replace('{{pct}}', mpesaPct.toString()),
    },
    {
      id: 3,
      label: t.emolaMovitel,
      value: emolaRevenue,
      badge: "e-Mola",
      badgeClass: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
      icon: <Smartphone size={20} className="stroke-[2.5]" />,
      iconClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
      borderColor: "hover:border-amber-500/20 dark:hover:border-amber-500/10",
      subtitle: t.representsPercentage.replace('{{pct}}', emolaPct.toString()),
    }
  ];

  const activeMetric = metrics[activeIdx];
  const progressPct = salesGoal > 0 ? Math.min(100, Math.round((todayRevenue / salesGoal) * 100)) : 0;

  return (
    <motion.div 
      variants={itemVariants}
      className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-zinc-800/80 flex flex-col justify-between relative overflow-hidden group transition-all min-h-[340px] ${activeMetric.borderColor}`}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-2xl transition-all duration-300 ${activeMetric.iconClass}`}>
              {activeMetric.icon}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all duration-300 ${activeMetric.badgeClass}`}>
                {activeMetric.badge}
              </span>
            </div>
          </div>

          <div className="min-h-[84px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMetric.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <h3 className="text-slate-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                  {activeMetric.label}
                </h3>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 font-mono mt-0.5">
                  {formatCurrency(activeMetric.value)}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium truncate mt-1">
                  {activeMetric.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-3">
          {salesGoal > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Target size={11} className="text-indigo-500" />
                  {t.salesGoalLabel}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {progressPct}% ({formatCurrency(todayRevenue)} / {formatCurrency(salesGoal)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Pagination dots for rotating slides */}
          <div className="flex justify-center gap-1.5 mt-1">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveIdx(m.id)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIdx === m.id 
                    ? 'w-5 bg-indigo-500 dark:bg-indigo-400' 
                    : 'w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300'
                }`}
                aria-label={`Visualizar ${m.label}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default RotatingRevenueCard;
