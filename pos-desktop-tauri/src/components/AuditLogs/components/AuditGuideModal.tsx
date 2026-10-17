import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Database, 
  Cloud, 
  Lock, 
  KeyRound, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuditsI18n } from '../../../i18n';

interface AuditGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string | null;
}

export function AuditGuideModal({ isOpen, onClose, topic }: AuditGuideModalProps) {
  const t = useAuditsI18n();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/40">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                  {t.guideTitle || "Guia de Auditoria & Segurança"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  {t.guideSubtitle || "Transparência, integridade imutável e backup em nuvem"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1 text-xs">
                <Sparkles size={14} /> {t.guideWhatIsTitle || "O que é o Módulo de Auditoria?"}
              </h4>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                {t.guideWhatIsDesc || "O módulo de auditoria regista automaticamente todas as operações críticas do sistema (vendas, estornos, sangrias de caixa, alterações de operadores, descontos e permissões) de forma cronológica e à prova de adulteração."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-zinc-100 mb-1">
                  <Database size={14} className="text-indigo-500" />
                  <span>{t.guidePoint1Title || "1. Registo Offline-First em SQLite"}</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t.guidePoint1Desc || "Todos os eventos são gravados instantaneamente na base de dados SQLite local, garantindo zero latência de venda mesmo sem internet."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-zinc-100 mb-1">
                  <Cloud size={14} className="text-emerald-500" />
                  <span>{t.guidePoint2Title || "2. Backup & Arquivo em Nuvem (Plano Pago)"}</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t.guidePoint2Desc || "Com o módulo de Arquivo em Nuvem ativado, os registos são sincronizados com o Supabase para armazenamento perpétuo e relatórios remotos no Command Central. No modo gratuito, os logs permanecem seguros no dispositivo local."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-zinc-100 mb-1">
                  <KeyRound size={14} className="text-purple-500" />
                  <span>{t.guidePoint3Title || "3. Assinatura Criptográfica SHA-256"}</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {t.guidePoint3Desc || "Cada entrada gera uma assinatura criptográfica com referência ao evento anterior, formando uma cadeia imutável que deteta qualquer tentativa de edição manual do banco de dados."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-950/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs"
            >
              {t.understoodBtn || "Entendido"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
