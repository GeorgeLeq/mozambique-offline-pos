import { mockStorage, saveMockStorage } from '../storage';

/**
 * Handles execute/write operations for 'debts' and 'debt_payments' tables in mockStorage.
 */
export function handleDebtsQuery(query: string, bindValues?: any[]): boolean {
  if (query.includes('INSERT INTO debts') || query.includes('INSERT OR REPLACE INTO debts')) {
    console.log('[DEBUG MockDB debtsHandler] INSERT INTO debts query received:', { query, bindValues });
    if (bindValues && bindValues.length >= 3) {
      const id = bindValues[0];
      const existing = mockStorage.debts.get(id) || {};
      console.log('[DEBUG MockDB debtsHandler] Existing debt record in mockStorage for id:', id, existing);

      const colMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
      const colMap: Record<string, any> = {};
      if (colMatch && colMatch[1]) {
        const cols = colMatch[1].split(',').map(c => c.trim().toLowerCase());
        cols.forEach((col, idx) => {
          if (idx < bindValues.length) {
            colMap[col] = bindValues[idx];
          }
        });
      }

      const customerName = colMap['customer_name'] ?? (bindValues.length > 1 ? bindValues[1] : null) ?? existing.customer_name ?? 'Cliente';
      const amountMt = colMap['amount_mt'] !== undefined ? Number(colMap['amount_mt']) : (bindValues.length > 2 ? Number(bindValues[2]) : (existing.amount_mt ?? 0));
      const status = colMap['status'] ?? (bindValues.length > 3 ? bindValues[3] : null) ?? existing.status ?? 'unpaid';
      const phoneNumber = colMap['phone_number'] !== undefined ? colMap['phone_number'] : (bindValues.length > 4 ? bindValues[4] : (existing.phone_number ?? null));
      const address = colMap['address'] !== undefined ? colMap['address'] : (bindValues.length > 5 ? bindValues[5] : (existing.address ?? null));
      const paymentMethod = colMap['payment_method'] !== undefined ? colMap['payment_method'] : (existing.payment_method ?? null);
      const paidAt = colMap['paid_at'] !== undefined ? colMap['paid_at'] : (existing.paid_at ?? null);
      
      let createdAt = colMap['created_at'] ?? (bindValues.length > 6 ? bindValues[6] : null);
      if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        createdAt = existing.created_at || new Date().toISOString();
      }

      const receiptId = colMap['receipt_id'] !== undefined ? colMap['receipt_id'] : (bindValues.length > 7 ? bindValues[7] : (existing.receipt_id ?? null));
      const cashierName = colMap['cashier_name'] !== undefined ? colMap['cashier_name'] : (bindValues.length > 8 ? bindValues[8] : (existing.cashier_name ?? null));
      const itemsJson = colMap['items_json'] !== undefined ? colMap['items_json'] : (bindValues.length > 9 ? bindValues[9] : (existing.items_json ?? null));

      let syncStatus = 0;
      if (colMap['sync_status'] !== undefined && colMap['sync_status'] !== null) {
        syncStatus = Number(colMap['sync_status']);
      } else if (bindValues.length > 10 && bindValues[10] !== undefined) {
        syncStatus = Number(bindValues[10]);
      } else if (query.includes(', 1)') || query.includes(',1)')) {
        syncStatus = 1;
      }

      const newRecordToSave = {
        ...existing,
        id,
        customer_name: customerName,
        amount_mt: amountMt,
        status,
        phone_number: phoneNumber,
        address,
        payment_method: paymentMethod,
        paid_at: paidAt,
        created_at: createdAt,
        receipt_id: receiptId,
        cashier_name: cashierName,
        items_json: itemsJson,
        sync_status: syncStatus
      };

      mockStorage.debts.set(id, newRecordToSave);
      saveMockStorage('debts', mockStorage.debts);
      console.log(`[DEBUG MockDB debtsHandler] Successfully saved debt ${id}. Total debts in mockStorage: ${mockStorage.debts.size}`, Array.from(mockStorage.debts.entries()));
    }
    return true;
  }

  if (query.includes('UPDATE debts SET customer_name')) {
    if (bindValues && bindValues.length >= 5) {
      const id = bindValues[bindValues.length - 1];
      let debt = mockStorage.debts.get(id);
      if (!debt) {
        for (const [_, v] of mockStorage.debts.entries()) {
          if (v && (v.id === id || String(v.id) === String(id))) {
            debt = v;
            break;
          }
        }
      }
      if (!debt) {
        debt = { id, created_at: new Date().toISOString() };
      }
      debt.customer_name = bindValues[0] ?? debt.customer_name;
      debt.phone_number = bindValues[1] ?? debt.phone_number;
      debt.address = bindValues[2] ?? debt.address;
      debt.amount_mt = bindValues[3] !== undefined ? Number(bindValues[3]) : debt.amount_mt;
      debt.items_json = bindValues[4] !== undefined ? bindValues[4] : debt.items_json;
      debt.sync_status = 0;
      mockStorage.debts.set(id, debt);
      saveMockStorage('debts', mockStorage.debts);
    }
    return true;
  }

  if (query.includes('UPDATE debts SET status')) {
    if (bindValues && bindValues.length >= 4) {
      const debtId = bindValues[bindValues.length - 1];
      let debt = mockStorage.debts.get(debtId);
      if (!debt) {
        for (const [_, v] of mockStorage.debts.entries()) {
          if (v && (v.id === debtId || String(v.id) === String(debtId))) {
            debt = v;
            break;
          }
        }
      }
      if (debt) {
        debt.status = bindValues[0];
        if (debt.status === 'paid' || query.includes('amount_mt = 0')) {
          debt.amount_mt = 0;
        }
        debt.paid_at = bindValues[1];
        debt.payment_method = bindValues[2];
        debt.sync_status = 0;
        mockStorage.debts.set(debt.id || debtId, debt);
        saveMockStorage('debts', mockStorage.debts);
      }
    }
    return true;
  }

  if (query.includes('UPDATE debts SET sync_status = 1')) {
    if (bindValues && bindValues.length > 0) {
      bindValues.forEach(id => {
        const debt = mockStorage.debts.get(id);
        if (debt) {
          debt.sync_status = 1;
          mockStorage.debts.set(id, debt);
        }
      });
      saveMockStorage('debts', mockStorage.debts);
    }
    return true;
  }

  if (query.includes('DELETE FROM debts')) {
    if (query.includes('WHERE id = ?') && bindValues && bindValues.length > 0) {
      mockStorage.debts.delete(bindValues[0]);
    } else {
      mockStorage.debts.clear();
    }
    saveMockStorage('debts', mockStorage.debts);
    return true;
  }

  if (query.includes('INSERT INTO debt_payments') || query.includes('INSERT OR REPLACE INTO debt_payments')) {
    if (bindValues && bindValues.length >= 3) {
      const id = bindValues[0];
      const existing = mockStorage.debt_payments.get(id) || {};

      const colMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
      const colMap: Record<string, any> = {};
      if (colMatch && colMatch[1]) {
        const cols = colMatch[1].split(',').map(c => c.trim().toLowerCase());
        cols.forEach((col, idx) => {
          colMap[col] = bindValues[idx];
        });
      }

      let createdAt = colMap['created_at'];
      if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        createdAt = existing.created_at || new Date().toISOString();
      }

      const amt = Number(colMap['amount_mt'] ?? colMap['amount_paid_mt'] ?? bindValues[2]) || 0;

      mockStorage.debt_payments.set(id, {
        ...existing,
        id,
        debt_id: colMap['debt_id'] ?? bindValues[1],
        amount_mt: amt,
        amount_paid_mt: amt,
        payment_method: colMap['payment_method'] ?? bindValues[3] ?? 'cash',
        receipt_id: colMap['receipt_id'] ?? (query.includes('receipt_id') ? bindValues[4] : null),
        cashier_name: colMap['cashier_name'] ?? (query.includes('cashier_name') ? bindValues[5] : null),
        created_at: createdAt,
        sync_status: 0
      });
      saveMockStorage('debt_payments', mockStorage.debt_payments);
    }
    return true;
  }

  if (query.includes('UPDATE debt_payments SET sync_status = 1')) {
    if (bindValues && bindValues.length > 0) {
      bindValues.forEach(id => {
        const dp = mockStorage.debt_payments.get(id);
        if (dp) {
          dp.sync_status = 1;
          mockStorage.debt_payments.set(id, dp);
        }
      });
      saveMockStorage('debt_payments', mockStorage.debt_payments);
    }
    return true;
  }

  if (query.includes('DELETE FROM debt_payments')) {
    if (query.includes('WHERE debt_id = ?') && bindValues && bindValues.length > 0) {
      const debtId = bindValues[0];
      Array.from(mockStorage.debt_payments.keys()).forEach(id => {
        const p = mockStorage.debt_payments.get(id);
        if (p && p.debt_id === debtId) {
          mockStorage.debt_payments.delete(id);
        }
      });
    } else if (query.includes('WHERE id = ?') && bindValues && bindValues.length > 0) {
      mockStorage.debt_payments.delete(bindValues[0]);
    } else {
      mockStorage.debt_payments.clear();
    }
    saveMockStorage('debt_payments', mockStorage.debt_payments);
    return true;
  }

  if (query.includes('UPDATE debts SET amount_mt = amount_mt -') || query.includes('UPDATE debts SET amount_mt = amount_mt')) {
    if (bindValues && bindValues.length >= 2) {
      const amt = Number(bindValues[0]) || 0;
      const debtId = bindValues[1];
      let debt = mockStorage.debts.get(debtId);
      if (!debt) {
        for (const [_, v] of mockStorage.debts.entries()) {
          if (v && (v.id === debtId || String(v.id) === String(debtId))) {
            debt = v;
            break;
          }
        }
      }
      if (debt) {
        debt.amount_mt = Math.max(0, (debt.amount_mt || 0) - amt);
        if (debt.amount_mt === 0) {
          debt.status = 'paid';
        }
        debt.sync_status = 0;
        mockStorage.debts.set(debt.id || debtId, debt);
        saveMockStorage('debts', mockStorage.debts);
      }
    }
    return true;
  }

  return false;
}
