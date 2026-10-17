import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Trash2, RotateCcw, FileSpreadsheet, ShieldCheck, Clock, Download, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n';

interface HistoryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryGuideModal({ isOpen, onClose }: HistoryGuideModalProps) {
  const t = useI18n();
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
        <div
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                  <span>{t.guideTitle || 'Guia do Histórico, Lixeira & Auditoria'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-black tracking-wider">
                    {t.auditPOSBadge || 'Auditoria POS'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {t.guideSubtitle || 'Manual de rastreio de entradas, retenção de 30-90 dias, backups CSV/PDF e segurança.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={t.cancel || "Fechar"}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content with Scrollbar Hidden */}
          <div className="p-6 overflow-y-auto scrollbar-none space-y-6 text-slate-700 dark:text-zinc-300 text-xs flex-1">
            
            {/* Section 1: Histórico de Receção */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                <History size={15} />
                <span>{t.guideSection1Title || '1. Rastreio & Auditoria de Entradas de Stock'}</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                {t.guideSection1Desc || 'Cada confirmação de mercadoria no restoque gera um registo inalterável na base de dados SQLite local. O registo grava a fatura/guia de remessa, fornecedor, nome do operador e o timestamp exato, permitindo auditorias fiscais e inventariação precisa.'}
              </p>
            </div>

            {/* Section 2: Lixeira & Retenção de 30 a 90 Dias */}
            <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                <Clock size={16} />
                <span>{t.guideSection2Title || '2. Política de Retenção de 30 a 90 Dias (Saúde da Base de Dados)'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-zinc-100 text-xs">
                    <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Trash2 size={14} />
                    </div>
                    <span>{t.guideSection2SoftDelete || 'Eliminação Segura (Soft-Delete)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                    {t.guideSection2SoftDeleteDesc || 'Produtos eliminados saem do catálogo de vendas imediatamente, mas ficam guardados na lixeira para evitar perdas acidentais de dados.'}
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-zinc-100 text-xs">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={14} />
                    </div>
                    <span>{t.guideSection2AutoPurge || 'Purga Automática & Performance'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                    {t.guideSection2AutoPurgeDesc || 'Decorrido o período de retenção selecionado (30, 60 ou 90 dias), o sistema purga os itens antigos para manter a base de dados SQLite rápida e leve.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Restauro Rápido (1-Tap) */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                <RotateCcw size={15} />
                <span>{t.guideSection3Title || '3. Restauro Rápido a 1-Tap'}</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                {t.guideSection3Desc || 'Qualquer produto na lixeira pode ser devolvido à circulação ativa imediatamente com o botão Restaurar, mantendo as embalagens métricas, custos e histórico de preços associados.'}
              </p>
            </div>

            {/* Section 4: Exportação & Backups (CSV / PDF) */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                <FileSpreadsheet size={15} />
                <span>{t.guideSection4Title || '4. Exportação para CSV & Relatório Impresso / PDF'}</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                {t.guideSection4Desc || 'Utilize o botão Exportar CSV para transferir os registos para folha de cálculo Excel, ou Imprimir / PDF para gerar uma folha de arquivo oficial antes de limpezas definitivas.'}
              </p>
            </div>

            {/* Section 5: Permissões de Operador (PIN Próprio) */}
            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-xs uppercase tracking-wider">
                <ShieldCheck size={15} />
                <span>{t.guideSection5Title || '5. Permissões de Acesso por Operador'}</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                {t.guideSection5Desc || 'O Administrador pode conceder a permissão "Histórico & Lixeira" a operadores ou encarregados de armazém. Ao aceder, o operador utiliza o seu próprio PIN pessoal sem necessitar de partilhar credenciais de administração master.'}
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-0"
            >
              {t.understand || 'Compreendido'}
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
