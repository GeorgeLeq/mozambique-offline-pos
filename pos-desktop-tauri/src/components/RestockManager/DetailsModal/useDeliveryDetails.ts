import { useState, useEffect } from 'react';
import { getDB } from '../../../lib/db';
import { logAudit } from '../../../lib/audit';
import toast from 'react-hot-toast';

export function useDeliveryDetails(deliveryId: string, onClose: () => void, onStatusUpdated: () => void) {
  const [delivery, setDelivery] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [verificationMap, setVerificationMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      try {
        const db = await getDB();
        const delRes = await db.select(`
          SELECT ed.*, COALESCE(u.name, ed.created_by, 'Admin') as creator_name
          FROM expected_deliveries ed
          LEFT JOIN users u ON ed.created_by = u.id
          WHERE ed.id = ?
        `, [deliveryId]) as any[];
        if (delRes.length > 0) {
          setDelivery(delRes[0]);
        }
        const itemsRes = await db.select(`
          SELECT 
            ei.*, 
            COALESCE(ei.name, p.name, 'Produto') as name,
            p.barcode, 
            p.cost_price_mt, 
            p.stock_quantity as current_stock, 
            p.is_deleted, 
            p.requires_verification as prod_verif, 
            p.attributes as product_attributes 
          FROM expected_delivery_items ei
          LEFT JOIN products p ON ei.product_id = p.id
          WHERE ei.delivery_id = ?
        `, [deliveryId]) as any[];
        console.log('[useDeliveryDetails] Loaded itemsRes:', itemsRes);
        setItems(itemsRes);

        const initialMap: Record<string, number> = {};
        const initialVerifMap: Record<string, number> = {};
        itemsRes.forEach(item => {
          const effRec = (item.received_quantity !== undefined && item.received_quantity !== null && item.received_quantity > 0)
            ? item.received_quantity
            : (item.current_stock !== undefined && item.current_stock !== null && item.current_stock > 0
              ? item.current_stock
              : 0);
          console.log('[useDeliveryDetails] Item:', item.id, item.name, 'received_quantity:', item.received_quantity, 'current_stock:', item.current_stock, 'effRec:', effRec);

          initialMap[item.id] = effRec;
          initialVerifMap[item.id] = (item.requires_verification !== undefined && item.requires_verification !== null)
            ? (item.requires_verification ? 1 : 0)
            : (item.prod_verif !== undefined && item.prod_verif !== null ? (item.prod_verif ? 1 : 0) : 1);
        });
        setReceivedQtyMap(initialMap);
        setVerificationMap(initialVerifMap);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar detalhes da encomenda');
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [deliveryId]);

  const handleToggleItemVerification = async (item: any) => {
    const currentVal = verificationMap[item.id] !== undefined ? verificationMap[item.id] : 1;
    const newVal = currentVal === 1 ? 0 : 1;

    setVerificationMap(prev => ({ ...prev, [item.id]: newVal }));

    try {
      const db = await getDB();
      await db.execute('UPDATE expected_delivery_items SET requires_verification = ?, sync_status = 0 WHERE id = ?', [newVal, item.id]);
      if (item.product_id) {
        await db.execute('UPDATE products SET requires_verification = ?, sync_status = 0 WHERE id = ?', [newVal, item.product_id]);
      }
      toast.success(newVal === 1 
        ? `Verificação ativada para "${item.name}". (Venda no POS trancada)`
        : `Verificação desativada para "${item.name}". (Venda no POS libertada)`
      );
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar verificação do produto');
    }
  };

  const handleRestoreProduct = async (productId: string, productName: string) => {
    try {
      const db = await getDB();
      await db.execute('UPDATE products SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [productId]);
      await logAudit(undefined, 'PRODUCT_RESTORED', `Restaurado produto ${productName} para a Lista de Produtos a partir da encomenda`);
      toast.success(`Produto "${productName}" restaurado para a Lista de Produtos com sucesso!`);

      const itemsRes = await db.select(`
        SELECT ei.*, p.name, p.barcode, p.cost_price_mt, p.stock_quantity as current_stock, p.is_deleted 
        FROM expected_delivery_items ei
        JOIN products p ON ei.product_id = p.id
        WHERE ei.delivery_id = ?
      `, [deliveryId]) as any[];
      setItems(itemsRes);
      onStatusUpdated();
    } catch (err) {
      toast.error('Erro ao restaurar produto');
    }
  };

  const handleConfirmReceipt = async () => {
    setIsSaving(true);
    try {
      const db = await getDB();
      let hasDiscrepancy = false;

      for (const item of items) {
        const newReceived = Number(receivedQtyMap[item.id]) || 0;
        const oldReceived = Number(item.received_quantity) || 0;
        const delta = newReceived - oldReceived;
        const itemVerif = verificationMap[item.id] !== undefined ? verificationMap[item.id] : 0;

        if (newReceived < item.expected_quantity) {
          hasDiscrepancy = true;
        }

        await db.execute(
          'UPDATE expected_delivery_items SET received_quantity = ?, requires_verification = ?, sync_status = 0 WHERE id = ?',
          [newReceived, itemVerif, item.id]
        );

        if (item.product_id) {
          await db.execute(
            'UPDATE products SET stock_quantity = stock_quantity + ?, requires_verification = ?, sync_status = 0 WHERE id = ?',
            [delta, itemVerif, item.product_id]
          );
        }
      }

      const newStatus = hasDiscrepancy ? 'discrepancy' : 'received';
      await db.execute(
        'UPDATE expected_deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?',
        [newStatus, deliveryId]
      );

      const totalReceivedUnits = items.reduce((acc, item) => acc + (Number(receivedQtyMap[item.id]) || 0), 0);
      const deliveryLabel = delivery?.po_number ? `PO-${delivery.po_number}` : (delivery?.invoice_number ? `Fat: ${delivery.invoice_number}` : 'Encomenda');
      const supplierLabel = delivery?.supplier_name || 'Fornecedor';
      await logAudit(
        undefined,
        'RESTOCK_RECEIVE',
        `Receção ${deliveryLabel} (${supplierLabel}): ${items.length} itens, ${totalReceivedUnits} un recebidas. Estado: ${hasDiscrepancy ? 'Com Divergência' : 'Concluído/Total'}`
      ).catch(() => {});

      try {
        const { syncExpectedDeliveriesToCloud } = await import('../../../lib/syncEngine/expectedDeliveries');
        const { syncProductsToCloud } = await import('../../../lib/syncEngine/products');
        await Promise.race([
          Promise.all([syncProductsToCloud(), syncExpectedDeliveriesToCloud()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 3000))
        ]);
      } catch (e) {
        console.warn('Sync trigger failed or timed out:', e);
      }

      toast.success(hasDiscrepancy ? 'Receção registada com divergência. Produtos verificados e desbloqueados!' : 'Receção confirmada! Stock creditado e produtos desbloqueados para venda POS.');
      onStatusUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao confirmar receção de stock');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    delivery,
    items,
    receivedQtyMap,
    setReceivedQtyMap,
    verificationMap,
    isLoading,
    isSaving,
    isFullScreen,
    setIsFullScreen,
    handleToggleItemVerification,
    handleRestoreProduct,
    handleConfirmReceipt,
  };
}
