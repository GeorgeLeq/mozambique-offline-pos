import { getDB } from '../db';
import { supabase } from '../supabase';

/**
 * Background task to sync local expected deliveries and items to Supabase.
 */
export async function syncExpectedDeliveriesToCloud(): Promise<boolean> {
  try {
    const db = await getDB();

    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];
    
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    let hasMoreWork = false;

    // 1. Sync Expected Deliveries (Heads) in batches
    const unsyncedDeliveries = await db.select(
      'SELECT * FROM expected_deliveries WHERE sync_status = 0 LIMIT 50'
    ) as any[];

    if (unsyncedDeliveries && unsyncedDeliveries.length > 0) {
      console.log(`[Deliveries Sync] Uploading batch of ${unsyncedDeliveries.length} expected deliveries...`);
      const payloadDeliveries = unsyncedDeliveries.map(d => ({
        id: d.id,
        shop_id: shopId,
        po_number: d.po_number || 1001,
        invoice_number: d.invoice_number || null,
        supplier_name: d.supplier_name,
        expected_date: d.expected_date,
        status: d.status,
        created_by: d.created_by,
        created_at: d.created_at,
        updated_at: d.updated_at || d.created_at
      }));

      const { error: dError } = await supabase
        .from('expected_deliveries')
        .upsert(payloadDeliveries, { onConflict: 'id' });

      if (dError) throw dError;

      const syncedDeliveryIds = unsyncedDeliveries.map(d => d.id);
      const dPlaceholders = syncedDeliveryIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE expected_deliveries SET sync_status = 1 WHERE id IN (${dPlaceholders})`,
        syncedDeliveryIds
      );

      const remainingDeliveries = await db.select('SELECT id FROM expected_deliveries WHERE sync_status = 0 LIMIT 1') as any[];
      if (remainingDeliveries.length > 0) hasMoreWork = true;
    }

    // 2. Sync Expected Delivery Items in batches
    const unsyncedItems = await db.select(
      'SELECT * FROM expected_delivery_items WHERE sync_status = 0 LIMIT 50'
    ) as any[];

    if (unsyncedItems && unsyncedItems.length > 0) {
      console.log(`[Deliveries Sync] Uploading batch of ${unsyncedItems.length} delivery items...`);
      // Enrich item payload with product name/barcode if missing locally
      const payloadItems = await Promise.all(unsyncedItems.map(async (item) => {
        let itemName = item.name || item.item_name || item.resolved_name;
        let packagingData = item.packaging_data;

        if ((!itemName || itemName === 'Produto') && item.product_id) {
          const prodRes = await db.select('SELECT name FROM products WHERE id = ? LIMIT 1', [item.product_id]) as any[];
          if (prodRes.length > 0 && prodRes[0].name) {
            itemName = prodRes[0].name;
            await db.execute('UPDATE expected_delivery_items SET name = ? WHERE id = ?', [itemName, item.id]);
          }
        }

        return {
          id: item.id,
          shop_id: shopId,
          delivery_id: item.delivery_id,
          product_id: item.product_id,
          name: itemName || 'Produto',
          packaging_data: packagingData || null,
          expected_quantity: item.expected_quantity,
          received_quantity: item.received_quantity || 0,
          cost_price_mt: item.cost_price_mt || 0,
          created_at: item.created_at || new Date().toISOString()
        };
      }));

      const { error: iError } = await supabase
        .from('expected_delivery_items')
        .upsert(payloadItems, { onConflict: 'id' });

      if (iError) throw iError;

      const syncedItemIds = unsyncedItems.map(i => i.id);
      const iPlaceholders = syncedItemIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE expected_delivery_items SET sync_status = 1 WHERE id IN (${iPlaceholders})`,
        syncedItemIds
      );

      const remainingItems = await db.select('SELECT id FROM expected_delivery_items WHERE sync_status = 0 LIMIT 1') as any[];
      if (remainingItems.length > 0) hasMoreWork = true;
    }

    return hasMoreWork;
  } catch (error) {
    console.warn('Background expected deliveries push failed.', error);
    return false;
  }
}

/**
 * Background task to pull expected deliveries and items down from Supabase.
 */
export async function syncExpectedDeliveriesFromCloud(): Promise<boolean> {
  try {
    const db = await getDB();

    const settings = await db.select(
      "SELECT value FROM settings WHERE key = 'shop_id'"
    ) as { value: string }[];
    
    if (!settings || settings.length === 0) return false;
    const shopId = settings[0].value;

    const lastPullSetting = await db.select(
      "SELECT value FROM settings WHERE key = 'last_pull_expected_deliveries'"
    ) as { value: string }[];
    const lastPull = lastPullSetting.length > 0 ? lastPullSetting[0].value : '1970-01-01T00:00:00.000Z';
    const nextPullTime = new Date().toISOString();

    // 1. Pull Deliveries (using updated_at or created_at)
    let cloudDeliveries: any[] | null = null;
    const dRes = await supabase
      .from('expected_deliveries')
      .select('id, po_number, invoice_number, supplier_name, expected_date, status, created_by, created_at, updated_at, requires_verification')
      .eq('shop_id', shopId)
      .or(`created_at.gt.${lastPull},updated_at.gt.${lastPull}`)
      .order('updated_at', { ascending: true })
      .limit(200);

    let dData: any[] | null = dRes.data;
    let dError = dRes.error;

    if (dError && (dError.code === '42703' || dError.message?.includes('requires_verification'))) {
      const fallback = await supabase
        .from('expected_deliveries')
        .select('id, po_number, invoice_number, supplier_name, expected_date, status, created_by, created_at, updated_at')
        .eq('shop_id', shopId)
        .or(`created_at.gt.${lastPull},updated_at.gt.${lastPull}`)
        .order('updated_at', { ascending: true })
        .limit(200);
      dData = fallback.data as any[];
      dError = fallback.error;
    }

    if (dError) throw dError;
    cloudDeliveries = dData;

    // 2. Pull Delivery Items
    let cloudItems: any[] | null = null;
    const iRes = await supabase
      .from('expected_delivery_items')
      .select('id, delivery_id, product_id, name, packaging_data, expected_quantity, received_quantity, cost_price_mt, created_at, requires_verification')
      .eq('shop_id', shopId)
      .gt('created_at', lastPull)
      .order('created_at', { ascending: true })
      .limit(200);

    let iData: any[] | null = iRes.data;
    let iError = iRes.error;

    if (iError && (iError.code === '42703' || iError.message?.includes('requires_verification'))) {
      const fallback = await supabase
        .from('expected_delivery_items')
        .select('id, delivery_id, product_id, name, packaging_data, expected_quantity, received_quantity, cost_price_mt, created_at')
        .eq('shop_id', shopId)
        .gt('created_at', lastPull)
        .order('created_at', { ascending: true })
        .limit(200);
      iData = fallback.data as any[];
      iError = fallback.error;
    }

    if (iError) throw iError;
    cloudItems = iData;

    const gotDeliveries = cloudDeliveries && cloudDeliveries.length > 0;
    const gotItems = cloudItems && cloudItems.length > 0;

    if (!gotDeliveries && !gotItems) {
      await db.execute(
        'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
        ['last_pull_expected_deliveries', nextPullTime]
      );
      return false;
    }

    let maxTime = lastPull;

    if (gotDeliveries) {
      for (const d of cloudDeliveries) {
        const dTime = d.updated_at || d.created_at;
        if (dTime && dTime > maxTime) {
          maxTime = dTime;
        }
        await db.execute(
          `INSERT OR REPLACE INTO expected_deliveries 
          (id, po_number, invoice_number, supplier_name, expected_date, status, created_by, created_at, updated_at, sync_status, requires_verification) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [d.id, d.po_number || 1001, d.invoice_number || null, d.supplier_name, d.expected_date, d.status, d.created_by, d.created_at, d.updated_at || d.created_at, d.requires_verification !== false ? 1 : 0]
        );
      }
    }

    if (gotItems) {
      for (const item of cloudItems) {
        if (item.created_at && item.created_at > maxTime) {
          maxTime = item.created_at;
        }
        // Query local item or product to preserve local snapshot
        const localItems = await db.select('SELECT name, packaging_data FROM expected_delivery_items WHERE id = ? LIMIT 1', [item.id]) as any[];
        let localName = localItems.length > 0 ? localItems[0].name : null;
        let localPkg = localItems.length > 0 ? localItems[0].packaging_data : null;

        if ((!localName || localName === 'Produto') && item.product_id) {
          const localProd = await db.select('SELECT name FROM products WHERE id = ? LIMIT 1', [item.product_id]) as any[];
          if (localProd.length > 0 && localProd[0].name) {
            localName = localProd[0].name;
          }
        }

        const resolvedName = (item.name && item.name !== 'Produto')
          ? item.name
          : (localName || item.name || 'Produto');

        const resolvedPkg = item.packaging_data
          ? (typeof item.packaging_data === 'string' ? item.packaging_data : JSON.stringify(item.packaging_data))
          : localPkg;

        await db.execute(
          `INSERT OR REPLACE INTO expected_delivery_items 
          (id, delivery_id, product_id, name, packaging_data, expected_quantity, received_quantity, cost_price_mt, created_at, sync_status, requires_verification) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            item.id,
            item.delivery_id,
            item.product_id,
            resolvedName,
            resolvedPkg,
            item.expected_quantity,
            item.received_quantity || 0,
            item.cost_price_mt || 0,
            item.created_at || new Date().toISOString(),
            item.requires_verification !== false ? 1 : 0
          ]
        );
      }
    }

    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, sync_status) VALUES (?, ?, 1)',
      ['last_pull_expected_deliveries', maxTime]
    );

    console.log(`Successfully pulled deliveries data from Supabase.`);
    return true;
  } catch (error) {
    console.warn('Background expected deliveries pull failed.', error);
    return false;
  }
}
