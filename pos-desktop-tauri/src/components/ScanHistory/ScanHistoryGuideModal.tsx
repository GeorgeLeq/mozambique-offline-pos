import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Barcode, 
  Calculator, 
  Coins, 
  Database, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Receipt,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { useScanHistoryI18n } from '../../i18n';

interface ScanHistoryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScanHistoryGuideModal({ isOpen, onClose }: ScanHistoryGuideModalProps) {
  const t = useScanHistoryI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const totalPages = 3;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      const isHidden = localStorage.getItem('hide_scan_history_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_scan_history_guide', 'true');
    } else {
      localStorage.removeItem('hide_scan_history_guide');
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
                <Barcode size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">
                    {t.guideTitle || 'Guia de Histórico de Leituras & Vendas'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                    {(t.guidePageLabel || 'Página {current} de {total}').replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  {t.guideSubtitle || 'Rastreio de códigos de barras, fluxo de pagamentos e auditoria de caixa'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={t.closeBtn || "Fechar"}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Zero-Scroll Paged Presentation */}
          <div className="p-6 text-slate-700 dark:text-zinc-300 text-xs min-h-[320px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* PAGE 1: Registo de Bips & Vendas */}
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
                    <Barcode size={16} />
                    <span>{t.guidePage1Title || '1. Telemetria de Leituras (Bips) & Vendas'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage1Desc || 'Cada produto passado no leitor ótico (scanner de código de barras) ou digitado manualmente é auditado com precisão de segundos.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Barcode size={13} />
                        <span>{t.guidePage1Card1Category || 'Bip Automático'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage1Card1Title || 'Scanner Ótico USB'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage1Card1Desc || 'Identifica produtos instantaneamente. Regista o código exato lido, hora da leitura e quantidade adicionada ao carrinho.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Receipt size={13} />
                        <span>{t.guidePage1Card2Category || 'Vendas & Transações'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage1Card2Title || 'Associação de Recibos'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage1Card2Desc || 'Associa cada leitura ao operador de caixa responsável e à respetiva venda finalizada no terminal POS.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <Search size={13} />
                        <span>{t.guidePage1Card3Category || 'Filtro de Leitura'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage1Card3Title || 'Sucesso vs Falha'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage1Card3Desc || 'Ajuda a detetar códigos não cadastrados ou tentativas de leitura rejeitadas para auditoria de catálogo.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 2: Saldo Físico & Métodos de Pagamento */}
              {currentPage === 2 && (
                <motion.div
                  key="page-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <Calculator size={16} />
                    <span>{t.guidePage2Title || '2. Saldo Físico do Gaveteiro & Métodos de Pagamento'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage2Desc || 'O sistema separa rigorosamente o que entrou em dinheiro vivo (gaveteiro) das transações eletrónicas e a prazo.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Coins size={13} />
                        <span>{t.guidePage2Card1Category || 'Saldo Físico (Gaveta)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage2Card1Title || 'Dinheiro DIN - Saídas'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage2Card1Desc || 'Fórmula: DIN (Numerário) - Saídas. É exatamente o valor monetário que deve constar fisicamente na gaveta.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <Smartphone size={13} />
                        <span>{t.guidePage2Card2Category || 'M-Pesa & E-Mola'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage2Card2Title || 'Carteiras Móveis'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage2Card2Desc || 'Pagamentos móveis são creditados na conta digital da loja e não interferem na conferência do dinheiro físico.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-black text-xs">
                        <Receipt size={13} />
                        <span>{t.guidePage2Card3Category || 'Vendas Fiado / Conta'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage2Card3Title || 'Crédito a Clientes'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage2Card3Desc || 'Contabilizado nas estatísticas de vendas, mas segregado do valor de liquidação imediata da gaveta.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 3: Saídas de Caixa & Arquitetura Offline */}
              {currentPage === 3 && (
                <motion.div
                  key="page-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm pb-1 border-b border-slate-100 dark:border-zinc-800">
                    <TrendingDown size={16} />
                    <span>{t.guidePage3Title || '3. Saídas de Caixa (Sangrias) & SQLite Offline'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                    {t.guidePage3Desc || 'Transparência total em despesas operacionais e armazenamento 100% offline garantido no SQLite local.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black text-xs">
                        <ArrowUpRight size={13} />
                        <span>{t.guidePage3Card1Category || 'Saídas de Caixa'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage3Card1Title || 'Sangrias & Despesas'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage3Card1Desc || 'Registo de retiradas com motivo (fornecedores, trocos, despesas miúdas), abatendo diretamente do saldo em dinheiro.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <Database size={13} />
                        <span>{t.guidePage3Card2Category || 'SQLite Offline-First'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage3Card2Title || 'Resiliência Total'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage3Card2Desc || 'Todas as leituras e transações são gravadas instantaneamente no banco de dados local. Nenhuma leitura é perdida sem internet.'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                        <ShieldCheck size={13} />
                        <span>{t.guidePage3Card3Category || 'Sincronização em Nuvem'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        {t.guidePage3Card3Title || 'Backup em Segundo Plano'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        {t.guidePage3Card3Desc || 'Assim que a conectividade estiver estável, o motor de sincronização envia os lotes para o Supabase sem travar o POS.'}
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
