import { getDB } from '../db';
import { supabase } from '../supabase';

export interface PosAnnouncement {
  id: string;
  shop_id: string;
  cashier_id?: string | null;
  target_name?: string;
  message: string;
  priority: 'normal' | 'urgent';
  is_acknowledged: boolean | number;
  acknowledged_at?: string | null;
  created_at: string;
  sync_status?: number;
}

export async function syncPosAnnouncementsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const unsynced = await db.select('SELECT * FROM pos_announcements WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[POS Announcements Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(a => ({
      id: a.id,
      shop_id: shopId,
      cashier_id: a.cashier_id || null,
      target_name: a.target_name || 'All Cashiers',
      message: a.message,
      priority: a.priority || 'normal',
      is_acknowledged: Boolean(a.is_acknowledged),
      acknowledged_at: a.acknowledged_at || null,
      created_at: a.created_at
    }));

    const { error } = await supabase.from('pos_announcements').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE pos_announcements SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    const remaining = await db.select('SELECT id FROM pos_announcements WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background pos_announcements upload sync failed.', error);
    return false;
  }
}

export async function syncPosAnnouncementsFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_pos_announcements'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    const { data: cloudAnnouncements, error } = await supabase
      .from('pos_announcements')
      .select('id, shop_id, cashier_id, target_name, message, priority, is_acknowledged, acknowledged_at, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    if (cloudAnnouncements && cloudAnnouncements.length > 0) {
      console.log(`[POS Announcements Sync] Downlinking ${cloudAnnouncements.length} announcements from cloud...`);

      for (const ann of cloudAnnouncements) {
        await db.execute(
          `INSERT OR REPLACE INTO pos_announcements 
           (id, shop_id, cashier_id, target_name, message, priority, is_acknowledged, acknowledged_at, created_at, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            ann.id,
            ann.shop_id,
            ann.cashier_id || null,
            ann.target_name || 'All Cashiers',
            ann.message,
            ann.priority || 'normal',
            ann.is_acknowledged ? 1 : 0,
            ann.acknowledged_at || null,
            ann.created_at
          ]
        );
      }

      // Notify UI via window custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos-announcements-updated'));
      }
    }

    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value, sync_status, updated_at) VALUES ('last_pull_pos_announcements', ?, 1, CURRENT_TIMESTAMP)",
      [nextPullTime]
    );

    return (cloudAnnouncements && cloudAnnouncements.length === 100);
  } catch (error) {
    console.warn('Background pos_announcements pull sync failed.', error);
    return false;
  }
}
