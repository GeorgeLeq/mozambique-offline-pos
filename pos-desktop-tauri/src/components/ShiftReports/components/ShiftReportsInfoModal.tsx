import React, { useState, useEffect } from 'react';
import { Info, X, Check } from 'lucide-react';

export function ShiftReportsInfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pos_shift_reports_info_dismissed');
    if (dismissed === 'true') {
      setIsOpen(false);
    }
  }, []);

  const handleToggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('pos_shift_reports_info_dismissed', 'true');
    }
    setIsOpen(false);
  };

  const isDismissed = localStorage.getItem('pos_shift_reports_info_dismissed') === 'true';

  if (isDismissed && !isOpen) {
    return (
      <button
        onClick={handleToggleModal}
        className="fixed bottom-6 left-6 z-30 p-3 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md hover:bg-white text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg border border-slate-200/80 dark:border-zinc-800 transition-all flex items-center gap-2 px-4 text-xs font-bold"
        title="Ajuda sobre Turnos e Quebras"
      >
        <Info size={16} /> Guia Rápido ℹ️
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleToggleModal}
        className="fixed bottom-6 left-6 z-30 p-3 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md hover:bg-white text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg border border-slate-200/80 dark:border-zinc-800 transition-all flex items-center gap-2 px-4 text-xs font-bold"
        title="Ajuda sobre Turnos e Quebras"
      >
        <Info size={16} /> Guia Rápido ℹ️
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Guia do Módulo de Turnos</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Entenda como funcionam os fechos e auditoria de caixa</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-zinc-300 mb-6">
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <strong className="text-slate-900 dark:text-white block mb-1">1. Esperado pelo Sistema</strong>
                É o montante exato que deve estar no gavetão de dinheiro: <code className="text-xs bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">Fundo de Maneio + Vendas em Dinheiro - Sangrias / Saídas</code>.
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <strong className="text-slate-900 dark:text-white block mb-1">2. Contado em Caixa & Diferença (Quebra/Sobra)</strong>
                Corresponde ao dinheiro físico contado pelo operador ao fechar o turno. Se for menor que o esperado, regista-se <strong>Quebra de Caixa (-)</strong>. Se for maior, <strong>Sobra (+)</strong>.
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <strong className="text-slate-900 dark:text-white block mb-1">3. Pagamentos Digitais (M-Pesa / e-Mola / Cartão)</strong>
                Estes valores são enviados diretamente para contas móveis/bancárias e não entram no cofre físico de dinheiro em espécie.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 bg-transparent"
                />
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Não mostrar novamente</span>
              </label>

              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition-all"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
