import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';
import { spoolJob } from '../../../lib/printSpooler';
import { parseProductMetric } from '../../../lib/utils/productMetric';
import { CartItem } from './useCart';

export function useCheckout(cart: CartItem[], setCart: React.Dispatch<React.SetStateAction<CartItem[]>>, currentUser: any, setIsFiadoModalOpen: (val: boolean) => void) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async (
    paymentMethod: 'cash' | 'fiado' | 'm-pesa' | 'e-mola' | 'mixed', 
    fiadoInfo?: { name: string, phone: string, address: string }, 
    mixedDetails?: { cash: number, mpesa: number, emola: number },
    transactionId?: string
  ) => {
    if (cart.length === 0 || isCheckingOut) return;
    
    setIsCheckingOut(true);
    try {
      if (paymentMethod === 'fiado' && fiadoInfo) {
        const { checkFiadosLimit } = await import('../../ClientManager/services/debtService');
        const limitCheck = await checkFiadosLimit(fiadoInfo.name);
        if (!limitCheck.allowed) {
          toast.error(`Limite de Clientes Atingido (${limitCheck.current}/${limitCheck.limit}). O Administrador deve atualizar para o plano PRO.`);
          setIsCheckingOut(false);
          return;
        }
      }

      const db = await getDB();
      const currentTotal = cart.reduce((sum, item) => sum + (item.price_mt * item.quantity), 0);
      
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
      const seq = Math.floor(1000 + Math.random() * 9000); // 4 random digits
      const receiptId = `REC-${dateStr}-${seq}`;

      // Pre-cache low stock and high value thresholds beforehand to prevent N+1 selects inside loop
      const globalAlertSetting: any[] = await db.select("SELECT value FROM settings WHERE key = 'low_stock_threshold'");
      const defaultAlertThreshold = globalAlertSetting.length > 0 ? (parseFloat(globalAlertSetting[0].value) || 5) : 5;

      const highValRow: any[] = await db.select("SELECT value FROM settings WHERE key = 'high_value_threshold'");
      const highValThreshold = parseFloat(highValRow[0]?.value || '5000');
      
      const notifPrefsRow: any[] = await db.select("SELECT value FROM settings WHERE key = 'notification_preferences'");
      const prefs = notifPrefsRow[0]?.value ? notifPrefsRow[0].value.split(',') : [];

      let detailsJson = null;
      if (paymentMethod === 'mixed' && mixedDetails) {
         detailsJson = JSON.stringify(mixedDetails);
      } else if ((paymentMethod === 'm-pesa' || paymentMethod === 'e-mola') && transactionId) {
         detailsJson = JSON.stringify({ transaction_id: transactionId });
      }

      // Collect low stock alerts and notifications to display/insert after transaction completes successfully or in batch
      const lowStockToastsToTrigger: { name: string; newStock: number }[] = [];
      const notificationsToInsert: { id: string; type: string; title: string; message: string; action_url: string }[] = [];
      const triggeredAlerts = new Set<string>();

      // Open a unified SQLite transaction for all cart checkout writes
      let inTransaction = false;
      try {
        await db.execute('BEGIN TRANSACTION;');
        inTransaction = true;
      } catch (beginErr) {
        console.warn('Could not begin explicit transaction:', beginErr);
      }

      try {
        if (currentTotal >= highValThreshold && prefs.includes('high_value_sales')) {
           const notifId = crypto.randomUUID();
           notificationsToInsert.push({
             id: notifId,
             type: 'HIGH_VALUE_SALE',
             title: 'Venda de Alto Valor',
             message: `O Caixa ${currentUser?.name || 'Desconhecido'} registou uma venda no valor de ${currentTotal} MT. (ID: ${receiptId})`,
             action_url: 'sales'
           });
        }

        // Batch-retrieve all cart products to avoid N+1 select queries inside the loop
        const uniqueProductIds = Array.from(new Set(cart.map(item => item.id)));
        const productPlaceholders = uniqueProductIds.map(() => '?').join(',');
        const productsRec: any[] = uniqueProductIds.length > 0
          ? await db.select(
              `SELECT id, stock_quantity, min_stock_alert, name, attributes, is_fractional FROM products WHERE id IN (${productPlaceholders})`,
              uniqueProductIds
            )
          : [];

        const productsMap = new Map<string, { id: string; stock_quantity: any; min_stock_alert: any; name: string; attributes?: string; is_fractional?: any }>();
        for (const prod of productsRec) {
          productsMap.set(prod.id, prod);
        }

        // Check if any cart item is a pack linked to a parent product that is not yet in productsMap
        const parentIdsToFetch = new Set<string>();
        for (const prod of productsRec) {
          const metric = parseProductMetric(prod.attributes, prod.is_fractional);
          if (metric.parentProductId && !productsMap.has(metric.parentProductId)) {
            parentIdsToFetch.add(metric.parentProductId);
          }
        }

        if (parentIdsToFetch.size > 0) {
          const parentIdArray = Array.from(parentIdsToFetch);
          const parentPlaceholders = parentIdArray.map(() => '?').join(',');
          const parentProductsRec: any[] = await db.select(
            `SELECT id, stock_quantity, min_stock_alert, name, attributes, is_fractional FROM products WHERE id IN (${parentPlaceholders})`,
            parentIdArray
          );
          for (const parentProd of parentProductsRec) {
            productsMap.set(parentProd.id, parentProd);
          }
        }

        // Construct a batch INSERT for all sales items in the cart
        const salesPlaceholders = cart.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)').join(', ');
        const salesValues: any[] = [];

        // Track and compute stock updates in memory first
        for (const item of cart) {
          const saleId = crypto.randomUUID();
          const basePrice = item.original_price_mt !== undefined && item.original_price_mt !== null ? item.original_price_mt : item.price_mt;
          const discountType = item.discount_type || 'none';
          const discountValue = item.discount_value || 0;
          const authorizedBy = item.authorized_by || null;

          salesValues.push(
            saleId, 
            receiptId, 
            item.id, 
            item.quantity, 
            item.price_mt * item.quantity, 
            paymentMethod, 
            'completed', 
            currentUser?.id || 'unknown', 
            currentUser?.name || 'Cashier', 
            detailsJson,
            basePrice,
            discountType,
            discountValue,
            authorizedBy
          );

          // Calculate in-memory stock transitions
          const prod = productsMap.get(item.id);
          if (prod) {
            const currentStock = parseFloat(prod.stock_quantity) || 0;
            const newStock = currentStock - item.quantity;
            
            // Mutate the local map state to accumulate quantities
            prod.stock_quantity = newStock;

            let alertThreshold = parseFloat(prod.min_stock_alert);
            if (isNaN(alertThreshold)) {
              alertThreshold = defaultAlertThreshold;
            }

            if (currentStock > alertThreshold && newStock <= alertThreshold && !triggeredAlerts.has(item.id)) {
               triggeredAlerts.add(item.id);
               lowStockToastsToTrigger.push({ name: prod.name, newStock });
               notificationsToInsert.push({
                 id: crypto.randomUUID(),
                 type: 'LOW_STOCK',
                 title: 'Alerta de Estoque Baixo',
                 message: `${prod.name} atingiu o limite mínimo. Estoque atual: ${newStock}`,
                 action_url: 'products'
               });
            }

            // Linked Parent Product Stock Deduction (if item is a pack linked to a base unit)
            const metric = parseProductMetric(prod.attributes, prod.is_fractional);
            if (metric.parentProductId && productsMap.has(metric.parentProductId)) {
              const parentProd = productsMap.get(metric.parentProductId)!;
              const unitsToDeduct = item.quantity * (metric.packUnitsCount || 1);
              const currentParentStock = parseFloat(parentProd.stock_quantity) || 0;
              const newParentStock = currentParentStock - unitsToDeduct;
              parentProd.stock_quantity = newParentStock;

              let parentAlertThreshold = parseFloat(parentProd.min_stock_alert);
              if (isNaN(parentAlertThreshold)) {
                parentAlertThreshold = defaultAlertThreshold;
              }

              if (currentParentStock > parentAlertThreshold && newParentStock <= parentAlertThreshold && !triggeredAlerts.has(parentProd.id)) {
                triggeredAlerts.add(parentProd.id);
                lowStockToastsToTrigger.push({ name: parentProd.name, newStock: newParentStock });
                notificationsToInsert.push({
                  id: crypto.randomUUID(),
                  type: 'LOW_STOCK',
                  title: 'Alerta de Estoque Baixo',
                  message: `${parentProd.name} atingiu o limite mínimo (deduzido via ${prod.name}). Estoque atual: ${newParentStock}`,
                  action_url: 'products'
                });
              }
            }
          }
        }

        // Execute batch sales insert in a single query statement
        if (salesValues.length > 0) {
          await db.execute(
            `INSERT INTO sales (id, receipt_id, product_id, quantity, total_mt, payment_method, status, user_id, cashier_name, payment_details, original_price_mt, discount_type, discount_value, authorized_by, is_synced) VALUES ${salesPlaceholders}`,
            salesValues
          );
        }

        // Bulk update all affected products' stock_quantity in a single statement using a CASE update
        const allModifiedProductIds = Array.from(productsMap.keys());
        if (allModifiedProductIds.length > 0) {
          const caseBlocks: string[] = [];
          const updateParams: any[] = [];
          
          for (const pid of allModifiedProductIds) {
            const prod = productsMap.get(pid);
            if (prod) {
              caseBlocks.push('WHEN ? THEN ?');
              updateParams.push(pid, prod.stock_quantity);
            }
          }
          
          if (caseBlocks.length > 0) {
            const validPlaceholders = allModifiedProductIds.map(() => '?').join(',');
            const updateQuery = `
              UPDATE products 
              SET stock_quantity = CASE id ${caseBlocks.join(' ')} END, 
                  sync_status = 0 
              WHERE id IN (${validPlaceholders})
            `;
            updateParams.push(...allModifiedProductIds);
            await db.execute(updateQuery, updateParams);
          }
        }

        // Batch-insert all notifications in a single statement
        if (notificationsToInsert.length > 0) {
          const notifPlaceholders = notificationsToInsert.map(() => '(?, ?, ?, ?, 0, ?, 0)').join(', ');
          const notifValues: any[] = [];
          for (const n of notificationsToInsert) {
            notifValues.push(n.id, n.type, n.title, n.message, n.action_url);
          }
          await db.execute(`
            INSERT INTO notifications (id, type, title, message, is_read, action_url, sync_status) 
            VALUES ${notifPlaceholders}
          `, notifValues);
        }

        if (paymentMethod === 'fiado' && fiadoInfo) {
          const debtId = crypto.randomUUID();
          const itemsJson = JSON.stringify(cart.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price_mt || i.price,
            total: (i.price_mt || i.price || 0) * i.quantity
          })));
          await db.execute(
            'INSERT INTO debts (id, customer_name, amount_mt, status, phone_number, address, receipt_id, cashier_name, items_json, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [debtId, fiadoInfo.name, currentTotal, 'unpaid', fiadoInfo.phone, fiadoInfo.address, receiptId, currentUser?.name || 'Caixa', itemsJson]
          );
        }

        // Commit transaction atomic set
        if (inTransaction) {
          await db.execute('COMMIT;');
          inTransaction = false;
        }
      } catch (err) {
        // Rollback on any failure if transaction was active
        if (inTransaction) {
          try {
            await db.execute('ROLLBACK;');
          } catch (rbErr) {
            console.warn('Rollback failed or transaction already inactive:', rbErr);
          }
          inTransaction = false;
        }
        throw err;
      }

      // Immediately clear the cart and close modals to make the user interface ultra-responsive
      setCart([]);
      if (paymentMethod === 'fiado') {
        setIsFiadoModalOpen(false);
      }
      toast.success(paymentMethod === 'fiado' ? `Fiado registado para ${fiadoInfo?.name}` : 'Venda realizada com sucesso!');

      // Dispatch custom event to notify useMiniDashboard of new sale instantly without polling delay
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));

      // Offload receipt generation, printer spooling, and non-blocking low stock toasts to a separate macrotask
      setTimeout(() => {
        // Fire low-stock toast alerts after successful database commit
        lowStockToastsToTrigger.forEach(t => {
          toast(`Atenção: ${t.name} está acabando! Restam ${t.newStock} em estoque.`, { icon: '⚠️', duration: 6000 });
        });

        // Prepare and print receipt
        const receiptData = {
          shopName: "SmartPOS",
          shopAddress: "Rua Exemplo, Maputo",
          shopPhone: "+258 84 123 4567",
          receiptId: receiptId,
          date: new Date().toISOString(),
          cashierName: currentUser?.name || "Caixa",
          items: cart.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price_mt || i.price || 0,
            total: (i.price_mt || i.price || 0) * i.quantity
          })),
          totalDue: currentTotal,
          paymentMethod: paymentMethod === 'mixed' && mixedDetails 
            ? `Misto (${[
                mixedDetails.cash > 0 ? `Dinheiro: ${mixedDetails.cash} MT` : '',
                mixedDetails.mpesa > 0 ? `M-Pesa: ${mixedDetails.mpesa} MT` : '',
                mixedDetails.emola > 0 ? `e-Mola: ${mixedDetails.emola} MT` : ''
              ].filter(Boolean).join(', ')})`
            : ((paymentMethod === 'm-pesa' || paymentMethod === 'e-mola') && transactionId 
                ? `${paymentMethod.toUpperCase()} (Ref: ${transactionId})` 
                : paymentMethod.toUpperCase())
        };

        const autoPrintSetting = localStorage.getItem('printer_auto_print') !== 'false';
        if (autoPrintSetting) {
          spoolJob(`Recibo #${receiptId.substring(0, 8).toUpperCase()}`, 'receipt', receiptData);
          toast.success('Recibo enviado para a fila de impressão.', { icon: '🖨️' });
        }
      }, 50);

    } catch (error) {
      console.error('Failed to save sale to local database:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return { isCheckingOut, handleCheckout };
}
