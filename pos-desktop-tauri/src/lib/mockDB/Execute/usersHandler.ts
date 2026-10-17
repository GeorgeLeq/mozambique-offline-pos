import { mockStorage, saveMockStorage } from '../storage';

/**
 * Handles execute/write operations for the 'users' table in mockStorage.
 */
export function handleUsersQuery(query: string, bindValues?: any[]): boolean {
  if (query.includes('INSERT INTO users') || query.includes('INSERT OR REPLACE INTO users')) {
    if (bindValues && bindValues.length >= 4) {
      const id = bindValues[0];
      const isFullInsert = bindValues.length >= 9;
      const isNewFullInsert = bindValues.length >= 11;
      const hasTerminalName = bindValues.length >= 12;
      mockStorage.users.set(id, {
        id: id,
        name: bindValues[1],
        role: bindValues[2],
        pin: bindValues[3],
        permissions_json: isFullInsert ? bindValues[4] : undefined,
        opening_cash: isFullInsert ? bindValues[5] : undefined,
        needs_shift_cash: isFullInsert ? bindValues[6] : 1,
        is_blocked: isFullInsert ? bindValues[7] : 0,
        current_shift_start: hasTerminalName ? bindValues[8] : (isNewFullInsert ? bindValues[8] : undefined),
        current_shift_cash: hasTerminalName ? bindValues[9] : (isNewFullInsert ? bindValues[9] : undefined),
        terminal_name: hasTerminalName ? bindValues[10] : '',
        sync_status: hasTerminalName ? bindValues[11] : (isNewFullInsert ? bindValues[10] : (isFullInsert ? bindValues[8] : 0))
      });
      saveMockStorage('users', mockStorage.users);
    }
    return true;
  }

  if (query.includes('UPDATE users SET is_deleted = 1')) {
    if (bindValues && bindValues.length >= 2) {
      const deletedAt = bindValues[0];
      const deletionReason = bindValues.length >= 3 ? bindValues[1] : undefined;
      const userId = bindValues[bindValues.length - 1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.is_deleted = 1;
        user.deleted_at = deletedAt;
        user.deletion_reason = deletionReason;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET is_deleted = 0')) {
    if (bindValues && bindValues.length >= 1) {
      const userId = bindValues[bindValues.length - 1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.is_deleted = 0;
        user.deleted_at = null;
        user.deletion_reason = null;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('DELETE FROM users WHERE is_deleted = 1')) {
    for (const [id, u] of Array.from(mockStorage.users.entries())) {
      if (u.is_deleted === 1) {
        mockStorage.users.delete(id);
      }
    }
    saveMockStorage('users', mockStorage.users);
    return true;
  }

  if (query.includes('DELETE FROM users')) {
    if (bindValues && bindValues.length > 0) {
      mockStorage.users.delete(bindValues[0]);
    } else {
      mockStorage.users.clear(); // Wipe all if no bind values
    }
    saveMockStorage('users', mockStorage.users);
    return true;
  }

  if (query.includes('UPDATE users SET sync_status = 1')) {
    if (bindValues) {
      bindValues.forEach(id => {
        const user = mockStorage.users.get(id);
        if (user) {
          user.sync_status = 1;
          mockStorage.users.set(id, user);
        }
      });
      saveMockStorage('users', mockStorage.users);
    }
    return true;
  }

  if (query.includes('UPDATE users SET current_shift_start =') && query.includes('current_shift_cash =')) {
    if (bindValues && bindValues.length >= 3) {
      const shiftStart = bindValues[0];
      const shiftCash = bindValues[1];
      const userId = bindValues[bindValues.length - 1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.current_shift_start = shiftStart;
        user.current_shift_cash = shiftCash;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET name =') && query.includes('current_shift_start =')) {
    if (bindValues && bindValues.length >= 10) {
      const name = bindValues[0];
      const role = bindValues[1];
      const pin = bindValues[2];
      const permissionsJson = bindValues[3];
      const openingCash = bindValues[4];
      const needsShiftCash = bindValues[5];
      const isBlocked = bindValues[6];
      const shiftStart = bindValues[7];
      const shiftCash = bindValues[8];
      const hasTerminalName = bindValues.length >= 11;
      const terminalName = hasTerminalName ? bindValues[9] : '';
      const id = hasTerminalName ? bindValues[10] : bindValues[9];
      const user = mockStorage.users.get(id);
      if (user) {
        user.name = name;
        user.role = role;
        user.pin = pin;
        user.permissions_json = permissionsJson;
        user.opening_cash = openingCash;
        user.needs_shift_cash = needsShiftCash;
        user.is_blocked = isBlocked;
        user.current_shift_start = shiftStart;
        user.current_shift_cash = shiftCash;
        user.terminal_name = terminalName;
        user.sync_status = 1;
        mockStorage.users.set(id, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET terminal_name =')) {
    if (bindValues && bindValues.length >= 2) {
      const terminalName = bindValues[0];
      const userId = bindValues[1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.terminal_name = terminalName;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET is_blocked =')) {
    if (bindValues && bindValues.length >= 2) {
      const isBlocked = bindValues[0];
      const userId = bindValues[1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.is_blocked = isBlocked;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET needs_shift_cash =')) {
    if (bindValues && bindValues.length >= 2) {
      const needsShiftCash = bindValues[0];
      const userId = bindValues[1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.needs_shift_cash = needsShiftCash;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  if (query.includes('UPDATE users SET opening_cash =')) {
    if (bindValues && bindValues.length >= 2) {
      const openingCash = bindValues[0];
      const userId = bindValues[1];
      const user = mockStorage.users.get(userId);
      if (user) {
        user.opening_cash = openingCash;
        user.sync_status = 0;
        mockStorage.users.set(userId, user);
        saveMockStorage('users', mockStorage.users);
      }
    }
    return true;
  }

  return false;
}
