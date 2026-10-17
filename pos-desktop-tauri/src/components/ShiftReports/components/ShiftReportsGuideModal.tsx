import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  X, 
  FileText, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wallet, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { useShiftReportsI18n } from '../../../i18n';

interface ShiftReportsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export function ShiftReportsGuideModal({ isOpen, onClose, initialTab }: ShiftReportsGuideModalProps) {
  const t = useShiftReportsI18n();
  const [activeTopic, setActiveTopic] = useState<string>('total');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTopic(initialTab);
      } else {
        setActiveTopic('total');
      }
      const isHidden = localStorage.getItem('hide_shift_reports_guide') === 'true';
      setDontShowAgain(isHidden);
    }
  }, [isOpen, initialTab]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_shift_reports_guide', 'true');
    } else {
      localStorage.removeItem('hide_shift_reports_guide');
    }
    onClose();
  };

  if (!isOpen) return null;

  const topics = [
    {
      id: 'total',
      label: t.tabTotalShifts || 'Total de Turnos',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10'
    },
    {
      id: 'expected',
      label: t.tabExpected || 'Esperado Sistema',
      icon: Calculator,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      id: 'reported',
      label: t.tabReported || 'Contado em Caixa',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      id: 'difference',
      label: t.tabDifference || 'Diferença (Quebra/Sobra)',
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10'
    },
    {
      id: 'counting',
      label: t.tabCounting || 'Contando (Turnos Ativos)',
      icon: Clock,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-500/10'
    },
    {
      id: 'base_cash',
      label: t.tabBaseCash || 'Fundo Base (Maneio)',
      icon: Wallet,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10'
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100">
                {t.guideModalTitle || 'Guia dos Indicadores de Turno'}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {t.guideModalSubtitle || 'Entenda o cálculo, auditoria e fluxo de caixa de Moçambique'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            title={t.guideCloseBtn || 'Fechar guia'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Topic Pills */}
        <div className="py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {topics.map((tItem) => {
            const Icon = tItem.icon;
            const isSelected = activeTopic === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => setActiveTopic(tItem.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon size={13} />
                <span>{tItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Content Body */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-zinc-300">
          {activeTopic === 'total' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-sm mb-1.5 flex items-center gap-2">
                  <FileText size={16} /> {t.guideTotalTitle || 'O que representa o "Total de Turnos"?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideTotalDesc || 'Mostra a quantidade total de turnos encerrados e auditados registados no sistema.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="font-black text-emerald-800 dark:text-emerald-400 block text-xs mb-1">
                    {t.guideOkTitle || 'Sem Quebras (OK)'}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    {t.guideOkDesc || 'O dinheiro contado fisicamente bateu 100% com o calculado pelo sistema (Diferença = 0,00 MT).'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="font-black text-rose-800 dark:text-rose-400 block text-xs mb-1">
                    {t.guideShortageTitle || 'Com Quebra'}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    {t.guideShortageDesc || 'Faltou dinheiro no caixa em relação ao esperado (Diferença < 0 MT).'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <span className="font-black text-amber-800 dark:text-amber-400 block text-xs mb-1">
                    {t.guideSurplusTitle || 'Com Sobra'}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    {t.guideSurplusDesc || 'Houve mais dinheiro físico na gaveta do que o esperado (Diferença > 0 MT).'}
                  </p>
                </div>
              </div>

              <div className="text-[11.5px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                💡 <strong>{t.guideAuditTip || 'Dica de Auditoria: Use o botão Arquivo (Nuvem) no topo para consultar turnos anteriores a 30 dias sincronizados com o Supabase.'}</strong>
              </div>
            </motion.div>
          )}

          {activeTopic === 'expected' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm mb-1.5 flex items-center gap-2">
                  <Calculator size={16} /> {t.guideExpectedTitle || 'Como é calculado o "Esperado Pelo Sistema"?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideExpectedDesc || 'O valor esperado é calculado com base estrita no dinheiro físico (espécie) que deveria estar fisicamente presente na gaveta do caixa.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5">
                <div className="text-indigo-400 font-bold">{t.guideFormulaLabel || 'Fórmula Matemática do Caixa:'}</div>
                <div className="text-white font-bold text-sm">
                  {t.guideFormulaEquation || 'Esperado = Fundo Base + Vendas Dinheiro - Saídas/Sangrias'}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>{t.guideFloatNote || 'Fundo de Maneio: O troco inicial com o qual o operador abriu o caixa.'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p>{t.guideCashNote || 'Vendas em Dinheiro: Apenas os valores recebidos em cédulas e moedas.'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <p>{t.guidePayoutsNote || 'Saídas de Gaveta (Sangrias): Pagamentos a fornecedores ou retiradas registadas pelo operador.'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p>{t.guideDigitalNote || 'M-Pesa e e-Mola: Pagamentos digitais vão diretamente para a carteira móvel e não aumentam o dinheiro físico da gaveta.'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTopic === 'reported' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <h4 className="font-black text-emerald-900 dark:text-emerald-300 text-sm mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t.guideReportedTitle || 'O que é o "Contado em Caixa" (Fecho Cego)?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideReportedDesc || 'É a soma física de todas as cédulas e moedas declaradas pelo operador no momento em que ele clica em Encerrar Turno.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                <h5 className="font-bold text-slate-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {t.guideBlindCloseTitle || 'Por que usamos o procedimento de Fecho Cego?'}
                </h5>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  {t.guideBlindCloseDesc || 'O operador nunca visualiza o valor esperado pelo sistema antes de digitar quanto dinheiro tem nas mãos. Isso impede que o operador ajuste valores fictícios ou retire excedentes sem registo.'}
                </p>
              </div>

              <div className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                {t.guideImmutableNote || 'O valor declarado é registado de forma imutável com data, hora e assinatura eletrónica do operador.'}
              </div>
            </motion.div>
          )}

          {activeTopic === 'difference' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                <h4 className="font-black text-rose-900 dark:text-rose-300 text-sm mb-1.5 flex items-center gap-2">
                  <AlertTriangle size={16} /> {t.guideDiffTitle || 'Como auditar a "Diferença Total"?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideDiffDesc || 'A diferença indica a conformidade entre o que a loja vendeu e o dinheiro físico que entrou no cofre:'}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5">
                  <TrendingDown size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-rose-800 dark:text-rose-400 text-xs block">
                      {t.guideShortageItemTitle || 'Quebra de Caixa (Valor Negativo: -MT)'}
                    </span>
                    <p className="text-[11.5px] text-slate-600 dark:text-zinc-400 mt-0.5">
                      {t.guideShortageItemDesc || 'Falta de dinheiro. Causas comuns: troco errado entregue ao cliente, sangria não registada no POS ou desvio de fundos.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                  <TrendingUp size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-amber-800 dark:text-amber-400 text-xs block">
                      {t.guideSurplusItemTitle || 'Sobra de Caixa (Valor Positivo: +MT)'}
                    </span>
                    <p className="text-[11.5px] text-slate-600 dark:text-zinc-400 mt-0.5">
                      {t.guideSurplusItemDesc || 'Excesso de dinheiro. Causas comuns: troco esquecido pelo cliente ou venda cobrada sem ser registada no sistema.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-emerald-800 dark:text-emerald-400 text-xs block">
                      {t.guideBalancedItemTitle || 'Caixa Equilibrado (0,00 MT)'}
                    </span>
                    <p className="text-[11.5px] text-slate-600 dark:text-zinc-400 mt-0.5">
                      {t.guideBalancedItemDesc || 'Balanço perfeito. Não há quebras nem sobras no período auditado.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTopic === 'counting' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40">
                <h4 className="font-black text-teal-900 dark:text-teal-300 text-sm mb-1.5 flex items-center gap-2">
                  <Clock size={16} /> {t.guideCountingTitle || 'O que significa "Contando (Turnos Ativos)"?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideCountingDesc || 'Indica a quantidade de operadores que estão atualmente com o caixa aberto e em operação na loja neste instante.'}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/70">
                  <strong className="text-slate-800 dark:text-zinc-200 block mb-1">
                    {t.guideRealtimeFlowTitle || 'Fluxo em Tempo Real:'}
                  </strong>
                  {t.guideRealtimeFlowDesc || 'Enquanto o operador está logado e atendendo clientes, o turno está em estado "open" (em andamento). As vendas acumulam em SQLite instantaneamente.'}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/70">
                  <strong className="text-slate-800 dark:text-zinc-200 block mb-1">
                    {t.guideClosingFlowTitle || 'Encerramento do Turno:'}
                  </strong>
                  {t.guideClosingFlowDesc || 'Assim que o operador faz logout ou encerra o expediente, o turno é finalizado e passa imediatamente a constar na tabela de relatórios.'}
                </div>
              </div>
            </motion.div>
          )}

          {activeTopic === 'base_cash' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <h4 className="font-black text-purple-900 dark:text-purple-300 text-sm mb-1.5 flex items-center gap-2">
                  <Wallet size={16} /> {t.guideBaseCashTitle || 'O que é o "Fundo Base" (Fundo de Maneio)?'}
                </h4>
                <p className="leading-relaxed">
                  {t.guideBaseCashDesc || 'É a quantia padrão em Meticais (MT) disponibilizada a cada operador na abertura do caixa para troco e operações iniciais do dia.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                <h5 className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                  {t.guideGlobalConfigTitle || 'Configuração Global:'}
                </h5>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  {t.guideGlobalConfigDesc || 'Ao atualizar o Fundo Base neste cartão, o novo valor será aplicado como padrão aos próximos turnos abertos pelos operadores da loja.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 bg-transparent"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              {t.dontShowAgain || 'Não mostrar novamente'}
            </span>
          </label>

          <button
            onClick={handleClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {t.understoodClose || 'Compreendido'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
