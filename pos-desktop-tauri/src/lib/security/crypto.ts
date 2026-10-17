/**
 * @file crypto.ts
 * @description Cryptographic utilities for hashing PINs and sensitive POS operator codes.
 */

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_mozpos_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  // Support legacy plaintext PINs during transition as well as hashed PINs
  if (inputPin === storedHash) {
    return true;
  }
  const hashedInput = await hashPin(inputPin);
  return hashedInput === storedHash;
}

export async function findUserByPin(db: any, inputPin: string, allowedRoles?: string[]): Promise<any | null> {
  const users = await db.select('SELECT * FROM users') as any[];
  console.log(`[Crypto] findUserByPin: Checking ${users?.length || 0} users against input: ${inputPin}`);
  if (!users || users.length === 0) return null;
  
  for (const user of users) {
    if (user.is_deleted === 1 || user.is_deleted === true || user.is_deleted === '1') {
      continue; // Skip soft-deleted operators - they have zero access
    }
    const matches = await verifyPin(inputPin, user.pin);
    console.log(`[Crypto] Comparing input '${inputPin}' against user ${user.name} (pin: '${user.pin}'). Match: ${matches}`);
    if (matches) {
      if (allowedRoles && allowedRoles.length > 0) {
        const roleUpper = (user.role || '').toUpperCase();
        const allowedUpper = allowedRoles.map(r => r.toUpperCase());
        if (allowedUpper.includes(roleUpper)) {
          return user;
        } else {
          return { ...user, __role_mismatch: true };
        }
      }
      return user;
    }
  }
  return null;
}

