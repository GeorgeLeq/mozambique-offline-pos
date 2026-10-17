import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncTillPayoutsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    // Retrieve unsynced records in batches
    const unsynced = await db.select('SELECT * FROM till_payouts WHERE (sync_status = 0 OR is_synced = 0) LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Till Payouts Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(p => ({
      id: p.id,
      shop_id: shopId,
      amount_mt: p.amount_mt ?? p.amount ?? 0,
      amount: p.amount_mt ?? p.amount ?? 0,
      reason: p.reason || 'Sangria',
      authorized_by: p.authorized_by ?? p.user_id ?? 'Admin',
      created_at: p.created_at
    }));

    const { error } = await supabase.from('till_payouts').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const syncedIds = unsynced.map(p => p.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    
    await db.execute(
      `UPDATE till_payouts SET sync_status = 1, is_synced = 1 WHERE id IN (${placeholders})`, 
      syncedIds
    );

    // Check if more remain
    const remaining = await db.select('SELECT id FROM till_payouts WHERE sync_status = 0 OR is_synced = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background till payouts sync failed.', error);
    return false;
  }
}

/**
 * Till payouts are write-only expense tracking events pushed to the cloud.
 * Terminals do not download all global till payouts.
 */
export async function syncTillPayoutsFromCloud(): Promise<boolean> {
  return false;
}

