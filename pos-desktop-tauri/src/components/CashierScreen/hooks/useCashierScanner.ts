import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';
import { getProductByBarcode } from '../../../lib/api';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { CartItem } from './useCart';

export function useCashierScanner(
  currentUser: any,
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
  isRefundMode: boolean = false
) {
  const [isScanning, setIsScanning] = useState(false);

  useBarcodeScanner({
    onScan: async (barcode) => {
      setIsScanning(true);
      try {
        const product = await getProductByBarcode(barcode);
        
        // Log the scan history asynchronously
        setTimeout(async () => {
          try {
            const db = await getDB();
            const id = crypto.randomUUID();
            await db.execute(
              'INSERT INTO scan_history (id, barcode, product_name, status, user_id, is_synced) VALUES (?, ?, ?, ?, ?, 0)',
              [id, barcode, product ? product.name : null, product ? 'success' : 'not_found', currentUser?.id || 'unknown']
            );
          } catch(e) {
            console.error('Failed to log scan', e);
          }
        }, 0);

        if (product) {
          // Check if product requires verification and is blocked from sale
          const requiresVerif = product.requires_verification === 1 || product.requires_verification === true;
          if (requiresVerif) {
            toast.error(`⛔ Produto Bloqueado para Venda! "${product.name}" aguarda verificação de stock pelo Gestor antes de ser vendido.`, {
              id: `blocked-verification-${product.id}`,
              duration: 5000
            });
            return;
          }

          let stockCheckPassed = true;
          setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.barcode === barcode);
            const currentCartQuantity = existingItem ? existingItem.quantity : 0;
            const quantityDelta = isRefundMode ? -1 : 1;
            const newCartQuantity = currentCartQuantity + quantityDelta;

            if (newCartQuantity === 0) {
                return prevCart.filter(item => item.barcode !== barcode);
            }
            
            // Check stock limit dynamically only if adding normally
            if (!isRefundMode) {
              const currentStock = parseFloat(product.stock_quantity as any) || 0;
              const allowNegative = localStorage.getItem('allow_negative_stock') === '1';
              if (newCartQuantity > currentStock) {
                if (!allowNegative) {
                  stockCheckPassed = false;
                  toast.error(`⚠️ Stock Esgotado! Apenas ${currentStock} unidades de "${product.name}" estão disponíveis.`, { 
                    id: `out-of-stock-${product.id}`,
                    duration: 4000
                  });
                  return prevCart;
                } else {
                  toast(`Aviso: "${product.name}" vendido sem stock (disponível: ${currentStock}).`, {
                    icon: '⚠️',
                    id: `negative-stock-warning-${product.id}`,
                    duration: 3000
                  });
                }
              }
            }
            
            // Check threshold dynamically only if adding normally
            if (!isRefundMode) {
              setTimeout(async () => {
                const db = await getDB();
                let alertThreshold = parseFloat(product.min_stock_alert as any);
                if (isNaN(alertThreshold)) {
                  const globalAlertSetting: any[] = await db.select("SELECT value FROM settings WHERE key = 'low_stock_threshold'");
                  alertThreshold = globalAlertSetting.length > 0 ? (parseFloat(globalAlertSetting[0].value) || 5) : 5;
                }
                const currentStock = parseFloat(product.stock_quantity as any) || 0;
                const remainingStock = currentStock - newCartQuantity;
                
                const prevRemaining = currentStock - currentCartQuantity;
                
                if (remainingStock <= alertThreshold && prevRemaining > alertThreshold) {
                  toast(`Atenção: ${product.name} está acabando! Restam ${remainingStock} no estoque após esta venda.`, { icon: '⚠️', duration: 4000 });
                } else if (remainingStock === 0) { 
                   toast(`Atenção: ${product.name} esgotou (0 no estoque após esta venda).`, { icon: '🚨', duration: 4000 });
                }
              }, 0);
            }

            if (existingItem) {
              return prevCart.map((item) =>
                item.barcode === barcode
                  ? { ...item, quantity: newCartQuantity }
                  : item
              );
            }

            const isPromoActive = !!product.promo_active;
            const activePrice = isPromoActive && product.promo_price_mt !== null && product.promo_price_mt !== undefined
              ? product.promo_price_mt
              : product.price_mt;

            return [...prevCart, { 
              ...product, 
              original_price_mt: product.price_mt,
              price_mt: activePrice,
              quantity: newCartQuantity 
            }];
          });
          if (isRefundMode) {
            toast.success(`Refund mode: ${product.name} added as return (-1)`);
          }
        } else {
          toast.error(`Produto não encontrado!`);
          console.warn(`Barcode ${barcode} not found in database.`);
        }
      } finally {
        setIsScanning(false);
      }
    },
  });

  return { isScanning };
}
