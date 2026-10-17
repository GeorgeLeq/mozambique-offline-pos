import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  PackageCheck, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Boxes,
  Barcode,
  Layers,
  Scale,
  DollarSign,
  Edit3,
  Trash2,
  KeyRound,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface ExpectedDeliveriesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTabType = 'workflow' | 'formats' | 'actions';

export function ExpectedDeliveriesGuideModal({ isOpen, onClose }: ExpectedDeliveriesGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTabType>('workflow');
  const [neverShowAgain, setNeverShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('mozpos_hide_expected_deliveries_guide') === 'true';
  });

  if (!isOpen) return null;

  const handleClose = () => {
    if (neverShowAgain) {
      localStorage.setItem('mozpos_hide_expected_deliveries_guide', 'true');
    } else {
      localStorage.removeItem('mozpos_hide_expected_deliveries_guide');
    }
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
        <div
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>Manual de Acolhimento & Formatos</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-black tracking-wider">
                    Guia Interativo
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Aprenda como gerir encomendas, formatos de embalagens e ações operacionais.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100/70 dark:bg-zinc-950/40 border-b border-slate-200/60 dark:border-zinc-800/80 shrink-0">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border-0 ${
                activeTab === 'workflow'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <PackageCheck size={14} />
              <span>1. Fluxo de Acolhimento</span>
            </button>

            <button
              onClick={() => setActiveTab('formats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border-0 ${
                activeTab === 'formats'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Boxes size={14} />
              <span>2. Formatos & Embalagens</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border-0 ${
                activeTab === 'actions'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Sparkles size={14} />
              <span>3. Ações & Permissões</span>
            </button>
          </div>

          {/* Body Content with Scrollbar Hidden */}
          <div className="p-6 overflow-y-auto scrollbar-none space-y-4 text-slate-700 dark:text-zinc-300 text-xs flex-1">
            
            {/* TAB 1: WORKFLOW */}
            {activeTab === 'workflow' && (
              <div className="space-y-4">
                {/* Section 1: Encomendas Pendentes */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <Clock size={15} />
                    <span>1. Encomendas Pendentes (Purchase Orders)</span>
                  </div>
                  <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                    Ao emitir uma <strong>Nova Encomenda</strong>, especifica-se o número de PO, fatura/guia de remessa, fornecedor e quantidade prevista. A encomenda fica registada no estado <span className="font-bold text-amber-600 dark:text-amber-400">Pendente</span> até a mercadoria chegar fisicamente à loja.
                  </p>
                </div>

                {/* Section 2: Tranca de Verificação no Acolhimento */}
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-xs uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>2. Verificação no Acolhimento (Tranca de Segurança)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Locked Option */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Lock size={14} />
                        </div>
                        <span>🔒 Trancado (Padrão - 1 Tap)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Assume que a quantidade recebida é <strong>exatamente igual à esperada</strong>. Na receção, um único clique confirma a entrada total sem necessidade de introduzir contagens manuais.
                      </p>
                    </div>

                    {/* Unlocked Option */}
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Unlock size={14} />
                        </div>
                        <span>🔓 Destrancado (Verificação Manual)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Permite ao operador ajustar individualmente a quantidade recebida de cada item (ideal para caixas danificadas, produtos em falta ou divergências do fornecedor).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Indicadores de Estado */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider">
                    <Sparkles size={15} className="text-amber-500" />
                    <span>3. Indicadores de Estado & Cores</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="flex items-center gap-2.5 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 block text-[11px]">Recebido (Verde)</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">Stock incrementado na loja</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <span className="font-black text-rose-700 dark:text-rose-300 block text-[11px]">Divergência (Vermelho)</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">Diferença na contagem</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="font-black text-amber-700 dark:text-amber-300 block text-[11px]">Pendente (Âmbar)</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">A aguardar entrega</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Atualização Automática de Inventário */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <ArrowRight size={15} />
                    <span>4. Atualização Automática do Stock</span>
                  </div>
                  <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                    Assim que a encomenda é confirmada como <strong>Recebido</strong>, o sistema incrementa automaticamente as quantidades físicas no inventário de cada produto envolvido e gera um registo inalterável no <strong>Histórico de Acolhimento</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: FORMATS & PACKAGES */}
            {activeTab === 'formats' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <Layers size={16} />
                    <span>Tipos & Formatos de Mercadoria</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <Boxes size={14} className="text-indigo-500" />
                        <span>Unidades Avulsas (Unitário)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Contadas por número inteiro (ex: 24 garrafas, 10 cadernos). Cada bip no scanner subtrai 1 unidade.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <Scale size={14} className="text-emerald-500" />
                        <span>Fracionado (Kg / Litros)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Permite casas decimais (ex: 1.250 kg de açúcar ou 0.5L). No PDV, o operador pode vender quantidades decimais com facilidade.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <Barcode size={14} className="text-amber-500" />
                        <span>Múltiplos Códigos de Barras (Aliases)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Um único produto pode ter múltiplos códigos de barras (ex: código do fardo vs código da lata individual, ou embalagens com redesign).
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-zinc-100 text-xs">
                        <DollarSign size={14} className="text-cyan-500" />
                        <span>Margem & Custo vs Venda</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        O custo por unidade atualiza o valor total do inventário e calcula automaticamente as margens de lucro nas vendas realizadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACTIONS & PERMISSIONS */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                    <Sparkles size={16} />
                    <span>Ações Operacionais Rápidas</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <PackageCheck size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block text-xs">Acolhimento Rápido / Ver Detalhes</span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Clique em qualquer linha da tabela para abrir o modal de acolhimento. Se estiver trancado, o botão "Confirmar e Atualizar Stock" aplica a entrada imediatamente.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Edit3 size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block text-xs">Editar Encomenda Pendente</span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Permite alterar fornecedor, número de fatura e quantidades esperadas antes da chegada dos bens.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                        <Trash2 size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block text-xs">Eliminar Encomenda</span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Cancela a PO pendente. Requer confirmação para evitar perdas acidentais de registo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <RotateCcw size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 block text-xs">Auto-Restauro de Produtos Apagados</span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Se um produto na encomenda foi movido para a Lixeira, a receção da encomenda restaura o produto automaticamente de volta à Lista Ativa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer with "Never show again" Checkbox and Close */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={neverShowAgain}
                onChange={(e) => setNeverShowAgain(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
              <span>Não voltar a mostrar automaticamente</span>
            </label>

            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-0"
            >
              Compreendido
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
