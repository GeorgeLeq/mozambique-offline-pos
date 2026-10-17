import { mockStorage, saveMockStorage } from '../storage';

/**
 * Handles execute/write operations for the 'sales' table in mockStorage.
 */
export function handleSalesQuery(query: string, bindValues?: any[]): boolean {
  if (query.includes('DELETE FROM sales')) {
    if (query.includes('WHERE') && bindValues && bindValues.length > 0) {
      const thresholdStr = bindValues[0];
      const thresholdDate = new Date(thresholdStr);
      let count = 0;
      Array.from(mockStorage.sales.keys()).forEach(id => {
        const sale = mockStorage.sales.get(id);
        if (sale) {
          const saleTime = new Date(sale.created_at).getTime();
          if (saleTime < thresholdDate.getTime()) {
            mockStorage.sales.delete(id);
            count++;
          }
        }
      });
      console.log(`[Mock DB] Pruned ${count} mock sales older than ${thresholdDate.toISOString()}`);
    } else {
      mockStorage.sales.clear();
    }
    saveMockStorage('sales', mockStorage.sales);
    return true;
  }

  if (query.includes('INSERT INTO sales')) {
    if (bindValues && bindValues.length >= 7) {
      const hasPaymentDetails = query.includes('payment_details');
      // Check if it's a batch insert (multiple tuples)
      // Standard single row tuple has either 10 or 15 parameters
      const numFieldsPerRow = query.includes('original_price_mt') ? 15 : 10;
      
      if (bindValues.length > numFieldsPerRow && bindValues.length % numFieldsPerRow === 0) {
        for (let i = 0; i < bindValues.length; i += numFieldsPerRow) {
          const row = bindValues.slice(i, i + numFieldsPerRow);
          mockStorage.sales.set(row[0], {
            id: row[0],
            receipt_id: row[1],
            product_id: row[2],
            quantity: row[3],
            total_mt: row[4],
            payment_method: row[5],
            status: row[6],
            is_synced: 0,
            user_id: row[7] || null,
            cashier_name: row[8] || null,
            payment_details: row[9] || null,
            original_price_mt: row[10] || null,
            discount_type: row[11] || null,
            discount_value: row[12] || 0,
            authorized_by: row[13] || null,
            created_at: new Date().toISOString()
          });
        }
      } else {
        mockStorage.sales.set(bindValues[0], {
          id: bindValues[0],
          receipt_id: bindValues[1],
          product_id: bindValues[2],
          quantity: bindValues[3],
          total_mt: bindValues[4],
          payment_method: bindValues[5],
          status: bindValues[6],
          is_synced: 0,
          user_id: bindValues[7] || null,
          cashier_name: bindValues[8] || null,
          authorized_by: hasPaymentDetails ? (bindValues[13] || null) : (bindValues[9] || null),
          payment_details: hasPaymentDetails ? (bindValues[9] || null) : null,
          created_at: new Date().toISOString()
        });
      }
      saveMockStorage('sales', mockStorage.sales);
    }
    return true;
  }

  if (query.includes('UPDATE sales SET is_synced = 1')) {
    if (bindValues) {
      bindValues.forEach(id => {
        const sale = mockStorage.sales.get(id);
        if (sale) {
          sale.is_synced = 1;
          mockStorage.sales.set(id, sale);
        }
      });
      saveMockStorage('sales', mockStorage.sales);
    }
    return true;
  }

  if (query.includes('UPDATE sales SET status') || query.includes('UPDATE sales')) {
    if (bindValues && bindValues.length >= 2) {
      const statusVal = bindValues[0];
      const idVal = bindValues[bindValues.length - 1];
      const sale = mockStorage.sales.get(idVal);
      if (sale) {
        sale.status = statusVal;
        sale.is_synced = 0;
        mockStorage.sales.set(idVal, sale);
        saveMockStorage('sales', mockStorage.sales);
      }
    }
    return true;
  }

  return false;
}
