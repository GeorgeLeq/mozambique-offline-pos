import { getDB } from '../db';
import { supabase, isSupabaseConfigured } from '../supabase';

export async function syncNotificationsToCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const unsynced = await db.select('SELECT * FROM notifications WHERE sync_status = 0 LIMIT 50') as any[];
    if (!unsynced || unsynced.length === 0) return false;

    console.log(`[Notifications Sync] Uploading batch of ${unsynced.length} records...`);

    const payload = unsynced.map(n => ({
      id: n.id,
      shop_id: shopId,
      type: n.type,
      title: n.title,
      message: n.message,
      is_read: n.is_read === 1 || n.is_read === true,
      action_url: n.action_url,
      created_at: n.created_at
    }));

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }

    const syncedIds = unsynced.map(s => s.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    await db.execute(`UPDATE notifications SET sync_status = 1 WHERE id IN (${placeholders})`, syncedIds);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM notifications WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background notifications sync failed.', error);
    return false;
  }
}

export async function syncNotificationsFromCloud(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return false;
    const db = await getDB();
    const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_notifications'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    const { data: cloudNotifications, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, action_url, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    if (!cloudNotifications || cloudNotifications.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_notifications', nextPullTime]
      );
      return false;
    }

    let maxCreatedAt = lastPull;

    for (const item of cloudNotifications) {
      if (item.created_at && item.created_at > maxCreatedAt) {
        maxCreatedAt = item.created_at;
      }
      await db.execute(
        'INSERT OR REPLACE INTO notifications (id, type, title, message, is_read, action_url, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [
          item.id,
          item.type,
          item.title,
          item.message,
          item.is_read ? 1 : 0,
          item.action_url,
          item.created_at
        ]
      );
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_notifications', maxCreatedAt]
    );
    console.log(`Successfully pulled ${cloudNotifications.length} notifications from Supabase.`);
    return cloudNotifications.length >= 100;
  } catch (error) {
    console.warn('Background notifications pull failed.', error);
    return false;
  }
}

/**
 * Deletes a single notification from local SQLite and deletes it from Supabase.
 */
export async function deleteNotificationLocalAndCloud(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    await db.execute('DELETE FROM notifications WHERE id = ?', [id]);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (cloudErr) {
        console.warn('Cloud notification deletion error (will retry or ignore)', cloudErr);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to delete notification', err);
    return false;
  }
}

/**
 * Deletes all read notifications from both local SQLite and Supabase.
 */
export async function clearReadNotificationsLocalAndCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    await db.execute('DELETE FROM notifications WHERE is_read = 1');

    if (isSupabaseConfigured()) {
      try {
        const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
        if (settings && settings.length > 0) {
          const shopId = settings[0].value;
          await supabase.from('notifications').delete().eq('shop_id', shopId).eq('is_read', true);
        }
      } catch (cloudErr) {
        console.warn('Cloud clear read notifications error', cloudErr);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to clear read notifications', err);
    return false;
  }
}

/**
 * Deletes ALL notifications from both local SQLite and Supabase.
 */
export async function clearAllNotificationsLocalAndCloud(): Promise<boolean> {
  try {
    const db = await getDB();
    await db.execute('DELETE FROM notifications');

    if (isSupabaseConfigured()) {
      try {
        const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
        if (settings && settings.length > 0) {
          const shopId = settings[0].value;
          await supabase.from('notifications').delete().eq('shop_id', shopId);
        }
      } catch (cloudErr) {
        console.warn('Cloud clear all notifications error', cloudErr);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to clear all notifications', err);
    return false;
  }
}

/**
 * Applies auto-retention policy (e.g. 15, 30, 90 days or 0 for disabled)
 * Prunes notifications older than N days from local SQLite and Supabase.
 */
export async function applyNotificationRetention(days: number): Promise<boolean> {
  try {
    const db = await getDB();
    // Save the retention preference
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 0)',
      ['notif_retention_days', String(days)]
    );

    if (days > 0) {
      // Calculate ISO timestamp cutoff for portability
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      await db.execute('DELETE FROM notifications WHERE created_at < ?', [cutoffDate]);

      if (isSupabaseConfigured()) {
        try {
          const settings = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as { value: string }[];
          if (settings && settings.length > 0) {
            const shopId = settings[0].value;
            // Attempt RPC first, fallback to direct delete
            const { error: rpcErr } = await supabase.rpc('clean_old_notifications', {
              p_shop_id: shopId,
              p_retention_days: days,
              p_only_read: false
            });

            if (rpcErr) {
              await supabase
                .from('notifications')
                .delete()
                .eq('shop_id', shopId)
                .lt('created_at', cutoffDate);
            }
          }
        } catch (cloudErr) {
          console.warn('Cloud notification auto-purge error', cloudErr);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to apply notification retention', err);
    return false;
  }
}

/**
 * Runs auto-prune on startup or background based on saved retention setting.
 */
export async function autoPruneOldNotifications(): Promise<void> {
  try {
    const db = await getDB();
    const rows = await db.select("SELECT value FROM settings WHERE key = 'notif_retention_days'") as { value: string }[];
    const retentionDays = rows && rows.length > 0 ? parseInt(rows[0].value, 10) : 30; // Default 30 days
    if (retentionDays > 0) {
      await applyNotificationRetention(retentionDays);
    }
  } catch (e) {
    console.warn('Auto-pruning old notifications skipped', e);
  }
}

