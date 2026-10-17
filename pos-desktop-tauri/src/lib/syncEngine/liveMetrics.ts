import { getDB } from '../db';
import { supabase, isSupabaseConfigured } from '../supabase';

let debouncedTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncingMetrics = false;

/**
 * Calculates today's live business metrics directly from local SQLite (Offline-First)
 * and synchronizes them to Supabase `public.shops` (columns `live_metrics` and `last_metrics_sync_at`).
 * 
 * NOTE: Gated by the shop's Companion App subscription status:
 * Sync will execute only if `companion_app_enabled === true` and not expired.
 */
export async function syncLiveMetricsToCloud(): Promise<boolean> {
  if (!isSupabaseConfigured() || !navigator.onLine) {
    return false;
  }

  if (isSyncingMetrics) {
    return false;
  }

  isSyncingMetrics = true;

  try {
    const db = await getDB();

    // 1. Get the shop_id from local settings
    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];

    if (!settings || settings.length === 0 || !settings[0].value) {
      return false;
    }
    const shopId = settings[0].value;

    // 2. Check if Companion App is enabled and not expired for this shop
    // We check both local settings and remote shop status
    let isCompanionAppEnabled = false;
    let companionExpiresAt: string | null = null;

    try {
      // First check local settings cache
      const companionSetting = await db.select(
        "SELECT key, value FROM settings WHERE key IN ('companion_app_enabled', 'companion_app_expires_at')"
      ) as { key: string; value: string }[];

      const localEnabled = companionSetting.find(s => s.key === 'companion_app_enabled')?.value === '1' ||
                           companionSetting.find(s => s.key === 'companion_app_enabled')?.value === 'true';
      const localExpiry = companionSetting.find(s => s.key === 'companion_app_expires_at')?.value || null;

      // Query Supabase shops table to get authoritative status
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(shopId);
      let query = supabase.from('shops').select('id, companion_app_enabled, companion_app_expires_at');
      
      const { data: shopData, error: shopErr } = isUuid
        ? await query.eq('id', shopId).maybeSingle()
        : await query.eq('code', shopId).maybeSingle();

      if (!shopErr && shopData) {
        isCompanionAppEnabled = Boolean(shopData.companion_app_enabled);
        companionExpiresAt = shopData.companion_app_expires_at || null;

        // Cache into local SQLite settings for offline reference
        await db.execute(
          "INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES ('companion_app_enabled', ?, 1)",
          [isCompanionAppEnabled ? '1' : '0']
        );
        if (companionExpiresAt) {
          await db.execute(
            "INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES ('companion_app_expires_at', ?, 1)",
            [companionExpiresAt]
          );
        }
      } else {
        isCompanionAppEnabled = localEnabled;
        companionExpiresAt = localExpiry;
      }
    } catch (checkErr) {
      console.warn('[Live Metrics] Companion subscription check warning:', checkErr);
    }

    // Check expiration if date provided
    if (isCompanionAppEnabled && companionExpiresAt) {
      const expiryDate = new Date(companionExpiresAt);
      if (expiryDate < new Date()) {
        isCompanionAppEnabled = false; // Expired
      }
    }

    // If Companion App is not paid / enabled, skip sync to save bandwidth
    if (!isCompanionAppEnabled) {
      return false;
    }

    // 3. Compute today's metrics from local SQLite
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString().replace('T', ' ').substring(0, 19);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString().replace('T', ' ').substring(0, 19);
    const todayDateStr = now.toISOString().split('T')[0];

    // Query sales grouped by payment method
    const salesToday = await db.select(
      "SELECT SUM(total_mt) as total, payment_method, COUNT(*) as count FROM sales WHERE created_at >= ? AND created_at <= ? AND status != 'voided' GROUP BY payment_method",
      [startOfDay, endOfDay]
    ) as any[];

    let revenue = 0;
    let cashSales = 0;
    let mpesa = 0;
    let emola = 0;
    let card = 0;
    let otherPayments = 0;
    let totalSalesCount = 0;

    if (salesToday) {
      salesToday.forEach((row: any) => {
        const amt = parseFloat(row.total) || 0;
        const count = parseInt(row.count, 10) || 0;
        revenue += amt;
        totalSalesCount += count;

        if (row.payment_method === 'cash') cashSales += amt;
        else if (row.payment_method === 'mpesa') mpesa += amt;
        else if (row.payment_method === 'emola') emola += amt;
        else if (row.payment_method === 'card' || row.payment_method === 'pos') card += amt;
        else if (row.payment_method !== 'mixed') otherPayments += amt;
      });
    }

    // Handle mixed payments
    const mixedToday = await db.select(
      "SELECT receipt_id, payment_details FROM sales WHERE created_at >= ? AND created_at <= ? AND status != 'voided' AND payment_method = 'mixed'",
      [startOfDay, endOfDay]
    ) as any[];

    if (mixedToday && mixedToday.length > 0) {
      const uniqueMixedReceipts: { [receiptId: string]: any } = {};
      mixedToday.forEach((row: any) => {
        if (row.receipt_id && row.payment_details) {
          try {
            uniqueMixedReceipts[row.receipt_id] = JSON.parse(row.payment_details);
          } catch {}
        }
      });

      Object.values(uniqueMixedReceipts).forEach(details => {
        cashSales += parseFloat(details.cash) || 0;
        mpesa += parseFloat(details.mpesa) || 0;
        emola += parseFloat(details.emola) || 0;
        card += parseFloat(details.card || details.pos) || 0;
      });
    }

    // Starting cash and till payouts
    const baseCashRow = await db.select("SELECT value FROM settings WHERE key = 'base_cash'") as any[];
    const bCash = parseFloat(baseCashRow?.[0]?.value || '0');

    const payoutsRow = await db.select(
      "SELECT SUM(amount) as total FROM till_payouts WHERE created_at >= ? AND created_at <= ?",
      [startOfDay, endOfDay]
    ) as any[];
    const totalPayouts = parseFloat(payoutsRow?.[0]?.total || '0');

    // Unpaid debts
    const debtsRow = await db.select(
      "SELECT SUM(amount_mt) as total, COUNT(*) as count FROM debts WHERE status IN ('unpaid', 'pending', 'partial')"
    ) as any[];
    const pendingDebts = parseFloat(debtsRow?.[0]?.total || '0');
    const pendingDebtsCount = parseInt(debtsRow?.[0]?.count || '0', 10);

    // Live Cash in drawer calculation
    const liveCash = Math.max(0, bCash + cashSales - totalPayouts);
    const averageTicket = totalSalesCount > 0 ? parseFloat((revenue / totalSalesCount).toFixed(2)) : 0;

    // 4. Construct live metrics payload for the companion app
    const liveMetricsPayload = {
      date: todayDateStr,
      today_revenue_mt: Math.round(revenue * 100) / 100,
      live_cash_mt: Math.round(liveCash * 100) / 100,
      cash_sales_mt: Math.round(cashSales * 100) / 100,
      mpesa_sales_mt: Math.round(mpesa * 100) / 100,
      emola_sales_mt: Math.round(emola * 100) / 100,
      card_sales_mt: Math.round(card * 100) / 100,
      other_sales_mt: Math.round(otherPayments * 100) / 100,
      sales_count: totalSalesCount,
      average_ticket_mt: averageTicket,
      pending_debts_mt: Math.round(pendingDebts * 100) / 100,
      pending_debts_count: pendingDebtsCount,
      payouts_total_mt: Math.round(totalPayouts * 100) / 100,
      base_cash_mt: Math.round(bCash * 100) / 100,
      last_updated_at: new Date().toISOString()
    };

    // 5. Update Supabase public.shops table
    const { error: updateErr } = await supabase
      .from('shops')
      .update({
        live_metrics: liveMetricsPayload,
        last_metrics_sync_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (updateErr) {
      console.warn('[Live Metrics] Sync update to Supabase failed (verify if live_metrics column exists):', updateErr.message);
      return false;
    }

    console.log('[Live Metrics] Successfully updated live companion metrics in Supabase:', {
      revenue,
      liveCash,
      salesCount: totalSalesCount
    });

    return true;
  } catch (err) {
    console.warn('[Live Metrics] Error calculating/syncing metrics:', err);
    return false;
  } finally {
    isSyncingMetrics = false;
  }
}

/**
 * Triggers a debounced live metrics sync (e.g. 5 seconds after a sale or cash drawer movement).
 */
export function triggerDebouncedLiveMetricsSync(delayMs = 5000) {
  if (debouncedTimer) {
    clearTimeout(debouncedTimer);
  }

  debouncedTimer = setTimeout(() => {
    syncLiveMetricsToCloud().catch(err => {
      console.warn('[Live Metrics] Debounced sync background error:', err);
    });
  }, delayMs);
}
