import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncScanHistoryToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    const shopId = settings?.[0]?.value || null;

    const unsynced = await db.select('SELECT * FROM scan_history WHERE (sync_status = 0 OR is_synced = 0) LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Scan History Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(s => ({
      id: s.id,
      shop_id: shopId,
      shift_id: s.shift_id || null,
      barcode: s.barcode,
      product_name: s.product_name || null,
      product_id: s.product_id || null,
      status: s.status || 'success',
      quantity: s.quantity ?? 1,
      unit_price: s.unit_price ?? 0,
      total_mt: s.total_mt ?? 0,
      payment_method: s.payment_method || null,
      sale_id: s.sale_id || null,
      terminal_name: s.terminal_name || null,
      user_id: s.user_id,
      created_at: s.created_at
    }));

    const { error } = await supabase.from('scan_history').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE scan_history SET sync_status = 1, is_synced = 1 WHERE id IN (${placeholders})`, syncedIds);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM scan_history WHERE sync_status = 0 OR is_synced = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background scan history push failed.', error);
    return false;
  }
}

/**
 * Scan history is local/write-only telemetry for the cloud backoffice.
 * Terminals push their scan logs up, but do not download all scans from the cloud.
 */
export async function syncScanHistoryFromCloud(): Promise<boolean> {
  return false;
}
