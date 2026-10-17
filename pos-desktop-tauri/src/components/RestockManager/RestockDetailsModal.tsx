import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, FileText, Trash2, PackageCheck } from 'lucide-react';
import { useI18n } from '../../i18n';

interface RestockLog {
  id: string;
  user_name: string;
  details: string;
  created_at: string;
}

interface RestockDetailsModalProps {
  log: RestockLog;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function RestockDetailsModal({ log, onClose, onDelete }: RestockDetailsModalProps) {
  const t = useI18n();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  const dateObj = new Date(log.created_at);

  let parsedDetails: any = null;
  let rawText = log.details;
  let justification = '';

  try {
    if (log.details?.trim().startsWith('{') || log.details?.trim().startsWith('[')) {
      parsedDetails = JSON.parse(log.details);
    }
  } catch (e) {}

  if (!parsedDetails && log.details) {
    const justMatch = log.details.match(/(?:-\s*(?:Justificativa|Motivo):\s*)(.*)/i);
    if (justMatch) {
      justification = justMatch[1].trim();
      rawText = log.details.replace(justMatch[0], '').trim();
    }
  }

  const renderDetails = () => {
    if (parsedDetails) {
      return (
        <div className="space-y-1 text-sm text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
          {Object.entries(parsedDetails).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold capitalize opacity-70 min-w-[120px]">{key.replace(/_/g, ' ')}:</span>
              <span className="font-medium font-mono">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-sm text-slate-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800">
        {rawText}
        {justification && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <span className="block text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1">{t.justificationReason || 'Motivo / Justificativa'}</span>
            <span className="text-rose-600 dark:text-rose-400 italic">"{justification}"</span>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      {!isClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
          />

          <div 
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 z-10 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <PackageCheck size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-zinc-50">{t.operationDetailsTitle || t.receiveGoodsTitle || 'Detalhes da Operação'}</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">ID: {log.id}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    <Calendar size={13} />
                    <span>{t.receivedDate || 'Data e Hora'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {dateObj.toLocaleDateString()} {t.atTime || 'às'} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    <User size={13} />
                    <span>{t.responsibleOperator || t.supplierName || 'Operador Responsável'}</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-red-500/10 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/10">
                      {log.user_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  <FileText size={13} />
                  <span>{t.stockOperationSummary || t.receivingNotesLabel || 'Resumo da Operação de Stock'}</span>
                </div>
                {renderDetails()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onDelete(log.id)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border border-rose-500/20"
              >
                <Trash2 size={14} />
                <span>{t.deleteProduct || 'Eliminar Registo'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                {t.cancel || 'Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
