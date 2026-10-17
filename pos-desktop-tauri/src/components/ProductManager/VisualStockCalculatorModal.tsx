import React, { useState, useEffect } from 'react';
import { Product } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, Package, Check, Lock, Unlock, AlertCircle } from 'lucide-react';
import { getDB } from '../../lib/db';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import { VisualStockCalculator } from './ProductForm/VisualStockCalculator';
import { getExpectedDeliveryInfoForProduct, ExpectedDeliveryProductInfo } from './utils/deliveryInfo';
import { parseProductMetric } from '../../lib/utils/productMetric';

interface VisualStockCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function VisualStockCalculatorModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: VisualStockCalculatorModalProps) {
  const { currentUser } = useAuth();
  const [deliveryInfo, setDeliveryInfo] = useState<ExpectedDeliveryProductInfo | null>(null);
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false);
  const [stockOperation, setStockOperation] = useState<'replace' | 'add'>('replace');
  const [unlockProduct, setUnlockProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [lastMetadata, setLastMetadata] = useState<{ packs: number; unitsPerPack: number; packType: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !product) {
      setDeliveryInfo(null);
      setCalculatedTotal(0);
      setLastMetadata(null);
      return;
    }

    let isMounted = true;
    const fetchDeliveryInfo = async () => {
      setIsLoadingDelivery(true);
      try {
        const info = await getExpectedDeliveryInfoForProduct(product.id);
        if (isMounted) {
          setDeliveryInfo(info);
          if (info && info.expectedQuantity > 0) {
            setCalculatedTotal(info.expectedQuantity);
          }
        }
      } catch (e) {
        console.warn('Could not fetch expected delivery for modal', e);
      } finally {
        if (isMounted) setIsLoadingDelivery(false);
      }
    };

    fetchDeliveryInfo();
    return () => { isMounted = false; };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock_quantity) || 0;
  const isLocked = Boolean(product.requires_verification);
  const parsedMetric = parseProductMetric(product.attributes, product.is_fractional);
  const unitLabel = product.is_fractional ? parsedMetric.unitMetric || 'kg' : 'unidades';

  const handleApplyCalculated = (totalUnits: number, metadata: { packs: number; unitsPerPack: number; packType: string }) => {
    setCalculatedTotal(totalUnits);
    setLastMetadata(metadata);
  };

  const handleConfirmStockEntry = async () => {
    if (calculatedTotal <= 0) {
      toast.error('A quantidade calculada deve ser superior a zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const db = await getDB();
      const finalStock = stockOperation === 'add' ? currentStock + calculatedTotal : calculatedTotal;
      const shouldUnlock = isLocked && unlockProduct;

      await db.execute(
        'UPDATE products SET stock_quantity = ?, requires_verification = ?, sync_status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [finalStock, shouldUnlock ? 0 : (isLocked ? 1 : 0), product.id]
      );

      // Audit logging
      const opDesc = stockOperation === 'add'
        ? `Adicionadas ${calculatedTotal} ${unitLabel} (de ${currentStock} para ${finalStock})`
        : `Definido stock exato de ${finalStock} ${unitLabel}`;
      
      const detailsMsg = lastMetadata
        ? `${opDesc} via Calculadora (${lastMetadata.packs} ${lastMetadata.packType}s x ${lastMetadata.unitsPerPack} un)`
        : `${opDesc} via Calculadora Visual`;

      await logAudit(
        currentUser?.id,
        'STOCK_ADJUSTMENT',
        `Entrada de Stock para "${product.name}": ${detailsMsg}${shouldUnlock ? ' [Desbloqueado para venda]' : ''}`
      );

      // Trigger cloud sync in background
      try {
        const { syncProductsToCloud } = await import('../../lib/syncEngine/products');
        syncProductsToCloud();
      } catch (syncErr) {
        console.warn('Sync products background call failed', syncErr);
      }

      toast.success(`Stock de "${product.name}" atualizado para ${finalStock} ${unitLabel}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update stock via calculator', err);
      toast.error('Erro ao guardar entrada de stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultingStock = stockOperation === 'add' 
    ? currentStock + calculatedTotal 
    : calculatedTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Calculator size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                  Entrada de Stock: {product.name}
                </h3>
                {isLocked && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-500/20 flex items-center gap-1">
                    <Lock size={10} />
                    Requer Verificação
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
                Stock Atual: <strong className="text-slate-800 dark:text-zinc-200">{currentStock} {unitLabel}</strong>
                {product.barcode ? ` • Barcode: ${product.barcode}` : ''}
                {product.price_mt ? ` • PVP: ${product.price_mt.toFixed(2)} MT` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Operation Selector */}
          <div className="p-3 bg-slate-100/80 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-slate-700 dark:text-zinc-300">
              Modo de Atualização:
            </span>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="stockOp"
                  checked={stockOperation === 'replace'}
                  onChange={() => setStockOperation('replace')}
                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  Definir Novo Stock
                </span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer ml-2">
                <input
                  type="radio"
                  name="stockOp"
                  checked={stockOperation === 'add'}
                  onChange={() => setStockOperation('add')}
                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  Somar ao Stock Atual (+{currentStock})
                </span>
              </label>
            </div>
          </div>

          {/* Embedded Visual Calculator */}
          <VisualStockCalculator
            initialPacks={2}
            initialUnitsPerPack={24}
            unitName={unitLabel}
            sellingPriceMt={product.price_mt}
            expectedDeliveryInfo={deliveryInfo}
            onApplyTotalUnits={handleApplyCalculated}
            currentStock={currentStock}
            buttonLabel="Calcular & Selecionar Quantidade"
          />

          {/* Unlock option if product was locked */}
          {isLocked && (
            <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl flex items-start gap-2.5">
              <input
                id="unlockProductCheck"
                type="checkbox"
                checked={unlockProduct}
                onChange={(e) => setUnlockProduct(e.target.checked)}
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="unlockProductCheck" className="text-xs cursor-pointer">
                <span className="font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                  <Unlock size={13} className="text-indigo-600 dark:text-indigo-400" />
                  Desbloquear produto para venda imediata no POS
                </span>
                <span className="block text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Marca a verificação de acolhimento como concluída e liberta o produto no ecrã de vendas.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="text-xs">
            <span className="text-slate-500 dark:text-zinc-400">Stock Final a Registar: </span>
            <strong className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-black">
              {resultingStock} {unitLabel}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmStockEntry}
              disabled={isSubmitting || calculatedTotal <= 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={15} />
              <span>{isSubmitting ? 'A guardar...' : 'Confirmar Entrada de Stock'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
