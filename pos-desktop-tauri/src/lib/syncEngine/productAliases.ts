import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncProductAliasesToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const unsynced = await db.select('SELECT * FROM product_aliases WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Product Aliases Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(a => ({
      id: a.id,
      shop_id: shopId,
      product_id: a.product_id,
      barcode: a.barcode,
      created_at: a.created_at
    }));

    const { error } = await supabase.from('product_aliases').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const syncedIds = unsynced.map(a => a.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE product_aliases SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    const remaining = await db.select('SELECT id FROM product_aliases WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background product aliases push sync failed.', error);
    return false;
  }
}

export async function syncProductAliasesFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_product_aliases'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    // Fetch new or updated aliases from the cloud with explicit column selection
    const { data: cloudAliases, error } = await supabase
      .from('product_aliases')
      .select('id, shop_id, product_id, barcode, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    if (!cloudAliases || cloudAliases.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_product_aliases', nextPullTime]
      );
      return false;
    }

    let maxCreatedAt = lastPull;

    for (const ca of cloudAliases) {
      if (ca.created_at && ca.created_at > maxCreatedAt) {
        maxCreatedAt = ca.created_at;
      }
      await db.execute(
        'INSERT OR REPLACE INTO product_aliases (id, product_id, barcode, sync_status) VALUES (?, ?, ?, 1)',
        [ca.id, ca.product_id, ca.barcode]
      );
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_product_aliases', maxCreatedAt]
    );
    console.log(`Successfully pulled ${cloudAliases.length} product aliases from Supabase.`);
    return cloudAliases.length >= 200;
  } catch (error) {
    console.warn('Background product aliases pull sync failed.', error);
    return false;
  }
}
