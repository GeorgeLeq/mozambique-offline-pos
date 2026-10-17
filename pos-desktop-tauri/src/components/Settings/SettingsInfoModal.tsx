import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';

export interface InfoModalContent {
  title: string;
  subtitle: string;
  badge?: string;
  sections: {
    heading: string;
    description: string;
    tips?: string[];
  }[];
}

interface SettingsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: InfoModalContent | null;
}

export default function SettingsInfoModal({
  isOpen,
  onClose,
  content,
}: SettingsInfoModalProps) {
  if (!isOpen || !content) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-150 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <HelpCircle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">{content.title}</h3>
                  {content.badge && (
                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-full text-[11px] font-bold">
                      {content.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                  {content.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-zinc-300">
            {content.sections.map((section, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-slate-50/70 dark:bg-zinc-950/40 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-2"
              >
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <ArrowRight size={15} className="text-indigo-500 shrink-0" />
                  {section.heading}
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {section.description}
                </p>

                {section.tips && section.tips.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 space-y-1.5">
                    {section.tips.map((tip, tipIdx) => (
                      <div key={tipIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-950/80 border-t border-slate-150 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <Lightbulb size={15} className="text-amber-500" />
              <span>Dica: As alterações entram em vigor imediatamente após salvar.</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
