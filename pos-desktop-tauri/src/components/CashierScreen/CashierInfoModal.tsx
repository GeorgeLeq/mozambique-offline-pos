import React, { useState, useEffect } from 'react';
import { X, Info, Scan, Pause, Wallet, ArrowLeftRight, Receipt, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';

interface CashierInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashierInfoModal({ isOpen, onClose }: CashierInfoModalProps) {
  const { pos: t, common: commonT } = useI18n();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pos_cashier_info_dismissed');
    if (dismissed === 'true') {
      setDontShowAgain(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('pos_cashier_info_dismissed', 'true');
    } else {
      localStorage.removeItem('pos_cashier_info_dismissed');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t.cashierGuideTitle || 'Guia Operacional do Caixa PDV'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t.cashierGuideSubtitle || 'Instruções de atendimento, pagamentos, saídas de caixa e fecho de turno'}
            </p>
          </div>
        </div>

        {/* Scrollable Content Cards */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-slate-700 dark:text-zinc-300 text-xs">
          {/* Card 1: Scanner e Pesquisa Rápida */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <Scan size={15} />
              <span>{t.guideScannerTitle || 'Leitor de Código de Barras & Atalhos'}</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t.guideScannerDesc || 'O leitor USB/Bluetooth funciona diretamente sem precisar clicar em nenhum campo de texto. Para produtos sem código, use a barra de pesquisa rápida ou os botões de categorias no ecrã.'}
            </p>
          </div>

          {/* Card 2: Suspensão de Carrinhos */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <Pause size={15} />
              <span>{t.guideSuspendTitle || 'Suspender & Retomar Vendas (Fila Rápida)'}</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t.guideSuspendDesc || 'Se um cliente esquecer a carteira ou precisar buscar outro produto, clique em Suspender para guardar os itens e atender o cliente seguinte. Em seguida, clique em Retomar para recuperar a venda com um clique.'}
            </p>
          </div>

          {/* Card 3: Métodos de Pagamento em Moçambique */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              <Receipt size={15} />
              <span>{t.guidePaymentTitle || 'Pagamentos: Dinheiro, M-Pesa, E-Mola, POS e Fiados'}</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t.guidePaymentDesc || 'O sistema calcula automaticamente o troco exato para pagamentos a dinheiro. Suporta pagamentos mistos (ex: metade em dinheiro e metade por M-Pesa/E-Mola) e registo de Fiados vinculados a contas correntes de clientes cadastrados.'}
            </p>
          </div>

          {/* Card 4: Saídas de Caixa (Sangrias) */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 mb-1">
              <Wallet size={15} />
              <span>{t.guidePayoutTitle || 'Saídas de Caixa / Sangrias Autorizadas'}</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t.guidePayoutDesc || 'Qualquer retirada de dinheiro para pequenas despesas locais (pão, transporte, fornecedor urgente) deve ser registada no botão Saída Caixa. Isso mantém o valor esperado do fecho perfeitamente sincronizado.'}
            </p>
          </div>

          {/* Card 5: Devoluções e Fecho de Turno */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-cyan-600 dark:text-cyan-400 mb-1">
              <ShieldCheck size={15} />
              <span>{t.guideCloseTitle || 'Devoluções & Conferência de Fecho de Turno'}</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t.guideCloseDesc || 'As devoluções registam a devolução do item ao stock com comprovativo impresso. No final do dia, conte e introduza os valores físicos apurados em dinheiro para emitir o resumo do turno e encerrar a sua sessão com segurança.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={14} />
            {t.understood || 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
