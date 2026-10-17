import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface NewOrderHeaderProps {
  isFullScreen: boolean;
  setIsFullScreen: (val: boolean) => void;
  onClose: () => void;
}

export function NewOrderHeader({ isFullScreen, setIsFullScreen, onClose }: NewOrderHeaderProps) {
  const t = useI18n();

  return (
    <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 shrink-0">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
          {t.newPurchaseOrder || 'Nova Encomenda'}
        </span>
        <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-50 truncate">
          {t.createOrderTitle || 'Registar Expectativa de Receção (PO)'}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          title={isFullScreen ? (t.collapseFullscreen || "Restaurar janela") : (t.expandFullscreen || "Ecrã inteiro")}
        >
          {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          title={t.cancel || "Fechar"}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
