import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  PackageSearch, 
  Calculator, 
  UserCheck, 
  Check, 
  HelpCircle,
  Percent,
  FileText
} from 'lucide-react';
import { useCustomersI18n } from '../../i18n';

interface DebtFormGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebtFormGuideModal: React.FC<DebtFormGuideModalProps> = ({ isOpen, onClose }) => {
  const t = useCustomersI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const hidden = localStorage.getItem('debt_form_guide_hidden') === 'true';
      setDontShowAgain(hidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('debt_form_guide_hidden', 'true');
    } else {
      localStorage.removeItem('debt_form_guide_hidden');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {t.formGuideTitle || 'Guia de Registo de Fiado'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.formGuideSubtitle || 'Como criar e editar fiados com precisão no sistema'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
            <AnimatePresence mode="wait">
              {currentPage === 1 && (
                <motion.div
                  key="form-page-1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <UserCheck size={16} />
                    <span>{t.formGuideStep1Title || '1. Dados do Cliente & Seleção de Produtos'}</span>
                  </div>

                  <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed">
                    {t.formGuideStep1Desc || 'Introduza o nome do cliente, contacto telefónico e bairro para facilidade de cobrança futura. Pode adicionar artigos do stock real ou descrever manualmente.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <PackageSearch size={14} />
                        <span>{t.formGuideStockTitle || 'Pesquisa no Stock'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.formGuideStockDesc || 'Procure produtos do catálogo por nome ou código de barras. Os preços e quantitativos são deduzidos automaticamente.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <FileText size={14} />
                        <span>{t.formGuideManualTitle || 'Descrição Livre'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.formGuideManualDesc || 'Caso seja um serviço ou artigo fora de catálogo, introduza o texto livremente com o valor total acordado.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 2 && (
                <motion.div
                  key="form-page-2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <Calculator size={16} />
                    <span>{t.formGuideStep2Title || '2. Cálculo de Impostos (IVA) & Gravação'}</span>
                  </div>

                  <p className="text-slate-600 dark:text-zinc-300 text-xs leading-relaxed">
                    {t.formGuideStep2Desc || 'Configure taxas de IVA se aplicável ao seu negócio e confirme o registo. A dívida será registada no SQLite local e sincronizada para a nuvem.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Percent size={14} />
                        <span>{t.formGuideTaxTitle || 'Imposto / IVA (16%)'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.formGuideTaxDesc || 'Ative a opção "Incluir IVA" para calcular a taxa automaticamente sobre a base do valor.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <BookOpen size={14} />
                        <span>{t.formGuideSaveTitle || 'Gravação Segura'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.formGuideSaveDesc || 'Ao salvar, o cliente é adicionado ao Livro de Fiados com estado "Não Pago" e saldo pendente atualizado.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {t.guideDontShowAgain || 'Não mostrar novamente'}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>{t.guidePrev || 'Anterior'}</span>
                </button>
              )}

              {currentPage < 2 ? (
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>{t.guideNext || 'Seguinte'}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Check size={14} />
                  <span>{t.guideUnderstood || 'Entendido'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
