import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { WizardStep } from '../types';

interface RefundWizardHeaderProps {
  wizardStep: WizardStep;
  onClose: () => void;
}

export function RefundWizardHeader({ wizardStep, onClose }: RefundWizardHeaderProps) {
  const stepNumber = wizardStep === 'pin' ? '1/3' : wizardStep === 'condition' ? '2/3' : '3/3';
  const stepLabel = wizardStep === 'pin' ? 'Autorização' : wizardStep === 'condition' ? 'Inventário' : 'Reembolso';

  return (
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none uppercase">
            Reembolso Seguro
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-1.5 uppercase tracking-wider">
            Passo {stepNumber}: {stepLabel}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        id="close-wizard-btn"
      >
        <X size={18} />
      </button>
    </div>
  );
}
