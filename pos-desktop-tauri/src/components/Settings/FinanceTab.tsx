import React from 'react';
import { motion } from 'motion/react';
import { Wallet, ShieldAlert, Tag, Percent, Sparkles, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useSettingsI18n } from '../../i18n';

interface FinanceTabProps {
  baseCash: string;
  setBaseCash: (val: string) => void;
  openingCashMode: 'admin' | 'cashier';
  setOpeningCashMode: (val: 'admin' | 'cashier') => void;
  lowStockThreshold: string;
  setLowStockThreshold: (val: string) => void;
  taxRate: string;
  setTaxRate: (val: string) => void;
  allowNegativeStock: boolean;
  setAllowNegativeStock: (val: boolean) => void;
  blindStockMode: boolean;
  setBlindStockMode: (val: boolean) => void;
  discountPresets: string;
  setDiscountPresets: (val: string) => void;
  maxDiscountCap: string;
  setMaxDiscountCap: (val: string) => void;
  onOpenInfo?: () => void;
}

export default function FinanceTab({
  baseCash,
  setBaseCash,
  openingCashMode,
  setOpeningCashMode,
  lowStockThreshold,
  setLowStockThreshold,
  taxRate,
  setTaxRate,
  allowNegativeStock,
  setAllowNegativeStock,
  blindStockMode,
  setBlindStockMode,
  discountPresets,
  setDiscountPresets,
  maxDiscountCap,
  setMaxDiscountCap,
  onOpenInfo,
}: FinanceTabProps) {
  const t = useSettingsI18n();

  return (
    <motion.div
      key="finance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Wallet size={22} className="text-indigo-600 dark:text-indigo-400" />
            {t.tabFinance || 'Operações de Caixa & Parâmetros Financeiros'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
            {t.subtitle || 'Defina o fundo de caixa inicial, políticas de desconto, taxas de IVA e controle de stock negativo.'}
          </p>
        </div>

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            <HelpCircle size={15} className="text-indigo-500" />
            <span>{t.guideTooltip || 'Guia de Ajuda'}</span>
          </button>
        )}
      </div>

      {/* 2-Column Balanced Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
        {/* Col 1: Caixa & Stock */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Fundo de Caixa Base */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {t.defaultBaseCashLabel || 'Fundo de Caixa Padrão'}
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                {t.baseCashBadge || 'Abertura'}
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={baseCash}
              onChange={(e) => setBaseCash(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="e.g. 10000"
            />
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
              {t.baseCashHelp || 'Montante fixo em numerário disponibilizado na gaveta para trocos no início do dia.'}
            </span>
          </div>

          {/* Modo de Abertura de Caixa */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
              {t.openingCashModeLabel || 'Definição do Fundo Inicial no Turno'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOpeningCashMode('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  openingCashMode === 'admin'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t.openingCashAdmin || 'Fixo pelo Admin'}
              </button>
              <button
                type="button"
                onClick={() => setOpeningCashMode('cashier')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  openingCashMode === 'cashier'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t.openingCashCashier || 'Digitado pelo Operador'}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
              {openingCashMode === 'admin' 
                ? (t.openingCashAdminDesc || 'O operador inicia o turno com o valor pré-estabelecido sem poder alterá-lo.')
                : (t.openingCashCashierDesc || 'O operador faz a contagem manual física e declara o valor real da gaveta.')}
            </span>
          </div>

          {/* Alerta de Stock Baixo & Taxa de IVA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100">
                {t.lowStockThresholdLabel || 'Alerta de Stock Baixo'}
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
                {t.lowStockHelp || 'Dispara aviso de reposição'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100">
                {t.taxRateLabel || 'Taxa de IVA Padrão (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
                {t.taxRateHelp || 'Calculado no checkout'}
              </span>
            </div>
          </div>
        </div>

        {/* Col 2: Descontos & Políticas de Stock */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Botões Rápidos de Desconto */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {t.discountPresetsLabel || 'Atalhos Rápidos de Desconto no POS'}
              </label>
              <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                {t.commaSeparated || 'Separados por vírgula'}
              </span>
            </div>
            <input
              type="text"
              value={discountPresets}
              onChange={(e) => setDiscountPresets(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none"
              placeholder="5%,10%,15%,-50,-100"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {discountPresets.split(',').filter(Boolean).map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800/50">
                  {p.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Teto Máximo de Desconto */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
              {t.maxDiscountCapLabel || 'Limite Máximo de Desconto Permitido ao Operador (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxDiscountCap}
              onChange={(e) => setMaxDiscountCap(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 outline-none"
            />
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block">
              {t.maxDiscountHelp || 'Descontos superiores a este valor exigirão obrigatoriamente aprovação de um Gestor/Admin.'}
            </span>
          </div>

          {/* Venda com Stock Negativo Toggle */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="pr-4">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                {t.allowNegativeStockLabel || 'Permitir Vendas com Stock Negativo'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block mt-0.5">
                {t.allowNegativeStockHelp || 'Permite finalizar a venda mesmo quando o inventário no sistema é 0'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAllowNegativeStock(!allowNegativeStock)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                allowNegativeStock ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                allowNegativeStock ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
