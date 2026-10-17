import React from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  User, 
  Copy, 
  Check, 
  Database, 
  Cloud 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditLog } from '../types';
import toast from 'react-hot-toast';
import { useAuditsI18n } from '../../../i18n';

interface AuditDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
  userMap: Record<string, string>;
}

export function AuditDetailModal({ log, onClose, userMap }: AuditDetailModalProps) {
  const t = useAuditsI18n();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!log) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} ${t.copiedNotice || 'copiado para a área de transferência'}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const userName = log.user_name || userMap[log.user_id] || log.user_id || (t.systemOperator || 'Sistema');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/40">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                  {t.modalDetailTitle || "Detalhes do Registo de Auditoria"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                  ID: {log.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                {t.actionExecuted || "Ação Executada"}
              </label>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/70 dark:border-zinc-800 font-bold text-slate-900 dark:text-zinc-100 text-sm flex items-center justify-between">
                <span>{log.action}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  log.sync_status === 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/40'
                }`}>
                  {log.sync_status === 1 ? (t.syncedCloudLabel || 'Sincronizado na Nuvem') : (t.storedSqliteLabel || 'Armazenado no SQLite')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  {t.operatorResponsible || "Operador Responsável"}
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/70 dark:border-zinc-800 font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <User size={13} className="text-slate-400" />
                  <span className="truncate">{userName}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  {t.exactDateTime || "Data & Hora Exata"}
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/70 dark:border-zinc-800 font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  <span>{new Date(log.created_at).toLocaleString('pt-PT')}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {t.fullDescriptionMetadata || "Descrição Completa & Metadados"}
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(log.details || '', 'Detalhes')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'Detalhes' ? <Check size={11} /> : <Copy size={11} />}
                  <span>{t.copyBtn || "Copiar"}</span>
                </button>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/70 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-all select-text">
                {log.details || (t.noDetailsRegistered || 'Sem detalhes registados.')}
              </div>
            </div>

            {log.hash && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                    {t.cryptoSignature || "Assinatura Criptográfica SHA-256"}
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(log.hash || '', 'Hash')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'Hash' ? <Check size={11} /> : <Copy size={11} />}
                    <span>{t.copyBtn || "Copiar"}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/70 dark:border-zinc-800 font-mono text-[10.5px] text-slate-600 dark:text-zinc-400 break-all select-text">
                  {log.hash}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-950/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs"
            >
              {t.closeBtn || "Fechar"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
