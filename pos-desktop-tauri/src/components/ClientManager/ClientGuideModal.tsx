import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Users, 
  Wallet, 
  MessageCircle, 
  Printer, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  PackageSearch,
  Clock,
  Maximize2
} from 'lucide-react';
import { useCustomersI18n } from '../../i18n';

interface ClientGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientGuideModal({ isOpen, onClose }: ClientGuideModalProps) {
  const t = useCustomersI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalPages = 5;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const isHidden = localStorage.getItem('hide_client_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_client_guide', 'true');
    } else {
      localStorage.removeItem('hide_client_guide');
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
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col z-10 my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {t.guideModalTitle || 'Guia do Livro de Fiados & Gestão de Clientes'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                    {t.pageLabel || 'Página'} {currentPage} {t.ofLabel || 'de'} {totalPages}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.guideSubtitle || 'Instruções completas para gestão de crédito, amortizações e cobrança'}
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
          <div className="p-6 text-slate-700 dark:text-zinc-300 text-xs min-h-[320px] flex flex-col justify-between">
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
                    <Users size={16} />
                    <span>{t.guideSec1Title || '1. Visão Geral do Livro & Métricas de Crédito'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec1Desc || 'O Livro de Fiados oferece uma vista em tempo real sobre todas as vendas a crédito da loja, monitorizando o saldo aberto global e o total de clientes ativos.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">
                        👥 {t.activeClients || 'Clientes Ativos'}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.activeClientsDesc || 'Contagem total de devedores'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Mantenha controle sobre o número de contas de crédito abertas e previna exceder os limites do plano.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">
                        💰 {t.openBalance || 'Saldo Aberto Global'}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.openBalanceDesc || 'Total em dívida por receber'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        O crachá superior indica o valor total pendente na tesouraria de todos os fiados não liquidados.
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
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <PackageSearch size={16} />
                    <span>{t.guideSec2Title || '2. Registo de Fiados, Stock & IVA'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec2Desc || 'Adicione novos fiados associando artigos reais do catálogo ou descrevendo os produtos manualmente com cálculo de imposto opcional.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">
                        📦 {t.stockCatalogTitle || 'Catálogo de Stock'}
                      </span>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Pesquise artigos e códigos de barras. As quantidades vendidas a crédito deduzem no inventário automaticamente.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                        📊 {t.taxVatTitle || 'Impostos & IVA'}
                      </span>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Ative o cálculo de taxa (ex: 16% IVA) para discriminar o valor base e a taxa final cobrada ao cliente.
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
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Wallet size={16} />
                    <span>{t.guideSec3Title || '3. Amortização Parcial, Recibos & WhatsApp'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec3Desc || 'Registe pagamentos parciais via M-Pesa, Dinheiro ou POS. Emita recibos térmicos de 80mm e envie cobranças amigáveis por WhatsApp.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <Printer size={14} />
                        <span>{t.thermalReceiptTitle || 'Recibos Térmicos 80mm'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Imprima comprovativos físicos com linha de assinatura do cliente para arquivo de tesouraria.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <MessageCircle size={14} />
                        <span>{t.whatsappCollectionTitle || 'Cobrança via WhatsApp'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Gere mensagens automáticas com a lista de artigos, valor pendente e contas M-Pesa da loja.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 4 && (
                <motion.div
                  key="page-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <SlidersHorizontal size={16} />
                    <span>{t.guideSec4Title || '4. Tabela, Filtros, Agrupamento & Foco'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec4Desc || 'A navegação permite filtrar por estado (Não Pagos, Parciais, Pagos, Cancelados), agrupar por cliente e alternar para o modo ecrã inteiro.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Users size={14} />
                        <span>{t.groupByClientTitle || 'Agrupamento por Cliente'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Veja o total somado por cliente. Clique num cliente para filtrar a lista e focar nas suas dívidas.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                        <Maximize2 size={14} />
                        <span>{t.focusModeTitle || 'Modo Ecrã Inteiro'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Expanda a tabela para ocupar 100% da largura do ecrã e esconder elementos de distrações.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPage === 5 && (
                <motion.div
                  key="page-5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Sparkles size={16} />
                    <span>{t.guideSec5Title || '5. Retenção de Cancelados & Expurgo Automático'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guideSec5Desc || 'As dívidas canceladas ficam retidas temporariamente no separador "Cancelados" com contagem decrescente e barra de progresso antes da limpeza definitiva.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Clock size={14} />
                        <span>{t.autoPurgeTitle || 'Prazos de Retenção (30/60/90d / Nunca)'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Escolha no seletor a retenção. Ao selecionar "Nunca", os registos permanecem na lixeira indefinidamente.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-emerald-500/20 space-y-1.5 bg-emerald-50/20 dark:bg-emerald-950/10">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <ShieldCheck size={14} />
                        <span>{t.sqliteOfflineSyncTitle || 'SQLite Local & Cloud Sync'}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-zinc-400 leading-normal">
                        Todas as transações operam localmente em SQLite e sincronizam com a Nuvem em segundo plano.
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
                  title={`${t.goToPage || 'Ir para página'} ${idx + 1}`}
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
                  <span>{t.guidePrev || 'Anterior'}</span>
                </button>
              )}

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideNext || 'Seguinte'}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.guideUnderstood || 'Entendido'}</span>
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
