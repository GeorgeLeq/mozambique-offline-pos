import { getDB } from '../db';
import { supabase } from '../supabase';
import { LocalSale } from './types';
import { encryptSensitiveData } from '../security/enterpriseSync';
import { triggerDebouncedLiveMetricsSync } from './liveMetrics';

/**
 * Background task to sync local sales to Supabase.
 * Fails silently if the internet drops, allowing it to retry next time.
 */
export async function syncSalesToCloud(): Promise<boolean> {
  try {
    const db = await getDB();

    // 0. Get the shop_id from local settings
    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];
    
    if (!settings || settings.length === 0) {
      console.warn('Cannot sync: shop_id not found in local settings.');
      return false;
    }
    const shopId = settings[0].value;

    // 1. Find a limited batch of unsynced sales
    const unsyncedSales = await db.select(
      'SELECT * FROM sales WHERE is_synced = 0 LIMIT 50'
    ) as LocalSale[];

    if (!unsyncedSales || unsyncedSales.length === 0) {
      return false;
    }

    console.log(`[Sales Sync] Uploading batch of ${unsyncedSales.length} sales to the cloud...`);

    const payload = await Promise.all(unsyncedSales.map(async (sale: any) => ({
      id: sale.id,
      shop_id: shopId,
      receipt_id: sale.receipt_id,
      product_id: sale.product_id,
      quantity: sale.quantity,
      total_mt: sale.total_mt,
      payment_method: sale.payment_method,
      status: sale.status,
      user_id: sale.user_id,
      cashier_name: sale.cashier_name,
      payment_details: await encryptSensitiveData(sale.payment_details),
      original_price_mt: sale.original_price_mt,
      discount_type: sale.discount_type || 'none',
      discount_value: sale.discount_value || 0,
      authorized_by: sale.authorized_by,
      created_at: sale.created_at,
    })));

    const { error } = await supabase
      .from('sales')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    const syncedIds = unsyncedSales.map(sale => sale.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    
    await db.execute(
      `UPDATE sales SET is_synced = 1 WHERE id IN (${placeholders})`,
      syncedIds
    );
    console.log(`Successfully synced batch of ${syncedIds.length} sales to Supabase.`);

    // Trigger debounced live companion metrics update
    triggerDebouncedLiveMetricsSync(2000);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM sales WHERE is_synced = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background sales sync failed. Will retry next time.', error);
    return false;
  }
}

export async function syncSalesFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_sales'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    const { data: cloudSales, error } = await supabase
      .from('sales')
      .select('id, receipt_id, product_id, quantity, total_mt, payment_method, status, user_id, cashier_name, payment_details, original_price_mt, discount_type, discount_value, authorized_by, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    if (!cloudSales || cloudSales.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_sales', nextPullTime]
      );
      return false;
    }

    let maxCreatedAt = lastPull;

    for (const s of cloudSales) {
      if (s.created_at && s.created_at > maxCreatedAt) {
        maxCreatedAt = s.created_at;
      }
      await db.execute(
        `INSERT OR REPLACE INTO sales (
          id, receipt_id, product_id, quantity, total_mt, payment_method, 
          status, user_id, cashier_name, payment_details, original_price_mt, 
          discount_type, discount_value, authorized_by, created_at, is_synced, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          s.id,
          s.receipt_id,
          s.product_id,
          s.quantity,
          s.total_mt,
          s.payment_method,
          s.status,
          s.user_id,
          s.cashier_name,
          s.payment_details,
          s.original_price_mt,
          s.discount_type || 'none',
          s.discount_value || 0,
          s.authorized_by,
          s.created_at
        ]
      );
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_sales', maxCreatedAt]
    );
    console.log(`Successfully pulled ${cloudSales.length} new sales from Supabase.`);
    return cloudSales.length >= 200;
  } catch (error) {
    console.warn('Background sales pull failed.', error);
    return false;
  }
}

