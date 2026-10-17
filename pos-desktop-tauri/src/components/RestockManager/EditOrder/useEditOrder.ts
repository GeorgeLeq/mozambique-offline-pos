import React, { useState, useEffect } from 'react';
import { getDB } from '../../../lib/db';
import toast from 'react-hot-toast';
import { sanitizeString } from '../../../lib/security/sanitizer';
import { Product } from '../../../lib/api';
import { OrderItemPackaging } from '../NewOrder/packagingTypes';
import { parseProductMetric } from '../../../lib/utils/productMetric';

export function useEditOrder(deliveryId: string, onClose: () => void, onSuccess: () => void) {
  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<any[]>([]);
  const [itemStateMap, setItemStateMap] = useState<Record<string, { 
    expected_quantity: number; 
    received_quantity: number; 
    status: string; 
    requires_verification: number; 
    name?: string;
    product_id?: string;
    barcode?: string;
    packaging?: OrderItemPackaging;
  }>>({});
  const [editingNameMap, setEditingNameMap] = useState<Record<string, boolean>>({});
  const [editingExpectedMap, setEditingExpectedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // New item creation state inside Edit Modal (Matching NewOrder parity)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Direct manual line additions
  const [directName, setDirectName] = useState('');
  const [directQty, setDirectQty] = useState('1');
  const [directMode, setDirectMode] = useState<'unit' | 'pack' | 'bulk'>('pack');
  const [directPackType, setDirectPackType] = useState<'pack' | 'box' | 'bundle' | 'crate' | 'other'>('box');
  const [directUnitsPerPack, setDirectUnitsPerPack] = useState('24');
  const [directTotalPacks, setDirectTotalPacks] = useState('1');
  const [directBulkMetric, setDirectBulkMetric] = useState<'kg' | 'g' | 'l' | 'ml'>('kg');
  const [directBulkSize, setDirectBulkSize] = useState('25');
  const [directBulkPkgs, setDirectBulkPkgs] = useState('1');

  useEffect(() => {
    async function loadDelivery() {
      try {
        const db = await getDB();
        const res = await db.select('SELECT * FROM expected_deliveries WHERE id = ?', [deliveryId]) as any[];
        if (res.length > 0) {
          setSupplierName(res[0].supplier_name || '');
          setExpectedDate(res[0].expected_date || '');
          setStatus(res[0].status || 'pending');
        }

        const itemsRes = await db.select(`
          SELECT 
            ei.*, 
            COALESCE(ei.name, p.name, 'Produto') as resolved_name,
            p.name as product_table_name, 
            p.barcode, 
            p.stock_quantity as current_stock, 
            p.requires_verification as prod_verif, 
            p.attributes as product_attributes 
          FROM expected_delivery_items ei
          LEFT JOIN products p ON ei.product_id = p.id
          WHERE ei.delivery_id = ?
        `, [deliveryId]) as any[];
        
        console.log('[useEditOrder] Loaded itemsRes:', itemsRes);
        
        const mappedItems = itemsRes.map(item => ({
          ...item,
          name: item.resolved_name || item.name || 'Produto',
        }));
        
        setItems(mappedItems);

        const initMap: Record<string, any> = {};
        mappedItems.forEach(item => {
          const effectiveReceived = (item.received_quantity !== undefined && item.received_quantity !== null && item.received_quantity > 0)
            ? item.received_quantity
            : (item.current_stock !== undefined && item.current_stock !== null && item.current_stock > 0
              ? item.current_stock
              : 0);
          
          const reqVerif = (item.requires_verification !== undefined && item.requires_verification !== null)
            ? (item.requires_verification ? 1 : 0)
            : (item.prod_verif !== undefined && item.prod_verif !== null ? (item.prod_verif ? 1 : 0) : 1);

          // Parse initial packaging if stored or from product attributes
          let parsedPackaging: OrderItemPackaging | undefined = undefined;
          if (item.packaging_data) {
            try {
              parsedPackaging = typeof item.packaging_data === 'string' ? JSON.parse(item.packaging_data) : item.packaging_data;
            } catch {
              // ignore
            }
          }
          if (!parsedPackaging && item.product_attributes) {
            try {
              const attrs = typeof item.product_attributes === 'string' ? JSON.parse(item.product_attributes) : item.product_attributes;
              if (attrs?.packaging_mode === 'pack' || attrs?.units_per_pack) {
                const uPerPack = Number(attrs.units_per_pack) || 24;
                const computedPacks = Math.ceil(item.expected_quantity / uPerPack);
                parsedPackaging = {
                  mode: 'pack',
                  packType: attrs.pack_type || 'box',
                  unitsPerPack: uPerPack,
                  totalPacks: computedPacks > 0 ? computedPacks : 1,
                };
              } else if (attrs?.packaging_mode === 'bulk' || attrs?.bulk_metric) {
                const bSize = Number(attrs.bulk_unit_size) || 25;
                const computedPkgs = Math.ceil(item.expected_quantity / bSize);
                parsedPackaging = {
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

          initMap[item.id] = {
            expected_quantity: item.expected_quantity,
            received_quantity: effectiveReceived,
            status: item.status || (effectiveReceived >= item.expected_quantity && item.expected_quantity > 0 ? 'received' : 'pending'),
            requires_verification: reqVerif,
            name: item.name,
            product_id: item.product_id,
            barcode: item.barcode,
            packaging: parsedPackaging,
          };
        });
        setItemStateMap(initMap);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar encomenda e itens');
      } finally {
        setIsLoading(false);
      }
    }
    loadDelivery();
  }, [deliveryId]);

  // Handle Search for adding new products in Edit mode
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const db = await getDB();
      const results = await db.select(
        'SELECT * FROM products WHERE (name LIKE ? OR barcode LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 10',
        [`%${term}%`, `%${term}%`]
      ) as Product[];
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product from Catalog into Edit Order
  const handleAddProduct = (product: Product) => {
    // Check if already in order
    const existingIndex = items.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const curState = itemStateMap[existing.id] || { expected_quantity: existing.expected_quantity };
      const nextQty = (curState.expected_quantity || 1) + 1;
      setItemStateMap(prev => ({
        ...prev,
        [existing.id]: {
          ...curState,
          expected_quantity: nextQty
        }
      }));
      toast.success(`Quantidade incrementada para "${product.name}"`);
    } else {
      const metricInfo = parseProductMetric(product.attributes, product.is_fractional);
      let initialPackaging: OrderItemPackaging = { mode: 'unit' };
      let defaultQty = 1;

      if (metricInfo.productType === 'pack' || (metricInfo.packUnitsCount && metricInfo.packUnitsCount > 1)) {
        const units = metricInfo.packUnitsCount || 24;
        initialPackaging = {
          mode: 'pack',
          packType: (metricInfo.packType as any) || 'box',
          unitsPerPack: units,
          totalPacks: 1
        };
        defaultQty = units;
      } else if (metricInfo.productType === 'bulk' || product.is_fractional) {
        const metric = (metricInfo.unitMetric as any) || 'kg';
        const pkgSize = metricInfo.packageTotalQty || 25;
        initialPackaging = {
          mode: 'bulk',
          bulkMetric: metric,
          bulkUnitSize: pkgSize,
          totalBulkPackages: 1
        };
        defaultQty = pkgSize;
      }

      const tempId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem = {
        id: tempId,
        delivery_id: deliveryId,
        product_id: product.id,
        name: product.name,
        barcode: product.barcode,
        expected_quantity: defaultQty,
        received_quantity: 0,
        status: 'pending',
        requires_verification: 1,
        packaging: initialPackaging,
        isNew: true,
      };

      setItems(prev => [...prev, newItem]);
      setItemStateMap(prev => ({
        ...prev,
        [tempId]: {
          expected_quantity: defaultQty,
          received_quantity: 0,
          status: 'pending',
          requires_verification: 1,
          name: product.name,
          product_id: product.id,
          barcode: product.barcode,
          packaging: initialPackaging,
        }
      }));
      toast.success(`"${product.name}" adicionado à encomenda`);
    }

    setSearchTerm('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Add Direct Item (Manual Entry) into Edit Order
  const handleAddDirect = () => {
    const cleanName = sanitizeString(directName);
    if (!cleanName) {
      return toast.error('Introduza o nome do produto');
    }

    let calculatedQty = 1;
    let packaging: OrderItemPackaging = { mode: 'unit' };

    if (directMode === 'unit') {
      calculatedQty = parseFloat(directQty) || 1;
      packaging = { mode: 'unit' };
    } else if (directMode === 'pack') {
      const packs = parseInt(directTotalPacks, 10) || 1;
      const unitsPer = parseInt(directUnitsPerPack, 10) || 24;
      calculatedQty = packs * unitsPer;
      packaging = {
        mode: 'pack',
        packType: directPackType,
        unitsPerPack: unitsPer,
        totalPacks: packs
      };
    } else if (directMode === 'bulk') {
      const pkgs = parseFloat(directBulkPkgs) || 1;
      const size = parseFloat(directBulkSize) || 25;
      calculatedQty = pkgs * size;
      packaging = {
        mode: 'bulk',
        bulkMetric: directBulkMetric,
        bulkUnitSize: size,
        totalBulkPackages: pkgs
      };
    }

    const tempId = `new_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      id: tempId,
      delivery_id: deliveryId,
      product_id: null,
      name: cleanName,
      barcode: 'MANUAL',
      expected_quantity: calculatedQty,
      received_quantity: 0,
      status: 'pending',
      requires_verification: 1,
      packaging,
      isNew: true,
    };

    setItems(prev => [...prev, newItem]);
    setItemStateMap(prev => ({
      ...prev,
      [tempId]: {
        expected_quantity: calculatedQty,
        received_quantity: 0,
        status: 'pending',
        requires_verification: 1,
        name: cleanName,
        product_id: null as any,
        barcode: 'MANUAL',
        packaging,
      }
    }));

    setDirectName('');
    setDirectQty('1');
    setDirectTotalPacks('1');
    setDirectBulkPkgs('1');
    toast.success('Item adicionado à encomenda');
  };

  // Remove Item from Edit Order
  const handleRemoveItem = async (itemId: string) => {
    const itemToRemove = items.find(i => i.id === itemId);
    if (!itemToRemove) return;

    if (itemToRemove.isNew) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      setItemStateMap(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success('Item removido');
      return;
    }

    try {
      const db = await getDB();
      
      // Clean up orphaned product if it has 0 stock and is not used elsewhere
      if (itemToRemove.product_id) {
        try {
          const otherUses = await db.select('SELECT COUNT(*) as cnt FROM expected_delivery_items WHERE product_id = ? AND id != ?', [itemToRemove.product_id, itemId]) as any[];
          const salesUses = await db.select('SELECT COUNT(*) as cnt FROM sale_items WHERE product_id = ?', [itemToRemove.product_id]).catch(() => [{cnt: 0}]) as any[];
          const prodRes = await db.select('SELECT stock_quantity FROM products WHERE id = ?', [itemToRemove.product_id]) as any[];
          
          if (
            (otherUses[0]?.cnt || 0) === 0 && 
            (salesUses[0]?.cnt || 0) === 0 && 
            (prodRes[0]?.stock_quantity || 0) === 0
          ) {
            await db.execute('DELETE FROM products WHERE id = ?', [itemToRemove.product_id]);
            await db.execute('DELETE FROM barcodes WHERE linked_product_id = ?', [itemToRemove.product_id]);
          }
        } catch (e) {
          console.error("Failed to delete unused product:", e);
        }
      }

      await db.execute('DELETE FROM expected_delivery_items WHERE id = ?', [itemId]);
      setItems(prev => prev.filter(i => i.id !== itemId));
      setItemStateMap(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success('Item removido da encomenda');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover item');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSupplier = sanitizeString(supplierName);
    const cleanDate = sanitizeString(expectedDate);

    if (!cleanSupplier) {
      return toast.error('Nome do fornecedor obrigatório');
    }

    setIsSaving(true);
    try {
      const db = await getDB();

      for (const item of items) {
        const currentState = itemStateMap[item.id] || { 
          expected_quantity: item.expected_quantity, 
          received_quantity: 0, 
          status: 'pending', 
          requires_verification: 1,
          name: item.name,
          packaging: item.packaging,
        };

        const resolvedName = sanitizeString(currentState.name || item.name || 'Produto');
        const oldReceived = Number(item.received_quantity) || 0;
        const newReceived = Number(currentState.received_quantity) || 0;
        const newExpected = Number(currentState.expected_quantity) !== undefined ? Number(currentState.expected_quantity) : item.expected_quantity;
        const newItemStatus = currentState.status;
        const delta = newReceived - oldReceived;
        const itemReqVerif = currentState.requires_verification !== undefined ? currentState.requires_verification : 1;
        const packagingJson = currentState.packaging ? JSON.stringify(currentState.packaging) : null;

        if (item.isNew) {
          // Insert newly added line
          await db.execute(
            `INSERT INTO expected_delivery_items 
             (id, delivery_id, product_id, name, expected_quantity, received_quantity, status, requires_verification, packaging_data, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              item.id,
              deliveryId,
              item.product_id || null,
              resolvedName,
              newExpected,
              newReceived,
              newItemStatus,
              itemReqVerif,
              packagingJson,
            ]
          );
        } else {
          // Update existing line
          await db.execute(
            `UPDATE expected_delivery_items 
             SET name = ?, expected_quantity = ?, received_quantity = ?, status = ?, requires_verification = ?, packaging_data = ?, sync_status = 0 
             WHERE id = ?`,
            [resolvedName, newExpected, newReceived, newItemStatus, itemReqVerif, packagingJson, item.id]
          );
        }

        // Handle inventory updates if received
        if (item.product_id) {
          if (newItemStatus === 'received') {
            await db.execute(
              'UPDATE products SET stock_quantity = stock_quantity + ?, requires_verification = ?, sync_status = 0 WHERE id = ?',
              [delta > 0 ? delta : (newReceived - oldReceived), itemReqVerif, item.product_id]
            );
          } else if (newItemStatus === 'pending' || newItemStatus === 'cancelled') {
            const reverseDelta = oldReceived > 0 ? oldReceived : 0;
            if (reverseDelta > 0) {
              await db.execute(
                'UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?), requires_verification = ?, sync_status = 0 WHERE id = ?',
                [reverseDelta, itemReqVerif, item.product_id]
              );
            } else {
              await db.execute(
                'UPDATE products SET requires_verification = ?, sync_status = 0 WHERE id = ?',
                [itemReqVerif, item.product_id]
              );
            }
          }
        }
      }

      await db.execute(
        'UPDATE expected_deliveries SET supplier_name = ?, expected_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?',
        [cleanSupplier, cleanDate || null, status, deliveryId]
      );

      try {
        const { logAudit } = await import('../../../lib/audit');
        await logAudit(
          undefined,
          'ORDER_UPDATED',
          `Atualizada encomenda para fornecedor "${cleanSupplier}": estado ${status}, ${items.length} itens.`
        );
      } catch (auditErr) {
        console.warn('Audit logging failed for ORDER_UPDATED', auditErr);
      }

      try {
        const { syncExpectedDeliveriesToCloud } = await import('../../../lib/syncEngine/expectedDeliveries');
        const { syncProductsToCloud } = await import('../../../lib/syncEngine/products');
        await Promise.race([
          Promise.all([syncProductsToCloud(), syncExpectedDeliveriesToCloud()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 3000))
        ]);
      } catch (cloudErr) {
        console.warn('Cloud sync trigger failed or timed out:', cloudErr);
      }

      toast.success('Encomenda atualizada com sucesso! Itens e formatos de embalagem preservados.');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar encomenda');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    supplierName,
    setSupplierName,
    expectedDate,
    setExpectedDate,
    status,
    setStatus,
    items,
    setItems,
    itemStateMap,
    setItemStateMap,
    editingNameMap,
    setEditingNameMap,
    editingExpectedMap,
    setEditingExpectedMap,
    isLoading,
    isSaving,
    isFullScreen,
    setIsFullScreen,
    searchTerm,
    searchResults,
    searchInputRef,
    handleSearch,
    handleAddProduct,
    directName,
    setDirectName,
    directQty,
    setDirectQty,
    directMode,
    setDirectMode,
    directPackType,
    setDirectPackType,
    directUnitsPerPack,
    setDirectUnitsPerPack,
    directTotalPacks,
    setDirectTotalPacks,
    directBulkMetric,
    setDirectBulkMetric,
    directBulkSize,
    setDirectBulkSize,
    directBulkPkgs,
    setDirectBulkPkgs,
    handleAddDirect,
    handleRemoveItem,
    handleSave,
  };
}
