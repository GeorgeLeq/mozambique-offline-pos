import React, { useState } from 'react';
import { Package, Scale, Layers, Check, X } from 'lucide-react';
import { OrderItemPackaging, RESTOCK_PACK_TYPES, RESTOCK_BULK_METRICS } from '../NewOrder/packagingTypes';
import { useI18n } from '../../../i18n';

interface ItemPackagingConfigModalProps {
  productName: string;
  currentExpectedQty: number;
  initialPackaging?: OrderItemPackaging;
  onSave: (packaging: OrderItemPackaging, calculatedQty: number) => void;
  onClose: () => void;
}

export function ItemPackagingConfigModal({
  productName,
  currentExpectedQty,
  initialPackaging,
  onSave,
  onClose,
}: ItemPackagingConfigModalProps) {
  const t = useI18n();
  const [mode, setMode] = useState<'unit' | 'pack' | 'bulk'>(initialPackaging?.mode || 'unit');
  
  // Pack state
  const [packType, setPackType] = useState<'pack' | 'box' | 'bundle' | 'crate' | 'other'>(
    initialPackaging?.packType || 'box'
  );
  const [unitsPerPack, setUnitsPerPack] = useState<string>(
    initialPackaging?.unitsPerPack ? String(initialPackaging.unitsPerPack) : '24'
  );
  const [totalPacks, setTotalPacks] = useState<string>(
    initialPackaging?.totalPacks ? String(initialPackaging.totalPacks) : '10'
  );

  // Bulk state
  const [bulkMetric, setBulkMetric] = useState<'kg' | 'g' | 'l' | 'ml'>(
    initialPackaging?.bulkMetric || 'kg'
  );
  const [bulkUnitSize, setBulkUnitSize] = useState<string>(
    initialPackaging?.bulkUnitSize ? String(initialPackaging.bulkUnitSize) : '25'
  );
  const [totalBulkPackages, setTotalBulkPackages] = useState<string>(
    initialPackaging?.totalBulkPackages ? String(initialPackaging.totalBulkPackages) : '10'
  );

  // Unit direct state
  const [unitQty, setUnitQty] = useState<string>(String(currentExpectedQty || 1));

  // Compute calculated values
  const computedPackTotal = (parseInt(totalPacks, 10) || 1) * (parseInt(unitsPerPack, 10) || 24);
  const computedBulkTotal = (parseFloat(totalBulkPackages) || 1) * (parseFloat(bulkUnitSize) || 25);
  const computedUnitTotal = parseFloat(unitQty) || 1;

  const handleApply = () => {
    if (mode === 'unit') {
      onSave({ mode: 'unit' }, computedUnitTotal);
    } else if (mode === 'pack') {
      onSave({
        mode: 'pack',
        packType,
        unitsPerPack: parseInt(unitsPerPack, 10) || 24,
        totalPacks: parseInt(totalPacks, 10) || 1,
      }, computedPackTotal);
    } else {
      onSave({
        mode: 'bulk',
        bulkMetric,
        bulkUnitSize: parseFloat(bulkUnitSize) || 25,
        totalBulkPackages: parseFloat(totalBulkPackages) || 1,
      }, computedBulkTotal);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t.addPackagingItem || 'Formato de Receção & Embalagem'}
            </span>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate">
              {productName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('unit')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'unit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers size={13} />
            <span>{t.unitsTab || 'Unidades'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('pack')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'pack'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Package size={13} />
            <span>{t.packBoxTab || 'Pack / Caixa'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'bulk'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Scale size={13} />
            <span>{t.bulkTab || 'Granel'}</span>
          </button>
        </div>

        {/* Form Body based on Mode */}
        {mode === 'unit' && (
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {t.looseQtyPlaceholder || 'Quantidade de Unidades Avulsas'}
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              value={unitQty}
              onChange={(e) => setUnitQty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        {mode === 'pack' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.type || 'Tipo'}
                </label>
                <select
                  value={packType}
                  onChange={(e) => {
                    const newT = e.target.value as any;
                    setPackType(newT);
                    const defUnits = RESTOCK_PACK_TYPES.find(t => t.id === newT)?.defaultUnits || 24;
                    setUnitsPerPack(String(defUnits));
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-zinc-100"
                >
                  {RESTOCK_PACK_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.unitsPerPack || 'Un/Emb.'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitsPerPack}
                  onChange={(e) => setUnitsPerPack(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.packsQty || 'Qtd. Emb.'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalPacks}
                  onChange={(e) => setTotalPacks(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package size={14} className="text-indigo-600" />
                <span>{t.totalCalculated || 'Total Calculado:'}</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                {computedPackTotal} un
              </span>
            </div>
          </div>
        )}

        {mode === 'bulk' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.metric || 'Métrica'}
                </label>
                <select
                  value={bulkMetric}
                  onChange={(e) => {
                    const newM = e.target.value as any;
                    setBulkMetric(newM);
                    const defSize = RESTOCK_BULK_METRICS.find(m => m.id === newM)?.defaultPackage || 25;
                    setBulkUnitSize(String(defSize));
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-zinc-100"
                >
                  {RESTOCK_BULK_METRICS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.packageSize || 'Tam.'} ({bulkMetric})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={bulkUnitSize}
                  onChange={(e) => setBulkUnitSize(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t.sacksQty || 'Qtd. Sacos'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalBulkPackages}
                  onChange={(e) => setTotalBulkPackages(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold font-mono outline-none text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale size={14} className="text-indigo-600" />
                <span>{t.totalCalculated || 'Total Calculado:'}</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                {computedBulkTotal} {bulkMetric}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
          >
            {t.cancel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Check size={14} />
            <span>{t.applyFormat || 'Aplicar Formato'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
