import { getDB } from '../db';
import { supabase } from '../supabase';
import { User } from '../../types';

/**
 * Background task to sync local users to Supabase.
 */
export async function syncUsersToCloud(): Promise<boolean> {
  try {
    const db = await getDB();

    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];
    
    if (!settings || settings.length === 0) {
      return false;
    }
    const shopId = settings[0].value;

    // Find unsynced users in batches
    const unsyncedUsers = await db.select(
      'SELECT * FROM users WHERE sync_status = 0 LIMIT 50'
    ) as User[];

    if (!unsyncedUsers || unsyncedUsers.length === 0) {
      return false;
    }

    console.log(`[Users Sync] Uploading batch of ${unsyncedUsers.length} users to the cloud...`);

    const payload = unsyncedUsers.map(user => ({
      id: user.id,
      shop_id: shopId,
      name: user.name,
      role: user.role,
      pin_hash: user.pin, // In a real app, this should be a hashed PIN
      permissions_json: user.permissions_json,
      opening_cash: user.opening_cash,
      needs_shift_cash: user.needs_shift_cash !== 0, // Convert SQLite 1/0 to Boolean for Supabase/PostgreSQL
      is_blocked: user.is_blocked === 1, // Convert SQLite 1/0 to Boolean for Supabase/PostgreSQL
      current_shift_start: user.current_shift_start || null,
      current_shift_cash: user.current_shift_cash !== undefined && user.current_shift_cash !== null ? user.current_shift_cash : null,
      terminal_name: user.terminal_name || '',
      is_deleted: user.is_deleted === 1,
      deleted_at: user.deleted_at || null,
      deletion_reason: user.deletion_reason || null,
      deleted_by: user.deleted_by || null,
      sync_status: true
    }));

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    // Update local SQLite rows to sync_status = 1
    const syncedIds = unsyncedUsers.map(user => user.id);
    const placeholders = syncedIds.map(() => '?').join(',');
    
    await db.execute(
      `UPDATE users SET sync_status = 1 WHERE id IN (${placeholders})`,
      syncedIds
    );
    console.log(`Successfully synced batch of ${syncedIds.length} users to Supabase.`);

    // Check if more remain
    const remaining = await db.select('SELECT id FROM users WHERE sync_status = 0 LIMIT 1') as any[];
    return remaining.length > 0;
  } catch (error) {
    console.warn('Background users sync failed. Will retry next time.', error);
    return false;
  }
}

/**
 * Background task to sync users from Supabase (including blocked status).
 */
export async function syncUsersFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();

    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];
    
    if (!settings || settings.length === 0) {
      return false;
    }
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_users'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    // Fetch from Supabase with timestamp filter and explicit column list
    let cloudUsers: any[] | null = null;
    const uRes = await supabase
      .from('users')
      .select('id, name, role, pin_hash, permissions_json, opening_cash, needs_shift_cash, is_blocked, current_shift_start, current_shift_cash, terminal_name, is_deleted, deleted_at, deletion_reason, deleted_by, created_at')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(100);

    let uData: any[] | null = uRes.data;
    let uError = uRes.error;

    if (uError && (uError.code === '42703' || uError.message?.includes('is_deleted') || uError.message?.includes('deleted_at'))) {
      // Fallback: Supabase users table does not have soft-delete columns yet
      const fallback = await supabase
        .from('users')
        .select('id, name, role, pin_hash, permissions_json, opening_cash, needs_shift_cash, is_blocked, current_shift_start, current_shift_cash, terminal_name, created_at')
        .eq('shop_id', shopId)
        .gt('created_at', lastPull)
        .order('created_at', { ascending: true })
        .limit(100);
      uData = fallback.data as any[];
      uError = fallback.error;
    }

    if (uError) {
      throw uError;
    }
    cloudUsers = uData;

    if (!cloudUsers || cloudUsers.length === 0) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_users', nextPullTime]
      );
      return false;
    }

    let maxCreatedAt = lastPull;

    for (const cloudUser of cloudUsers) {
      if (cloudUser.created_at && cloudUser.created_at > maxCreatedAt) {
        maxCreatedAt = cloudUser.created_at;
      }
      const isBlocked = cloudUser.is_blocked ? 1 : 0;
      const needsShiftCash = cloudUser.needs_shift_cash ? 1 : 0;
      const isDeleted = cloudUser.is_deleted ? 1 : 0;

      // Check if user exists locally by ID or by PIN
      const local = await db.select('SELECT id FROM users WHERE id = ?', [cloudUser.id]) as any[];
      const localByPin = (local.length === 0 && cloudUser.pin_hash)
        ? (await db.select('SELECT id FROM users WHERE pin = ?', [cloudUser.pin_hash]) as any[])
        : [];

      if (local.length > 0) {
        // Update local user, but ONLY if local sync_status is 1 (to prevent overwriting local pending changes)
        const pending = await db.select('SELECT sync_status FROM users WHERE id = ? AND sync_status = 0', [cloudUser.id]) as any[];
        if (pending.length === 0) {
          await db.execute(
            'UPDATE users SET name = ?, role = ?, pin = ?, permissions_json = ?, opening_cash = ?, needs_shift_cash = ?, is_blocked = ?, current_shift_start = ?, current_shift_cash = ?, terminal_name = ?, is_deleted = ?, deleted_at = ?, deletion_reason = ?, deleted_by = ?, sync_status = 1 WHERE id = ?',
            [
              cloudUser.name,
              cloudUser.role,
              cloudUser.pin_hash,
              cloudUser.permissions_json,
              cloudUser.opening_cash,
              needsShiftCash,
              isBlocked,
              cloudUser.current_shift_start || null,
              cloudUser.current_shift_cash || null,
              cloudUser.terminal_name || '',
              isDeleted,
              cloudUser.deleted_at || null,
              cloudUser.deletion_reason || null,
              cloudUser.deleted_by || null,
              cloudUser.id
            ]
          );
        }
      } else if (localByPin.length > 0) {
        // An existing local user has this PIN (e.g. initial seed admin '1' vs cloud UUID).
        // Adopt the authoritative cloud ID and update local references to avoid UNIQUE(pin) crash.
        const oldId = localByPin[0].id;
        try { await db.execute('UPDATE sales SET user_id = ? WHERE user_id = ?', [cloudUser.id, oldId]); } catch {}
        try { await db.execute('UPDATE shift_reports SET user_id = ? WHERE user_id = ?', [cloudUser.id, oldId]); } catch {}
        try { await db.execute('UPDATE audit_logs SET user_id = ? WHERE user_id = ?', [cloudUser.id, oldId]); } catch {}
        try { await db.execute('UPDATE scan_history SET user_id = ? WHERE user_id = ?', [cloudUser.id, oldId]); } catch {}

        await db.execute(
          'UPDATE users SET id = ?, name = ?, role = ?, pin = ?, permissions_json = ?, opening_cash = ?, needs_shift_cash = ?, is_blocked = ?, current_shift_start = ?, current_shift_cash = ?, terminal_name = ?, is_deleted = ?, deleted_at = ?, deletion_reason = ?, deleted_by = ?, sync_status = 1 WHERE id = ?',
          [
            cloudUser.id,
            cloudUser.name,
            cloudUser.role,
            cloudUser.pin_hash,
            cloudUser.permissions_json,
            cloudUser.opening_cash,
            needsShiftCash,
            isBlocked,
            cloudUser.current_shift_start || null,
            cloudUser.current_shift_cash || null,
            cloudUser.terminal_name || '',
            isDeleted,
            cloudUser.deleted_at || null,
            cloudUser.deletion_reason || null,
            cloudUser.deleted_by || null,
            oldId
          ]
        );
      } else {
        // Insert new user
        await db.execute(
          'INSERT INTO users (id, name, role, pin, permissions_json, opening_cash, needs_shift_cash, is_blocked, current_shift_start, current_shift_cash, terminal_name, is_deleted, deleted_at, deletion_reason, deleted_by, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            cloudUser.id,
            cloudUser.name,
            cloudUser.role,
            cloudUser.pin_hash,
            cloudUser.permissions_json,
            cloudUser.opening_cash,
            needsShiftCash,
            isBlocked,
            cloudUser.current_shift_start || null,
            cloudUser.current_shift_cash || null,
            cloudUser.terminal_name || '',
            isDeleted,
            cloudUser.deleted_at || null,
            cloudUser.deletion_reason || null,
            cloudUser.deleted_by || null
          ]
        );
      }
    }
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_users', maxCreatedAt]
    );
    console.log(`Successfully pulled ${cloudUsers.length} users from Supabase.`);
    return true;
  } catch (error) {
    console.warn('Background users down-sync failed. Will retry next time.', error);
    return false;
  }
}
