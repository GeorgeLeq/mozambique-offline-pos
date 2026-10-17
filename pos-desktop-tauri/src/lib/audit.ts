import { getDB } from './db';

export async function logAudit(userId: string | undefined, action: string, details: string) {
  try {
    const db = await getDB();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    let prevHash = 'GENESIS_MOZ_AT_BLOCK';
    let nextSeq = 1;

    try {
      const lastLogs: any[] = await db.select('SELECT hash, sequence_no FROM audit_logs ORDER BY sequence_no DESC LIMIT 1');
      if (lastLogs.length > 0) {
        if (lastLogs[0].hash) prevHash = lastLogs[0].hash;
        if (typeof lastLogs[0].sequence_no === 'number') nextSeq = lastLogs[0].sequence_no + 1;
      }
    } catch (e) {
      // Fallback if columns not present yet
    }

    const rawData = `${prevHash}|${id}|${userId || 'system'}|${action}|${details}|${timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawData));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await db.execute(
      'INSERT INTO audit_logs (id, user_id, action, details, created_at, hash, prev_hash, sequence_no, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
      [id, userId || 'system', action, details, timestamp, hash, prevHash, nextSeq]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

