import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncShiftReportsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const unsynced = await db.select('SELECT * FROM shift_reports WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Shift Reports Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(s => ({
      id: s.id,
      shop_id: shopId,
      user_id: s.user_id,
      user_name: s.user_name || 'Operador',
      opening_cash: s.opening_cash ?? 0,
      closing_cash: s.closing_cash ?? s.reported_amount_mt ?? 0,
      expected_cash: s.expected_cash ?? s.expected_amount_mt ?? 0,
      discrepancy: s.discrepancy ?? s.difference_mt ?? 0,
      reported_amount_mt: s.closing_cash ?? s.reported_amount_mt ?? 0,
      expected_amount_mt: s.expected_cash ?? s.expected_amount_mt ?? 0,
      difference_mt: s.discrepancy ?? s.difference_mt ?? 0,
      status: s.status || 'closed',
      details_json: s.details_json,
      created_at: s.opened_at || s.created_at || new Date().toISOString()
    }));

    const { error } = await supabase.from('shift_reports').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    // Archive cloud shift reports older than 90 days in Supabase instead of deleting them
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      await supabase
        .from('shift_reports')
        .update({ is_archived: true })
        .eq('shop_id', shopId)
        .lt('created_at', ninetyDaysAgo.toISOString());
    } catch (e) {
      // Ignore if permissions restricted
    }

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE shift_reports SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM shift_reports WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background shift_reports sync failed.', error);
    return false;
  }
}

/**
 * Shift reports are write-only financial summaries sent to the cloud.
 * Terminals push completed shift summaries up to Supabase.
 * Downloading historical shift logs across all terminals to local POS is disabled to conserve egress.
 */
export async function syncShiftReportsFromCloud(): Promise<boolean> {
  return false;
}

