import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Users, 
  Shield, 
  KeyRound, 
  Lock, 
  Wallet, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal, 
  Wifi, 
  Sparkles,
  Trash2,
  RotateCcw,
  Clock,
  FileText
} from 'lucide-react';
import { useEmployeesI18n } from '../../i18n';

interface EmployeeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeGuideModal({ isOpen, onClose }: EmployeeGuideModalProps) {
  const t = useEmployeesI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalPages = 3;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const isHidden = localStorage.getItem('hide_employee_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_employee_guide', 'true');
    } else {
      localStorage.removeItem('hide_employee_guide');
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Zero-Scroll Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col z-10 text-slate-800 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {t.guideModalHeaderTitle || 'Guia de Gestão de Operadores'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                    {(t.guidePageOf || 'Página {0} de {1}').replace('{0}', String(currentPage)).replace('{1}', String(totalPages))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.guideHeaderSubtitle || 'Segurança de PINs, funções, fundo de caixa e controlo de permissões'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={t.closeBtn || 'Fechar'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Zero-Scroll Paged Presentation */}
          <div className="p-6 text-slate-700 dark:text-zinc-300 text-xs min-h-[310px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {currentPage === 1 && (
                <motion.div
                  key="page-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <KeyRound size={16} />
                    <span>{t.guidePage1Title || '1. PINs Criptografados, Níveis de Acesso & Caixa'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage1Desc || 'O sistema opera com autenticação rápida por código PIN e encriptação segura na base de dados SQLite local.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Lock size={13} />
                        <span>{t.guideSecPinTitle || 'PIN Seguro (Hash)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideSecPinSubtitle || 'Criptografia Irreversível'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideSecPinDesc || 'PINs são gravados em hash. Utilize o botão "Regerar PIN" caso o operador se esqueça.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Shield size={13} />
                        <span>{t.guideRoleTitle || 'Admin vs Caixa'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideRoleSubtitle || 'Níveis de Função'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideRoleDesc || 'Administradores têm acesso total; Caixas têm restrições configuradas na matriz de permissões.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Wallet size={13} />
                        <span>{t.guideCashTitle || 'Fundo de Caixa'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCashSubtitle || 'Abertura de Turno'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCashDesc || 'Defina um valor inicial próprio para o operador ou use a configuração geral da loja.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 2 && (
                <motion.div
                  key="page-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <SlidersHorizontal size={16} />
                    <span>{t.guidePage2Title || '2. Matriz de Sub-Permissões & Operação Offline'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage2Desc || 'Controle granularmente o que cada operador de caixa pode ou não executar no ponto de venda.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Shield size={14} />
                        <span>{t.guidePermCardTitle || 'Sub-Permissões de Caixa'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePermCardDesc || 'Conceda ou bloqueie autorização para aplicar descontos manuais, anular itens na venda, aceder a histórico de vendas e sangrias de caixa.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Wifi size={14} />
                        <span>{t.guideOfflineTitle || 'Autonomia Offline Total'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideOfflineDesc || 'Todos os operadores e credenciais ficam guardados localmente. O POS funciona e valida logins mesmo sem nenhuma ligação à internet.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 3 && (
                <motion.div
                  key="page-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Trash2 size={16} />
                    <span>{t.guidePage3Title || '3. Lixeira de Operadores & Política de Retenção'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage3Desc || 'Operadores revogados são movidos para a Lixeira com proteção contra exclusão acidental e contagem regressiva.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Clock size={13} />
                        <span>{t.guideBinCard1Title || 'Retenção Automática'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideBinCard1Desc || 'Configure o período de guarda (15, 30, 60, 90 dias ou nunca). Registos expirados são limpos automaticamente do SQLite.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <RotateCcw size={13} />
                        <span>{t.guideBinCard2Title || 'Restauro Seguro'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideBinCard2Desc || 'Restaure qualquer operador a qualquer momento com 1 clique, com validação instantânea da quota do seu plano.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <FileText size={13} />
                        <span>{t.guideBinCard3Title || 'Motivo Registado'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideBinCard3Desc || 'Cada revogação regista o motivo estruturado (ex: fim de contrato, demissão, conduta) para auditoria interna.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Indicators */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentPage === idx + 1 
                      ? 'w-6 bg-indigo-600' 
                      : 'w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700'
                  }`}
                  title={`Ir para página ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer with "Don't show again" and Slide Controls */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {t.dontShowAgain || 'Não mostrar novamente'}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft size={14} />
                  <span>{t.prevBtn || 'Anterior'}</span>
                </button>
              )}

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.nextBtn || 'Seguinte'}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.understoodBtn || 'Entendido'}</span>
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
