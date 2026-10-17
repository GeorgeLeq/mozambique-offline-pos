import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wallet, 
  ShieldAlert, 
  History, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal,
  Monitor,
  Clock,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { useCashierControlI18n } from '../../../i18n';

interface CashierControlGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashierControlGuideModal({ isOpen, onClose }: CashierControlGuideModalProps) {
  const t = useCashierControlI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalPages = 3;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const isHidden = localStorage.getItem('hide_cashier_control_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_cashier_control_guide', 'true');
    } else {
      localStorage.removeItem('hide_cashier_control_guide');
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col z-10 text-slate-800 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Wallet size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {t.guideModalTitle || 'Guia de Controlo de Caixa por Operador'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                    {(t.guidePageOf || 'Página {0} de {1}')
                      .replace('{0}', String(currentPage))
                      .replace('{1}', String(totalPages))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.guideModalSubtitle || 'Supervisão operacional, gestão de turnos, segurança e histórico de sessões'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={t.guideCloseBtn || 'Fechar'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Zero-Scroll Paged Presentation */}
          <div className="p-6 text-slate-700 dark:text-zinc-300 text-xs min-h-[320px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* PAGE 1: Gestão de Turnos & Fundo de Caixa */}
              {currentPage === 1 && (
                <motion.div
                  key="page-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Wallet size={16} />
                    <span>{t.guidePage1Title || '1. Gestão de Turnos, Fundo de Caixa & Terminais'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage1Desc || 'Supervisione em tempo real quem está operando no ponto de venda e padronize os fundos de caixa iniciais.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Wallet size={13} />
                        <span>{t.guideCard1Title || 'Fundo de Abertura'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard1Sub || 'Valor Específico ou Padrão'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard1Desc || 'Defina um valor monetário fixo para cada operador ou deixe vazio para herdar o valor padrão configurado para a loja.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <SlidersHorizontal size={13} />
                        <span>{t.guideCard2Title || 'Exigência de Caixa'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard2Sub || 'Isentar / Exigir Turno'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard2Desc || 'Alterne entre "Exigir Caixa" (obriga abertura e fecho de turno) e "Isentar" (ideal para gerentes e supervisores).'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Monitor size={13} />
                        <span>{t.guideCard3Title || 'Banca / Terminal'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard3Sub || 'Identificação Rápida'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard3Desc || 'Atribua diretamente na tabela o nome ou número da banca/computador em que o operador está alocado.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 2: Segurança & Contingência Operacional */}
              {currentPage === 2 && (
                <motion.div
                  key="page-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <ShieldAlert size={16} />
                    <span>{t.guidePage2Title || '2. Segurança, Burner PINs & Bloqueio de Emergência'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage2Desc || 'Mecanismos imediatos de controlo de acesso, contingência offline e proteção contra fraudes.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black text-xs">
                        <KeyRound size={13} />
                        <span>{t.guideCard4Title || 'Fichas de Emergência'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard4Sub || 'Burner PINs Descartáveis'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard4Desc || 'Gere lotes de PINs temporários de 6 dígitos para autorizações telefónicas. Cada código expira automaticamente após o primeiro uso.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Lock size={13} />
                        <span>{t.guideCard5Title || 'Bloqueio Individual'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard5Sub || 'Bloquear / Desbloquear'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard5Desc || 'Impeça instantaneamente que um operador faça login no POS sem apagar o seu histórico ou estatísticas de vendas passadas.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black text-xs">
                        <ShieldAlert size={13} />
                        <span>{t.guideCard6Title || 'Bloqueio Geral (Lockdown)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard6Sub || 'Travamento Total'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard6Desc || 'Congela imediatamente todas as operações de caixa no estabelecimento em situações críticas ou auditorias surpresa.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 3: Histórico de Sessões (HDS) */}
              {currentPage === 3 && (
                <motion.div
                  key="page-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <History size={16} />
                    <span>{t.guidePage3Title || '3. Histórico de Sessões (HDS) & Auditoria de Entradas/Saídas'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage3Desc || 'O painel de Histórico de Sessões é a central de auditoria e resolução de disputas em tempo real do POS.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Clock size={13} />
                        <span>{t.guideCard7Title || 'Registo de Sessões'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard7Sub || 'LOGIN e LOGOUT'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard7Desc || 'Grava a hora exata, terminal, valor de abertura e fecho de cada sessão iniciada por qualquer funcionário no SQLite local.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Search size={13} />
                        <span>{t.guideCard8Title || 'Filtros & Pesquisa'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard8Sub || 'Busca por Operador ou Data'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard8Desc || 'Filtre instantaneamente por nome, dia de atividade ou tipo de ação para esclarecer quebras de caixa ou horários de turno.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <FileSpreadsheet size={13} />
                        <span>{t.guideCard9Title || 'Modo Expandido'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guideCard9Sub || 'Visualização Ampla'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guideCard9Desc || 'Utilize o botão de expansão no cabeçalho da gaveta para visualizar mais detalhes e comparar turnos lado a lado confortavelmente.'}
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
                  title={`${t.guidePageOf?.replace('{0}', String(idx + 1)).replace('{1}', String(totalPages)) || `Página ${idx + 1}`}`}
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
                {t.guideDontShowAgain || 'Não mostrar novamente'}
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
                  <span>{t.guidePrevBtn || 'Anterior'}</span>
                </button>
              )}

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideNextBtn || 'Seguinte'}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideUnderstoodBtn || 'Entendido'}</span>
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
