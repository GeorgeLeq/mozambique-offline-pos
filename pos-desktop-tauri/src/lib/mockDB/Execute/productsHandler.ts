import { mockStorage, saveMockStorage } from '../storage';

/**
 * Handles execute/write operations for products, barcodes, deliveries, and spoiled items in mockStorage.
 */
export function handleProductsQuery(query: string, bindValues?: any[]): boolean {
  if (query.includes('DELETE FROM products')) {
    mockStorage.products.clear();
    saveMockStorage('products', mockStorage.products);
    return true;
  }

  if (query.includes('DELETE FROM barcodes WHERE barcode')) {
    if (bindValues && bindValues.length > 0) {
      mockStorage.barcodes.delete(bindValues[0]);
    } else {
      mockStorage.barcodes.clear();
    }
    saveMockStorage('barcodes', mockStorage.barcodes);
    return true;
  }

  if (query.includes('DELETE FROM barcodes')) {
    mockStorage.barcodes.clear();
    saveMockStorage('barcodes', mockStorage.barcodes);
    return true;
  }

  if (query.includes('INSERT INTO products') || query.includes('INSERT OR REPLACE INTO products')) {
    if (bindValues && bindValues.length >= 4) {
      const id = bindValues[0];
      const existing = mockStorage.products.get(id);

      // 1. syncProductsFromCloud query:
      // INSERT OR REPLACE INTO products (id, barcode, name, price_mt, cost_price_mt, stock_quantity, is_fractional, min_stock_alert, category, promo_price_mt, promo_active, attributes, requires_verification, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      if (query.includes('id, barcode, name, price_mt, cost_price_mt, stock_quantity, is_fractional')) {
        mockStorage.products.set(id, {
          ...existing,
          id: bindValues[0],
          barcode: bindValues[1],
          name: bindValues[2] || existing?.name || 'Produto Sem Nome',
          price_mt: Number(bindValues[3]) || 0,
          cost_price_mt: Number(bindValues[4]) || 0,
          stock_quantity: Number(bindValues[5]) ?? 0,
          is_fractional: bindValues[6] === 1 || bindValues[6] === true,
          min_stock_alert: bindValues[7] ?? 5,
          category: bindValues[8] || 'Geral',
          promo_price_mt: bindValues[9],
          promo_active: bindValues[10] === 1 || bindValues[10] === true,
          attributes: bindValues[11] || null,
          requires_verification: bindValues[12] ?? 0,
          sync_status: 1
        });
      } 
      // 2. useProductForm query:
      // INSERT INTO products (id, barcode, name, category, price_mt, cost_price_mt, stock_quantity, is_fractional, min_stock_alert, promo_price_mt, promo_active, attributes, sync_status)
      else if (query.includes('id, barcode, name, category, price_mt, cost_price_mt, stock_quantity, is_fractional')) {
        mockStorage.products.set(id, {
          ...existing,
          id: bindValues[0],
          barcode: bindValues[1],
          name: bindValues[2] || 'Produto Sem Nome',
          category: bindValues[3] || 'Geral',
          price_mt: Number(bindValues[4]) || 0,
          cost_price_mt: Number(bindValues[5]) || 0,
          stock_quantity: Number(bindValues[6]) ?? 0,
          is_fractional: bindValues[7] === 1 || bindValues[7] === true,
          min_stock_alert: bindValues[8] ?? 5,
          promo_price_mt: bindValues[9],
          promo_active: bindValues[10] === 1 || bindValues[10] === true,
          attributes: bindValues[11] || null,
          sync_status: 0
        });
      } 
      // 3. useNewOrder query:
      // INSERT INTO products (id, name, barcode, cost_price_mt, price_mt, stock_quantity, sync_status, requires_verification)
      else if (query.includes('id, name, barcode, cost_price_mt')) {
        mockStorage.products.set(id, {
          ...existing,
          id: bindValues[0],
          name: bindValues[1],
          barcode: bindValues[2],
          cost_price_mt: Number(bindValues[3]) || 0,
          price_mt: Number(bindValues[4]) || 0,
          stock_quantity: Number(bindValues[5]) ?? 0,
          requires_verification: bindValues[6] ?? 0,
          category: existing?.category || 'Geral',
          sync_status: 0
        });
      } 
      // 4. productExportImport query:
      // INSERT INTO products (id, barcode, name, category, price_mt, cost_price_mt, stock_quantity, min_stock_alert, is_fractional, image_url)
      else if (query.includes('id, barcode, name, category, price_mt, cost_price_mt, stock_quantity, min_stock_alert')) {
        mockStorage.products.set(id, {
          ...existing,
          id: bindValues[0],
          barcode: bindValues[1],
          name: bindValues[2],
          category: bindValues[3] || 'Geral',
          price_mt: Number(bindValues[4]) || 0,
          cost_price_mt: Number(bindValues[5]) || 0,
          stock_quantity: Number(bindValues[6]) ?? 0,
          min_stock_alert: bindValues[7],
          is_fractional: bindValues[8] === 1,
          sync_status: 0
        });
      } 
      else {
        mockStorage.products.set(id, {
          ...existing,
          id: bindValues[0],
          barcode: bindValues[1],
          name: bindValues[2],
          category: bindValues[3] || 'Geral',
          price_mt: Number(bindValues[4] ?? bindValues[3]) || 0,
          stock_quantity: Number(bindValues[5] ?? bindValues[4]) || 0,
          sync_status: 0
        });
      }
      saveMockStorage('products', mockStorage.products);
    }
    return true;
  }

  if (query.includes('UPDATE products SET name = ?, updated_at')) {
    if (bindValues && bindValues.length >= 2) {
      const name = bindValues[0];
      const id = bindValues[1];
      const prod = mockStorage.products.get(id);
      if (prod) {
        prod.name = name;
        prod.sync_status = 0;
        mockStorage.products.set(id, prod);
        saveMockStorage('products', mockStorage.products);
      }
    }
    return true;
  }

  if (query.includes('UPDATE products SET barcode = ?, updated_at')) {
    if (bindValues && bindValues.length >= 2) {
      const barcode = bindValues[0];
      const id = bindValues[1];
      const prod = mockStorage.products.get(id);
      if (prod) {
        prod.barcode = barcode;
        prod.sync_status = 0;
        mockStorage.products.set(id, prod);
        saveMockStorage('products', mockStorage.products);
      }
    }
    return true;
  }

  if (query.includes('UPDATE products SET') && !query.includes('stock_quantity') && !query.includes('sync_status = 1')) {
    if (bindValues && bindValues.length >= 2) {
      const id = bindValues[bindValues.length - 1];
      const existingProd = mockStorage.products.get(id) || {};
      if (bindValues.length >= 11) {
        mockStorage.products.set(id, {
          ...existingProd,
          id: id,
          barcode: bindValues[0],
          name: bindValues[1],
          category: bindValues[2],
          price_mt: Number(bindValues[3]) || 0,
          cost_price_mt: Number(bindValues[4]) || 0,
          stock_quantity: Number(bindValues[5]) || 0,
          is_fractional: bindValues[6] === 1,
          min_stock_alert: bindValues[7],
          promo_price_mt: bindValues[8],
          promo_active: bindValues[9] === 1,
          attributes: bindValues[10],
          sync_status: 0
        });
      } else {
        mockStorage.products.set(id, {
          ...existingProd,
          id: id,
          name: bindValues[0] || existingProd.name,
          sync_status: 0
        });
      }
      saveMockStorage('products', mockStorage.products);
    }
    return true;
  }

  if (query.includes('UPDATE products SET is_deleted')) {
    if (bindValues && bindValues.length >= 1) {
      const isDeletedVal = query.includes('is_deleted = 1') ? 1 : (query.includes('is_deleted = 0') ? 0 : bindValues[0]);
      const id = bindValues[bindValues.length - 1];
      const prod = mockStorage.products.get(id);
      if (prod) {
        prod.is_deleted = isDeletedVal;
        mockStorage.products.set(id, prod);
        saveMockStorage('products', mockStorage.products);
      }
    }
    return true;
  }

  if (query.includes('UPDATE products') && query.includes('CASE id')) {
    // Bulk CASE update format: [id1, qty1, id2, qty2, ..., id1, id2]
    if (bindValues && bindValues.length >= 2) {
      for (let i = 0; i < bindValues.length; i += 2) {
        const id = bindValues[i];
        const qty = bindValues[i + 1];
        if (id && qty !== undefined && typeof id === 'string') {
          const prod = mockStorage.products.get(id);
          if (prod) {
            prod.stock_quantity = Number(qty);
            prod.sync_status = 0;
            mockStorage.products.set(id, prod);
          }
        }
      }
      saveMockStorage('products', mockStorage.products);
    }
    return true;
  }

  if (query.includes('UPDATE products SET stock_quantity')) {
    if (bindValues && bindValues.length >= 2) {
      const qty = bindValues[0];
      const id = bindValues[1];
      const prod = mockStorage.products.get(id);
      if (prod) {
        if (query.includes('stock_quantity +')) {
          prod.stock_quantity = (prod.stock_quantity || 0) + Number(qty);
        } else {
          prod.stock_quantity = Number(qty);
        }
        mockStorage.products.set(id, prod);
        saveMockStorage('products', mockStorage.products);
      }
    }
    return true;
  }

  if (query.includes('UPDATE products SET sync_status = 1')) {
    if (bindValues) {
      bindValues.forEach(id => {
        const product = mockStorage.products.get(id);
        if (product) {
          product.sync_status = 1;
          mockStorage.products.set(id, product);
        }
      });
      saveMockStorage('products', mockStorage.products);
    }
    return true;
  }

  if (query.includes('INSERT INTO expected_deliveries') || query.includes('INSERT OR REPLACE INTO expected_deliveries')) {
    if (bindValues && bindValues.length >= 4) {
      const id = bindValues[0];
      const isCloudInsert = query.includes('updated_at');

      if (isCloudInsert) {
        // [id, po_number, invoice_number, supplier_name, expected_date, status, created_by, created_at, updated_at, reqVerif]
        mockStorage.expected_deliveries.set(id, {
          id,
          po_number: bindValues[1],
          invoice_number: bindValues[2],
          supplier_name: bindValues[3],
          expected_date: bindValues[4],
          status: bindValues[5] || 'pending',
          created_by: bindValues[6] || 'Admin',
          created_at: bindValues[7] || new Date().toISOString(),
          requires_verification: bindValues[9] ?? 0,
          sync_status: 1
        });
      } else {
        // useNewOrder: [id, po_number, invoice_number, supplier_name, expected_date, created_by, reqVerif]
        mockStorage.expected_deliveries.set(id, {
          id,
          po_number: bindValues[1],
          invoice_number: bindValues[2],
          supplier_name: bindValues[3],
          expected_date: bindValues[4],
          status: 'pending',
          created_by: bindValues[5] || 'Admin',
          requires_verification: bindValues[6] ?? 1,
          sync_status: 0,
          created_at: new Date().toISOString()
        });
      }
      saveMockStorage('expected_deliveries', mockStorage.expected_deliveries);
    }
    return true;
  }

  if (query.includes('INSERT INTO expected_delivery_items') || query.includes('INSERT OR REPLACE INTO expected_delivery_items')) {
    if (bindValues && bindValues.length >= 4) {
      const id = bindValues[0];
      const existingItem = mockStorage.expected_delivery_items.get(id);
      const prod = bindValues[2] ? mockStorage.products.get(bindValues[2]) : null;

      const isEditOrderInsert = query.includes('name, expected_quantity, received_quantity, status');
      const isCloudPullInsert = query.includes('created_at, sync_status, requires_verification');

      if (isEditOrderInsert) {
        // [id, deliveryId, prodId, name, expectedQty, receivedQty, status, reqVerif, packagingJson]
        const resolvedName = bindValues[3] || existingItem?.name || prod?.name || 'Produto';
        mockStorage.expected_delivery_items.set(id, {
          id: bindValues[0],
          delivery_id: bindValues[1],
          product_id: bindValues[2],
          name: resolvedName,
          item_name: resolvedName,
          expected_quantity: Number(bindValues[4]) || 0,
          received_quantity: Number(bindValues[5]) || 0,
          status: bindValues[6] || 'pending',
          requires_verification: bindValues[7] ?? 1,
          packaging_data: bindValues[8] || null,
          cost_price_mt: 0,
          sync_status: 0,
          created_at: existingItem?.created_at || new Date().toISOString()
        });
      } else if (isCloudPullInsert) {
        // [id, deliveryId, prodId, name, packagingJson, cleanQty, receivedQty, costPrice, createdAt, itemRequiresVerif]
        const incomingName = bindValues[3];
        const resolvedName = (incomingName && incomingName !== 'Produto')
          ? incomingName
          : (existingItem?.name || prod?.name || incomingName || 'Produto');
        const resolvedPkg = bindValues[4] || existingItem?.packaging_data || null;

        mockStorage.expected_delivery_items.set(id, {
          id: bindValues[0],
          delivery_id: bindValues[1],
          product_id: bindValues[2],
          name: resolvedName,
          item_name: resolvedName,
          packaging_data: resolvedPkg,
          expected_quantity: Number(bindValues[5]) || 0,
          received_quantity: Number(bindValues[6]) || 0,
          cost_price_mt: Number(bindValues[7]) || 0,
          status: existingItem?.status || 'pending',
          requires_verification: bindValues[9] ?? 1,
          sync_status: 1,
          created_at: bindValues[8] || existingItem?.created_at || new Date().toISOString()
        });
      } else {
        // [id, deliveryId, prodId, name, packagingJson, cleanQty, receivedQty, costPrice, itemRequiresVerif] (e.g. useNewOrder)
        const incomingName = bindValues[3];
        const resolvedName = (incomingName && incomingName !== 'Produto')
          ? incomingName
          : (existingItem?.name || prod?.name || incomingName || 'Produto');
        const resolvedPkg = bindValues[4] || existingItem?.packaging_data || null;

        mockStorage.expected_delivery_items.set(id, {
          id: bindValues[0],
          delivery_id: bindValues[1],
          product_id: bindValues[2],
          name: resolvedName,
          item_name: resolvedName,
          packaging_data: resolvedPkg,
          expected_quantity: Number(bindValues[5]) || 0,
          received_quantity: Number(bindValues[6]) || 0,
          cost_price_mt: Number(bindValues[7]) || 0,
          status: 'pending',
          requires_verification: bindValues[8] ?? 1,
          sync_status: 0,
          created_at: existingItem?.created_at || new Date().toISOString()
        });
      }
      saveMockStorage('expected_delivery_items', mockStorage.expected_delivery_items);
    }
    return true;
  }

  if (query.includes('UPDATE expected_deliveries')) {
    if (bindValues && bindValues.length >= 1) {
      if (query.includes('sync_status = 1')) {
        bindValues.forEach(id => {
          const delivery = mockStorage.expected_deliveries.get(id);
          if (delivery) {
            delivery.sync_status = 1;
            mockStorage.expected_deliveries.set(id, delivery);
          }
        });
      } else {
        const id = bindValues[bindValues.length - 1];
        const delivery = mockStorage.expected_deliveries.get(id);
        if (delivery) {
          if (query.includes('status =') && bindValues.length === 2) {
            // [newStatus, id]
            delivery.status = bindValues[0];
          } else if (query.includes('supplier_name =')) {
            // [supplierName, invoiceNumber, expectedDate, status, reqVerif, deliveryId]
            delivery.supplier_name = bindValues[0] || delivery.supplier_name;
            if (bindValues.length >= 5) {
              delivery.invoice_number = bindValues[1];
              delivery.expected_date = bindValues[2];
              delivery.status = bindValues[3];
              delivery.requires_verification = bindValues[4];
            }
          }
          delivery.sync_status = 0;
          mockStorage.expected_deliveries.set(id, delivery);
        }
      }
      saveMockStorage('expected_deliveries', mockStorage.expected_deliveries);
    }
    return true;
  }

  if (query.includes('UPDATE expected_delivery_items')) {
    if (bindValues && bindValues.length >= 1) {
      if (query.includes('sync_status = 1')) {
        bindValues.forEach(id => {
          const item = mockStorage.expected_delivery_items.get(id);
          if (item) {
            item.sync_status = 1;
            mockStorage.expected_delivery_items.set(id, item);
          }
        });
      } else if (query.includes('WHERE delivery_id = ?')) {
        const deliveryId = bindValues[bindValues.length - 1];
        Array.from(mockStorage.expected_delivery_items.values()).forEach(item => {
          if (item.delivery_id === deliveryId) {
            if (query.includes('status =')) {
              item.status = bindValues[0];
            }
            item.sync_status = 0;
            mockStorage.expected_delivery_items.set(item.id, item);
          }
        });
      } else {
        const id = bindValues[bindValues.length - 1];
        const item = mockStorage.expected_delivery_items.get(id);
        if (item) {
          if (query.includes('SET name =')) {
            // [resolvedName, newExpected, newReceived, newItemStatus, itemReqVerif, packagingJson, item.id]
            item.name = bindValues[0];
            item.expected_quantity = Number(bindValues[1]) || 0;
            item.received_quantity = Number(bindValues[2]) || 0;
            item.status = bindValues[3] || item.status;
            item.requires_verification = bindValues[4] ?? item.requires_verification;
            item.packaging_data = bindValues[5] || item.packaging_data;
          } else if (query.includes('received_quantity =')) {
            // [recQty, reqVerif, id]
            item.received_quantity = bindValues[0];
            if (bindValues.length >= 3) {
              item.requires_verification = bindValues[1];
            }
          } else if (query.includes('requires_verification =')) {
            // [reqVerif, id]
            item.requires_verification = bindValues[0];
          }
          item.sync_status = 0;
          mockStorage.expected_delivery_items.set(id, item);
        }
      }
      saveMockStorage('expected_delivery_items', mockStorage.expected_delivery_items);
    }
    return true;
  }

  if (query.includes('DELETE FROM expected_delivery_items')) {
    if (bindValues && bindValues.length > 0) {
      const delId = bindValues[0];
      Array.from(mockStorage.expected_delivery_items.keys()).forEach(key => {
        const item = mockStorage.expected_delivery_items.get(key);
        if (item && (item.delivery_id === delId || item.id === delId)) {
          mockStorage.expected_delivery_items.delete(key);
        }
      });
      saveMockStorage('expected_delivery_items', mockStorage.expected_delivery_items);
    }
    return true;
  }

  if (query.includes('DELETE FROM expected_deliveries')) {
    if (bindValues && bindValues.length > 0) {
      mockStorage.expected_deliveries.delete(bindValues[0]);
      saveMockStorage('expected_deliveries', mockStorage.expected_deliveries);
    }
    return true;
  }

  if (query.includes('INSERT INTO spoiled_items')) {
    if (bindValues && bindValues.length >= 7) {
      mockStorage.spoiled_items.set(bindValues[0], {
        id: bindValues[0],
        product_id: bindValues[1],
        quantity: bindValues[2],
        reason: bindValues[3],
        authorized_by: bindValues[4],
        sale_id: bindValues[5],
        receipt_id: bindValues[6],
        sync_status: 0,
        created_at: new Date().toISOString()
      });
      saveMockStorage('spoiled_items', mockStorage.spoiled_items);
    }
    return true;
  }

  if (query.includes('INSERT INTO barcodes')) {
    if (bindValues && bindValues.length >= 3) {
      mockStorage.barcodes.set(bindValues[0], {
        barcode: bindValues[0],
        status: bindValues[1],
        expires_at: bindValues[2],
        sync_status: 0,
        created_at: new Date().toISOString()
      });
      saveMockStorage('barcodes', mockStorage.barcodes);
    }
    return true;
  }

  if (query.includes('UPDATE barcodes SET expires_at')) {
    if (bindValues && bindValues.length >= 2) {
      const barcode = mockStorage.barcodes.get(bindValues[1]);
      if (barcode) {
        barcode.expires_at = bindValues[0];
        barcode.sync_status = 0;
        mockStorage.barcodes.set(bindValues[1], barcode);
        saveMockStorage('barcodes', mockStorage.barcodes);
      }
    }
    return true;
  }

  if (query.includes('UPDATE barcodes SET status')) {
    if (bindValues && bindValues.length >= 2) {
      const barcode = mockStorage.barcodes.get(bindValues[1]);
      if (barcode) {
        barcode.status = bindValues[0];
        barcode.sync_status = 0;
        mockStorage.barcodes.set(bindValues[1], barcode);
        saveMockStorage('barcodes', mockStorage.barcodes);
      }
    }
    return true;
  }

  if (query.includes('UPDATE barcodes SET sync_status = 1')) {
    if (bindValues) {
      bindValues.forEach(id => {
        const barcode = mockStorage.barcodes.get(id);
        if (barcode) {
          barcode.sync_status = 1;
          mockStorage.barcodes.set(id, barcode);
        }
      });
      saveMockStorage('barcodes', mockStorage.barcodes);
    }
    return true;
  }

  return false;
}
