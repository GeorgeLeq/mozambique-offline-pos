import React from 'react';
import { Wallet, Smartphone, HelpCircle } from 'lucide-react';

interface ReversalStepProps {
  refundItem: any;
  authorizedManager: any;
  itemCondition: 'shelf' | 'damaged' | null;
  refundMethod: string;
  handleFinalizeRefund: () => void;
  setWizardStep: (step: 'pin' | 'condition' | 'reversal') => void;
}

export const ReversalStep: React.FC<ReversalStepProps> = ({
  refundItem,
  authorizedManager,
  itemCondition,
  refundMethod,
  handleFinalizeRefund,
  setWizardStep,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1 text-center">
        <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-zinc-550 uppercase bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 rounded-lg font-mono">
          Método Original: {refundItem?.payment_method?.toUpperCase()}
        </span>
        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 pt-3">
          Instruções de Reembolso
        </h4>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          Como o reembolso deve ser processado:
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10 flex flex-col items-center gap-3 text-center">
        {(refundMethod === 'cash' || (refundMethod === 'any' && refundItem?.payment_method === 'cash') || (refundMethod === 'original' && refundItem?.payment_method === 'cash')) ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <Wallet size={24} />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-400 dark:text-zinc-505 uppercase">Devolver da Gaveta</span>
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(refundItem?.total_mt)}
              </span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Retire o valor físico acima directamente da gaveta e entregue ao cliente de imediato.
              </p>
              {refundMethod === 'cash' && refundItem?.payment_method !== 'cash' && (
                <p className="text-[10px] font-bold text-indigo-500 mt-1.5">
                  * Nota: Estornado em Dinheiro devido à política local de reembolso.
                </p>
              )}
            </div>
          </>
        ) : (refundMethod === 'original' || refundMethod === 'any') && refundItem?.payment_method === 'mpesa' ? (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center animate-bounce">
              <Smartphone size={24} />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-400 dark:text-zinc-505 uppercase">Reembolso M-Pesa</span>
              <span className="block text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(refundItem?.total_mt)}
              </span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                <strong>Aviso de Segurança:</strong> O Gerente {authorizedManager?.name} deve fazer o envio digital via M-Pesa deste valor. O caixa não possui acesso aos fundos digitais.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-pulse">
              <HelpCircle size={24} />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-400 dark:text-zinc-550 uppercase">Ajuste de Conta</span>
              <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(refundItem?.total_mt)}
              </span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                O saldo pendente deste cliente fiado foi atualizado no sistema local para descontar esta devolução.
              </p>
            </div>
          </>
        )}
      </div>

      {refundMethod !== 'any' && (
        <div className="px-3 py-2 bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            🛡️ Regra da Loja: {
              refundMethod === 'original' 
                ? 'Estorno obrigatório no método de pagamento original'
                : 'Todos os reembolsos são liquidados em Dinheiro Físico'
            }
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setWizardStep('condition')}
          className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-colors active:scale-95 border border-slate-100 dark:border-zinc-800/40 cursor-pointer"
        >
          Voltar
        </button>
        <button
          onClick={handleFinalizeRefund}
          className="flex-[2] py-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer"
          id="finalize-refund-btn"
        >
          Concluir Reembolso
        </button>
      </div>
    </div>
  );
};
