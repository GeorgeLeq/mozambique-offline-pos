import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncSpoiledItemsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    // Batch query of unsynced items
    const unsynced = await db.select('SELECT * FROM spoiled_items WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Spoiled Items Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(s => ({
      id: s.id,
      shop_id: shopId,
      product_id: s.product_id,
      quantity: s.quantity,
      reason: s.reason,
      authorized_by: s.authorized_by,
      sale_id: s.sale_id || null,
      receipt_id: s.receipt_id || null,
      created_at: s.created_at
    }));

    const { error } = await supabase.from('spoiled_items').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE spoiled_items SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    // Check if more unsynced items remain
    const remaining = await db.select('SELECT id FROM spoiled_items WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background spoiled items sync failed.', error);
    return false;
  }
}

/**
 * Spoiled/damaged items are write-only inventory waste audit logs sent to the cloud.
 * Terminals do not download historical waste logs.
 */
export async function syncSpoiledItemsFromCloud(): Promise<boolean> {
  return false;
}


