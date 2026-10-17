import { getDB } from '../db';
import { supabase, isSupabaseConfigured } from '../supabase';

export async function syncDebtPaymentsToCloud(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    let shopId = settings?.[0]?.value;
    if (!shopId && typeof localStorage !== 'undefined') {
      shopId = localStorage.getItem('shop_id') || '';
    }
    if (!shopId) {
      shopId = 'default-moz-shop-' + Math.random().toString(36).substring(2, 9);
      await db.execute('INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)', ['shop_id', shopId]);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shop_id', shopId);
      }
      console.log('[Debt Payments Sync] Auto-generated and saved missing shop_id:', shopId);
    }

    const unsynced = await db.select('SELECT * FROM debt_payments WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Debt Payments Sync] Uploading batch of ${unsynced.length} records to Supabase...`);

    const payload = unsynced.map(dp => ({
      id: dp.id,
      shop_id: shopId,
      debt_id: dp.debt_id,
      amount_mt: Number(dp.amount_paid_mt ?? dp.amount_mt ?? 0),
      payment_method: dp.payment_method || 'cash',
      created_at: dp.created_at,
      receipt_id: dp.receipt_id || null,
      cashier_name: dp.cashier_name || null,
    }));

    const { error } = await supabase.from('debt_payments').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Debt Payments Sync] Supabase upsert skipped (offline/unreachable):', error.message || error);
      return false;
    }

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE debt_payments SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);
    console.log(`[Debt Payments Sync] Successfully synced batch of ${syncedIds.length} debt payments to Supabase.`);

    const remaining = await db.select('SELECT id FROM debt_payments WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error: any) {
    console.warn('[Debt Payments Sync] Background debt_payments sync skipped (offline or network error):', error?.message || error);
    return false;
  }
}

export async function syncDebtPaymentsFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    let shopId = settings?.[0]?.value;
    if (!shopId && typeof localStorage !== 'undefined') {
      shopId = localStorage.getItem('shop_id') || '';
    }
    if (!shopId) return false;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_debt_payments'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    const { data: cloudPayments, error } = await supabase
      .from('debt_payments')
      .select('id, debt_id, amount_mt, payment_method, receipt_id, cashier_name, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.warn('[Debt Payments Sync] Supabase select skipped (offline/unreachable):', error.message, error.details);
      return false;
    }
    if (!cloudPayments || cloudPayments.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_debt_payments', nextPullTime]
      );
      return false;
    }

    let maxCreatedAt = lastPull;

    for (const dp of cloudPayments) {
      if (dp.created_at && dp.created_at > maxCreatedAt) {
        maxCreatedAt = dp.created_at;
      }
      const amt = Number(dp.amount_mt) || 0;
      try {
        await db.execute(
          'INSERT OR REPLACE INTO debt_payments (id, debt_id, amount_paid_mt, amount_mt, payment_method, receipt_id, cashier_name, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            dp.id,
            dp.debt_id,
            amt,
            amt,
            dp.payment_method,
            dp.receipt_id,
            dp.cashier_name,
            dp.created_at
          ]
        );
      } catch (e) {
        await db.execute(
          'INSERT OR REPLACE INTO debt_payments (id, debt_id, amount_paid_mt, payment_method, receipt_id, cashier_name, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [
            dp.id,
            dp.debt_id,
            amt,
            dp.payment_method,
            dp.receipt_id,
            dp.cashier_name,
            dp.created_at
          ]
        );
      }
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_debt_payments', maxCreatedAt]
    );
    console.log(`[Debt Payments Sync] Successfully pulled ${cloudPayments.length} new debt payments from Supabase.`);
    return cloudPayments.length >= 200;
  } catch (error: any) {
    console.warn('[Debt Payments Sync] Background debt_payments pull skipped (offline or network error):', error?.message || error);
    return false;
  }
}

