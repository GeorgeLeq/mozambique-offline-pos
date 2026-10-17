import React, { useState } from 'react';
import { Lock, Unlock, Edit3, Package, Scale, Layers, Trash2 } from 'lucide-react';
import { useI18n } from '../../../i18n';
import { OrderItemPackaging, formatOrderItemPackaging } from '../NewOrder/packagingTypes';
import { ItemPackagingConfigModal } from '../EditOrder/ItemPackagingConfigModal';

interface ExpectedItemsTableProps {
  items: any[];
  mode?: 'details' | 'edit';
  itemStateMap?: Record<string, any>;
  setItemStateMap?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  receivedQtyMap?: Record<string, number>;
  verificationMap?: Record<string, number>;
  handleToggleItemVerification?: (item: any) => void;
  editingNameMap?: Record<string, boolean>;
  setEditingNameMap?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  editingExpectedMap?: Record<string, boolean>;
  setEditingExpectedMap?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleRestoreProduct?: (productId: string, productName: string) => void;
  handleRemoveItem?: (itemId: string) => void;
}

export function ExpectedItemsTable({
  items,
  mode = 'details',
  itemStateMap = {},
  setItemStateMap = () => {},
  receivedQtyMap = {},
  verificationMap = {},
  handleToggleItemVerification = () => {},
  editingNameMap = {},
  setEditingNameMap = () => {},
  editingExpectedMap = {},
  setEditingExpectedMap = () => {},
  handleRestoreProduct,
  handleRemoveItem,
}: ExpectedItemsTableProps) {
  const t = useI18n();
  const isEdit = mode === 'edit';
  
  // State for pack configuration modal in edit mode
  const [selectedPackConfigItem, setSelectedPackConfigItem] = useState<{
    id: string;
    name: string;
    expectedQty: number;
    packaging?: OrderItemPackaging;
  } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          {t.totalItems || 'Itens Esperados'} ({items.length})
        </h3>
        <span className="text-[11px] font-bold text-slate-400">
          {isEdit ? (t.editOrderSubtitle || 'Edição de Quantidades, Embalagem & Detalhes') : (t.receptionVerification || 'Verificação de Stock no Acolhimento por Produto')}
        </span>
      </div>
      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="p-3.5">{t.productAndPackaging || 'Produto & Embalagem'}</th>
              <th className="p-3.5">{t.barcode || 'Cód. Barras'}</th>
              <th className="p-3.5 text-center">{t.qtyOrdered || 'Qtd Esperada'}</th>
              <th className="p-3.5 text-center">{t.qtyReceived || 'Qtd Recebida'}</th>
              <th className="p-3.5 text-center">{t.receptionVerification || 'Verificação no Acolhimento'}</th>
              {isEdit && handleRemoveItem && <th className="p-3.5 text-center w-10">{t.actions || 'Ações'}</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const state = isEdit ? (itemStateMap[item.id] || { expected_quantity: item.expected_quantity, received_quantity: item.received_quantity || 0, status: 'pending', requires_verification: item.requires_verification !== undefined ? item.requires_verification : 1, name: item.name, packaging: item.packaging }) : item;
              
              const currentRec = isEdit
                ? (state.received_quantity !== undefined ? state.received_quantity : (item.received_quantity || 0))
                : (receivedQtyMap[item.id] !== undefined ? receivedQtyMap[item.id] : (item.received_quantity || 0));

              const expectedQty = isEdit ? (state.expected_quantity !== undefined ? state.expected_quantity : item.expected_quantity) : item.expected_quantity;
              
              const isFullyReceived = currentRec >= expectedQty && expectedQty > 0;
              const isPartiallyReceived = currentRec > 0 && currentRec < expectedQty;
              const isProductDeleted = !item.name || item.is_deleted === 1 || item.is_deleted === true;
              
              const displayName = isEdit 
                ? (state.name || item.name || 'Produto')
                : (item.name || (t.deletedProduct || 'Produto'));

              const isReqVerif = isEdit
                ? (state.requires_verification === 1)
                : ((verificationMap[item.id] !== undefined ? verificationMap[item.id] : item.requires_verification) === 1);

              const isEditingName = isEdit && editingNameMap[item.id];
              const isEditingExpected = isEdit && editingExpectedMap[item.id];

              // Parse packaging metadata if present
              let itemPackaging: OrderItemPackaging | undefined = state.packaging || item.packaging;
              if (!itemPackaging && item.packaging_data) {
                try {
                  itemPackaging = typeof item.packaging_data === 'string' ? JSON.parse(item.packaging_data) : item.packaging_data;
                } catch {
                  // ignore
                }
              }

              // Fallback to product attributes if product is configured with packs/granel
              if (!itemPackaging && item.product_attributes) {
                try {
                  const attrs = typeof item.product_attributes === 'string' ? JSON.parse(item.product_attributes) : item.product_attributes;
                  if (attrs?.packaging_mode === 'pack' || attrs?.units_per_pack) {
                    const uPerPack = Number(attrs.units_per_pack) || 24;
                    const computedPacks = Math.ceil(expectedQty / uPerPack);
                    itemPackaging = {
                      mode: 'pack',
                      packType: attrs.pack_type || 'box',
                      unitsPerPack: uPerPack,
                      totalPacks: computedPacks > 0 ? computedPacks : 1,
                    };
                  } else if (attrs?.packaging_mode === 'bulk' || attrs?.bulk_metric) {
                    const bSize = Number(attrs.bulk_unit_size) || 25;
                    const computedPkgs = Math.ceil(expectedQty / bSize);
                    itemPackaging = {
                      mode: 'bulk',
                      bulkMetric: attrs.bulk_metric || 'kg',
                      bulkUnitSize: bSize,
                      totalBulkPackages: computedPkgs > 0 ? computedPkgs : 1,
                    };
                  }
                } catch {
                  // ignore
                }
              }

              return (
                <tr key={item.id || idx} className="border-b border-slate-100 dark:border-zinc-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-zinc-200">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div 
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isProductDeleted && !displayName
                                ? 'bg-rose-500 ring-2 ring-rose-500/20'
                                : isFullyReceived 
                                ? 'bg-emerald-500 ring-2 ring-emerald-500/20' 
                                : isPartiallyReceived 
                                ? 'bg-amber-500 ring-2 ring-amber-500/20' 
                                : 'bg-slate-300 dark:bg-zinc-700'
                            }`} 
                          />
                          {isEdit && isEditingName ? (
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemStateMap(prev => ({
                                  ...prev,
                                  [item.id]: { ...state, name: val }
                                }));
                              }}
                              className="w-full px-2 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-zinc-200"
                              autoFocus
                            />
                          ) : (
                            <span className={isProductDeleted && !displayName ? "line-through text-slate-400 dark:text-zinc-500 font-bold" : "font-bold"}>
                              {displayName || (t.deletedProduct || 'Produto')}
                            </span>
                          )}
                          {isProductDeleted && (
                            <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold shrink-0">
                              {t.deletedProduct || 'Eliminado'}
                            </span>
                          )}
                        </div>
                        {isEdit && (
                          <button
                            type="button"
                            onClick={() => setEditingNameMap(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                              isEditingName 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                            }`}
                            title={isEditingName ? "Concluir" : "Editar nome"}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {!isEdit && isProductDeleted && handleRestoreProduct && item.product_id && (
                          <button
                            type="button"
                            onClick={() => handleRestoreProduct(item.product_id, item.name || 'Produto')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {t.restore || 'Restaurar'}
                          </button>
                        )}
                      </div>

                      {/* Packaging Configuration Badge & Action */}
                      <div className="flex items-center gap-2 pl-4.5 flex-wrap">
                        {itemPackaging && itemPackaging.mode !== 'unit' ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black ${
                            itemPackaging.mode === 'pack'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                          }`}>
                            {itemPackaging.mode === 'pack' ? <Package size={12} className="text-indigo-600 dark:text-indigo-400" /> : <Scale size={12} className="text-emerald-600 dark:text-emerald-400" />}
                            <span>{formatOrderItemPackaging(itemPackaging, expectedQty)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 font-bold">
                            <Layers size={11} className="text-slate-400" />
                            <span>{expectedQty} unidades avulsas</span>
                          </div>
                        )}

                        {/* Edit Packaging Config Button in Edit Mode */}
                        {isEdit && (
                          <button
                            type="button"
                            onClick={() => setSelectedPackConfigItem({
                              id: item.id,
                              name: displayName || 'Produto',
                              expectedQty,
                              packaging: itemPackaging,
                            })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md border border-indigo-200/60 dark:border-indigo-800/40 cursor-pointer transition-colors shadow-2xs"
                            title="Configurar Pack / Caixa / Granel"
                          >
                            <Package size={11} />
                            <span>Config. Emb.</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{item.barcode || '—'}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {isEdit ? (
                      <div className="flex items-center justify-center gap-2">
                        {isEditingExpected ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={expectedQty}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setItemStateMap(prev => ({
                                ...prev,
                                [item.id]: { ...state, expected_quantity: val }
                              }));
                            }}
                            className="w-20 px-2 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-center font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 dark:text-indigo-400"
                            autoFocus
                          />
                        ) : (
                          <span>{expectedQty}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingExpectedMap(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                            isEditingExpected 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                          title={isEditingExpected ? "Concluir" : "Editar quantidade"}
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span>{expectedQty}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center justify-center gap-1 font-mono">
                      <span>{currentRec}</span>
                      {isFullyEqual(currentRec, expectedQty) && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md">100%</span>}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEdit) {
                          const nextVal = isReqVerif ? 0 : 1;
                          setItemStateMap(prev => ({
                            ...prev,
                            [item.id]: {
                              ...state,
                              requires_verification: nextVal
                            }
                          }));
                        } else {
                          handleToggleItemVerification(item);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-all shadow-2xs mx-auto ${
                        isReqVerif
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      title={isReqVerif ? "Requer Verificação. Clique para libertar venda no POS" : "Venda Livre. Clique para exigir verificação"}
                    >
                      {isReqVerif ? <Lock size={12} className="text-amber-500 shrink-0" /> : <Unlock size={12} className="text-emerald-500 shrink-0" />}
                      <span>{isReqVerif ? (t.requiresVerification || '🔒 Verificar') : (t.freeSale || '🔓 Sem Verif.')}</span>
                    </button>
                  </td>
                  {isEdit && handleRemoveItem && (
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Remover item da encomenda"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Packaging Config Popover Modal for Edit Mode */}
      {selectedPackConfigItem && (
        <ItemPackagingConfigModal
          productName={selectedPackConfigItem.name}
          currentExpectedQty={selectedPackConfigItem.expectedQty}
          initialPackaging={selectedPackConfigItem.packaging}
          onClose={() => setSelectedPackConfigItem(null)}
          onSave={(packaging, calculatedQty) => {
            const currentItemState = itemStateMap[selectedPackConfigItem.id] || {};
            setItemStateMap(prev => ({
              ...prev,
              [selectedPackConfigItem.id]: {
                ...currentItemState,
                expected_quantity: calculatedQty,
                packaging: packaging,
              }
            }));
            setSelectedPackConfigItem(null);
          }}
        />
      )}
    </div>
  );
}

function isFullyEqual(received: number, expected: number) {
  return received >= expected && expected > 0;
}
