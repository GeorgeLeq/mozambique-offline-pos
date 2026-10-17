import React, { useState } from 'react';
import { 
  FileText, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wallet, 
  Info, 
  Check, 
  Edit3, 
  TrendingDown, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { ShiftReportsGuideModal } from './ShiftReportsGuideModal';
import { useShiftReportsI18n } from '../../../i18n';

interface ShiftReportsSummaryCardsProps {
  totalShifts: number;
  totalExpected: number;
  totalReported: number;
  totalDifference: number;
  activeShiftsCount: number;
  baseCash: string;
  setBaseCash: (val: string) => void;
  isSavingBaseCash: boolean;
  onSaveBaseCash: () => void;
  okCount: number;
  shortageCount: number;
  surplusCount: number;
}

export function ShiftReportsSummaryCards({
  totalShifts,
  totalExpected,
  totalReported,
  totalDifference,
  activeShiftsCount,
  baseCash,
  setBaseCash,
  isSavingBaseCash,
  onSaveBaseCash,
  okCount,
  shortageCount,
  surplusCount
}: ShiftReportsSummaryCardsProps) {
  const t = useShiftReportsI18n();
  const [guideTopic, setGuideTopic] = useState<string | null>(null);
  const [isEditingBaseCash, setIsEditingBaseCash] = useState(false);
  const [tempBaseCash, setTempBaseCash] = useState(baseCash);

  const handleOpenGuide = (topic: string) => {
    setGuideTopic(topic);
  };

  const handleSaveCash = () => {
    setBaseCash(tempBaseCash);
    onSaveBaseCash();
    setIsEditingBaseCash(false);
  };

  const differenceColorClass = 
    totalDifference < 0 
      ? 'text-rose-600 dark:text-rose-400' 
      : totalDifference > 0 
      ? 'text-amber-600 dark:text-amber-400' 
      : 'text-emerald-600 dark:text-emerald-400';

  const differenceBadgeClass = 
    totalDifference < 0
      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
      : totalDifference > 0
      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60';

  return (
    <>
      {/* 6 Metric Cards Grid */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-100/50 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-white/10 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Total de Turnos */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardTotalShifts || 'Total de Turnos'}
              </span>
              <button
                type="button"
                onClick={() => handleOpenGuide('total')}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoTotalShifts || "Informações sobre Total de Turnos"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
                  {totalShifts}
                </span>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                  {totalShifts === 1 ? (t.shiftSingular || 'Turno') : (t.shiftPlural || 'Turnos')}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 truncate">
                <span className="text-emerald-600 dark:text-emerald-400">{okCount} OK</span>
                <span>•</span>
                <span className={shortageCount > 0 ? 'text-rose-600 dark:text-rose-400' : ''}>
                  {shortageCount} {t.quebrasLabel || 'Quebras'}
                </span>
                <span>•</span>
                <span className={surplusCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {surplusCount} {t.sobrasLabel || 'Sobras'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Esperado Pelo Sistema */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-blue-200 dark:hover:border-blue-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardExpectedSystem || 'Esperado Sistema'}
              </span>
              <button
                type="button"
                onClick={() => handleOpenGuide('expected')}
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoExpectedSystem || "Informações sobre Esperado Pelo Sistema"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono truncate">
                {formatCurrency(totalExpected)}
              </div>
              <div className="mt-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                <Calculator size={10} className="text-blue-500 shrink-0" />
                <span>{t.floatSalesPayouts || 'Fundo + Vendas - Saídas'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Contado em Caixa */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardCountedCash || 'Contado em Caixa'}
              </span>
              <button
                type="button"
                onClick={() => handleOpenGuide('reported')}
                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoCountedCash || "Informações sobre Contado em Caixa"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono truncate">
                {formatCurrency(totalReported)}
              </div>
              <div className="mt-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span>{t.blindCloseDeclared || 'Declarado em Fecho Cego'}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Diferença Total */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardTotalDiff || 'Diferença Total'}
              </span>
              <button
                type="button"
                onClick={() => handleOpenGuide('difference')}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoTotalDiff || "Informações sobre Diferença Total"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight font-mono truncate ${differenceColorClass}`}>
                {totalDifference > 0 ? `+${formatCurrency(totalDifference)}` : formatCurrency(totalDifference)}
              </div>
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${differenceBadgeClass}`}>
                  {totalDifference < 0 ? (
                    <>
                      <TrendingDown size={10} /> {t.shortageBadge || 'Quebra de Caixa'}
                    </>
                  ) : totalDifference > 0 ? (
                    <>
                      <TrendingUp size={10} /> {t.surplusBadge || 'Sobra de Caixa'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={10} /> {t.balancedBadge || 'Equilibrado'}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Contando (Turnos Ativos) */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-teal-200 dark:hover:border-teal-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {activeShiftsCount > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${activeShiftsCount > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`}></span>
                </span>
                {t.cardCounting || 'Contando'}
              </span>
              <button
                type="button"
                onClick={() => handleOpenGuide('counting')}
                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t.infoCounting || "Informações sobre Turnos em Contagem/Abertos"}
              >
                <Info size={13} />
              </button>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono">
                  {activeShiftsCount}
                </span>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                  {activeShiftsCount === 1 ? (t.activeSingular || 'Ativo') : (t.activePlural || 'Ativos')}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                <Clock size={10} className="text-teal-500 shrink-0" />
                <span>{activeShiftsCount > 0 ? (t.inOperationNow || 'Em operação agora') : (t.noneOpen || 'Nenhum aberto')}</span>
              </div>
            </div>
          </div>

          {/* Card 6: Fundo Base (Maneio) */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col justify-between relative group hover:border-purple-200 dark:hover:border-purple-900/60 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {t.cardBaseCash || 'Fundo Base'}
              </span>
              <div className="flex items-center gap-0.5">
                {!isEditingBaseCash && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempBaseCash(baseCash);
                      setIsEditingBaseCash(true);
                    }}
                    className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title={t.editBaseCashTooltip || "Editar Fundo Base"}
                  >
                    <Edit3 size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenGuide('base_cash')}
                  className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={t.infoBaseCash || "Informações sobre Fundo Base"}
                >
                  <Info size={13} />
                </button>
              </div>
            </div>
            <div>
              {isEditingBaseCash ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={tempBaseCash}
                    onChange={(e) => setTempBaseCash(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-purple-400 dark:border-purple-500 text-xs font-black text-slate-900 dark:text-white outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveCash}
                    disabled={isSavingBaseCash}
                    className="p-1 rounded bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors shrink-0 shadow-2xs"
                    title={t.saveBaseCashTooltip || "Gravar fundo base"}
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setTempBaseCash(baseCash);
                    setIsEditingBaseCash(true);
                  }}
                  className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100 font-mono truncate cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title={t.clickToEdit || "Clique para editar"}
                >
                  {parseFloat(baseCash || '0').toLocaleString('pt-MZ')} MT
                </div>
              )}
              <div className="mt-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                <Wallet size={10} className="text-purple-500 shrink-0" />
                <span>{t.standardFloatNote || 'Troco Inicial Padrão'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Info Guide Modal */}
      <ShiftReportsGuideModal
        isOpen={!!guideTopic}
        onClose={() => setGuideTopic(null)}
        initialTab={guideTopic || 'total'}
      />
    </>
  );
}
