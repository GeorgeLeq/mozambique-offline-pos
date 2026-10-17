import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncSettingsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settingsList = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settingsList || settingsList.length === 0) return false;
    const shopId = settingsList[0].value;

    const unsynced = await db.select('SELECT * FROM settings WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Settings Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(s => ({
      key: s.key,
      shop_id: shopId,
      value: s.value,
      updated_at: new Date().toISOString()
    }));

    // Settings table in Supabase has primary key (shop_id, key)
    let { error } = await supabase.from('settings').upsert(payload, { onConflict: 'shop_id, key' });
    if (error && (error.code === 'PGRST204' || error.message?.includes('updated_at'))) {
      // Fallback: Supabase table does not have updated_at column yet
      const fallbackPayload = payload.map(({ updated_at, ...rest }) => rest);
      const res = await supabase.from('settings').upsert(fallbackPayload, { onConflict: 'shop_id, key' });
      error = res.error;
    }
    if (error) throw error;

    const syncedKeys = unsynced.map(s => s.key);
    const placeholders = syncedKeys.map(() => '?').join(',');
    await db.execute(`UPDATE settings SET sync_status = 1 WHERE key IN (${placeholders})`, syncedKeys);
    console.log(`Successfully pushed batch of ${syncedKeys.length} settings to Supabase.`);

    const remaining = await db.select('SELECT key FROM settings WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background settings sync failed.', error);
    return false;
  }
}

export async function syncSettingsFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settingsList = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settingsList || settingsList.length === 0) return false;
    const shopId = settingsList[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_settings'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    let cloudSettings: any[] | null = null;
    const sRes = await supabase
      .from('settings')
      .select('key, value, updated_at')
      .eq('shop_id', shopId)
      .gt('updated_at', lastPull)
      .order('updated_at', { ascending: true })
      .limit(100);

    let data: any[] | null = sRes.data;
    let error = sRes.error;

    if (error && (error.code === '42703' || error.message?.includes('updated_at'))) {
      // Fallback: Supabase table does not have updated_at column yet
      const fallback = await supabase
        .from('settings')
        .select('key, value')
        .eq('shop_id', shopId)
        .limit(100);
      data = fallback.data as any[];
      error = fallback.error;
    }

    if (error) throw error;
    cloudSettings = data;
    if (!cloudSettings || cloudSettings.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_settings', nextPullTime]
      );
      return false;
    }

    let maxUpdatedAt = lastPull;

    for (const s of cloudSettings) {
      if (s.updated_at && s.updated_at > maxUpdatedAt) {
        maxUpdatedAt = s.updated_at;
      }
      if (s.key === 'shop_id' || s.key === 'device_id') continue;
      if (s.key === 'last_pull_settings') continue; // Avoid self-overwriting sync metadata
      
      // Exclude local hardware configurations (like terminal-specific printer options) 
      // from being overwritten by remote cloud pulls
      if (s.key.startsWith('printer_')) continue;
      
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        [s.key, s.value]
      );
      localStorage.setItem(s.key, s.value);
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_settings', maxUpdatedAt]
    );
    console.log(`Successfully pulled ${cloudSettings.length} settings from Supabase.`);
    return cloudSettings.length >= 100;
  } catch (error) {
    console.warn('Background settings pull failed.', error);
    return false;
  }
}

