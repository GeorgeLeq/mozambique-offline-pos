import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Package, 
  Wallet, 
  Receipt, 
  AlertTriangle, 
  Activity, 
  Cloud, 
  Boxes, 
  Award
} from 'lucide-react';
import { useI18n } from '../../i18n';

interface DashboardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

export default function DashboardGuideModal({ isOpen, onClose, initialPage = 0 }: DashboardGuideModalProps) {
  const t = useI18n();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [dontShowAgain, setDontShowAgain] = useState(() => {
    return localStorage.getItem('pos_hide_dashboard_guide') === 'true';
  });

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('pos_hide_dashboard_guide', 'true');
    } else {
      localStorage.removeItem('pos_hide_dashboard_guide');
    }
    onClose();
  };

  const toggleDontShowAgain = () => {
    const nextVal = !dontShowAgain;
    setDontShowAgain(nextVal);
    if (nextVal) {
      localStorage.setItem('pos_hide_dashboard_guide', 'true');
    } else {
      localStorage.removeItem('pos_hide_dashboard_guide');
    }
  };

  if (!isOpen) return null;

  const pages = [
    {
      title: t.guideTab1Title,
      subtitle: t.guideTab1Sub,
      icon: TrendingUp,
      accentColor: "indigo",
      badge: t.tabBadge.replace('{{num}}', '1'),
      cards: [
        {
          title: t.guideCard1Title,
          icon: TrendingUp,
          desc: t.guideCard1Desc
        },
        {
          title: t.guideCard2Title,
          icon: Wallet,
          desc: t.guideCard2Desc
        },
        {
          title: t.guideCard3Title,
          icon: Receipt,
          desc: t.guideCard3Desc
        }
      ]
    },
    {
      title: t.guideTab2Title,
      subtitle: t.guideTab2Sub,
      icon: ShieldCheck,
      accentColor: "emerald",
      badge: t.tabBadge.replace('{{num}}', '2'),
      cards: [
        {
          title: t.guideCard4Title,
          icon: Activity,
          desc: t.guideCard4Desc
        },
        {
          title: t.guideCard5Title,
          icon: AlertTriangle,
          desc: t.guideCard5Desc
        },
        {
          title: t.guideCard6Title,
          icon: Cloud,
          desc: t.guideCard6Desc
        }
      ]
    },
    {
      title: t.guideTab3Title,
      subtitle: t.guideTab3Sub,
      icon: Package,
      accentColor: "amber",
      badge: t.tabBadge.replace('{{num}}', '3'),
      cards: [
        {
          title: t.guideCard7Title,
          icon: Boxes,
          desc: t.guideCard7Desc
        },
        {
          title: t.guideCard8Title,
          icon: AlertTriangle,
          desc: t.guideCard8Desc
        },
        {
          title: t.guideCard9Title,
          icon: Award,
          desc: t.guideCard9Desc
        }
      ]
    }
  ];

  const current = pages[currentPage];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black backdrop-blur-xs"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {t.dashboardGuideHeader} • {current.badge}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {current.title}
              </h3>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Page Content */}
        <div className="py-5 overflow-y-auto flex-1 space-y-3.5 pr-1">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {current.subtitle}
          </p>

          <div className="space-y-3">
            {current.cards.map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex items-start gap-3.5"
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-zinc-800 shrink-0 mt-0.5">
                    <CardIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mt-1">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Strip */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex items-center gap-1.5">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentPage === idx 
                      ? 'w-6 bg-indigo-600' 
                      : 'w-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Don't show again toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400 cursor-pointer select-none hover:text-slate-900 dark:hover:text-zinc-200">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={toggleDontShowAgain}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>{t.dontShowAgain}</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              <span>{t.previousBtn}</span>
            </button>

            {currentPage < pages.length - 1 ? (
              <button
                onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
              >
                {t.understoodBtn}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
