import { getDB } from '../db';
import { supabase } from '../supabase';

export async function syncAuditLogsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const unsynced = await db.select('SELECT * FROM audit_logs WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Audit Logs Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(log => ({
      id: log.id,
      shop_id: shopId,
      user_id: log.user_id || log.user_name || 'System',
      user_name: log.user_name || log.user_id || 'System',
      action: log.action,
      details: log.details,
      created_at: log.created_at
    }));

    let { error } = await supabase.from('audit_logs').upsert(payload, { onConflict: 'id' });
    if (error && (error.code === 'PGRST204' || error.message?.includes('user_name'))) {
      // Fallback: Supabase audit_logs does not have user_name column yet
      const fallbackPayload = payload.map(({ user_name, ...rest }) => rest);
      const res = await supabase.from('audit_logs').upsert(fallbackPayload, { onConflict: 'id' });
      error = res.error;
    }
    if (error) throw error;

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE audit_logs SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM audit_logs WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background audit_logs sync failed.', error);
    return false;
  }
}

/**
 * Audit logs are write-only telemetry for the cloud backoffice.
 * Terminals push their local logs up to Supabase, but do not download
 * the entire multi-terminal historical audit log table to conserve egress.
 */
export async function syncAuditLogsFromCloud(): Promise<boolean> {
  // Telemetry is push-only to save bandwidth and SQLite space
  return false;
}

